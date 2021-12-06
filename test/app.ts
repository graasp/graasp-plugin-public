import fastify from 'fastify';
import plugin, { GraaspPublicPluginOptions } from '../src/service-api';
import schemas from '../src/schemas/common';
import { ItemMembershipService, ItemService, MemberService, MemberTaskManager } from 'graasp';
import { TaskRunner, ItemTaskManager } from 'graasp-test';
import { DEFAULT_GRAASP_ACTOR } from './constants';
import { ServiceMethod } from 'graasp-plugin-file';

type props = {
  taskManager: ItemTaskManager;
  runner: TaskRunner;
  itemDbService: ItemService;
  memberDbService: MemberService;
  itemMemberhipDbService: ItemMembershipService;
  memberTaskManager: MemberTaskManager;
  verifyAuthenticationMock?: () => void;
  options?: Partial<GraaspPublicPluginOptions>;
};

const build = async ({
  taskManager,
  runner,
  itemDbService,
  memberDbService,
  itemMemberhipDbService,
  memberTaskManager,
  verifyAuthenticationMock,
  options,
}: props) => {
  const app = fastify();
  app.decorate('verifyAuthentication', verifyAuthenticationMock ?? jest.fn());
  app.addSchema(schemas);

  app.decorate('taskRunner', runner);
  app.decorate('items', {
    taskManager,
    dbService: itemDbService,
  });
  app.decorate('itemMemberships', {
    dbService: itemMemberhipDbService,
  });
  app.decorate('members', {
    dbService: memberDbService,
    taskManager: memberTaskManager,
  });
  app.decorate('fileItemPluginOptions', {
    storageRootPath: '/',
  });

  await app.register(plugin, {
    tagId: 'sometagid',
    graaspActor: DEFAULT_GRAASP_ACTOR,
    ...options,
    serviceMethod: ServiceMethod.LOCAL,
    prefix: '/p',
  });

  return app;
};
export default build;
