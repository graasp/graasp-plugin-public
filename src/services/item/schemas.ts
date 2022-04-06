// schema for getting one item
const getOne = {
  params: { $ref: 'http://graasp.org/#/definitions/idParam' },
  response: {
    200: { $ref: 'http://graasp.org/public-items/#/definitions/item' },
  },
};

// schema for getting one item's children
const getChildren = {
  params: { $ref: 'http://graasp.org/#/definitions/idParam' },
  querystring: {
    type: 'object',
    properties: {
      ordered: { type: 'boolean' },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'array',
      items: { $ref: 'http://graasp.org/public-items/#/definitions/item' },
    },
  },
};

// schema for getting items by tags
const getItemsBy = {
  querystring: {
    type: 'object',
    properties: {
      tagId: {
        type: 'array',
        items: { $ref: 'http://graasp.org/#/definitions/uuid' },
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'array',
      items: {
        anyOf: [
          { $ref: 'http://graasp.org/public-items/#/definitions/error' },
          { $ref: 'http://graasp.org/public-items/#/definitions/item' },
        ],
      },
    },
  },
};

// schema for copying one item
const copyOne = {
  params: { $ref: 'http://graasp.org/#/definitions/idParam' },
  body: {
    type: 'object',
    properties: {
      parentId: { $ref: 'http://graasp.org/#/definitions/uuid' },
    },
    additionalProperties: false,
  },
};

export { getOne, getChildren, getItemsBy, copyOne };
