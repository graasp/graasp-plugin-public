import { DatabaseTransactionHandler, Item, ItemService } from 'graasp';
import { Actor } from 'graasp';
import { ItemTagService } from 'graasp-item-tags';
import { PublicItemService } from '../db-service';
import { BasePublicItemTask } from './base-public-item-task';

export type FilterPublicItemsTaskInputType = {
  items?: Item[];
  tagIds?: string[];
};

export class FilterPublicItemsTask extends BasePublicItemTask<readonly Item[]> {
  input: FilterPublicItemsTaskInputType;
  getInput: () => FilterPublicItemsTaskInputType;

  publicTagId: string;

  get name(): string {
    return FilterPublicItemsTask.name;
  }

  constructor(
    member: Actor,
    publicItemService: PublicItemService,
    itemTagService: ItemTagService,
    itemService: ItemService,
    publicTagId: string,
    input: FilterPublicItemsTaskInputType,
  ) {
    super(member, publicItemService, itemTagService, itemService);
    this.input = input;
    this.publicTagId = publicTagId;
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = 'RUNNING';

    const { items, tagIds = [] } = this.input;

    const itemsForTags = await Promise.all(
      items.map(async (item) => {
        const condition = await this.itemTagService.hasTags(
          item,
          [this.publicTagId, ...tagIds],
          handler,
        );
        return condition ? item : null;
      }),
    );

    this._result = itemsForTags.filter(Boolean);
    this.status = 'OK';
  }
}
