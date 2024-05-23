import { Currency } from "./currency";
import { WalletType } from "./wallet";

export enum TransactionType {
	DEPOSIT = "DEPOSIT",
	WITHDRAWAL = "WITHDRAWAL",
	TRANSFER = "TRANSFER",
	CONVERT = "CONVERT",
}

export enum TransactionWalletType {
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
	ToCurrency: Currency;
	conversionRate: number;
	fromAmount: number;
	ToAmount: number;
	type: TransactionType;
	timestamp: string;
	fromWalletAddress?: string;
	toWalletAddress?: string;
	status: TransactionStatus;
	transactionWalletType: TransactionWalletType;
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
