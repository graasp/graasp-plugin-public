// global
import { Actor, DatabaseTransactionHandler, ItemService } from 'graasp';
import { ItemTagService } from 'graasp-item-tags';

// local
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
    super(actor, publicItemService, itemTagService, itemService);
    this.itemService = itemService;
    this.publicItemService = publicItemService;
    this.input = input;
    this.publicTagId = publicTagId;
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = 'RUNNING';

    const { tagIds } = this.input;

    // get item
    // TODO:: use hasTags --> public and published tags and more tags
    const itemPaths = await this.itemTagService.getItemPathsByTags(
      [this.publicTagId, ...tagIds],
      handler,
    );
    const itemIds = itemPaths.map(({ item_path: path }) => {
      const splitted = path.split('.');
      return splitted[splitted.length - 1].replace(/_/g, '-');
    });
    this._result = itemIds;

    this.status = 'OK';
  }
}
