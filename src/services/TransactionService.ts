import { apiResponseHandler } from "@traderapp/shared-resources";
import { Response } from "express";
import { COLLECTIONS, ResponseType } from "../config/constants";
import { db } from "../firebase";
import { Currency } from "../schemas/currency";
import {
	ITransaction,
	TransactionStatus,
	TransactionType,
	TransactionWalletType,
} from "../schemas/transaction";
import { HttpStatus } from "../utils/httpStatus";
import { WalletService } from "./WalletService";
import { v4 as uuidv4 } from "uuid";
import { WalletType } from "../schemas/wallet";
import { BaseInput, ITransactionInput } from "../schemas";

// TODO
// Refactor to accomodate the webhook logic
// to update transaction status from third party API services
// eg. TransactionStatus.PENDING ==> TransactionStatus.SUCCESS or TransactionStatus.FAILED

export class TransactionService {
	constructor(private readonly walletService: WalletService) {}

	public async getTransactions({ userId, res }: ITransactionInput): Promise<Response> {
		try {
			const transactions = await this.getUserTransactions({ userId });
			if (!transactions) {
				return res.status(HttpStatus.OK).json(
					apiResponseHandler({
						type: ResponseType.SUCCESS,
						message: "No transactions found!",
					})
				);
			}

			return res.status(HttpStatus.OK).json(
				apiResponseHandler({
					type: ResponseType.SUCCESS,
					message: "List of user transactions!",
					object: { transactions },
				})
			);
		} catch (error: any) {
			throw new Error(`Error with getting transactions: ${error.message}`);
		}
	}

	public async depositFunds({ userId, res }: ITransactionInput): Promise<Response> {
		try {
			// Confirm user has an existing wallet
			const wallets = await this.walletService.getUserWalletBalance({ userId });
			if (!wallets) {
				return res.status(HttpStatus.BAD_REQUEST).json(
					apiResponseHandler({
						type: ResponseType.ERROR,
						message: "No existing wallets found",
					})
				);
			}
			// TODO
			// Check external service availability & requirements
			// Retrieve incoming funds detail and validate

			const transactionId = uuidv4();

			const transaction: ITransaction = {
				transactionId,
				transactionNetwork: "network_name",
				userId,
				fromCurrency: Currency.USDT,
				toCurrency: Currency.USDT,
				fromWalletAddress: "walletAddressReference",
				toWalletAddress: "toWalletAddressRefence",
				toWallet: WalletType.MAIN,
				conversionRate: 1,
				fromAmount: 65,
				toAmount: 65,
				type: TransactionType.DEPOSIT,
				timestamp: new Date().toISOString(),
				status: TransactionStatus.PENDING,
				transactionWalletType: TransactionWalletType.EXTERNAL,
			};

			await db.collection(COLLECTIONS.transactions).add(transaction);

			return res.status(HttpStatus.OK).json(
				apiResponseHandler({
					type: ResponseType.SUCCESS,
					message: "Funds deposited successfully!",
					object: { transaction },
				})
			);
		} catch (error: any) {
			throw new Error(`Error with fund deposit: ${error.message}`);
		}
	}

	public async withdrawFunds({ userId, res }: ITransactionInput): Promise<Response> {
		try {
			const wallets = await this.walletService.getUserWalletBalance({ userId });
			if (!wallets) {
				return res.status(HttpStatus.BAD_REQUEST).json(
					apiResponseHandler({
						type: ResponseType.ERROR,
						message: "No existing wallets found",
					})
				);
			}
			// TODO
			// Check external service availability & requirements
			// Retrieve outgoing funds detail and validate

			const transactionId = uuidv4();

			const transaction: ITransaction = {
				transactionId,
				transactionNetwork: "network_name",
				userId,
				fromCurrency: Currency.BTC,
				toCurrency: Currency.BTC,
				fromWalletAddress: "walletAddressReference",
				toWalletAddress: "toWalletAddressRefence",
				fromWallet: WalletType.MAIN,
				conversionRate: 1,
				fromAmount: 2,
				toAmount: 2,
				type: TransactionType.WITHDRAWAL,
				timestamp: new Date().toISOString(),
				status: TransactionStatus.PENDING,
				transactionWalletType: TransactionWalletType.EXTERNAL,
			};

			await db.collection(COLLECTIONS.transactions).add(transaction);

			return res.status(HttpStatus.OK).json(
				apiResponseHandler({
					type: ResponseType.SUCCESS,
					message: "Funds withdrawal completed successfully!",
					object: { transaction },
				})
			);
		} catch (error: any) {
			throw new Error(`Error with fund withdrawal: ${error.message}`);
		}
	}

