import { DOC_RESPONSE, RESPONSE_CODES, RESPONSE_TAGS } from "../../config/constants";

const getWalletsParams = {
	type: "object",
	properties: {
		page: {
			type: "number",
			example: 1,
		},
		rowsPerPage: {
			type: "number",
			example: 10,
		},
		sortBy: {
			type: "string",
			example: "createdAt",
		},
		sortOrder: {
			type: "string",
			example: "desc",
			enum: ["asc", "desc"],
		},
	},
};

const getWallets = {
	tags: [RESPONSE_TAGS.wallets],
	description: "get all wallets, or list of user wallets",
	parameters: [
		{
			in: "query",
			name: "page",
			description: "Page number for pagination",
			required: false,
			schema: {
				$ref: "#/components/schemas/getWalletsParams/properties/page",
			},
		},
		{
			in: "query",
			name: "rowsPerPage",
			description: "Number of rows per page",
			required: false,
			schema: {
				$ref: "#/components/schemas/getWalletsParams/properties/rowsPerPage",
			},
		},
		{
			in: "query",
			name: "sortBy",
			description: "Field to sort by",
			required: false,
			schema: {
				$ref: "#/components/schemas/getWalletsParams/properties/sortBy",
			},
		},
		{
			in: "query",
			name: "sortOrder",
			description: "Sort order (asc | desc)",
			required: false,
			schema: {
				$ref: "#/components/schemas/getWalletsParams/properties/sortOrder",
			},
		},
	],
	responses: {
		[RESPONSE_CODES.ok]: DOC_RESPONSE.SUCCESS,
		[RESPONSE_CODES.badRequest]: DOC_RESPONSE.BADREQUEST,
		[RESPONSE_CODES.unauthorized]: DOC_RESPONSE.UNAUTHORIZED,
		[RESPONSE_CODES.serverError]: DOC_RESPONSE.SERVERERROR,
	},
};

const createUserWalletBody = {
	type: "object",
	properties: {
		userId: {
			type: "string",
			example: "1234567890",
		},
	},
};

const createUserWallet = {
	tags: ["Wallets"],
	description: "Create a new user wallet",
	requestBody: {
		content: {
			"application/json": {
				schema: {
					$ref: "#/components/schemas/createUserWalletBody",
				},
			},
		},
		required: true,
	},
	responses: {
		[RESPONSE_CODES.ok]: DOC_RESPONSE.SUCCESS,
		[RESPONSE_CODES.badRequest]: DOC_RESPONSE.BADREQUEST,
		[RESPONSE_CODES.unauthorized]: DOC_RESPONSE.UNAUTHORIZED,
		[RESPONSE_CODES.serverError]: DOC_RESPONSE.SERVERERROR,
	},
};

export { createUserWallet, createUserWalletBody, getWallets, getWalletsParams };
