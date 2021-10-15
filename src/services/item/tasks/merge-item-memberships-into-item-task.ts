// global
import {
  Actor,
  DatabaseTransactionHandler,
  Item,
  ItemMembership,
  ItemMembershipService,
  ItemService,
  UnknownExtra,
} from 'graasp';
// local
import { PublicItemService } from '../db-service';
import { BasePublicItemTask } from './base-public-item-task';

interface ItemWithMemberships<E extends UnknownExtra> extends Item<E> {
  itemMemberships?: ItemMembership[];
}

type InputType = { items?: Item[] };

export class MergeItemMembershipsIntoItems<E extends UnknownExtra> extends BasePublicItemTask<
  ItemWithMemberships<E>[]
> {
  get name(): string {
    return MergeItemMembershipsIntoItems.name;
  }

  input: InputType;
  getInput: () => InputType;

  private itemMembershipService: ItemMembershipService;

  constructor(
    actor: Actor,
    input: InputType,
    publicItemService: PublicItemService,
    itemService: ItemService,
    itemMembershipService: ItemMembershipService,
  ) {
    super(actor, publicItemService, itemService);
    this.itemService = itemService;
    this.input = input;
    this.publicItemService = publicItemService;
    this.itemMembershipService = itemMembershipService;
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = 'RUNNING';

    const items = this.input.items as Item<E>[];
    const itemsWithMemberships = await Promise.all(
      items.map(async (item) => {
        const rootMemberships = await this.itemMembershipService.getInheritedForAll(item, handler);
        const itemMemberships = await this.itemMembershipService.getAllInSubtree(item, handler);
        return { ...item, itemMemberships: [...rootMemberships, ...itemMemberships] };
      }),
    );

    this._result = itemsWithMemberships;
    this.status = 'OK';
  }
}
