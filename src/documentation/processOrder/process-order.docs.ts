import { DOC_RESPONSE, RESPONSE_CODES, RESPONSE_TAGS } from "../../config/constants";

const createProcessOrderBody = {
	type: "object",
	required: ["userId", "currencyId", "amount", "transactionType"],
	properties: {
		userId: {
			type: "string",
			example: "rfgvunio1234567890sxdrgbn",
		},
		currencyId: {
			type: "string",
			example: "",
		},
		amount: {
			type: "number",
			example: "",
		},
		transactionType: {
			type: "string",
			example: "",
		},
	},
};

const createProcessOrder = {
	tags: [RESPONSE_TAGS.processOrder],
	description: "check balance, deduct/add order amount and fees",
	requestBody: {
		content: {
			"application/json": {
				schema: {
					$ref: "#/components/schemas/createProcessOrderBody",
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

export { createProcessOrder, createProcessOrderBody };
