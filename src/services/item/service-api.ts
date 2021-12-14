import { FastifyPluginAsync } from 'fastify';
import { IdParam } from 'graasp';

// local
import { PublicItemService } from './db-service';
import { getOne, getChildren, getItemsBy, copyOne } from './schemas';
import { ItemTagService } from 'graasp-item-tags';
import { GraaspPublicPluginOptions } from '../../types';
import { PublicItemTaskManager } from '../..';

const plugin: FastifyPluginAsync<GraaspPublicPluginOptions> = async (fastify) => {
  const {
    items: { dbService: iS, taskManager: iTM },
    taskRunner: runner,
    public: { publicTagId, graaspActor },
  } = fastify;

  const itemTagService = new ItemTagService();
  const pIS = new PublicItemService(publicTagId);
  const pITM = new PublicItemTaskManager(pIS, iS, itemTagService, publicTagId);

  fastify.get<{ Params: IdParam }>(
    '/:id',
    { schema: getOne },
    async ({ params: { id: itemId }, log }) => {
      const t1 = pITM.createGetPublicItemTask(graaspActor, { itemId });
      return runner.runSingle(t1, log);
    },
  );

  fastify.get<{ Params: IdParam; Querystring: { ordered?: boolean } }>(
    '/:id/children',
    { schema: getChildren },
    async ({ params: { id: itemId }, query: { ordered }, log }) => {
      const t1 = pITM.createGetPublicItemTask(graaspActor, { itemId });
      const t2 = iTM.createGetChildrenTask(graaspActor, {});
      t2.getInput = () => ({ ordered, item: t1.result });
      return runner.runSingleSequence([t1, t2], log);
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
        const t1 = pITM.createGetPublicItemTask(graaspActor, { itemId });

        // do not copy tags by default
        const copyTasks = iTM.createCopySubTaskSequence(member, t1, {
          parentId,
          shouldCopyTags: shouldCopyTags ?? false,
        });
        return runner.runSingleSequence([t1, ...copyTasks], log);
      },
    );
  });

  // get public items by tag id
  fastify.get<{ Querystring: { tagId: string[] } }>(
    '/',
    { schema: getItemsBy },
    async ({ query: { tagId: tagIds }, log }) => {
      const t1 = pITM.createGetPublicItemIdsByTagsTask(graaspActor, { tagIds });
      // use item manager task to get trigger post hooks (deleted items are removed)
      const t2 = iTM.createGetManyTask(graaspActor);
      t2.getInput = () => ({
        itemIds: t1.result,
      });
      // remove unavailable items
      return runner.runSingleSequence([t1, t2], log);
    },
  );
};

export default plugin;
