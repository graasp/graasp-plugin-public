import { Actor, DatabaseTransactionHandler, ItemService } from 'graasp';
import { v4 } from 'uuid';
import { ItemTagService } from 'graasp-item-tags';
import { buildMember, PUBLIC_ITEM_CHILDREN, PUBLIC_TAG_ID } from '../../../../test/constants';
import { PublicItemService } from '../db-service';
import { FilterPublicItemsTask } from './filter-public-items-task';

const actor = buildMember() as Actor;
const publicItemService = new PublicItemService(PUBLIC_TAG_ID);
const itemTagService = new ItemTagService();
const itemService = {
    get: jest.fn(),
    getDescendants: jest.fn(),
} as unknown as ItemService;
const handler = {} as unknown as DatabaseTransactionHandler;

const tagIds = [v4()];

describe('FilterPublicItemsTask', () => {
    it('Keep items if they have all tags', async () => {
        const children = PUBLIC_ITEM_CHILDREN;
        const response = [children[1]]
        jest
            .spyOn(itemTagService, 'hasTags')
            .mockImplementation(async (item) =>
                item.id === response[0].id
            );
        const task = new FilterPublicItemsTask(
            actor,
            publicItemService,
            itemTagService,
            itemService,
            PUBLIC_TAG_ID,
            { items: children, tagIds },
        );

        await task.run(handler);
        expect(task.result).toEqual(response);
    });
});
