import {
  Actor,
  DatabaseTransactionHandler,
  Item,
  ItemService,
  TaskStatus,
  UnknownExtra,
} from '@graasp/sdk';
import { ItemTagService } from 'graasp-item-tags';

import { ItemNotFound, ItemNotPublic } from '../../../util/errors';
import { PublicItemService } from '../db-service';
import { BasePublicItemTask } from './base-public-item-task';

export type GetPublicItemTaskInputType = {
  itemId: string;
};
export class GetPublicItemTask<E extends UnknownExtra> extends BasePublicItemTask<Item<E>> {
  input: GetPublicItemTaskInputType;
  getInput: () => GetPublicItemTaskInputType;

  get name(): string {
    return GetPublicItemTask.name;
  }

  constructor(
    actor: Actor,
    publicItemService: PublicItemService,
    itemTagService: ItemTagService,
    itemService: ItemService,
    publicTagId: string,
    input: GetPublicItemTaskInputType,
  ) {
    super(actor, publicItemService, itemTagService, itemService, publicTagId);
    this.input = input;
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = TaskStatus.RUNNING;

    const { itemId } = this.input;
    this.targetId = itemId;

    // get item
    const item = await this.itemService.get<E>(this.targetId, handler);
    if (!item) throw new ItemNotFound(this.targetId);

    // check if item is public
    const isPublic = await this.publicItemService.isPublic(item, handler);
    if (!isPublic) throw new ItemNotPublic(this.targetId);

    this._result = item;
    this.status = TaskStatus.OK;
  }
}
