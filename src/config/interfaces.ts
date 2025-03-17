import { UserRoles } from "./enums";

export interface IAccessToken {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	isPhoneVerified: boolean;
	isEmailVerified: boolean;
	isIdVerified: boolean;
	role: UserRoles[];
}

export enum TransactionType {
	DEPOSIT = "DEPOSIT",
	WITHDRAWAL = "WITHDRAWAL",
	TRANSFER = "TRANSFER",
	CONVERT = "CONVERT",
}

export enum TransactionSource {
	INTERNAL = "INTERNAL",
	EXTERNAL = "EXTERNAL",
}

export enum TransactionStatus {
	PENDING = "PENDING",
	SUCCESS = "SUCCESS",
	FAILED = "FAILED",
}

export interface ITransaction {
	transactionId: string;
	transactionNetwork: string;
	userId: string;
	fromWallet?: WalletType;
	toWallet?: WalletType;
	fromCurrency: Currency;
	toCurrency?: Currency;
	conversionRate?: number;
	fromAmount: number;
	toAmount?: number;
	type: TransactionType;
	timestamp: string;
	fromWalletAddress?: string;
	toWalletAddress?: string;
	status: TransactionStatus;
	transactionSource: TransactionSource;
}

export interface IDepositFundsPayload {
	userId: string;
	fromWallet?: WalletType;
	fromWalletAddress?: string;
	fromCurrency: Currency;
	toCurrency: Currency;
	fromAmount: number;
}

export interface IWithdrawFundsPayload {
	userId: string;
	toWallet?: WalletType;
	toWalletAddress?: string;
	fromCurrency: Currency;
	toCurrency: Currency;
	fromAmount: number;
}

export enum WalletType {
	MAIN = "MAIN",
	SPOT = "SPOT",
	FUTURES = "FUTURES",
}

export enum Currency {
	USDT = "USDT",
	// BTC = "BTC",
	// ETH = "ETH",
}

export interface IPaymentMethodResponse {
	paymentMethodId: string;
	paymentMethodName: string;
	logoUrl: string;
	symbol: string;
	categoryId: string;
	categoryName: string;
	providerId: string;
	providerName: string;
	isDepositSupported: boolean;
	isWithdrawalSupported: boolean;
	isDefault: boolean;
	supportNetworks?: Array<{
		slug: string;
		name: string;
		precision: number;
	}>;
}
