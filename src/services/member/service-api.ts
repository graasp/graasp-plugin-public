import { FastifyPluginAsync } from 'fastify';

import { IdParam } from '@graasp/sdk';

import { GraaspPublicPluginOptions } from '../../types';
import { getMember, getMembers } from './schemas';
import { GetPublicMembersTask } from './tasks/get-public-members-task';

const plugin: FastifyPluginAsync<GraaspPublicPluginOptions> = async (fastify) => {
  const {
    taskRunner: runner,
    members: { dbService: mS, taskManager: mT },
    public: { graaspActor },
  } = fastify;

  fastify.get<{ Params: IdParam }>(
    '/:id',
    { schema: getMember },
    async ({ params: { id }, log }) => {
      const task = mT.createGetTask(graaspActor, id);
      return runner.runSingle(task, log);
    },
  );

  fastify.get<{ Querystring: { id: string[] } }>(
    '/',
    { schema: getMembers },
    async ({ query: { id: ids }, log }) => {
      const task = new GetPublicMembersTask(graaspActor, mS, { memberIds: ids });
      return runner.runSingle(task, log);
    },
  );
};

export default plugin;
