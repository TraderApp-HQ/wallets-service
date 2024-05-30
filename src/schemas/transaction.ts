import { ITransactionInput } from ".";
import { Currency } from "./currency";
import { Network } from "./network";
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
	transactionNetwork: Network;
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
	transactionWalletType: TransactionWalletType;
}

export interface IDepositFundsPayload extends ITransactionInput {
	userId: string;
	fromWalletAddress?: string;
	toWallet?: WalletType;
	fromCurrency: Currency;
	toCurrency: Currency;
	fromAmount: number;
	network: Network;
}

export interface IWithdrawFundsPayload {
	userId: string;
	toWallet?: WalletType;
	toWalletAddress?: string;
	fromCurrency: Currency;
	toCurrency: Currency;
	fromAmount: number;
}
