// global
import { FastifyPluginAsync } from 'fastify';
import fastifyCors from 'fastify-cors';

import common from './schemas/schemas';
import publicItemPlugin from './services/item/service-api';
import publicMemberPlugin from './services/member/service-api';
import publicItemMembershipPlugin from './services/item-membership/service-api';
import { GraaspPublicPluginOptions } from './types';

const plugin: FastifyPluginAsync<GraaspPublicPluginOptions> = async (fastify, options) => {
  // add CORS support
  if (fastify.corsPluginOptions) {
    fastify.register(fastifyCors, fastify.corsPluginOptions);
  }

  fastify.addSchema(common);

  fastify.register(publicItemPlugin, { ...options, prefix: '/items' });
  fastify.register(publicMemberPlugin, { ...options, prefix: '/members' });
  fastify.register(publicItemMembershipPlugin, { ...options, prefix: '/item-memberships' });
};

export default plugin;
