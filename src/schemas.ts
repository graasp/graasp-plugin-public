export default {
  $id: 'http://graasp.org/public-items/',
  definitions: {
    // item properties to be returned to the client
    item: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        description: { type: ['string', 'null'] },
        type: { type: 'string' },
        path: { type: 'string' },
        extra: {
          type: 'object',
          additionalProperties: true
        },
        creator: { type: 'string' },
        createdAt: {},
        updatedAt: {}
      },
      additionalProperties: false
    }
  }
};

// schema for getting one item
const getOne = {
  params: { $ref: 'http://graasp.org/#/definitions/idParam' },
  response: {
    200: { $ref: 'http://graasp.org/public-items/#/definitions/item' }
  }
};

// schema for getting one item's children
const getChildren = {
  params: { $ref: 'http://graasp.org/#/definitions/idParam' },
  querystring: {
    type: 'object',
    properties: {
      ordered: { type: 'boolean' }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'array',
      items: { $ref: 'http://graasp.org/public-items/#/definitions/item' }
    }
  }
};

export {
  getOne,
  getChildren
};
