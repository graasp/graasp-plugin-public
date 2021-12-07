// global
import { FastifyPluginAsync } from 'fastify';
import { Actor } from 'graasp';
import fastifyCors from 'fastify-cors';
import { GraaspS3FileItemOptions } from 'graasp-plugin-s3-file-item';
import { GraaspFileItemOptions } from 'graasp-plugin-file-item';
// local
import common from './schemas/schemas';
import publicItemPlugin from './services/item/service-api';
import publicMemberPlugin from './services/member/service-api';

declare module 'fastify' {
  interface FastifyInstance {
    s3FileItemPluginOptions?: GraaspS3FileItemOptions;
    fileItemPluginOptions?: GraaspFileItemOptions;
  }
}

export interface GraaspPublicPluginOptions {
  /** id of the tag to look for in the item to check if an item is public */
  tagId: string;
  graaspActor: Actor;
  enableS3FileItemPlugin?: boolean;
  publishedTagId: string;
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

/**
 *
 * import tags
 *
 *        public            published
 * publicTagId      publishedTagId
 *            <<<<- isPublished / isPublic   / get all public items / get all published items
 * will contain main item, members, memberships public calls
 *
 * we only need published for  GET itemsby groups
 *
 *
 *
 * public plugins in each plugin
 * --> sauf memberships, members et item à cause du dep depenencies
 *
 * GET item + COPY
 * GET memberships
 * GET members
 *
 * GET categories    <<<<-   by categories <- if have a good db service call, can use filter out by tagids
 * GET thumbnails
 * GET tags  <<<- get all items by tagid
 *
 * GET chat
 * GET apps
 *
 * ---> import public to use its db-service
 * ---> will import public plugins in graasp-core  + main public
 */
