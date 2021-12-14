import { Actor, DatabaseTransactionHandler, ItemService } from 'graasp';
import { ItemTagService } from 'graasp-item-tags';
import { buildMember, PUBLIC_ITEM_CHILDREN, PUBLIC_TAG_ID } from '../../../../test/constants';
import { PublicItemService } from '../db-service';
import { GetManyPublicItemsTask } from './get-many-public-items-task';
import { ItemNotPublic } from '../../..';

const actor = buildMember() as Actor;
const publicItemService = new PublicItemService(PUBLIC_TAG_ID);
const itemTagService = new ItemTagService();
const itemService = {
    get: jest.fn(),
    getDescendants: jest.fn(),
} as unknown as ItemService;
const handler = {} as unknown as DatabaseTransactionHandler;


describe('GetManyPublicItemsTask', () => {
    it('Get many public items, or error', async () => {
        const children = PUBLIC_ITEM_CHILDREN;
        const publicItem = children[1]
        itemService.getMany = async () => children
        jest
            .spyOn(publicItemService, 'isPublic')
            .mockImplementation(async (item) =>
                item.id === publicItem.id
            );
        const task = new GetManyPublicItemsTask(
            actor,
            publicItemService,
            itemTagService,
            itemService,
            { itemIds: children.map(({ id }) => id) },
        );

        await task.run(handler);
        expect(task.result).toEqual([new ItemNotPublic(children[0].id), publicItem]);
    });
});
