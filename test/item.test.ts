import { StatusCodes } from 'http-status-codes';
import { v4 } from 'uuid';

import {
  Item,
  ItemMembershipService,
  ItemService,
  MemberService,
  MemberTaskManager,
} from '@graasp/sdk';
import { ItemTaskManager, Task, TaskRunner } from 'graasp-test';

import { ItemNotFound } from '../src';
import build from './app';
import { PUBLIC_ITEM_FOLDER, PUBLIC_TAG_ID } from './constants';

const taskManager = new ItemTaskManager();
const runner = new TaskRunner();
const itemDbService = {} as unknown as ItemService;
const itemMemberhipDbService = {} as unknown as ItemMembershipService;
const memberDbService = {} as unknown as MemberService;
const memberTaskManager = {} as unknown as MemberTaskManager;

describe('Items', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(runner, 'setTaskPostHookHandler').mockImplementation(() => {
      return;
    });
    jest.spyOn(runner, 'setTaskPreHookHandler').mockImplementation(() => {
      return;
    });
  });

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
      });

      jest.spyOn(runner, 'runSingle').mockImplementation(async () => item);

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
      });

      const children = [item, item];
      jest.spyOn(taskManager, 'createGetTask').mockImplementation(jest.fn());
      jest.spyOn(taskManager, 'createGetChildrenTask').mockImplementation(() => new Task<Item[]>());
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

  describe('POST /p/items/:id/copy', () => {
    it('Copy item', async () => {
      const verifyAuthenticationMock = jest.fn(async () => true);
      const app = await build({
        taskManager,
        runner,
        itemDbService,
        memberDbService,
        itemMemberhipDbService,
        memberTaskManager,
        verifyAuthenticationMock,
      });
      const item = PUBLIC_ITEM_FOLDER;
      jest.spyOn(taskManager, 'createCopySubTaskSequence').mockImplementation(jest.fn(() => []));
      jest.spyOn(runner, 'runSingleSequence').mockImplementation(async () => item);

      const res = await app.inject({
        method: 'POST',
        url: `/p/items/${item.id}/copy`,
        payload: {},
      });

      expect(res.statusCode).toBe(StatusCodes.OK);
      expect(res.json()).toEqual(item);
      expect(verifyAuthenticationMock).toHaveBeenCalled();
    });
    it('Bad request for invalid parent id', async () => {
      const app = await build({
        taskManager,
        runner,
        itemDbService,
        memberDbService,
        itemMemberhipDbService,
        memberTaskManager,
      });
      const item = PUBLIC_ITEM_FOLDER;
      jest.spyOn(taskManager, 'createCopySubTaskSequence').mockImplementation(jest.fn(() => []));
      jest.spyOn(runner, 'runSingleSequence').mockImplementation(async () => item);

      const res = await app.inject({
        method: 'POST',
        url: `/p/items/${item.id}/copy`,
        payload: {
          parentId: 'parentId',
        },
      });

      expect(res.statusCode).toBe(StatusCodes.BAD_REQUEST);
    });
    // more exhaustive tests in corresponding task
  });

  describe('GET /p/items?tagId=<id>', () => {
    it('Get public items by tag id', async () => {
      const app = await build({
        taskManager,
        runner,
        itemDbService,
        memberDbService,
        itemMemberhipDbService,
        memberTaskManager,
      });
      const items = [PUBLIC_ITEM_FOLDER, PUBLIC_ITEM_FOLDER];
      jest.spyOn(taskManager, 'createGetManyTask').mockImplementation(() => new Task(true));
      jest.spyOn(runner, 'runSingleSequence').mockImplementation(async () => items);

      const res = await app.inject({
        method: 'GET',
        url: `/p/items?tagId=${v4()}&tagId=${v4()}`,
      });
      expect(res.statusCode).toBe(StatusCodes.OK);
      expect(res.json()).toEqual(items);
    });

    it('Return items and errors', async () => {
      const app = await build({
        taskManager,
        runner,
        itemDbService,
        memberDbService,
        itemMemberhipDbService,
        memberTaskManager,
      });
      const itemsWithError = [PUBLIC_ITEM_FOLDER, PUBLIC_ITEM_FOLDER, new ItemNotFound()];
      jest.spyOn(runner, 'runSingleSequence').mockImplementation(async () => itemsWithError);
      jest.spyOn(taskManager, 'createGetManyTask').mockReturnValue(new Task());

      const res = await app.inject({
        method: 'GET',
        url: `/p/items?tagId=${PUBLIC_TAG_ID}`,
      });
      expect(res.statusCode).toBe(StatusCodes.OK);
      expect(res.json()).toEqual(itemsWithError);
    });
  });
});
