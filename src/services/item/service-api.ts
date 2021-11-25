// global
import { FastifyPluginAsync } from 'fastify';
import { IdParam, Item } from 'graasp';
import ThumbnailsPlugin, { buildFilePath, mimetype } from 'graasp-plugin-thumbnails';
import { FileItemExtra, GraaspFileItemOptions, GraaspS3FileItemOptions, ServiceMethod } from 'graasp-plugin-file';

// local
import { PublicItemService } from './db-service';
import {
  getOne,
  getChildren,
  getItemsBy,
  copyOne,
} from './schemas';
import { GetPublicItemTask } from './tasks/get-public-item-task';
import { GetPublicItemIdsWithTagTask } from './tasks/get-public-item-ids-by-tag-task';
import { GraaspPublicPluginOptions } from '../../service-api';
import { MergeItemMembershipsIntoItems } from './tasks/merge-item-memberships-into-item-task';
import { CannotEditPublicItem } from '../../util/graasp-public-items';
import { FileItemPlugin } from 'graasp-plugin-file-item';


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

  const pathPrefix = '/items/';

  fastify.register(ThumbnailsPlugin, {
    serviceMethod: enableS3FileItemPlugin ? ServiceMethod.S3 : ServiceMethod.LOCAL,
    serviceOptions: {
      s3: fastify.s3FileItemPluginOptions,
      local: fastify.fileItemPluginOptions,
    },

    pathPrefix: pathPrefix,
    appsTemplateRoot: '/apps',

    uploadPreHookTasks: async (id) => {
      throw new CannotEditPublicItem(id);
    },
    downloadPreHookTasks: async ({ itemId: id, filename }) => {
      const task = new GetPublicItemTask<FileItemExtra>(graaspActor, id, pIS, iS);
      task.getResult = () => ({
        filepath: buildFilePath((task.result as Item).id, pathPrefix, filename),
        mimetype: mimetype,
      });
      return [ task ];
    },

    prefix: '/thumbnails',
  });

  fastify.register(FileItemPlugin, {
    shouldLimit: true,
    storageRootPath: '/files/',
    serviceMethod: enableS3FileItemPlugin ? ServiceMethod.S3 : ServiceMethod.LOCAL,
    serviceOptions: {
      s3: fastify.s3FileItemPluginOptions,
      local: fastify.fileItemPluginOptions,
    }
  });

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

  // endpoints requiring authentication
  fastify.register(async function (instance) {
    // check member is set in request, necessary to allow access to parent
    instance.addHook('preHandler', fastify.verifyAuthentication);

    instance.post<{ Params: IdParam; Body: { parentId?: string, shouldCopyTags?: boolean } }>(
      '/:id/copy',
      { schema: copyOne },
      async ({ member, params: { id: itemId }, body: { parentId, shouldCopyTags }, log }) => {
        const t1 = new GetPublicItemTask(member, itemId, pIS, iS);
        // do not copy tags by default
        const copyTasks = iTM.createCopySubTaskSequence(member, t1, { parentId, shouldCopyTags: shouldCopyTags ?? false });
        return runner.runSingleSequence([t1, ...copyTasks], log);
      },
    );
  });
};

export default plugin;
