import { DOC_RESPONSE, RESPONSE_CODES, RESPONSE_TAGS } from "../../config/constants";
import { Currency } from "../../schemas/currency";
import { Network } from "../../schemas/network";

const getNetworkAddressParams = {
	type: "object",
	properties: {
		currency: {
			type: "string",
			enum: Object.values(Currency),
		},
		network: {
			type: "string",
			enum: Object.values(Network),
		},
	},
};

const getNetworkAddresses = {
	tags: [RESPONSE_TAGS.addresses],
	description: "get all user network addresses",
	parameters: [
		{
			in: "query",
			name: "currency",
			description: "filter by currency",
			required: false,
			schema: {
				$ref: "#/components/schemas/getNetworkAddressParams/properties/currency",
			},
		},
		{
			in: "query",
			name: "network",
			description: "filter by network",
			required: false,
			schema: {
				$ref: "#/components/schemas/getNetworkAddressParams/properties/network",
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
			enum: Object.values(Network),
		},
		currency: {
			type: "string",
			enum: Object.values(Currency),
		},
	},
};

const createUserNetworkAddress = {
	tags: [RESPONSE_TAGS.addresses],
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
