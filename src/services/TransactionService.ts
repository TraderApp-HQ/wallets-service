import { apiResponseHandler } from "@traderapp/shared-resources";
import { Response } from "express";
import { ResponseType } from "../config/constants";
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

export class TransactionService {
	constructor(private readonly walletService: WalletService) {}

	public async getTransactions(userId: string, res: Response): Promise<Response> {
		try {
			const transactions = await this.getUserTransactions(userId);
			if (!transactions) {
				return res.status(200).json(
					apiResponseHandler({
						type: ResponseType.SUCCESS,
						message: "No transactions found!",
					})
				);
			}

			return res.status(200).json(
				apiResponseHandler({
					type: ResponseType.SUCCESS,
					message: "List of user transactions!",
					object: { transactions },
				})
			);
		} catch (error: any) {
			throw new Error(error.message);
		}
	}

	public async depositFunds(userId: string, res: Response): Promise<Response> {
		try {
			// Confirm user has an existing wallet
			const wallets = await this.walletService.getUserWalletBalance(userId);
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
				ToCurrency: Currency.USDT,
				conversionRate: 0.1,
				fromAmount: 6500,
				ToAmount: 0.1,
				type: TransactionType.DEPOSIT,
				timestamp: new Date().toISOString(),
				status: TransactionStatus.PENDING,
				transactionWalletType: TransactionWalletType.EXTERNAL,
			};

			await db.collection("transactions").add(transaction);

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

	public async withdrawFunds(userId: string, res: Response): Promise<Response> {
		try {
			const wallets = await this.walletService.getUserWalletBalance(userId);
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
				ToCurrency: Currency.BTC,
				conversionRate: 0.1,
				fromAmount: 6500,
				ToAmount: 0.1,
				type: TransactionType.WITHDRAWAL,
				timestamp: new Date().toISOString(),
				status: TransactionStatus.PENDING,
				transactionWalletType: TransactionWalletType.EXTERNAL,
			};

			await db.collection("transactions").add(transaction);

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

	public async convertFunds(userId: string, res: Response): Promise<Response> {
		try {
			const wallets = await this.walletService.getUserWalletBalance(userId);
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
				ToCurrency: Currency.BTC,
				conversionRate: 0.1,
				fromAmount: 6500,
				ToAmount: 0.1,
				type: TransactionType.CONVERT,
				timestamp: new Date().toISOString(),
				status: TransactionStatus.PENDING,
				transactionWalletType: TransactionWalletType.INTERNAL,
			};

			await db.collection("transactions").add(transaction);

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

	public async transferFunds(userId: string, res: Response): Promise<Response> {
		try {
			const wallets = await this.walletService.getUserWalletBalance(userId);
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
				ToCurrency: Currency.BTC,
				conversionRate: 0.1,
				fromAmount: 6500,
				ToAmount: 0.1,
				type: TransactionType.TRANSFER,
				timestamp: new Date().toISOString(),
				status: TransactionStatus.PENDING,
				transactionWalletType: TransactionWalletType.INTERNAL,
			};

			await db.collection("transactions").add(transaction);

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

	public async getUserTransactions(userId: string): Promise<ITransaction[] | null> {
		try {
			const docs = await db
				.collection("transactions")
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
			throw new Error(error.message);
		}
	}
}
