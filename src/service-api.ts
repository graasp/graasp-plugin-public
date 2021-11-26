// global
import { FastifyPluginAsync } from 'fastify';
import { Actor } from 'graasp';
import fastifyCors from 'fastify-cors';
import { GraaspLocalFileItemOptions, GraaspS3FileItemOptions } from 'graasp-plugin-file';

import common from './schemas/schemas';
import publicItemPlugin from './services/item/service-api';
import publicMemberPlugin from './services/member/service-api';

declare module 'fastify' {
  interface FastifyInstance {
    s3FileItemPluginOptions?: GraaspS3FileItemOptions;
    fileItemPluginOptions?: GraaspLocalFileItemOptions;
  }
}

export interface GraaspPublicPluginOptions {
  /** id of the tag to look for in the item to check if an item is public */
  tagId: string;
  graaspActor: Actor;
  enableS3FileItemPlugin?: boolean;
}

const plugin: FastifyPluginAsync<GraaspPublicPluginOptions> = async (fastify, options) => {
  // add CORS support
  if (fastify.corsPluginOptions) {
    fastify.register(fastifyCors, fastify.corsPluginOptions);
  }

  fastify.addSchema(common);

  fastify.register(publicItemPlugin, { ...options, prefix: '/items' });
  fastify.register(publicMemberPlugin, { ...options, prefix: '/members' });
};

export default plugin;
