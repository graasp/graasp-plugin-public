import { ItemMembershipService, ItemService, MemberService, MemberTaskManager } from 'graasp';
import { ItemTaskManager, Task, TaskRunner, ItemMembershipTaskManager } from 'graasp-test';
import { StatusCodes } from 'http-status-codes';
import { v4 } from 'uuid';

import build from './app';
import { buildItemMembership } from './constants';

const taskManager = new ItemTaskManager();
const runner = new TaskRunner();
const itemDbService = {} as unknown as ItemService;
const itemMemberhipDbService = {} as unknown as ItemMembershipService;
const itemMembershipTaskManager = new ItemMembershipTaskManager();
const memberDbService = {} as unknown as MemberService;
const memberTaskManager = {} as unknown as MemberTaskManager;

describe('Item Memberships', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(runner, 'setTaskPostHookHandler').mockImplementation(() => {
      return;
    });
    jest.spyOn(runner, 'setTaskPreHookHandler').mockImplementation(() => {
      return;
    });
  });

  it('Get item memberships for items', async () => {
    const app = await build({
      taskManager,
      runner,
      itemDbService,
      memberDbService,
      itemMemberhipDbService,
      memberTaskManager,
      itemMembershipTaskManager,
    });
    const memberships = [[buildItemMembership()], [buildItemMembership()]];
    jest.spyOn(runner, 'runSingleSequence').mockImplementation(async () => memberships);
    jest.spyOn(itemMembershipTaskManager, 'createGetOfManyItemsTask').mockReturnValue(new Task());
    const res = await app.inject({
      method: 'GET',
      url: `/p/item-memberships?itemId=${v4()}&itemId=${v4()}`,
    });
    expect(res.statusCode).toBe(StatusCodes.OK);
    expect(res.json()).toEqual(memberships);
  });
});
