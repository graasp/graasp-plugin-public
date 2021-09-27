// global
import {
  Actor,
  DatabaseTransactionHandler,
  Item,
  ItemMembership,
  ItemMembershipService,
  ItemService,
  UnknownExtra,
} from "graasp";
// local
import { PublicItemService } from "../db-service";
import { ItemNotFound, ItemNotPublic } from "../util/graasp-public-items";
import { BasePublicItemTask } from "./base-public-item-task";

interface ItemWithMemberships<E extends UnknownExtra> extends Item<E> {
  itemMemberships?: ItemMembership[];
}

export class GetPublicItemTask<E extends UnknownExtra> extends BasePublicItemTask<
  ItemWithMemberships<E>
> {
  get name(): string {
    return GetPublicItemTask.name;
  }

  private withMemberships: boolean;
  private itemMembershipService: ItemMembershipService;

  constructor(
    actor: Actor,
    itemId: string,
    options: { withMemberships: boolean },
    publicItemService: PublicItemService,
    itemService: ItemService,
    itemMembershipService: ItemMembershipService
  ) {
    super(actor, publicItemService, itemService);
    this.itemService = itemService;
    this.publicItemService = publicItemService;
    this.targetId = itemId;
    this.withMemberships = options?.withMemberships;
    this.itemMembershipService = itemMembershipService;
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = "RUNNING";

    // get item
    const item = await this.itemService.get<E>(this.targetId, handler);
    if (!item) throw new ItemNotFound(this.targetId);

    // check if item is public
    const isPublic = await this.publicItemService.hasPublicTag(item, handler);
    if (!isPublic) throw new ItemNotPublic(this.targetId);

    this._result = item;

    // merge memberships when needed
    if (this.withMemberships) {
      const rootMemberships = await this.itemMembershipService.getInheritedForAll(item, handler);
      const itemMemberships = await this.itemMembershipService.getAllInSubtree(item, handler);
      this._result = { ...item, itemMemberships: [...rootMemberships, ...itemMemberships] };
    }

    this.status = "OK";
  }
}
