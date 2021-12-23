import { ItemMembershipService, ItemService, MemberService, MemberTaskManager } from 'graasp';
import { ItemTaskManager, TaskRunner } from 'graasp-test';
import { StatusCodes } from 'http-status-codes';
import qs from 'qs';

import build from './app';
import { buildMember, checkMember } from './constants';

const taskManager = new ItemTaskManager();
const runner = new TaskRunner();
const itemDbService = {} as unknown as ItemService;
const itemMemberhipDbService = {} as unknown as ItemMembershipService;
const memberDbService = {} as unknown as MemberService;
const memberTaskManager = {} as unknown as MemberTaskManager;

describe('Members', () => {
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
      checkMember(res.json(), member);
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
      const responseMembers = res.json();
      responseMembers.forEach((m) => {
        const thisMember = members.find(({ id: mId }) => m.id === mId);
        checkMember(thisMember, m);
      });
    });
  });
});
