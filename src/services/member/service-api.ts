// global
import { FastifyPluginAsync } from 'fastify';
import { IdParam } from 'graasp';
import graaspPluginThumbnails from 'graasp-plugin-thumbnails';
import { GraaspPublicPluginOptions } from '../../service-api';
import { CannotEditPublicMember } from '../../util/graasp-public-items';
// local
import { getMember, getMembers } from './schemas';
import { GetPublicMembersTask } from './tasks/get-public-members-task';

const plugin: FastifyPluginAsync<GraaspPublicPluginOptions> = async (fastify, options) => {
  const { graaspActor, enableS3FileItemPlugin } = options;
  const {
    taskRunner: runner,
    members: { dbService: mS, taskManager: mT },
  } = fastify;

  await fastify.register(graaspPluginThumbnails, {
    enableS3FileItemPlugin: enableS3FileItemPlugin,
    pluginStoragePrefix: 'thumbnails/users',
    uploadValidation: async (id) => {
      throw new CannotEditPublicMember(id);
    },
    downloadValidation: async (id) => [ mT.createGetTask(graaspActor, id) ],
    // endpoint
    prefix: '/avatars',
  });

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
