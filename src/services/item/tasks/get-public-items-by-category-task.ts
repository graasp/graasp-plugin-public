// global
import { Actor, DatabaseTransactionHandler, ItemService } from 'graasp';
// local
import { CategoryService } from 'graasp-plugin-categories';
import { PublicItemService } from '../db-service';
import { BasePublicItemTask } from './base-public-item-task';

type InputType = { categoryIds?: string[] };

// return {itemId}[]
export class GetItemsByCategoryTask extends BasePublicItemTask<string[]> {
  input: InputType;
  getInput: () => InputType;
  categoryService: CategoryService;

  get name(): string {
    return GetItemsByCategoryTask.name;
  }

  constructor(
    member: Actor,
    publicItemService: PublicItemService,
    itemService: ItemService,
    input: InputType,
  ) {
    super(member, publicItemService, itemService);
    this.input = input ?? {};
    this.categoryService = new CategoryService();
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = 'RUNNING';

    // get Category (age)
    const { categoryIds } = this.input;
    const items = await this.categoryService.getItemsByCategory(categoryIds, handler);

    this.status = 'OK';
    this._result = items;
  }
}
