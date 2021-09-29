const MAX_TARGETS_FOR_READ_REQUEST = 50;

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

export { getMember, getMembers, downloadSchema, getMetadataSchema };
