// global
import { Actor, DatabaseTransactionHandler, ItemService } from 'graasp';
// local
import { PublicItemService } from '../db-service';
import { CategoryService, ItemCategory } from 'graasp-plugin-categories';
import { BasePublicItemTask } from './base-public-item-task';
import { ItemNotFound, ItemNotPublic } from '../../../util/errors';

type InputType = { itemId?: string };

export class GetItemCategoriesTask extends BasePublicItemTask<ItemCategory[]> {
  input: InputType;
  getInput: () => InputType;
  categoryService: CategoryService

  get name(): string {
    return GetItemCategoriesTask.name;
  }

  constructor(member: Actor,
    publicItemService: PublicItemService,
    itemService: ItemService, input: InputType,) {

    super(member, publicItemService, itemService);
    this.input = input ?? {};
    this.categoryService = new CategoryService();
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = 'RUNNING';

    const { itemId } = this.input;

    // get item
    const item = await this.itemService.get(itemId, handler);
    if (!item) throw new ItemNotFound(itemId);

    // check if item is public
    const isPublic = await this.publicItemService.hasPublicTag(item, handler);
    if (!isPublic) throw new ItemNotPublic(itemId);

    const itemCategories = await this.categoryService.getItemCategory(itemId, handler);

    this.status = 'OK';
    this._result = itemCategories;
  }
}
