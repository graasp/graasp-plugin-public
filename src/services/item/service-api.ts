// global
import { FastifyPluginAsync } from 'fastify';
import S3 from 'aws-sdk/clients/s3';
import { IdParam, Item } from 'graasp';
import graaspPluginThumbnails from 'graasp-plugin-thumbnails';
import {
  GraaspS3FileItemOptions,
  S3FileItemExtra,
  GetMetadataFromItemTask,
} from 'graasp-plugin-s3-file-item';
import { GetFileFromItemTask, GraaspFileItemOptions, FileItemExtra } from 'graasp-plugin-file-item';
import { PublicCategoriesPlugin } from 'graasp-plugin-categories';
// local
import { PublicItemService } from './db-service';
import {
  getOne,
  getChildren,
  getItemsBy,
  downloadSchema,
  getMetadataSchema,
  copyOne,
} from './schemas';
import { GetPublicItemTask } from './tasks/get-public-item-task';
import { GetPublicItemIdsWithTagTask } from './tasks/get-public-item-ids-by-tag-task';
import { GraaspPublicPluginOptions } from '../../service-api';
import { MergeItemMembershipsIntoItems } from './tasks/merge-item-memberships-into-item-task';
import { CannotEditPublicItem } from '../../util/errors';
import { GetItemsByCategoryTask } from './tasks/get-public-items-by-category-task';
import { GetItemCategoriesTask } from './tasks/get-public-item-categories-task';

declare module 'fastify' {
  interface FastifyInstance {
    s3FileItemPluginOptions?: GraaspS3FileItemOptions;
    fileItemPluginOptions?: GraaspFileItemOptions;
  }
}

const plugin: FastifyPluginAsync<GraaspPublicPluginOptions> = async (fastify, options) => {
  const { tagId, graaspActor, enableS3FileItemPlugin, publishedTagId } = options;
  const {
    items: { dbService: iS, taskManager: iTM },
    taskRunner: runner,
    itemMemberships: { dbService: iMS },
    db,
  } = fastify;

  const pIS = new PublicItemService(tagId);

  await fastify.register(graaspPluginThumbnails, {
    enableS3FileItemPlugin: enableS3FileItemPlugin,
    pluginStoragePrefix: 'thumbnails/items',
    uploadValidation: async (id) => {
      throw new CannotEditPublicItem(id);
    },
    downloadValidation: async (id) => [
      new GetPublicItemTask<FileItemExtra>(graaspActor, id, pIS, iS),
    ],
    // endpoint
    prefix: '/thumbnails',
  });

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
      const t1 = new GetPublicItemTask(graaspActor, itemId, pIS, iS);
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
    async ({ query: { tagId, withMemberships } }) => {
      // todo: use only one transaction
      const t1 = new GetPublicItemIdsWithTagTask(graaspActor, { tagId }, pIS, iS);
      const itemIds = await runner.runSingle(t1);

      // use item manager task to get trigger post hooks (deleted items are removed)
      const t2 = itemIds.map((id) => iTM.createGetTask(graaspActor, id));
      const items = (await runner.runMultiple(t2)) as Item[];
      // remove unavailable items
      const validItems = items.filter(({ id }) => id);
      if (!withMemberships) {
        return validItems;
      }
      const t3 = new MergeItemMembershipsIntoItems(
        graaspActor,
        { items: validItems },
        pIS,
        iS,
        iMS,
      );
      const result = await runner.runSingle(t3);
      return result;
    },
  );

  // categories
  fastify.register(PublicCategoriesPlugin, { publicActor: graaspActor });

  // TODO: optimize, this is a temporary solution
  // get public items in given category(ies)
  fastify.get<{ Querystring: { category: string[] } }>(
    '/withCategories',
    async ({ query: { category: categoryIds }, log }) => {
      const task = new GetItemsByCategoryTask(graaspActor, pIS, iS, { categoryIds });
      type resultType = { itemId: string };
      const itemIds = (await runner.runSingle(task, log)) as unknown as resultType[];

      // use item manager task to get trigger post hooks (deleted items are removed)
      const t2 = itemIds.map(({ itemId }) => iTM.createGetTask(graaspActor, itemId));
      const items = (await runner.runMultiple(t2)) as Item[];

      // filter out to keep public items
      const result = items.filter(
        (item) => pIS.hasPublicTag(item, db.pool) && pIS.hasTag(item, publishedTagId, db.pool),
      );

      return result;
    },
  );

  //get category of an item
  fastify.get<{ Params: { itemId: string } }>(
    '/:itemId/categories',
    async ({ params: { itemId }, log }) => {
      const task = new GetItemCategoriesTask(graaspActor, pIS, iS, { itemId });
      return runner.runSingle(task, log);
    },
  );

  // endpoints requiring authentication
  fastify.register(async function (instance) {
    // check member is set in request, necessary to allow access to parent
    instance.addHook('preHandler', fastify.verifyAuthentication);

    instance.post<{ Params: IdParam; Body: { parentId?: string; shouldCopyTags?: boolean } }>(
      '/:id/copy',
      { schema: copyOne },
      async ({ member, params: { id: itemId }, body: { parentId, shouldCopyTags }, log }) => {
        const t1 = new GetPublicItemTask(member, itemId, pIS, iS);
        // do not copy tags by default
        const copyTasks = iTM.createCopySubTaskSequence(member, t1, {
          parentId,
          shouldCopyTags: shouldCopyTags ?? false,
        });
        return runner.runSingleSequence([t1, ...copyTasks], log);
      },
    );
  });
};

export default plugin;
