import fastify from 'fastify';
import plugin from '../src/service-api';
import schemas from '../src/schemas/common';

const build = async ({
  taskManager,
  runner,
  itemDbService,
  memberDbService,
  itemMemberhipDbService,
  memberTaskManager,
  options,
}) => {
  const app = fastify();
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

  await app.register(plugin, { ...options, prefix: '/p' });

  return app;
};
export default build;
