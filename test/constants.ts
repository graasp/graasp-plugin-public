import { v4 } from 'uuid';

import { Item, ItemMembership, Member } from '@graasp/sdk';

export const PUBLIC_ITEM_FOLDER: Item = {
  id: v4(),
  path: v4().replace(/-/g, '_'),
  name: 'public-item-folder',
  description: 'description',
  type: 'folder',
  extra: {},
  creator: v4(),
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  settings: {
    isPinned: false,
    showChatBox: false,
  },
};

const id1 = v4();
const id2 = v4();

export const PUBLIC_ITEM_CHILDREN: Item[] = [
  {
    id: id1,
    path: id1.replace(/-/g, '_'),
    name: 'public-item-children-folder',
    description: 'description',
    type: 'folder',
    extra: {},
    creator: v4(),
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    settings: {
      isPinned: false,
      showChatBox: false,
    },
  },
  {
    id: id2,
    path: id2.replace(/-/g, '_'),
    name: 'public-item-children-file',
    description: 'description',
    type: 'file',
    extra: {},
    creator: v4(),
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    settings: {
      isPinned: false,
      showChatBox: false,
    },
  },
];

export const PUBLIC_TAG_ID = v4();
export const PUBLISHED_TAG_ID = v4();

export const buildMember = (): Partial<Member> => ({
  id: v4(),
  name: 'member',
  email: 'member@email.com',
  extra: {},
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
});

export const buildItemMembership = (): Partial<ItemMembership> => ({
  id: v4(),
  memberId: buildMember().id,
  itemPath: v4().replace(/-/g, '_'),
  creator: v4(),
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
});

export const DEFAULT_GRAASP_ACTOR = {
  id: v4(),
};

export const FILE_PATHS = ['./test/files/1.txt', './test/files/2.jpeg'];
export const files: Partial<Item>[] = [
  {
    id: v4(),
    type: 'file',
    extra: {
      file: {
        name: '1.txt',
        path: '1.txt',
        size: 1594447,
        mimetype: 'text/plain',
      },
    },
  },
];

export const ITEM_FILE_TXT = files[0];

// this function can check the returned member and the member fixture
// the member fixture is more complete
export const checkMember = (expectedMember, member): void => {
  expect(member.id).toEqual(expectedMember.id);
  expect(member.name).toEqual(expectedMember.name);
  expect(member.email).toEqual(expectedMember.email);
};
