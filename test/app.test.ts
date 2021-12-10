import FormData from 'form-data';
import { createReadStream } from 'fs';
import { ItemMembershipService, ItemService, MemberService, MemberTaskManager } from 'graasp';
import { ItemTaskManager, Task, TaskRunner } from 'graasp-test';
import { StatusCodes } from 'http-status-codes';
import qs from 'qs';

import { GetPublicItemIdsWithTagTask } from '../src/services/item/tasks/get-public-item-ids-by-tag-task';
import { GetPublicMembersTask } from '../src/services/member/tasks/get-public-members-task';
import build from './app';
import { buildMember, FILE_PATHS, PUBLIC_ITEM_FOLDER, PUBLIC_TAG_ID } from './constants';

const taskManager = new ItemTaskManager();
const runner = new TaskRunner();
const itemDbService = {} as unknown as ItemService;
const itemMemberhipDbService = {} as unknown as ItemMembershipService;
const memberDbService = {} as unknown as MemberService;
const memberTaskManager = {} as unknown as MemberTaskManager;

describe('Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(runner, 'setTaskPostHookHandler').mockImplementation(() => { return; });
    jest.spyOn(runner, 'setTaskPreHookHandler').mockImplementation(() => { return; });
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
        });

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
      it('Get items by tag id', async () => {
        const app = await build({
          taskManager,
          runner,
          itemDbService,
          memberDbService,
          itemMemberhipDbService,
          memberTaskManager,
        });
        const items = [PUBLIC_ITEM_FOLDER, PUBLIC_ITEM_FOLDER];
        const runSingleMock = jest
          .spyOn(runner, 'runSingle')
          .mockImplementation(async () => items.map(({ id }) => id));
        jest.spyOn(taskManager, 'createGetTask').mockImplementation(jest.fn());
        jest.spyOn(runner, 'runMultiple').mockImplementation(async () => items);

        const res = await app.inject({
          method: 'GET',
          url: `/p/items?tagId=${PUBLIC_TAG_ID}`,
        });
        expect(res.statusCode).toBe(StatusCodes.OK);
        expect(res.json()).toEqual(items);
        expect(runSingleMock).toHaveBeenCalledTimes(1);
      });

      it('Get items by tag id with memberships', async () => {
        const app = await build({
          taskManager,
          runner,
          itemDbService,
          memberDbService,
          itemMemberhipDbService,
          memberTaskManager,
        });
        const items = [PUBLIC_ITEM_FOLDER, PUBLIC_ITEM_FOLDER];
        const runSingleMock = jest.spyOn(runner, 'runSingle').mockImplementation(async (task) => {
          if (task instanceof GetPublicItemIdsWithTagTask) {
            return items.map(({ id }) => id);
          } else {
            return items;
          }
        });
        jest.spyOn(taskManager, 'createGetTask').mockImplementation(jest.fn());
        jest.spyOn(runner, 'runMultiple').mockImplementation(async () => items);
        const res = await app.inject({
          method: 'GET',
          url: `/p/items?tagId=${PUBLIC_TAG_ID}&withMemberships=true`,
        });
        expect(res.statusCode).toBe(StatusCodes.OK);
        expect(res.json()).toEqual(items);
        expect(runSingleMock).toHaveBeenCalledTimes(2);
      });

      it('Remove invalid items', async () => {
        const app = await build({
          taskManager,
          runner,
          itemDbService,
          memberDbService,
          itemMemberhipDbService,
          memberTaskManager,
        });
        const items = [PUBLIC_ITEM_FOLDER, PUBLIC_ITEM_FOLDER];
        jest.spyOn(runner, 'runSingle').mockImplementation(async (task) => {
          if (task instanceof GetPublicItemIdsWithTagTask) {
            return [...items.map(({ id }) => id), { name: 'some error' }];
          } else {
            return items;
          }
        });
        jest.spyOn(taskManager, 'createGetTask').mockImplementation(jest.fn());
        jest.spyOn(runner, 'runMultiple').mockImplementation(async () => items);

        const res = await app.inject({
          method: 'GET',
          url: `/p/items?tagId=${PUBLIC_TAG_ID}`,
        });
        expect(res.statusCode).toBe(StatusCodes.OK);
        expect(res.json()).toEqual(items);
      });
    });

    describe('GET /p/items/:id/download', () => {
      it('Get a public file', async () => {
        const item = PUBLIC_ITEM_FOLDER;
        const app = await build({
          taskManager,
          runner,
          itemDbService,
          memberDbService,
          itemMemberhipDbService,
          memberTaskManager,
        });

        jest.spyOn(runner, 'runSingleSequence').mockImplementation(async () => createReadStream(FILE_PATHS[0]));

        const res = await app.inject({
          method: 'GET',
          url: `/p/items/${item.id}/download`,
        });

        expect(res.statusCode).toBe(StatusCodes.OK);
        expect(res.body).toBeTruthy();
      });
    });

    describe('POST /p/items/upload', () => {
      it('Upload should alway throw', async () => {
        const app = await build({
          taskManager,
          runner,
          itemDbService,
          memberDbService,
          itemMemberhipDbService,
          memberTaskManager,
        });

        const form = new FormData();
        form.append('file', createReadStream(FILE_PATHS[0]));

        const res = await app.inject({
          method: 'POST',
          url: '/p/items/upload',
          payload: form,
          headers: form.getHeaders(),
        });

        expect(res.statusCode).toBe(StatusCodes.BAD_REQUEST);
        expect(res.json().message).toEqual('Cannot edit public item');
      });
    });

    describe('GET /p/items/thumbnails/:id/download', () => {
      it('Download Thumbnails', async () => {
        const item = PUBLIC_ITEM_FOLDER;
        const app = await build({
          taskManager,
          runner,
          itemDbService,
          memberDbService,
          itemMemberhipDbService,
          memberTaskManager,
        });

        jest.spyOn(runner, 'runSingleSequence').mockImplementation(async () => createReadStream(FILE_PATHS[1]));

        const res = await app.inject({
          method: 'GET',
          url: `/p/items/thumbnails/${item.id}/download`,
        });

        expect(res.statusCode).toBe(StatusCodes.OK);
        expect(res.body).toBeTruthy();
      });
    });

    describe('POST /p/items/thumbnails/upload', () => {
      it('Upload should alway throw', async () => {
        const item = PUBLIC_ITEM_FOLDER;
        const app = await build({
          taskManager,
          runner,
          itemDbService,
          memberDbService,
          itemMemberhipDbService,
          memberTaskManager,
        });

        const form = new FormData();
        form.append('file', createReadStream(FILE_PATHS[1]));

        const res = await app.inject({
          method: 'POST',
          url: `/p/items/thumbnails/upload?id=${item.id}`,
          payload: form,
          headers: form.getHeaders(),
        });

        expect(res.statusCode).toBe(StatusCodes.BAD_REQUEST);
        expect(res.json().message).toEqual('Cannot edit public item');
      });
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

    describe('GET /p/members/avatars/:id/download', () => {
      it('Download avatar', async () => {
        const member = buildMember();
        const app = await build({
          taskManager,
          runner,
          itemDbService,
          memberDbService,
          itemMemberhipDbService,
          memberTaskManager,
        });

        memberTaskManager.createGetTask = jest.fn().mockReturnValue(new GetPublicMembersTask(null, null, null));
        jest.spyOn(runner, 'runSingleSequence').mockImplementation(async () => createReadStream(FILE_PATHS[1]));

        const res = await app.inject({
          method: 'GET',
          url: `/p/members/avatars/${member.id}/download`,
        });

        expect(res.statusCode).toBe(StatusCodes.OK);
        expect(res.body).toBeTruthy();
      });
    });

    describe('POST /p/members/avatars/upload', () => {
      it('Upload should alway throw', async () => {
        const member = buildMember();
        const app = await build({
          taskManager,
          runner,
          itemDbService,
          memberDbService,
          itemMemberhipDbService,
          memberTaskManager,
        });

        const form = new FormData();
        form.append('file', createReadStream(FILE_PATHS[1]));

        const res = await app.inject({
          method: 'POST',
          url: `/p/members/avatars/upload?id=${member.id}`,
          payload: form,
          headers: form.getHeaders(),
        });

        expect(res.statusCode).toBe(StatusCodes.BAD_REQUEST);
        expect(res.json().message).toEqual('Cannot edit public member');
      });
    });
  });
});
