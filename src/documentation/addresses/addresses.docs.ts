import { DOC_RESPONSE, RESPONSE_CODES, RESPONSE_TAGS } from "../../config/constants";

const getNetworkAddressParams = {
	type: "object",
	properties: {
		currency: {
			type: "string",
			example: 1,
		},
	},
};

const getNetworkAddresses = {
	tags: [RESPONSE_TAGS.wallets],
	description: "get all user network addresses",
	parameters: [
		{
			in: "query",
			name: "currency",
			description: "filter by currency",
			required: false,
			schema: {
				$ref: "#/components/schemas/etNetworkAddressesParams/properties/currency",
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

const createUserNetworkAddressBody = {
	type: "object",
	properties: {
		userId: {
			type: "string",
			example: "1234567890",
		},
		network: {
			type: "string",
			example: "TRON",
		},
		currency: {
			type: "string",
			example: "BTC",
		},
	},
};

const createUserNetworkAddress = {
	tags: ["Network Addresses"],
	description: "Create a new user network address",
	requestBody: {
		content: {
			"application/json": {
				schema: {
					$ref: "#/components/schemas/createUserNetworkAddressBody",
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
	createUserNetworkAddress,
	createUserNetworkAddressBody,
	getNetworkAddresses,
	getNetworkAddressParams,
};
