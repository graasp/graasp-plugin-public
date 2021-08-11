// global
import { FastifyPluginAsync } from "fastify";
import { Actor, IdParam } from "graasp";
import fastifyCors from "fastify-cors";
// local
import { PublicItemService } from "./db-service";
import common, { getOne, getChildren } from "./schemas";
import { GetPublicItemTask } from "./tasks/get-public-item";
import { GetPublicItemChildrenTask } from "./tasks/get-public-item-children";

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
  } = fastify;

  const pIS = new PublicItemService(tagId);

  // add CORS support
  if (fastify.corsPluginOptions) {
    fastify.register(fastifyCors, fastify.corsPluginOptions);
  }

  fastify.addSchema(common);

  fastify.get<{ Params: IdParam }>(
    "/items/:id",
    { schema: getOne },
    async ({ params: { id: itemId }, log }) => {
      const task = new GetPublicItemTask(graaspActor, itemId, pIS, iS);
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
};

export default plugin;
