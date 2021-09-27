const MAX_TARGETS_FOR_READ_REQUEST = 50;

export default {
  $id: "http://graasp.org/public-items/",
  definitions: {
    uuid: {
      type: "string",
      pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
    },
    idsQuery: {
      type: "object",
      required: ["id"],
      properties: {
        id: {
          type: "array",
          items: { $ref: "http://graasp.org/#/definitions/uuid" },
          uniqueItems: true,
        },
      },
      additionalProperties: false,
    },
    // permission values
    permission: {
      type: "string",
      enum: ["read", "write", "admin"],
    },

    itemMembership: {
      type: "object",
      properties: {
        id: { $ref: "http://graasp.org/#/definitions/uuid" },
        memberId: { $ref: "http://graasp.org/#/definitions/uuid" },
        /**
         * itemPath's 'pattern' not supported in serialization.
         * since 'itemMembership' schema is only used for serialization it's safe
         * to just use `{ type: 'string' }`
         */
        // itemPath: { $ref: 'http://graasp.org/#/definitions/itemPath' },
        itemPath: { type: "string" },
        // TODO: bug! should allow relative $ref: #/definitions/permission
        // check: https://github.com/fastify/fastify/issues/2328
        permission: { $ref: "http://graasp.org/item-memberships/#/definitions/permission" },
        creator: { $ref: "http://graasp.org/#/definitions/uuid" },
        createdAt: { type: "string" },
        updatedAt: { type: "string" },
      },
    },
    // item properties to be returned to the client
    item: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        description: { type: ["string", "null"] },
        type: { type: "string" },
        path: { type: "string" },
        extra: {
          type: "object",
          additionalProperties: true,
        },
        creator: { type: "string" },
        createdAt: {},
        updatedAt: {},
        itemMemberships: {
          type: "array",
          items: { $ref: "http://graasp.org/public-items/#/definitions/itemMembership" },
        },
      },
      additionalProperties: false,
    },
    member: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        email: { type: "string" },
      },
      additionalProperties: false,
    },
  },
};

// schema for getting one item
const getOne = {
  params: { $ref: "http://graasp.org/#/definitions/idParam" },
  response: {
    200: { $ref: "http://graasp.org/public-items/#/definitions/item" },
  },
};

// schema for getting one item's children
const getChildren = {
  params: { $ref: "http://graasp.org/#/definitions/idParam" },
  querystring: {
    type: "object",
    properties: {
      ordered: { type: "boolean" },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: "array",
      items: { $ref: "http://graasp.org/public-items/#/definitions/item" },
    },
  },
};

// schema for getting one item's children
const getItemsBy = {
  querystring: {
    type: "object",
    properties: {
      tagId: { type: "string" },
      withMemberships: { type: "boolean" },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: "array",
      items: { $ref: "http://graasp.org/public-items/#/definitions/item" },
    },
  },
};

// schema for getting one item
const getMember = {
  params: { $ref: "http://graasp.org/#/definitions/idParam" },
  response: {
    200: { $ref: "http://graasp.org/public-items/#/definitions/member" },
  },
};
// schema for getting one item
const getMembers = {
  querystring: {
    allOf: [
      { $ref: "http://graasp.org/#/definitions/idsQuery" },
      { properties: { id: { maxItems: MAX_TARGETS_FOR_READ_REQUEST } } },
    ],
  },
  response: {
    200: {
      type: "array",
      items: { $ref: "http://graasp.org/members/#/definitions/member" },
    },
  },
};

const downloadSchema = {
  params: { $ref: "http://graasp.org/#/definitions/idParam" },
};

const getMetadataSchema = {
  params: { $ref: "http://graasp.org/#/definitions/idParam" },
};

export {
  getOne,
  getChildren,
  getItemsBy,
  getMember,
  getMembers,
  downloadSchema,
  getMetadataSchema,
};
