// global
import { FastifyPluginAsync } from "fastify";
import { Actor, IdParam } from "graasp";
import fastifyCors from "fastify-cors";
import graaspS3FileItem, { GraaspS3FileItemOptions } from "graasp-s3-file-item";
import graaspFileItem from "graasp-file-item";
// local
import { PublicItemService } from "./db-service";
import common, { getOne, getChildren, getItemsBy, getMember, getMembers } from "./schemas";
import { GetPublicItemTask } from "./tasks/get-public-item";
import { GetPublicItemChildrenTask } from "./tasks/get-public-item-children";
import { GetPublicItemWithTagTask } from "./tasks/get-public-items-by-tag-task";
import { GetPublicMembersTask } from "./tasks/get-public-members-task";

// todo: import type from package
interface GraaspFileItemOptions {
  /**
   * Filesystem root path where the uploaded files will be saved
   */
  storageRootPath: string;
}
declare module "fastify" {
  interface FastifyInstance {
    s3FileItemPluginOptions?: GraaspS3FileItemOptions;
    fileItemPluginOptions?: GraaspFileItemOptions;
  }
}

export interface GraaspItemLoginOptions {
  /** id of the tag to look for in the item to check if an item is public */
  tagId: string;
  graaspActor: Actor;
  enableS3FileItemPlugin?: boolean;
}

const plugin: FastifyPluginAsync<GraaspItemLoginOptions> = async (fastify, options) => {
  const { tagId, graaspActor, enableS3FileItemPlugin } = options;
  const {
    items: { dbService: iS },
    taskRunner: runner,
    itemMemberships: { dbService: iMS },
    members: { dbService: mS, taskManager: mT },
  } = fastify;

  const pIS = new PublicItemService(tagId);

  // add CORS support
  if (fastify.corsPluginOptions) {
    fastify.register(fastifyCors, fastify.corsPluginOptions);
  }

  fastify.addSchema(common);

  fastify.register(
    () => {
      if (enableS3FileItemPlugin) {
        fastify.register(graaspS3FileItem, fastify.s3FileItemPluginOptions);
      } else {
        fastify.register(graaspFileItem, {
          ...fastify.fileItemPluginOptions,
          isPublic: true,
          graaspActor,
        });
      }

      fastify.get<{ Params: IdParam; Querystring: { withMemberships?: boolean } }>(
        "/:id",
        { schema: getOne },
        async ({ params: { id: itemId }, query: { withMemberships }, log }) => {
          const task = new GetPublicItemTask(
            graaspActor,
            itemId,
            { withMemberships },
            pIS,
            iS,
            iMS
          );
          return runner.runSingle(task, log);
        }
      );

      fastify.get<{ Params: IdParam; Querystring: { ordered?: boolean } }>(
        "/:id/children",
        { schema: getChildren },
        async ({ params: { id: itemId }, query: { ordered }, log }) => {
          const task = new GetPublicItemChildrenTask(graaspActor, itemId, pIS, iS, ordered);
          return runner.runSingle(task, log);
        }
      );

      fastify.get<{ Querystring: { tagId: string; withMemberships?: boolean } }>(
        "/",
        { schema: getItemsBy },
        async ({ query: { tagId, withMemberships }, log }) => {
          const task = new GetPublicItemWithTagTask(
            graaspActor,
            { tagId, withMemberships },
            pIS,
            iS,
            iMS
          );
          return runner.runSingle(task, log);
        }
      );
    },
    { prefix: "/items" }
  );

  // todo: move in another repo?

  fastify.get<{ Params: IdParam }>(
    "/members/:id",
    { schema: getMember },
    async ({ params: { id }, log }) => {
      const task = mT.createGetTask(graaspActor, id);
      return runner.runSingle(task, log);
    }
  );

  fastify.get<{ Querystring: { id: string[] } }>(
    "/members",
    { schema: getMembers },
    async ({ query: { id: ids }, log }) => {
      const task = new GetPublicMembersTask(graaspActor, ids, pIS, iS, mS);
      return runner.runSingle(task, log);
    }
  );
};

export default plugin;
