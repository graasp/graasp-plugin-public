import { Actor, DatabaseTransactionHandler, Item, ItemService } from 'graasp';
import { ItemTagService } from 'graasp-item-tags';

import { ItemNotPublic } from '../../../util/errors';
import { PublicItemService } from '../db-service';
import { BasePublicItemTask } from './base-public-item-task';

export type GetManyPublicItemsTaskInputType = {
  itemIds: string[];
};
export class GetManyPublicItemsTask extends BasePublicItemTask<(Item | ItemNotPublic)[]> {
  input: GetManyPublicItemsTaskInputType;
  getInput: () => GetManyPublicItemsTaskInputType;

  get name(): string {
    return GetManyPublicItemsTask.name;
  }

  constructor(
    actor: Actor,
    publicItemService: PublicItemService,
    itemTagService: ItemTagService,
    itemService: ItemService,
    publicTagId: string,
    input: GetManyPublicItemsTaskInputType,
  ) {
    super(actor, publicItemService, itemTagService, itemService, publicTagId);
    this.input = input;
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = 'RUNNING';

    const { itemIds } = this.input;
    this.targetId = JSON.stringify(itemIds);

    // get items
    const items = await this.itemService.getMany(itemIds, handler);

    // filter out private items
    const publicItems = await Promise.all(
      items.map(async (item) => {
        const isPublic = await this.publicItemService.isPublic(item, handler);
        return isPublic ? item : new ItemNotPublic(item.id);
      }),
    );

    this._result = publicItems;
    this.status = 'OK';
  }
}
