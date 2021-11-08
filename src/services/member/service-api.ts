// global
import { FastifyPluginAsync } from 'fastify';
import { IdParam } from 'graasp';
import { GraaspPublicPluginOptions } from '../../service-api';
// local
import { getMember, getMembers } from './schemas';
import { GetPublicMembersTask } from './tasks/get-public-members-task';

const plugin: FastifyPluginAsync<GraaspPublicPluginOptions> = async (fastify, options) => {
  const { graaspActor } = options;
  const {
    taskRunner: runner,
    members: { dbService: mS, taskManager: mT },
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
      const task = new GetPublicMembersTask(graaspActor, ids, mS);
      return runner.runSingle(task, log);
    },
  );
};

export default plugin;
