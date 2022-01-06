import { Actor, DatabaseTransactionHandler, ItemService } from 'graasp';
import { ItemTagService } from 'graasp-item-tags';
import { buildMember, PUBLIC_ITEM_FOLDER, PUBLIC_TAG_ID } from '../../../../test/constants';
import { ItemNotFound, ItemNotPublic } from '../../../util/errors';
import { PublicItemService } from '../db-service';
import { GetPublicItemTask } from './get-public-item-task';

const actor = buildMember() as Actor;
const publicItemService = new PublicItemService(PUBLIC_TAG_ID);
const itemTagService = new ItemTagService();
const itemService = {
  get: jest.fn(),
} as unknown as ItemService;
const handler = {} as unknown as DatabaseTransactionHandler;

describe('GetPublicItemTask', () => {
  it('Get public item', async () => {
    const item = PUBLIC_ITEM_FOLDER;
    jest.spyOn(itemService, 'get').mockResolvedValue(item);
    jest.spyOn(publicItemService, 'isPublic').mockResolvedValue(true);
    const task = new GetPublicItemTask(
      actor,
      publicItemService,
      itemTagService,
      itemService,
      PUBLIC_TAG_ID,
      {
        itemId: item.id,
      },
    );

    await task.run(handler);
    expect(task.result).toEqual(item);
  });
  it('Throw if item does not exist', async () => {
    const itemId = 'invalid-id';
    jest.spyOn(itemService, 'get').mockResolvedValue(undefined);
    const task = new GetPublicItemTask(
      actor,
      publicItemService,
      itemTagService,
      itemService,
      PUBLIC_TAG_ID,
      {
        itemId,
      },
    );

    await task.run(handler).catch((e) => {
      expect(e).toEqual(new ItemNotFound(itemId));
    });
  });
  it('Throw if item is not public', async () => {
    const item = PUBLIC_ITEM_FOLDER;
    jest.spyOn(itemService, 'get').mockResolvedValue(item);
    jest.spyOn(publicItemService, 'isPublic').mockResolvedValue(false);

    const task = new GetPublicItemTask(
      actor,
      publicItemService,
      itemTagService,
      itemService,
      PUBLIC_TAG_ID,
      {
        itemId: item.id,
      },
    );

    await task.run(handler).catch((e) => {
      expect(e).toEqual(new ItemNotPublic(item.id));
    });
  });
});
