import { FastifyPluginAsync } from 'fastify';
import { IdParam, Member } from 'graasp';
import { ServiceMethod } from 'graasp-plugin-file';
import ThumbnailsPlugin, { buildFilePathWithPrefix, THUMBNAIL_MIMETYPE } from 'graasp-plugin-thumbnails';

import { GraaspPublicPluginOptions } from '../../service-api';
import { CannotEditPublicMember } from '../../util/graasp-public-items';
import { getMember, getMembers } from './schemas';
import { GetPublicMembersTask } from './tasks/get-public-members-task';

const plugin: FastifyPluginAsync<GraaspPublicPluginOptions> = async (fastify, options) => {
  const { graaspActor, enableS3FileItemPlugin } = options;
  const {
    taskRunner: runner,
    members: { dbService: mS, taskManager: mT },
  } = fastify;

  const pathPrefix = 'avatars/';

  fastify.register(ThumbnailsPlugin, {
    serviceMethod: enableS3FileItemPlugin ? ServiceMethod.S3 : ServiceMethod.LOCAL,
    serviceOptions: {
      s3: fastify.s3FileItemPluginOptions,
      local: fastify.fileItemPluginOptions,
    },
    pathPrefix: pathPrefix,

    uploadPreHookTasks: async (id) => {
      throw new CannotEditPublicMember(id);
    },
    downloadPreHookTasks: async ({ itemId: id, filename }) => {
      const task = mT.createGetTask(graaspActor, id);
      task.getResult = () => ({
        filepath: buildFilePathWithPrefix({ itemId: (task.result as Member).id, pathPrefix, filename }),
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
