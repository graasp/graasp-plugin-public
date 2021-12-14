import { Actor } from 'graasp';
import { PublicItemService } from '.';
import { TaskManager } from './services/item/task-manager';

declare module 'fastify' {
  interface FastifyInstance {
    public?: {
      items: { taskManager: TaskManager; dbService: PublicItemService };
      publicTagId: string;
      publishedTagId: string;
      graaspActor: Actor;
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface GraaspPublicPluginOptions {}
