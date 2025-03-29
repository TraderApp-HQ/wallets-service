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
}
