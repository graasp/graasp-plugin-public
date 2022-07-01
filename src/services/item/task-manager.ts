import { Actor, Item, ItemService } from 'graasp';
import { ItemTagService } from 'graasp-item-tags';

import { PublicItemService } from './db-service';
import { BasePublicItemTask } from './tasks/base-public-item-task';
import {
  FilterPublicItemsTask,
  FilterPublicItemsTaskInputType,
} from './tasks/filter-public-items-task';
import {
  GetManyPublicItemsTask,
  GetManyPublicItemsTaskInputType,
} from './tasks/get-many-public-items-task';
import {
  GetPublicItemIdsWithTagsTask,
  GetPublicItemIdsWithTagsTaskInputType,
} from './tasks/get-public-item-ids-by-tags-task';
import { GetPublicItemTask, GetPublicItemTaskInputType } from './tasks/get-public-item-task';

export class TaskManager {
  private itemService: ItemService;
  private itemTagService: ItemTagService;
  private publicTagId: string;
  private publicItemService: PublicItemService;

  constructor(
    publicItemService: PublicItemService,
    itemService: ItemService,
    itemTagService: ItemTagService,
    publicTagId: string,
  ) {
    this.itemService = itemService;
    this.itemTagService = itemTagService;
    this.publicTagId = publicTagId;
    this.publicItemService = publicItemService;
  }

  createFilterPublicItemsTaskName(): string {
    return FilterPublicItemsTask.name;
  }

  createFilterPublicItemsTask(
    member: Actor,
    input: FilterPublicItemsTaskInputType,
  ): FilterPublicItemsTask {
    return new FilterPublicItemsTask(
      member,
      this.publicItemService,
      this.itemTagService,
      this.itemService,
      this.publicTagId,
      input,
    );
  }

  createGetPublicItemTask(
    member: Actor,
    input: GetPublicItemTaskInputType,
  ): BasePublicItemTask<Item> {
    return new GetPublicItemTask(
      member,
      this.publicItemService,
      this.itemTagService,
      this.itemService,
      this.publicTagId,
      input,
    );
  }

  createGetManyPublicItemsTask(
    member: Actor,
    input: GetManyPublicItemsTaskInputType,
  ): GetManyPublicItemsTask {
    return new GetManyPublicItemsTask(
      member,
      this.publicItemService,
      this.itemTagService,
      this.itemService,
      this.publicTagId,
      input,
    );
  }

  createGetPublicItemIdsByTagsTask(
    member: Actor,
    input: GetPublicItemIdsWithTagsTaskInputType,
  ): GetPublicItemIdsWithTagsTask {
    return new GetPublicItemIdsWithTagsTask(
      member,
      this.publicItemService,
      this.itemTagService,
      this.itemService,
      this.publicTagId,
      input,
    );
  }
}
