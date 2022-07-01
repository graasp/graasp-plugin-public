import { Actor, DatabaseTransactionHandler, Member, MemberService } from 'graasp';

import { PublicItemService } from '../../..';
import { PUBLIC_TAG_ID, buildMember } from '../../../../test/constants';
import { GetPublicMembersTask } from './get-public-members-task';

const actor = buildMember() as Actor;
const publicItemService = new PublicItemService(PUBLIC_TAG_ID);
const handler = {} as unknown as DatabaseTransactionHandler;

describe('GetPublicMembersTask', () => {
  it('Get public member', async () => {
    const members = [buildMember(), buildMember(), buildMember()];

    const memberService = {
      get: (id) => members.find(({ id: mId }) => mId === id) as Member,
    } as unknown as MemberService;

    jest.spyOn(publicItemService, 'isPublic').mockResolvedValue(true);
    const task = new GetPublicMembersTask(actor, memberService, {
      memberIds: members.map(({ id }) => id),
    });

    await task.run(handler);
    expect(task.result).toEqual(members);
  });
});
