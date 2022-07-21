import { DatabaseTransactionHandler, Item, ItemService, TaskStatus } from '@graasp/sdk';
import { Actor } from '@graasp/sdk';
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
    super(member, publicItemService, itemTagService, itemService, publicTagId);
    this.input = input;
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = TaskStatus.RUNNING;

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
    this.status = TaskStatus.OK;
  }
}
