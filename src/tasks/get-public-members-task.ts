// global
import { Actor, DatabaseTransactionHandler, ItemService, Member, MemberService } from "graasp";
// local
import { PublicItemService } from "../db-service";
import { BasePublicItemTask } from "./base-public-item-task";

export class GetPublicMembersTask extends BasePublicItemTask<Member[]> {
  get name(): string {
    return GetPublicMembersTask.name;
  }

  private memberIds: string[];
  private memberService: MemberService;

  constructor(
    actor: Actor,
    memberIds: string[],
    publicItemService: PublicItemService,
    itemService: ItemService,
    memberService: MemberService
  ) {
    super(actor, publicItemService, itemService);
    this.itemService = itemService;
    this.publicItemService = publicItemService;
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
