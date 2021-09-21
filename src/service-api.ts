// global
import { FastifyPluginAsync } from "fastify";
import { Actor, IdParam } from "graasp";
import fastifyCors from "fastify-cors";
// local
import { PublicItemService } from "./db-service";
import common, { getOne, getChildren, getItemsBy, getMember, getMembers } from "./schemas";
import { GetPublicItemTask } from "./tasks/get-public-item";
import { GetPublicItemChildrenTask } from "./tasks/get-public-item-children";
import { GetPublicItemWithTagTask } from "./tasks/get-public-items-by-tag-task";
import { GetPublicMembersTask } from "./tasks/get-public-members-task";
import { GetPublicMemberTask } from "./tasks/get-public-member-task";

export interface GraaspItemLoginOptions {
  /** id of the tag to look for in the item to check if an item is public */
  tagId: string;
  graaspActor: Actor;
}

const plugin: FastifyPluginAsync<GraaspItemLoginOptions> = async (fastify, options) => {
  const { tagId, graaspActor } = options;
  const {
    items: { dbService: iS },
    taskRunner: runner,
    itemMemberships: { dbService: iMS },
    members: { dbService: mS },
  } = fastify;

  const pIS = new PublicItemService(tagId);

  // add CORS support
  if (fastify.corsPluginOptions) {
    fastify.register(fastifyCors, fastify.corsPluginOptions);
  }

  fastify.addSchema(common);

  fastify.get<{ Params: IdParam; Querystring: { withMemberships?: boolean } }>(
    "/items/:id",
    { schema: getOne },
    async ({ params: { id: itemId }, query: { withMemberships }, log }) => {
      const task = new GetPublicItemTask(graaspActor, itemId, { withMemberships }, pIS, iS, iMS);
      return runner.runSingle(task, log);
    }
  );

  fastify.get<{ Params: IdParam; Querystring: { ordered?: boolean } }>(
    "/items/:id/children",
    { schema: getChildren },
    async ({ params: { id: itemId }, query: { ordered }, log }) => {
      const task = new GetPublicItemChildrenTask(graaspActor, itemId, pIS, iS, ordered);
      return runner.runSingle(task, log);
    }
  );

  fastify.get<{ Querystring: { tagId: string; withMemberships?: boolean } }>(
    "/items",
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

  // todo: move in another repo?

  fastify.get<{ Params: IdParam }>(
    "/members/:id",
    { schema: getMember },
    async ({ params: { id }, log }) => {
      const task = new GetPublicMemberTask(graaspActor, id, pIS, iS, mS);
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
