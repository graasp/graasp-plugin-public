import { DatabaseTransactionHandler, ItemService } from 'graasp';
import { buildMember, PUBLIC_ITEM_FOLDER, PUBLIC_TAG_ID } from '../../../../test/constants';
import { ItemNotFound, ItemNotPublic } from '../../../util/errors';
import { PublicItemService } from '../db-service';
import { GetPublicItemTask } from './get-public-item-task';

const actor = buildMember();
const publicItemService = new PublicItemService(PUBLIC_TAG_ID);
const itemService = {
  get: jest.fn(),
} as unknown as ItemService;
const handler = {} as unknown as DatabaseTransactionHandler;

describe('GetPublicItemTask', () => {
  it('Get public item', async () => {
    const item = PUBLIC_ITEM_FOLDER;
    jest.spyOn(itemService, 'get').mockResolvedValue(item);
    jest.spyOn(publicItemService, 'hasPublicTag').mockResolvedValue(true);
    const task = new GetPublicItemTask(actor, item.id, publicItemService, itemService);

    await task.run(handler);
    expect(task.result).toEqual(item);
  });
  it('Throw if item does not exist', async () => {
    const id = 'invalid-id';
    jest.spyOn(itemService, 'get').mockResolvedValue(undefined);
    const task = new GetPublicItemTask(actor, id, publicItemService, itemService);

    await task.run(handler).catch((e) => {
      expect(e).toEqual(new ItemNotFound(id));
    });
  });
  it('Throw if item is not public', async () => {
    const item = PUBLIC_ITEM_FOLDER;
    jest.spyOn(itemService, 'get').mockResolvedValue(item);
    jest.spyOn(publicItemService, 'hasPublicTag').mockResolvedValue(false);

    const task = new GetPublicItemTask(actor, item.id, publicItemService, itemService);

    await task.run(handler).catch((e) => {
      expect(e).toEqual(new ItemNotPublic(item.id));
    });
  });
});
