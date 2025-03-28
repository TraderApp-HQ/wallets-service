import { apiDocumentationResponseObject } from "@traderapp/shared-resources";

export const ENVIRONMENTS: Record<string, string> = Object.freeze({
	development: "dev",
	staging: "staging",
	production: "prod",
});

export const ResponseType = {
	SUCCESS: "success",
	ERROR: "error",
};

export const RESPONSE_TAGS = {
	processOrder: "processOrder",
	wallets: "Wallets",
	transactions: "Transactions",
	addresses: "Network Addresses",
};

export const RESPONSE_FLAGS = {
	unauthorized: "Unauthorized",
	validationError: "ValidationError",
	forbidden: "Forbidden",
	notfound: "NotFound",
};

export const RESPONSE_CODES = {
	ok: "200",
	badRequest: "400",
	unauthorized: "401",
	serverError: "500",
};

export const DOC_RESPONSE = {
	SERVERERROR: apiDocumentationResponseObject("Internal Server Error"),
	UNAUTHORIZED: apiDocumentationResponseObject("Error: Unauthorized"),
	BADREQUEST: apiDocumentationResponseObject("Error: Bad Request"),
	SUCCESS: apiDocumentationResponseObject("Success"),
};

export const ROUTES = {
	processOrder: "/process",
	getWallets: "/wallets",
	transactions: "/transactions",
	addresses: "/addresses",
};

export const COLLECTIONS = {
	wallets: "wallets",
	transactions: "transactions",
	addresses: "addresses",
};
