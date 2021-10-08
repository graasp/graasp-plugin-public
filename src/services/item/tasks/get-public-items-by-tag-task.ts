// global
import {
  Actor,
  DatabaseTransactionHandler,
  Item,
  ItemMembershipService,
  ItemService,
} from 'graasp';
// local
import { PublicItemService } from '../db-service';
import { BasePublicItemTask } from './base-public-item-task';

export class GetPublicItemWithTagTask extends BasePublicItemTask<readonly Item[]> {
  get name(): string {
    return GetPublicItemWithTagTask.name;
  }

  private tagId: string;
  private withMemberships: boolean;
  private itemMembershipService: ItemMembershipService;

  constructor(
    actor: Actor,
    options: { tagId: string; withMemberships?: boolean },
    publicItemService: PublicItemService,
    itemService: ItemService,
    itemMembershipService: ItemMembershipService,
  ) {
    super(actor, publicItemService, itemService);
    this.itemService = itemService;
    this.itemMembershipService = itemMembershipService;
    this.publicItemService = publicItemService;
    this.tagId = options.tagId;
    this.withMemberships = options?.withMemberships;
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = 'RUNNING';

    // get item
    const items = await this.publicItemService.getPublicItemsByTag(this.tagId, handler);
    this._result = items;

    // merge memberships when needed
    if (this.withMemberships) {
      const itemsWithMemberships = await Promise.all(
        items.map(async (item) => {
          const rootMemberships = await this.itemMembershipService.getInheritedForAll(
            item,
            handler,
          );
          const itemMemberships = await this.itemMembershipService.getAllInSubtree(item, handler);
          return { ...item, itemMemberships: [...rootMemberships, ...itemMemberships] };
        }),
      );
      this._result = itemsWithMemberships;
    }

    this.status = 'OK';
  }
}
