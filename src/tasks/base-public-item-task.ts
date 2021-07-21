// global
import { FastifyLoggerInstance } from 'fastify';
import { Actor, DatabaseTransactionHandler, ItemService } from 'graasp';
import { Task, TaskStatus } from 'graasp';
// local
import { PublicItemService } from '../db-service';

export abstract class BasePublicItemTask<R> implements Task<Actor, R> {
  protected publicItemService: PublicItemService;
  protected itemService: ItemService;
  protected _result: R;
  protected _message: string;

  readonly actor: Actor;

  status: TaskStatus;
  targetId: string;

  constructor(actor: Actor, publicItemService: PublicItemService, itemService: ItemService) {
    this.actor = actor;
    this.publicItemService = publicItemService;
    this.itemService = itemService;
    this.status = 'NEW';
  }

  abstract get name(): string;
  get result(): R { return this._result; }
  get message(): string { return this._message; }

  abstract run(handler: DatabaseTransactionHandler, log: FastifyLoggerInstance): Promise<void | BasePublicItemTask<R>[]>;
}
