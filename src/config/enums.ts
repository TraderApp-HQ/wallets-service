export enum UserRoles {
	USER = "USER",
	SUBSCRIBER = "SUBSCRIBER",
	ADMIN = "ADMIN",
	SUPER_ADMIN = "SUPER_ADMIN",
}

export enum WalletProvider {
	CRYPTOPAY = "CryptoPay",
}

export enum PaymentCategoryName {
	CRYPTO = "Crypto",
}

export enum PaymentOperation {
	DEPOSIT = "Deposit",
	WITHDRAWAL = "Withdrawal",
}

export enum AddressType {
	PERMANENT = "Permanent",
	DYNAMIC = "Dynamic",
}

export enum ErrorName {
	VALIDATION = "ValidationError",
	UNAUTHORIZED = "Unauthorized",
	FORBIDDEN = "Forbidden",
	NOT_FOUND = "NotFound",
	INTERNAL_ERROR = "InternalError",
}

export enum CurrencyCategory {
	CRYPTO = "Crypto",
	FIAT = "Fiat",
}

export enum NotificationChannel {
	EMAIL = "EMAIL",
	SMS = "SMS",
	WHATSAPP = "WHATSAPP",
}

export enum InvoiceStatus {
	PENDING = "PENDING", // Invoice is created but not
	PAID = "PAID",
	FAILED = "FAILED",
}

export enum InvoiceType {
	TRADING_FEE = "TRADING_FEE",
	PROFIT_SHARE = "PROFIT_SHARE",
}

export enum TradeSide {
	LONG = "LONG",
	SHORT = "SHORT",
}
