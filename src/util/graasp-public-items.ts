import { GraaspErrorDetails, GraaspError } from 'graasp';

export class GraaspPublicItems implements GraaspError {
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

export class ItemNotFound extends GraaspPublicItems {
  constructor(data?: unknown) {
    super({ code: 'GPIERR001', statusCode: 404, message: 'Item not found' }, data);
  }
}

export class ItemNotPublic extends GraaspPublicItems {
  constructor(data?: unknown) {
    super({ code: 'GPIERR002', statusCode: 403, message: 'Item is not public' }, data);
  }
}
