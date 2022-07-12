import { BaseGraaspError } from '@graasp/sdk';

import { PLUGIN_NAME } from './constants';

export class ItemNotFound extends BaseGraaspError {
  origin = PLUGIN_NAME;
  constructor(data?: unknown) {
    super({ code: 'GPIERR001', statusCode: 404, message: 'Item not found' }, data);
  }
}

export class ItemNotPublic extends BaseGraaspError {
  origin = PLUGIN_NAME;
  constructor(data?: unknown) {
    super({ code: 'GPIERR002', statusCode: 403, message: 'Item is not public' }, data);
  }
}

export class CannotEditPublicItem extends BaseGraaspError {
  origin = PLUGIN_NAME;
  constructor(data?: unknown) {
    super({ code: 'GERR003', statusCode: 400, message: 'Cannot edit public item' }, data);
  }
}

export class CannotEditPublicMember extends BaseGraaspError {
  origin = PLUGIN_NAME;
  constructor(data?: unknown) {
    super({ code: 'GERR004', statusCode: 400, message: 'Cannot edit public member' }, data);
  }
}
