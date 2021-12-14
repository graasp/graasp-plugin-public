// global
import { Actor, DatabaseTransactionHandler, Member, MemberService } from 'graasp';
// local
import { BasePublicMemberTask } from './base-public-member-task';

type GetPublicMembersTaskInputType = {
  memberIds?: string[]
}

export class GetPublicMembersTask extends BasePublicMemberTask<Member[]> {
  input?: GetPublicMembersTaskInputType
  getInput?: () => GetPublicMembersTaskInputType

  get name(): string {
    return GetPublicMembersTask.name;
  }

  private memberIds: string[];
  private memberService: MemberService;

  constructor(actor: Actor, memberService: MemberService, input: GetPublicMembersTaskInputType) {
    super(actor);
    this.input = input;
    this.memberService = memberService;
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = 'RUNNING';

    const { memberIds } = this.input;
    this.targetId = memberIds?.join(',');

    // get member
    // todo: limit properties?
    const members = await Promise.all(
      memberIds.map(async (id) => await this.memberService.get(id, handler)),
    );

    this._result = members;
    this.status = 'OK';
  }
}
