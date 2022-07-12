import { GraaspError, GraaspErrorDetails } from '@graasp/sdk';

export class GraaspPublicError implements GraaspError {
  name: string;
  code: string;
  message: string;
  statusCode?: number;
  data?: unknown;
  origin: 'plugin' | string;

  constructor({ code, statusCode, message }: GraaspErrorDetails, data?: unknown) {
    this.name = code;
    this.code = code;
    this.message = message;
    this.statusCode = statusCode;
    this.data = data;
    this.origin = 'plugin';
  }
}

export class ItemNotFound extends GraaspPublicError {
  constructor(data?: unknown) {
    super({ code: 'GPIERR001', statusCode: 404, message: 'Item not found' }, data);
  }
}

export class ItemNotPublic extends GraaspPublicError {
  constructor(data?: unknown) {
    super({ code: 'GPIERR002', statusCode: 403, message: 'Item is not public' }, data);
  }
}

export class CannotEditPublicItem extends GraaspPublicError {
  constructor(data?: unknown) {
    super({ code: 'GERR003', statusCode: 400, message: 'Cannot edit public item' }, data);
  }
}

export class CannotEditPublicMember extends GraaspPublicError {
  constructor(data?: unknown) {
    super({ code: 'GERR004', statusCode: 400, message: 'Cannot edit public member' }, data);
  }
}
