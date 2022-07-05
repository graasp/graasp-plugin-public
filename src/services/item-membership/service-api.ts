import { FastifyPluginAsync } from 'fastify';

import { ItemTagService } from 'graasp-item-tags';

import { PublicItemService } from '../..';
import { GraaspPublicPluginOptions } from '../../types';
import { getMany } from './schemas';
import { TaskManager as PublicItemMembershipTaskManager } from './task-manager';

const plugin: FastifyPluginAsync<GraaspPublicPluginOptions> = async (fastify) => {
  const {
    items: { dbService: iS },
    itemMemberships: { taskManager: iMTM },
    taskRunner: runner,
    public: { publicTagId, graaspActor },
  } = fastify;

  const itemTagService = new ItemTagService();
  const pIS = new PublicItemService(publicTagId);
  const pITM = new PublicItemMembershipTaskManager(pIS, iS, itemTagService, iMTM, publicTagId);

  fastify.get<{ Querystring: { itemId: string[] } }>(
    '/',
    { schema: getMany },
    async ({ query: { itemId: itemIds }, log }) => {
      const tasks = pITM.createGetManyPublicItemMembershipsTaskSequence(graaspActor, itemIds);
      return runner.runSingleSequence(tasks, log);
    },
  );
};
export default plugin;
