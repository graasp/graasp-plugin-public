// schema for getting many item's memberships
export const getMany = {
  querystring: {
    type: 'object',
    required: ['itemId'],
    properties: {
      itemId: {
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
          {
            type: 'array',
            items: {
              $ref: 'http://graasp.org/public-items/#/definitions/itemMembership',
            },
          },
          { $ref: 'http://graasp.org/#/definitions/error' },
        ],
      },
    },
  },
};
