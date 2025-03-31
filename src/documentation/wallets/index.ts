import { RESPONSE_CODES, RESPONSE_TAGS } from "../../config/constants";

// Standard response objects
const SUCCESS_RESPONSE = {
	description: "Success response",
	content: {
		"application/json": {
			schema: {
				type: "object",
				properties: {
					type: { type: "string", example: "success" },
					message: { type: "string", example: "Operation successful" },
					object: { type: "object" },
				},
			},
		},
	},
};

const ERROR_RESPONSE = {
	description: "Error response",
	content: {
		"application/json": {
			schema: {
				type: "object",
				properties: {
					type: { type: "string", example: "error" },
					message: { type: "string", example: "An error occurred" },
				},
			},
		},
	},
};

// Get User Wallets
export const getUserWallets = {
	tags: [RESPONSE_TAGS.wallets],
	description: "Get all wallets for a user",
	parameters: [
		{
			in: "query",
			name: "userId",
			description: "User ID to retrieve wallets for",
			required: false,
			schema: {
				type: "string",
				example: "user-12345",
			},
		},
	],
	responses: {
		[RESPONSE_CODES.ok]: SUCCESS_RESPONSE,
		[RESPONSE_CODES.badRequest]: ERROR_RESPONSE,
		[RESPONSE_CODES.unauthorized]: ERROR_RESPONSE,
		[RESPONSE_CODES.serverError]: ERROR_RESPONSE,
	},
};

// Get User Wallet Type
export const getUserWalletType = {
	tags: [RESPONSE_TAGS.wallets],
	description: "Get wallets of a specific type for a user",
	parameters: [
		{
			in: "query",
			name: "userId",
			description: "User ID to retrieve wallets for",
			required: false,
			schema: {
				type: "string",
				example: "user-12345",
			},
		},
		{
			in: "query",
			name: "type",
			description: "Wallet type to filter by",
			required: true,
			schema: {
				type: "string",
				enum: ["MAIN", "SPOT", "FUTURES"],
				example: "MAIN",
			},
		},
	],
	responses: {
		[RESPONSE_CODES.ok]: SUCCESS_RESPONSE,
		[RESPONSE_CODES.badRequest]: ERROR_RESPONSE,
		[RESPONSE_CODES.unauthorized]: ERROR_RESPONSE,
		[RESPONSE_CODES.serverError]: ERROR_RESPONSE,
	},
};

// Get Wallet Payment Categories
export const getWalletPaymentCategories = {
	tags: [RESPONSE_TAGS.wallets],
	description: "Get all payment categories",
	responses: {
		[RESPONSE_CODES.ok]: SUCCESS_RESPONSE,
		[RESPONSE_CODES.badRequest]: ERROR_RESPONSE,
		[RESPONSE_CODES.unauthorized]: ERROR_RESPONSE,
		[RESPONSE_CODES.serverError]: ERROR_RESPONSE,
	},
};

// Get Wallet Payment Methods
export const getWalletPaymentMethods = {
	tags: [RESPONSE_TAGS.wallets],
	description: "Get payment methods for a specific category and operation",
	parameters: [
		{
			in: "query",
			name: "category",
			description: "Payment category name",
			required: true,
			schema: {
				type: "string",
				example: "CRYPTO",
			},
		},
		{
			in: "query",
			name: "operation",
			description: "Payment operation type",
			required: true,
			schema: {
				type: "string",
				enum: ["DEPOSIT", "WITHDRAWAL"],
				example: "DEPOSIT",
			},
		},
	],
	responses: {
		[RESPONSE_CODES.ok]: SUCCESS_RESPONSE,
		[RESPONSE_CODES.badRequest]: ERROR_RESPONSE,
		[RESPONSE_CODES.unauthorized]: ERROR_RESPONSE,
		[RESPONSE_CODES.serverError]: ERROR_RESPONSE,
	},
};

// Initiate Deposit
export const initiateDeposit = {
	tags: [RESPONSE_TAGS.wallets],
	description: "Initiate a deposit transaction",
	requestBody: {
		content: {
			"application/json": {
				schema: {
					$ref: "#/components/schemas/initiateDepositBody",
				},
			},
		},
		required: true,
	},
	responses: {
		[RESPONSE_CODES.ok]: SUCCESS_RESPONSE,
		[RESPONSE_CODES.badRequest]: ERROR_RESPONSE,
		[RESPONSE_CODES.unauthorized]: ERROR_RESPONSE,
		[RESPONSE_CODES.serverError]: ERROR_RESPONSE,
	},
};

export * from "./wallets.docs";
