import { FastifyLoggerInstance } from 'fastify';

import { Actor, DatabaseTransactionHandler, MemberService, Task, TaskStatus } from 'graasp';

export abstract class BasePublicMemberTask<R> implements Task<Actor, R> {
  protected _result: R;
  protected _message: string;

  readonly actor: Actor;

  protected memberService: MemberService;

  status: TaskStatus;
  targetId: string;

  constructor(actor: Actor, memberService: MemberService) {
    this.actor = actor;
    this.status = 'NEW';
    this.memberService = memberService;
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
  ): Promise<void | BasePublicMemberTask<R>[]>;
}
