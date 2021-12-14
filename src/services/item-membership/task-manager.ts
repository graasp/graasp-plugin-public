import { ItemTagService } from 'graasp-item-tags';
import { Actor, ItemMembershipTaskManager, ItemService, Task } from 'graasp';
import { PublicItemService } from '../..';
import { GetManyPublicItemsTask } from '../item/tasks/get-many-public-items-task';

export class TaskManager {
  private itemService: ItemService;
  private itemTagService: ItemTagService;
  private publicItemService: PublicItemService;
  private itemMembershipTaskManager: ItemMembershipTaskManager;

  constructor(
    publicItemService: PublicItemService,
    itemService: ItemService,
    itemTagService: ItemTagService,
    itemMembershipTaskManager: ItemMembershipTaskManager,
  ) {
    this.itemService = itemService;
    this.itemTagService = itemTagService;
    this.publicItemService = publicItemService;
    this.itemMembershipTaskManager = itemMembershipTaskManager;
  }

  createGetManyPublicItemMembershipsTaskSequence(actor: Actor, itemIds: string[]): Task<Actor, unknown>[] {
    const t1 = new GetManyPublicItemsTask(
      actor,
      this.publicItemService,
      this.itemTagService,
      this.itemService,
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
