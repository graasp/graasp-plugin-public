// global
import { Actor, DatabaseTransactionHandler, Member, MemberService } from "graasp";
// local
import { BasePublicMemberTask } from "./base-public-member-task";

export class GetPublicMembersTask extends BasePublicMemberTask<Member[]> {
  get name(): string {
    return GetPublicMembersTask.name;
  }

  private memberIds: string[];
  private memberService: MemberService;

  constructor(actor: Actor, memberIds: string[], memberService: MemberService) {
    super(actor);
    this.memberIds = memberIds;
    this.memberService = memberService;
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = "RUNNING";

    // get member
    // todo: limit properties?
    const members = await Promise.all(
      this.memberIds.map(async (id) => await this.memberService.get(id, handler))
    );

    this._result = members;
    this.status = "OK";
  }
}
