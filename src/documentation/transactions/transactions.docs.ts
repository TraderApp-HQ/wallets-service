import { DOC_RESPONSE, RESPONSE_CODES, RESPONSE_TAGS } from "../../config/constants";
import { Currency } from "../../schemas/currency";
import { Network } from "../../schemas/network";
import { WalletType } from "../../schemas/wallet";

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
		fromWalletAddress: {
			type: "string",
		},
		toWalletAddress: {
			type: "string",
		},
		toWallet: {
			type: "string",
			enum: Object.values(WalletType),
		},
		fromCurrency: {
			type: "string",
			enum: Object.values(Currency),
		},
		toCurrency: {
			type: "string",
			enum: Object.values(Currency),
		},
		fromAmount: {
			type: "number",
		},
		network: {
			type: "string",
			enum: Object.values(Network),
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
		fromWalletAddress: {
			type: "string",
		},
		toWalletAddress: {
			type: "string",
		},
		fromWallet: {
			type: "string",
			enum: Object.values(WalletType),
		},
		fromCurrency: {
			type: "string",
			enum: Object.values(Currency),
		},
		toCurrency: {
			type: "string",
			enum: Object.values(Currency),
		},
		fromAmount: {
			type: "string",
		},
		network: {
			type: "string",
			enum: Object.values(Network),
		},
	},
};

const withdrawFunds = {
	tags: ["Transactions"],
	description: "Create a new withdrawal transaction",
	requestBody: {
		content: {
			"application/json": {
				schema: {
					$ref: "#/components/schemas/withdrawFundsBody",
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
		fromWallet: {
			type: "string",
			enum: Object.values(WalletType),
		},
		toWallet: {
			type: "string",
			enum: Object.values(WalletType),
		},
		fromCurrency: {
			type: "string",
			enum: Object.values(Currency),
		},
		toCurrency: {
			type: "string",
			enum: Object.values(Currency),
		},
		fromAmount: {
			type: "number",
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
		fromWallet: {
			type: "string",
			enum: Object.values(WalletType),
		},
		toWallet: {
			type: "string",
			enum: Object.values(WalletType),
		},
		fromCurrency: {
			type: "string",
			enum: Object.values(Currency),
		},
		toCurrency: {
			type: "string",
			enum: Object.values(Currency),
		},
		fromAmount: {
			type: "number",
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
