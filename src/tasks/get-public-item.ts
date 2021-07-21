// global
import { Actor, DatabaseTransactionHandler, Item, ItemService } from 'graasp';
// local
import { PublicItemService } from '../db-service';
import { ItemNotFound, ItemNotPublic } from '../util/graasp-public-items';
import { BasePublicItemTask } from './base-public-item-task';

export class GetPublicItemTask extends BasePublicItemTask<Item> {
  get name(): string { return GetPublicItemTask.name; }

  constructor(actor: Actor, itemId: string, publicItemService: PublicItemService, itemService: ItemService) {
    super(actor, publicItemService, itemService);
    this.itemService = itemService;
    this.publicItemService = publicItemService;
    this.targetId = itemId;
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = 'RUNNING';

    // get item
    const item = await this.itemService.get(this.targetId, handler);
    if (!item) throw new ItemNotFound(this.targetId);

    // check if item is public
    const isPublic = await this.publicItemService.hasPublicTag(item, handler);
    if (!isPublic) throw new ItemNotPublic(this.targetId);

    this._result = item;
    this.status = 'OK';
  }
}
