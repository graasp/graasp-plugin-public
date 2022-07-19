import { ErrorFactory } from '@graasp/sdk';

import { PLUGIN_NAME } from './constants';

export const GraaspError = ErrorFactory(PLUGIN_NAME);

export class ItemNotFound extends GraaspError {
  constructor(data?: unknown) {
    super({ code: 'GPIERR001', statusCode: 404, message: 'Item not found' }, data);
  }
}

export class ItemNotPublic extends GraaspError {
  constructor(data?: unknown) {
    super({ code: 'GPIERR002', statusCode: 403, message: 'Item is not public' }, data);
  }
}

export class CannotEditPublicItem extends GraaspError {
  constructor(data?: unknown) {
    super({ code: 'GERR003', statusCode: 400, message: 'Cannot edit public item' }, data);
  }
}

export class CannotEditPublicMember extends GraaspError {
  constructor(data?: unknown) {
    super({ code: 'GERR004', statusCode: 400, message: 'Cannot edit public member' }, data);
  }
}
