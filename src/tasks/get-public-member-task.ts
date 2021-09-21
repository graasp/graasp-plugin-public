// global
import { Actor, DatabaseTransactionHandler, ItemService, Member, MemberService } from "graasp";
// local
import { PublicItemService } from "../db-service";
import { BasePublicItemTask } from "./base-public-item-task";

export class GetPublicMemberTask extends BasePublicItemTask<Member> {
  get name(): string {
    return GetPublicMemberTask.name;
  }

  private memberId: string;
  private memberService: MemberService;

  constructor(
    actor: Actor,
    memberId: string,
    publicItemService: PublicItemService,
    itemService: ItemService,
    memberService: MemberService
  ) {
    super(actor, publicItemService, itemService);
    this.itemService = itemService;
    this.publicItemService = publicItemService;
    this.memberId = memberId;
    this.memberService = memberService;
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = "RUNNING";

    // get member
    // todo: limit properties?
    const member = await this.memberService.get(this.memberId, handler);

    this._result = member;
    this.status = "OK";
  }
}
