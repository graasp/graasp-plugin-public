// global
import { FastifyLoggerInstance } from 'fastify';
import { Actor, DatabaseTransactionHandler, ItemService } from 'graasp';
import { Task, TaskStatus } from 'graasp';
import { ItemTagService } from 'graasp-item-tags';
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
  skip?: boolean;

  input: unknown;
  getInput: () => unknown;

  getResult: () => unknown;

  protected itemTagService: ItemTagService;

  constructor(
    actor: Actor,
    publicItemService: PublicItemService,
    itemTagService: ItemTagService,
    itemService: ItemService,
  ) {
    this.actor = actor;
    this.publicItemService = publicItemService;
    this.itemTagService = itemTagService;
    this.itemService = itemService;
    this.status = 'NEW';
  }

  abstract get name(): string;
  get result(): R {
    return this._result;
  }
  get message(): string {
    return this._message;
  }

  abstract run(
    handler: DatabaseTransactionHandler,
    log: FastifyLoggerInstance,
  ): Promise<void | BasePublicItemTask<R>[]>;
}
