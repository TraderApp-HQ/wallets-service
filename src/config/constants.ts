import { apiDocumentationResponseObject } from "@traderapp/shared-resources";

export const ENVIRONMENTS: Record<string, string> = Object.freeze({
	development: "dev",
	test: "dev",
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

export const ConversionCurrencies = ["USD", "NGN"];

export const PAGINATION = {
	PAGE: 1,
	LIMIT: 10,
};

export const OTP_EXPIRES = 60 * 2;
export const OTP_RATE_LIMIT_EXPIRES = 60 * 60;
export const MAX_OTP_ATTEMPTS = 5;
export const OTP_DEFAULT_CODE = "123456"; // fallback when feature flag is disabled

export const WITHDRAWAL_LIMIT = {
	MINIMUM_AMOUNTS: { USDT: 10 },
	MAXIMUM_AMOUNTS: { USDT: 50000 },
};

export const WITHDRAWAL_REQUEST_TTL_SECONDS = 60 * 5;
export const WITHDRAWAL_REQUEST_STATUSES = {
	INITIATED: "INITIATED",
	SUBMITTING: "SUBMITTING", // transient during atomic claim
	SUBMITTED: "SUBMITTED", // transaction created & funds locked
	EXPIRED: "EXPIRED", // (implicit via TTL or explicit mark if needed)
} as const;
