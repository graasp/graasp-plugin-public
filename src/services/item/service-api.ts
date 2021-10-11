// global
import { FastifyPluginAsync } from 'fastify';
import S3 from 'aws-sdk/clients/s3';
import { IdParam, Item } from 'graasp';
import {
  GraaspS3FileItemOptions,
  S3FileItemExtra,
  GetMetadataFromItemTask,
} from 'graasp-plugin-s3-file-item';
import { GetFileFromItemTask, GraaspFileItemOptions, FileItemExtra } from 'graasp-plugin-file-item';
// local
import { PublicItemService } from './db-service';
import { getOne, getChildren, getItemsBy, downloadSchema, getMetadataSchema } from './schemas';
import { GetPublicItemTask } from './tasks/get-public-item-task';
import { GetPublicItemsWithTagTask } from './tasks/get-public-items-by-tag-task';
import { GraaspPublicPluginOptions } from '../../service-api';
import { MergeItemMembershipsIntoItems } from './tasks/merge-item-memberships-into-item-task';

declare module 'fastify' {
  interface FastifyInstance {
    s3FileItemPluginOptions?: GraaspS3FileItemOptions;
    fileItemPluginOptions?: GraaspFileItemOptions;
  }
}

const plugin: FastifyPluginAsync<GraaspPublicPluginOptions> = async (fastify, options) => {
  const { tagId, graaspActor, enableS3FileItemPlugin } = options;
  const {
    items: { dbService: iS, taskManager: iTM },
    taskRunner: runner,
    itemMemberships: { dbService: iMS },
  } = fastify;

  const pIS = new PublicItemService(tagId);

  if (enableS3FileItemPlugin) {
    const {
      s3Region: region,
      s3Bucket: bucket,
      s3AccessKeyId: accessKeyId,
      s3SecretAccessKey: secretAccessKey,
      s3UseAccelerateEndpoint: useAccelerateEndpoint = false,
    } = fastify.s3FileItemPluginOptions;
    const s3 = new S3({
      region,
      useAccelerateEndpoint,
      credentials: { accessKeyId, secretAccessKey },
    }); // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html

    fastify.get<{ Params: IdParam }>(
      '/:id/s3-metadata',
      { schema: getMetadataSchema },
      async ({ params: { id }, log }) => {
        const t1 = new GetPublicItemTask<S3FileItemExtra>(graaspActor, id, pIS, iS);
        const t2 = new GetMetadataFromItemTask(graaspActor, iS, s3, bucket);
        t2.getInput = () => ({
          item: t1.result as Item<S3FileItemExtra>,
        });
        return runner.runSingleSequence([t1, t2], log);
      },
    );
  } else {
    fastify.get<{ Params: IdParam }>(
      '/:id/download',
      { schema: downloadSchema },
      async (request, reply) => {
        const {
          params: { id },
          log,
        } = request;

        const t1 = new GetPublicItemTask<FileItemExtra>(graaspActor, id, pIS, iS);
        const t2 = new GetFileFromItemTask(graaspActor, {});
        t2.getInput = () => ({
          path: fastify.fileItemPluginOptions.storageRootPath,
          reply,
          item: t1.result as Item<FileItemExtra>,
        });
        return runner.runSingleSequence([t1, t2], log);
      },
    );
  }

  fastify.get<{ Params: IdParam; Querystring: { withMemberships?: boolean } }>(
    '/:id',
    { schema: getOne },
    async ({ params: { id: itemId }, query: { withMemberships }, log }) => {
      const t1 = iTM.createGetTask(graaspActor, itemId);
      const t2 = new MergeItemMembershipsIntoItems(graaspActor, {}, pIS, iS, iMS);
      t2.skip = !withMemberships;
      t2.getInput = () => ({ items: [t1.result] as Item[] });
      // either pass result from get item
      if (!withMemberships) {
        t2.getResult = () => t1.result;
      }
      // or take first item to return a non-array
      else {
        t2.getResult = () => t2.result[0];
      }
      return runner.runSingleSequence([t1, t2], log);
    },
  );

  fastify.get<{ Params: IdParam; Querystring: { ordered?: boolean } }>(
    '/:id/children',
    { schema: getChildren },
    async ({ params: { id: itemId }, query: { ordered }, log }) => {
      const t1 = new GetPublicItemTask(graaspActor, itemId, pIS, iS);
      const t2 = iTM.createGetChildrenTask(graaspActor, {});
      t2.getInput = () => ({ ordered, item: t1.result });
      return runner.runSingleSequence([t1, t2], log);
    },
  );

  fastify.get<{ Querystring: { tagId: string; withMemberships?: boolean } }>(
    '/',
    { schema: getItemsBy },
    async ({ query: { tagId, withMemberships }, log }) => {
      const t1 = new GetPublicItemsWithTagTask(graaspActor, { tagId }, pIS, iS);
      const t2 = new MergeItemMembershipsIntoItems(graaspActor, {}, pIS, iS, iMS);
      t2.getInput = () => ({ items: t1.result as Item[] });
      t2.skip = !withMemberships;
      if (!withMemberships) {
        t2.getResult = () => t1.result;
      }
      return runner.runSingleSequence([t1, t2], log);
    },
  );
};

export default plugin;