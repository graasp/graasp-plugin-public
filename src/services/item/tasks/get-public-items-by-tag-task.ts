// global
import { Actor, DatabaseTransactionHandler, Item, ItemService } from 'graasp';
// local
import { PublicItemService } from '../db-service';
import { BasePublicItemTask } from './base-public-item-task';

export class GetPublicItemsWithTagTask extends BasePublicItemTask<readonly Item[]> {
  get name(): string {
    return GetPublicItemsWithTagTask.name;
  }

  private tagId: string;

  constructor(
    actor: Actor,
    options: { tagId: string },
    publicItemService: PublicItemService,
    itemService: ItemService,
  ) {
    super(actor, publicItemService, itemService);
    this.itemService = itemService;
    this.publicItemService = publicItemService;
    this.tagId = options.tagId;
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = 'RUNNING';

    // get item
    const items = await this.publicItemService.getPublicItemsByTag(this.tagId, handler);
    this._result = items;

    this.status = 'OK';
  }
}
