// global
import { Actor, DatabaseTransactionHandler, Item, ItemService } from 'graasp';
// local
import { PublicItemService } from '../db-service';
import { ItemNotFound, ItemNotPublic } from '../../../util/graasp-public-items';
import { BasePublicItemTask } from './base-public-item-task';

const sortChildrenWith = (idsOrder: string[]) => (stElem: { id: string }, ndElem: { id: string }) =>
  idsOrder.indexOf(stElem.id) - idsOrder.indexOf(ndElem.id);

export class GetPublicItemChildrenTask extends BasePublicItemTask<Item[]> {
  private ordered: boolean;
  get name(): string {
    return GetPublicItemChildrenTask.name;
  }

  constructor(
    actor: Actor,
    itemId: string,
    publicItemService: PublicItemService,
    itemService: ItemService,
    ordered?: boolean,
  ) {
    super(actor, publicItemService, itemService);
    this.itemService = itemService;
    this.publicItemService = publicItemService;
    this.targetId = itemId;
    this.ordered = ordered;
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = 'RUNNING';

    // get item
    const item = await this.itemService.get<{ folder: { childrenOrder: string[] } }>(
      this.targetId,
      handler,
    );
    if (!item) throw new ItemNotFound(this.targetId);

    // check if item is public
    const isPublic = await this.publicItemService.hasPublicTag(item, handler);
    if (!isPublic) throw new ItemNotPublic(this.targetId);

    // get item's children
    const children = await this.itemService.getDescendants(item, handler, 'ASC', 1);

    if (this.ordered) {
      const {
        extra: { folder: { childrenOrder = [] } = {} },
      } = item;

      if (childrenOrder.length) {
        const compareFn = sortChildrenWith(childrenOrder);
        children.sort(compareFn);
      }
    }

    this._result = children;
    this.status = 'OK';
  }
}
