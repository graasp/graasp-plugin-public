import { FastifyPluginAsync } from 'fastify';
import { IdParam, Member } from 'graasp';
import ThumbnailsPlugin, { buildFilePathWithPrefix, THUMBNAIL_MIMETYPE } from 'graasp-plugin-thumbnails';

import { GraaspPublicPluginOptions } from '../../service-api';
import { CannotEditPublicMember } from '../../util/graasp-public-items';
import { getMember, getMembers } from './schemas';
import { GetPublicMembersTask } from './tasks/get-public-members-task';

const PATH_PREFIX = 'avatars/';

const plugin: FastifyPluginAsync<GraaspPublicPluginOptions> = async (fastify, options) => {
  const { graaspActor, serviceMethod } = options;
  const {
    taskRunner: runner,
    members: { dbService: mS, taskManager: mT },
  } = fastify;

  fastify.register(ThumbnailsPlugin, {
    serviceMethod: serviceMethod,
    serviceOptions: {
      s3: fastify.s3FileItemPluginOptions,
      local: fastify.fileItemPluginOptions,
    },
    pathPrefix: PATH_PREFIX,

    uploadPreHookTasks: async (id) => {
      throw new CannotEditPublicMember(id);
    },
    downloadPreHookTasks: async ({ itemId: id, filename }) => {
      const task = mT.createGetTask(graaspActor, id);
      task.getResult = () => ({
        filepath: buildFilePathWithPrefix({ itemId: (task.result as Member).id, pathPrefix: PATH_PREFIX, filename }),
        mimetype: THUMBNAIL_MIMETYPE,
      });
      return [task];
    },
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
