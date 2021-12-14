import { FastifyPluginAsync } from 'fastify';
import { ItemTagService } from 'graasp-item-tags';
import { PublicItemService } from '../..';
import { GraaspPublicPluginOptions } from '../../types';
import { TaskManager as PublicItemMembershipTaskManager } from './task-manager';
import { getMany } from './schemas';

const plugin: FastifyPluginAsync<GraaspPublicPluginOptions> = async (fastify) => {
  const {
    items: { dbService: iS },
    itemMemberships: { taskManager: iMTM },
    taskRunner: runner,
    public: { publicTagId, graaspActor },
  } = fastify;

  const itemTagService = new ItemTagService();
  const pIS = new PublicItemService(publicTagId);
  const pITM = new PublicItemMembershipTaskManager(pIS, iS, itemTagService, iMTM);

  fastify.get<{ Querystring: { itemId: string[] } }>(
    '/',
    { schema: getMany },
    async ({ query: { itemId: itemIds }, log }) => {
      const tasks = pITM.createGetManyPublicItemMembershipsTaskSequence(graaspActor, itemIds);
      const ddd = await runner.runSingleSequence(tasks, log);
      return ddd
    },
  );
};
export default plugin;
