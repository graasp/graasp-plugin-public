// global
import { Actor, DatabaseTransactionHandler, Item, ItemService } from 'graasp';
// local
import { PublicItemService } from '../db-service';
import { BasePublicItemTask } from './base-public-item-task';

export class GetPublicItemIdsWithTagTask extends BasePublicItemTask<readonly string[]> {
  get name(): string {
    return GetPublicItemIdsWithTagTask.name;
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
    const itemPaths = await this.publicItemService.getPublicItemPathsByTag(this.tagId, handler);
    const itemIds = itemPaths.map(({ item_path: path }) => {
      const splitted = path.split('.');
      return splitted[splitted.length - 1].replace(/_/g, '-');
    });
    this._result = itemIds;

    this.status = 'OK';
  }
}
