import { Actor, DatabaseTransactionHandler, ItemService, TaskStatus } from '@graasp/sdk';
import { ItemTagService } from 'graasp-item-tags';

import { PublicItemService } from '../db-service';
import { BasePublicItemTask } from './base-public-item-task';

export type GetPublicItemIdsWithTagsTaskInputType = { tagIds: string[] };

export class GetPublicItemIdsWithTagsTask extends BasePublicItemTask<readonly string[]> {
  input: GetPublicItemIdsWithTagsTaskInputType;
  getInput: () => GetPublicItemIdsWithTagsTaskInputType;

  publicTagId: string;

  get name(): string {
    return GetPublicItemIdsWithTagsTask.name;
  }

  constructor(
    actor: Actor,
    publicItemService: PublicItemService,
    itemTagService: ItemTagService,
    itemService: ItemService,
    publicTagId: string,
    input: GetPublicItemIdsWithTagsTaskInputType,
  ) {
    super(actor, publicItemService, itemTagService, itemService, publicTagId);
    this.input = input;
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = TaskStatus.RUNNING;

    const { tagIds } = this.input;

    const itemPaths = await this.itemTagService.getItemPathsByTags(
      [this.publicTagId, ...tagIds],
      handler,
    );
    const itemIds = itemPaths.map(({ item_path: path }) => {
      const splitted = path.split('.');
      return splitted[splitted.length - 1].replace(/_/g, '-');
    });
    this._result = itemIds;

    this.status = TaskStatus.OK;
  }
}
