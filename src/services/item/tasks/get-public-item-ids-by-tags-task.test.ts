import { Actor, DatabaseTransactionHandler, ItemService } from 'graasp';
import { v4 } from 'uuid';
import { ItemTagService } from 'graasp-item-tags';
import { buildMember, PUBLIC_ITEM_CHILDREN, PUBLIC_TAG_ID } from '../../../../test/constants';
import { PublicItemService } from '../db-service';
import { GetPublicItemIdsWithTagsTask } from './get-public-item-ids-by-tags-task';

const actor = buildMember() as Actor;
const publicItemService = new PublicItemService(PUBLIC_TAG_ID);
const itemTagService = new ItemTagService();
const itemService = {
  get: jest.fn(),
  getDescendants: jest.fn(),
} as unknown as ItemService;
const handler = {} as unknown as DatabaseTransactionHandler;

const tagIds = [v4()];

describe('GetPublicItemsWithTagTask', () => {
  it('Get public items by tag', async () => {
    const children = PUBLIC_ITEM_CHILDREN;
    jest
      .spyOn(itemTagService, 'getItemPathsByTags')
      .mockImplementation(async () => children.map(({ path }) => ({ item_path: path })));
    const task = new GetPublicItemIdsWithTagsTask(
      actor,
      publicItemService,
      itemTagService,
      itemService,
      PUBLIC_TAG_ID,
      { tagIds },
    );

    await task.run(handler);
    expect(task.result).toEqual(children.map(({ id }) => id));
  });
});
