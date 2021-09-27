// global
import { FastifyPluginAsync } from "fastify";
import { Actor, IdParam, Item, UnknownExtra } from "graasp";
import fastifyCors from "fastify-cors";
import { GraaspS3FileItemOptions, S3FileItemExtra } from "graasp-s3-file-item";
import S3 from "aws-sdk/clients/s3";
import contentDisposition from "content-disposition";
import fs from "fs";
// local
import { PublicItemService } from "./db-service";
import common, {
  getOne,
  getChildren,
  getItemsBy,
  getMember,
  getMembers,
  downloadSchema,
  getMetadataSchema,
} from "./schemas";
import { GetPublicItemTask } from "./tasks/get-public-item";
import { GetPublicItemChildrenTask } from "./tasks/get-public-item-children";
import { GetPublicItemWithTagTask } from "./tasks/get-public-items-by-tag-task";
import { GetPublicMembersTask } from "./tasks/get-public-members-task";

interface FileItemExtra extends UnknownExtra {
  file: {
    name: string;
    path: string;
    mimetype: string;
  };
}
// todo: import type from package
interface GraaspFileItemOptions {
  /**
   * Filesystem root path where the uploaded files will be saved
   */
  storageRootPath: string;
}
declare module "fastify" {
  interface FastifyInstance {
    s3FileItemPluginOptions?: GraaspS3FileItemOptions;
    fileItemPluginOptions?: GraaspFileItemOptions;
  }
}

const FILE_ITEM_TYPE = "file";

export interface GraaspItemLoginOptions {
  /** id of the tag to look for in the item to check if an item is public */
  tagId: string;
  graaspActor: Actor;
  enableS3FileItemPlugin?: boolean;
}

const plugin: FastifyPluginAsync<GraaspItemLoginOptions> = async (fastify, options) => {
  const { tagId, graaspActor, enableS3FileItemPlugin } = options;
  const {
    items: { dbService: iS },
    taskRunner: runner,
    itemMemberships: { dbService: iMS },
    members: { dbService: mS, taskManager: mT },
  } = fastify;

  const pIS = new PublicItemService(tagId);

  // add CORS support
  if (fastify.corsPluginOptions) {
    fastify.register(fastifyCors, fastify.corsPluginOptions);
  }

  fastify.addSchema(common);

  fastify.register(
    async function (fastify) {
      if (enableS3FileItemPlugin) {
        // todo: refactor using a file taskmanager or import from file item package
        const {
          s3Region: region,
          s3Bucket: bucket,
          s3AccessKeyId: accessKeyId,
          s3SecretAccessKey: secretAccessKey,
          s3UseAccelerateEndpoint: useAccelerateEndpoint = false,
          s3Expiration: expiration = 60, // 1 minute,
        } = fastify.s3FileItemPluginOptions;

        // TODO: a Cache-Control policy is missing and
        // it's necessary to check how that policy is kept while copying
        // also: https://www.aaronfagan.ca/blog/2017/how-to-configure-aws-lambda-to-automatically-set-cache-control-headers-on-s3-objects/
        const s3 = new S3({
          region,
          useAccelerateEndpoint,
          credentials: { accessKeyId, secretAccessKey },
        }); // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html

        fastify.get<{ Params: IdParam }>(
          "/:id/s3-metadata",
          { schema: getMetadataSchema },
          async ({ params: { id }, log }) => {
            const task = new GetPublicItemTask<S3FileItemExtra>(
              graaspActor,
              id,
              { withMemberships: false },
              pIS,
              iS,
              iMS
            );
            const item = await runner.runSingle(task, log);
            const { s3File } = item.extra;

            if (!s3File) throw new Error(`Item ${id} is not a s3 file`);

            const { size, contenttype, key } = s3File;
            if ((size === 0 || size) && contenttype) return s3File;

            // let itemData: Partial<Item<S3FileItemExtra>>;
            const params: S3.HeadObjectRequest = { Bucket: bucket, Key: key };

            try {
              const { ContentLength: cL, ContentType: cT } = await s3.headObject(params).promise();
              // itemData = {
              //   extra: { s3File: Object.assign(s3File, { size: cL, contenttype: cT }) },
              // };
              return { size: cL, contenttype: cT };
            } catch (error) {
              log.error(error, "graasp-s3-file-item: failed to get s3 object metadata");
              throw error;
            }
          }
        );
      } else {
        // todo: refactor using a file taskmanager or import from file item package
        fastify.get<{ Params: IdParam }>(
          "/:id/download",
          { schema: downloadSchema },
          async (request, reply) => {
            const {
              params: { id },
              log,
            } = request;

            const task = new GetPublicItemTask<FileItemExtra>(
              graaspActor,
              id,
              { withMemberships: false },
              pIS,
              iS,
              iMS
            );

            const {
              type,
              extra: { file },
            } = await runner.runSingle(task, log);

            if (type !== FILE_ITEM_TYPE || !file) {
              reply.status(400);
              throw new Error(`Invalid '${FILE_ITEM_TYPE}' item`);
            }

            const { name, path, mimetype } = file;

            reply.type(mimetype);
            // this header will make the browser download the file with 'name' instead of
            // simply opening it and showing it
            reply.header("Content-Disposition", contentDisposition(name));

            // TODO: can/should this be done in a worker (fastify piscina)?
            return fs.createReadStream(`${fastify.fileItemPluginOptions.storageRootPath}/${path}`);
          }
        );
      }

      fastify.get<{ Params: IdParam; Querystring: { withMemberships?: boolean } }>(
        "/:id",
        { schema: getOne },
        async ({ params: { id: itemId }, query: { withMemberships }, log }) => {
          const task = new GetPublicItemTask(
            graaspActor,
            itemId,
            { withMemberships },
            pIS,
            iS,
            iMS
          );
          return runner.runSingle(task, log);
        }
      );

      fastify.get<{ Params: IdParam; Querystring: { ordered?: boolean } }>(
        "/:id/children",
        { schema: getChildren },
        async ({ params: { id: itemId }, query: { ordered }, log }) => {
          const task = new GetPublicItemChildrenTask(graaspActor, itemId, pIS, iS, ordered);
          return runner.runSingle(task, log);
        }
      );

      fastify.get<{ Querystring: { tagId: string; withMemberships?: boolean } }>(
        "/",
        { schema: getItemsBy },
        async ({ query: { tagId, withMemberships }, log }) => {
          const task = new GetPublicItemWithTagTask(
            graaspActor,
            { tagId, withMemberships },
            pIS,
            iS,
            iMS
          );
          return runner.runSingle(task, log);
        }
      );
    },
    { prefix: "/items" }
  );

  // todo: move in another repo?

  fastify.get<{ Params: IdParam }>(
    "/members/:id",
    { schema: getMember },
    async ({ params: { id }, log }) => {
      const task = mT.createGetTask(graaspActor, id);
      return runner.runSingle(task, log);
    }
  );

  fastify.get<{ Querystring: { id: string[] } }>(
    "/members",
    { schema: getMembers },
    async ({ query: { id: ids }, log }) => {
      const task = new GetPublicMembersTask(graaspActor, ids, pIS, iS, mS);
      return runner.runSingle(task, log);
    }
  );
};

export default plugin;
