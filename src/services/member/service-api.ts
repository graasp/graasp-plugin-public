// global
import { FastifyPluginAsync } from "fastify";
import { Actor, IdParam } from "graasp";
// local
import { getMember, getMembers } from "./schemas";
import { GetPublicMembersTask } from "./tasks/get-public-members-task";

export interface GraaspItemLoginOptions {
  /** id of the tag to look for in the item to check if an item is public */
  tagId: string;
  graaspActor: Actor;
  enableS3FileItemPlugin?: boolean;
}

const plugin: FastifyPluginAsync<GraaspItemLoginOptions> = async (fastify, options) => {
  const { tagId, graaspActor } = options;
  const {
    taskRunner: runner,
    members: { dbService: mS, taskManager: mT },
  } = fastify;

  fastify.get<{ Params: IdParam }>(
    "/:id",
    { schema: getMember },
    async ({ params: { id }, log }) => {
      const task = mT.createGetTask(graaspActor, id);
      return runner.runSingle(task, log);
    }
  );

  fastify.get<{ Querystring: { id: string[] } }>(
    "/",
    { schema: getMembers },
    async ({ query: { id: ids }, log }) => {
      const task = new GetPublicMembersTask(graaspActor, ids, mS);
      return runner.runSingle(task, log);
    }
  );
};

export default plugin;
