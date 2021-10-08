// global
import { FastifyPluginAsync } from 'fastify';
import S3 from 'aws-sdk/clients/s3';
import { IdParam, Item } from 'graasp';
import {
  GraaspS3FileItemOptions,
  S3FileItemExtra,
  GetMetadataFromItemTask,
} from 'graasp-plugin-s3-file-item';
import { GetFileFromItemTask, GraaspFileItemOptions, FileItemExtra } from 'graasp-file-item';
// local
import { PublicItemService } from './db-service';
import { getOne, getChildren, getItemsBy, downloadSchema, getMetadataSchema } from './schemas';
import { GetPublicItemTask } from './tasks/get-public-item';
import { GetPublicItemChildrenTask } from './tasks/get-public-item-children';
import { GetPublicItemWithTagTask } from './tasks/get-public-items-by-tag-task';
import { GraaspPublicPluginOptions } from '../../service-api';


declare module 'fastify' {
  interface FastifyInstance {
    s3FileItemPluginOptions?: GraaspS3FileItemOptions;
    fileItemPluginOptions?: GraaspFileItemOptions;
  }
}

const plugin: FastifyPluginAsync<GraaspPublicPluginOptions> = async (fastify, options) => {
  const { tagId, graaspActor, enableS3FileItemPlugin } = options;
  const {
    items: { dbService: iS },
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
        const t1 = new GetPublicItemTask<S3FileItemExtra>(
          graaspActor,
          id,
          { withMemberships: false },
          pIS,
          iS,
          iMS,
        );
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

        const t1 = new GetPublicItemTask<FileItemExtra>(
          graaspActor,
          id,
          { withMemberships: false },
          pIS,
          iS,
          iMS,
        );
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
      const task = new GetPublicItemTask(graaspActor, itemId, { withMemberships }, pIS, iS, iMS);
      return runner.runSingle(task, log);
    },
  );

  fastify.get<{ Params: IdParam; Querystring: { ordered?: boolean } }>(
    '/:id/children',
    { schema: getChildren },
    async ({ params: { id: itemId }, query: { ordered }, log }) => {
      const task = new GetPublicItemChildrenTask(graaspActor, itemId, pIS, iS, ordered);
      return runner.runSingle(task, log);
    },
  );

  fastify.get<{ Querystring: { tagId: string; withMemberships?: boolean } }>(
    '/',
    { schema: getItemsBy },
    async ({ query: { tagId, withMemberships }, log }) => {
      const task = new GetPublicItemWithTagTask(
        graaspActor,
        { tagId, withMemberships },
        pIS,
        iS,
        iMS,
      );
      return runner.runSingle(task, log);
    },
  );
};

export default plugin;
