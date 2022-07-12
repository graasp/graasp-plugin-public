import { Actor, ItemMembershipTaskManager, ItemService, Task } from '@graasp/sdk';
import { ItemTagService } from 'graasp-item-tags';

import { PublicItemService } from '../..';
import { GetManyPublicItemsTask } from '../item/tasks/get-many-public-items-task';

export class TaskManager {
  private itemService: ItemService;
  private itemTagService: ItemTagService;
  private publicItemService: PublicItemService;
  private itemMembershipTaskManager: ItemMembershipTaskManager;
  private publicTagId: string;

  constructor(
    publicItemService: PublicItemService,
    itemService: ItemService,
    itemTagService: ItemTagService,
    itemMembershipTaskManager: ItemMembershipTaskManager,
    publicTagId: string,
  ) {
    this.itemService = itemService;
    this.itemTagService = itemTagService;
    this.publicItemService = publicItemService;
    this.itemMembershipTaskManager = itemMembershipTaskManager;
    this.publicTagId = publicTagId;
  }

  createGetManyPublicItemMembershipsTaskSequence(
    actor: Actor,
    itemIds: string[],
  ): Task<Actor, unknown>[] {
    const t1 = new GetManyPublicItemsTask(
      actor,
      this.publicItemService,
      this.itemTagService,
      this.itemService,
      this.publicTagId,
      { itemIds },
    );
    const t2 = this.itemMembershipTaskManager.createGetOfManyItemsTask(actor);
    t2.getInput = () => ({
      items: t1.result,
      shouldValidatePermission: false,
    });
    return [t1, t2];
  }
}
