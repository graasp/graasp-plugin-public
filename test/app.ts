import fastify from 'fastify';
import plugin from '../src/service-api';
import schemas from '../src/schemas/common';
import { ItemMembershipService, ItemService, MemberService, MemberTaskManager } from 'graasp';
import { TaskRunner, ItemTaskManager, ItemMembershipTaskManager } from 'graasp-test';
import { GraaspPublicPluginOptions } from '../src/types';
import { DEFAULT_GRAASP_ACTOR, PUBLIC_TAG_ID, PUBLISHED_TAG_ID } from './constants';

type props = {
  taskManager: ItemTaskManager;
  runner: TaskRunner;
  itemDbService: ItemService;
  memberDbService: MemberService;
  itemMemberhipDbService: ItemMembershipService;
  memberTaskManager: MemberTaskManager;
  verifyAuthenticationMock?: () => void;
  options?: Partial<GraaspPublicPluginOptions>;
  itemMembershipTaskManager?: ItemMembershipTaskManager
};

const build = async ({
  taskManager,
  runner,
  itemDbService,
  memberDbService,
  itemMemberhipDbService,
  itemMembershipTaskManager,
  memberTaskManager,
  verifyAuthenticationMock,
  options,
}: props) => {
  const app = fastify({
    ajv: {
      customOptions: {
        // This allow routes that take array to correctly interpret single values as an array
        // https://github.com/fastify/fastify/blob/main/docs/Validation-and-Serialization.md
        coerceTypes: 'array',
      },
    },
  });
  app.decorate('verifyAuthentication', verifyAuthenticationMock ?? jest.fn());
  app.addSchema(schemas);

  app.decorate('taskRunner', runner);
  app.decorate('items', {
    taskManager,
    dbService: itemDbService,
  });
  app.decorate('itemMemberships', {
    dbService: itemMemberhipDbService,
    taskManager: itemMembershipTaskManager
  });
  app.decorate('members', {
    dbService: memberDbService,
    taskManager: memberTaskManager,
  });
  app.decorate('public', {
    publicTagId: PUBLIC_TAG_ID,
    publishedTagId: PUBLISHED_TAG_ID,
    graaspActor: DEFAULT_GRAASP_ACTOR,
  });

  await app.register(plugin, {
    ...options,

    prefix: '/p',
  });

  return app;
};
export default build;
