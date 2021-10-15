import { ItemMembershipService, ItemService, MemberService, MemberTaskManager } from 'graasp';
import { ItemTaskManager, Task, TaskRunner } from 'graasp-test';
import { StatusCodes } from 'http-status-codes';
import qs from 'qs';
import build from './app';
import { buildMember, PUBLIC_ITEM_FOLDER, PUBLIC_TAG_ID } from './constants';

const taskManager = new ItemTaskManager();
const runner = new TaskRunner();
const itemDbService = {} as unknown as ItemService;
const itemMemberhipDbService = {} as unknown as ItemMembershipService;
const memberDbService = {} as unknown as MemberService;
const memberTaskManager = {} as unknown as MemberTaskManager;

describe('Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Items Endpoints', () => {
    describe('GET /p/items/:id', () => {
      it('Get a public item', async () => {
        const item = PUBLIC_ITEM_FOLDER;
        const app = await build({
          taskManager,
          runner,
          itemDbService,
          memberDbService,
          itemMemberhipDbService,
          memberTaskManager,
          options: {},
        });

        jest.spyOn(taskManager, 'createGetTask').mockImplementation(jest.fn());
        jest.spyOn(runner, 'runSingleSequence').mockImplementation(async () => item);

        const res = await app.inject({
          method: 'GET',
          url: `/p/items/${item.id}`,
        });

        expect(res.statusCode).toBe(StatusCodes.OK);
        expect(res.json()).toEqual(item);
      });
      // more exhaustive tests in corresponding task
    });
    describe('GET /p/items/:id/children', () => {
      it('Get children from a public item', async () => {
        const item = PUBLIC_ITEM_FOLDER;
        const app = await build({
          taskManager,
          runner,
          itemDbService,
          memberDbService,
          itemMemberhipDbService,
          memberTaskManager,
          options: {},
        });

        const children = [item, item];
        jest.spyOn(taskManager, 'createGetTask').mockImplementation(jest.fn());
        jest.spyOn(taskManager, 'createGetChildrenTask').mockImplementation(() => new Task());
        jest.spyOn(runner, 'runSingleSequence').mockImplementation(async () => children);

        const res = await app.inject({
          method: 'GET',
          url: `/p/items/${item.id}/children`,
        });

        expect(res.statusCode).toBe(StatusCodes.OK);
        expect(res.json()).toEqual(children);
      });
      // more exhaustive tests in corresponding task
    });
    describe('GET /p/items?tagId=<id>', () => {
      it('Get items by tag id', async () => {
        const app = await build({
          taskManager,
          runner,
          itemDbService,
          memberDbService,
          itemMemberhipDbService,
          memberTaskManager,
          options: {},
        });
        const items = [PUBLIC_ITEM_FOLDER, PUBLIC_ITEM_FOLDER];
        jest.spyOn(runner, 'runSingle').mockImplementation(async () => items);

        const res = await app.inject({
          method: 'GET',
          url: `/p/items?tagId=${PUBLIC_TAG_ID}`,
        });

        expect(res.statusCode).toBe(StatusCodes.OK);
        expect(res.json()).toEqual(items);
      });
      // more exhaustive tests in corresponding task
    });
  });

  describe('Members Endpoints', () => {
    describe('GET /p/members/:id', () => {
      it('Get a public member', async () => {
        const app = await build({
          taskManager,
          runner,
          itemDbService,
          memberDbService,
          itemMemberhipDbService,
          memberTaskManager,
          options: {},
        });

        const member = buildMember();
        memberTaskManager.createGetTask = jest.fn();
        jest.spyOn(runner, 'runSingle').mockImplementation(async () => member);
        const res = await app.inject({
          method: 'GET',
          url: `/p/members/${member.id}`,
        });

        expect(memberTaskManager.createGetTask).toHaveBeenCalled();
        expect(res.statusCode).toBe(StatusCodes.OK);
        expect(res.json()).toEqual(member);
      });
    });
    describe('GET /p/members', () => {
      it('Get public members', async () => {
        const app = await build({
          taskManager,
          runner,
          itemDbService,
          memberDbService,
          itemMemberhipDbService,
          memberTaskManager,
          options: {},
        });

        const members = [buildMember(), buildMember()];
        jest.spyOn(runner, 'runSingle').mockImplementation(async () => members);

        const res = await app.inject({
          method: 'GET',
          url: `/p/members?${qs.stringify(
            { id: members.map(({ id }) => id) },
            { arrayFormat: 'repeat' },
          )}`,
        });
        expect(res.statusCode).toBe(StatusCodes.OK);
        expect(res.json()).toEqual(members);
      });
    });
  });
});
