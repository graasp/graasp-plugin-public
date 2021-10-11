import { Item, PermissionLevel } from 'graasp';
import { v4 } from 'uuid';

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
};

export const PUBLIC_ITEM_CHILDREN: Item[] = [
  {
    id: v4(),
    path: v4().replace(/-/g, '_'),
    name: 'public-item-children-folder',
    description: 'description',
    type: 'folder',
    extra: {},
    creator: v4(),
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  {
    id: v4(),
    path: v4().replace(/-/g, '_'),
    name: 'public-item-children-file',
    description: 'description',
    type: 'file',
    extra: {},
    creator: v4(),
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
];

export const PUBLIC_TAG_ID = v4();

export const buildMember = () => ({
  id: v4(),
  name: 'member',
  email: 'member@email.com',
});

export const buildItemMembership = () => ({
  id: v4(),
  memberId: buildMember().id,
  itemPath: v4().replace(/-/g, '_'),
  permission: 'read' as PermissionLevel,
  creator: v4(),
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
});