	public async convertFunds({ userId, res }: ITransactionInput): Promise<Response> {
		try {
			const wallets = await this.walletService.getUserWalletBalance({ userId });
			if (!wallets) {
				return res.status(HttpStatus.BAD_REQUEST).json(
					apiResponseHandler({
						type: ResponseType.ERROR,
						message: "No existing wallets found",
					})
				);
			}
			// TODO
			// Check external service availability & requirements
			// Retrieve outgoing funds detail and validate

			const transactionId = uuidv4();

			const transaction: ITransaction = {
				transactionId,
				transactionNetwork: "network_name",
				userId,
				fromCurrency: Currency.USDT,
				toCurrency: Currency.BTC,
				conversionRate: 0.1,
				fromAmount: 6500,
				toAmount: 0.1,
				type: TransactionType.CONVERT,
				timestamp: new Date().toISOString(),
				status: TransactionStatus.PENDING,
				transactionWalletType: TransactionWalletType.INTERNAL,
			};

			await db.collection(COLLECTIONS.transactions).add(transaction);

			return res.status(HttpStatus.OK).json(
				apiResponseHandler({
					type: ResponseType.SUCCESS,
					message: "Funds conversion completed successfully!",
					object: { transaction },
				})
			);
		} catch (error: any) {
			throw new Error(`Error with fund conversion: ${error.message}`);
		}
	}

	public async transferFunds({ userId, res }: ITransactionInput): Promise<Response> {
		try {
			const wallets = await this.walletService.getUserWalletBalance({ userId });
			if (!wallets) {
				return res.status(HttpStatus.BAD_REQUEST).json(
					apiResponseHandler({
						type: ResponseType.ERROR,
						message: "No existing wallets found",
					})
				);
			}
			// TODO
			// Check external service availability & requirements
			// Retrieve outgoing funds detail and validate

			const transactionId = uuidv4();

			const transaction: ITransaction = {
				transactionId,
				transactionNetwork: "network_name",
				userId,
				fromCurrency: Currency.USDT,
				toCurrency: Currency.USDT,
				fromWalletAddress: "walletAddressReference",
				toWalletAddress: "toWalletAddressRefence",
				fromWallet: WalletType.MAIN,
				toWallet: WalletType.FUTURES,
				conversionRate: 1,
				fromAmount: 50,
				toAmount: 50,
				type: TransactionType.TRANSFER,
				timestamp: new Date().toISOString(),
				status: TransactionStatus.PENDING,
				transactionWalletType: TransactionWalletType.INTERNAL,
			};

			await db.collection(COLLECTIONS.transactions).add(transaction);

			return res.status(HttpStatus.OK).json(
				apiResponseHandler({
					type: ResponseType.SUCCESS,
					message: "Funds transfer completed successfully!",
					object: { transaction },
				})
			);
		} catch (error: any) {
			throw new Error(`Error with fund transfer: ${error.message}`);
		}
	}

	private async getUserTransactions({ userId }: BaseInput): Promise<ITransaction[] | null> {
		try {
			const docs = await db
				.collection(COLLECTIONS.transactions)
				.where("userId", "==", `${userId}`)
				.get();

			const transactions: ITransaction[] = [];

			if (docs.empty) {
				return null;
			}

			docs.forEach((doc) => {
				transactions.push(doc.data() as ITransaction);
			});

			return transactions;
		} catch (error: any) {
			throw new Error(`Error with getting user transactions: ${error.message}`);
		}
	}
}
