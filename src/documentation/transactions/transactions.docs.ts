import { DOC_RESPONSE, RESPONSE_CODES, RESPONSE_TAGS } from "../../config/constants";

const getTransactionsParams = {
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

const getTransactions = {
	tags: [RESPONSE_TAGS.transactions],
	description: "get all transactions",
	parameters: [
		{
			in: "query",
			name: "page",
			description: "Page number for pagination",
			required: false,
			schema: {
				$ref: "#/components/schemas/getTransactionsParams/properties/page",
			},
		},
		{
			in: "query",
			name: "rowsPerPage",
			description: "Number of rows per page",
			required: false,
			schema: {
				$ref: "#/components/schemas/getTransactionsParams/properties/rowsPerPage",
			},
		},
		{
			in: "query",
			name: "sortBy",
			description: "Field to sort by",
			required: false,
			schema: {
				$ref: "#/components/schemas/getTransactionsParams/properties/sortBy",
			},
		},
		{
			in: "query",
			name: "sortOrder",
			description: "Sort order (asc | desc)",
			required: false,
			schema: {
				$ref: "#/components/schemas/getTransactionsParams/properties/sortOrder",
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

const depositFundsBody = {
	type: "object",
	properties: {
		userId: {
			type: "string",
			example: "1234567890",
		},
	},
};

const depositFunds = {
	tags: ["Transactions"],
	description: "Create a new deposit transaction",
	requestBody: {
		content: {
			"application/json": {
				schema: {
					$ref: "#/components/schemas/depositFundsBody",
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

const withdrawFundsBody = {
	type: "object",
	properties: {
		userId: {
			type: "string",
			example: "1234567890",
		},
	},
};

const withdrawFunds = {
	tags: ["Transactions"],
	description: "Create a new deposit transaction",
	requestBody: {
		content: {
			"application/json": {
				schema: {
					$ref: "#/components/schemas/depositFundsBody",
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

const convertFundsBody = {
	type: "object",
	properties: {
		userId: {
			type: "string",
			example: "1234567890",
		},
	},
};

const convertFunds = {
	tags: ["Transactions"],
	description: "Create a new convert transaction",
	requestBody: {
		content: {
			"application/json": {
				schema: {
					$ref: "#/components/schemas/convertFundsBody",
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

const transferFundsBody = {
	type: "object",
	properties: {
		userId: {
			type: "string",
			example: "1234567890",
		},
	},
};

const transferFunds = {
	tags: ["Transactions"],
	description: "Create a new transfer transaction",
	requestBody: {
		content: {
			"application/json": {
				schema: {
					$ref: "#/components/schemas/transferFundsBody",
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

export {
	depositFunds,
	depositFundsBody,
	getTransactions,
	getTransactionsParams,
	withdrawFunds,
	withdrawFundsBody,
	convertFunds,
	convertFundsBody,
	transferFunds,
	transferFundsBody,
};
