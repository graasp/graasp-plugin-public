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

const downloadSchema = {
  params: { $ref: "http://graasp.org/#/definitions/idParam" },
};

const getMetadataSchema = {
  params: { $ref: "http://graasp.org/#/definitions/idParam" },
};

export { getOne, getChildren, getItemsBy, downloadSchema, getMetadataSchema };
