import { apiResponseHandler } from "@traderapp/shared-resources";
import { Response } from "express";
import { COLLECTIONS, ResponseType } from "../config/constants";
import { db } from "../firebase";
import {
	IConvertFundsPayload,
	IDepositFundsPayload,
	ITransaction,
	ITransferFundsPayload,
	IWithdrawFundsPayload,
	TransactionStatus,
	TransactionType,
	TransactionWalletType,
} from "../schemas/transaction";
import { HttpStatus } from "../utils/httpStatus";
import { WalletService } from "./WalletService";
import { v4 as uuidv4 } from "uuid";
import { UserWallet, WalletType } from "../schemas/wallet";
import { BaseInput, ITransactionInput } from "../schemas";
import { AddressService } from "./AddressService";

// TODO
// Refactor to accomodate the webhook logic
// to update transaction status from third party API services
// eg. TransactionStatus.PENDING ==> TransactionStatus.SUCCESS or TransactionStatus.FAILED

export class TransactionService {
	constructor(
		private readonly walletService: WalletService,
		private readonly addressService: AddressService
	) {}

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

	public async depositFunds({ res, ...payload }: IDepositFundsPayload): Promise<Response> {
		try {
			// Confirm user has an existing wallet
			const wallets: UserWallet[] | null = await this.walletService.getUserWalletBalance({
				userId: payload.userId,
			});
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
				transactionNetwork: payload.network,
				userId: payload.userId,
				fromCurrency: payload.fromCurrency,
				toCurrency: payload.toCurrency,
				fromWalletAddress: payload.fromWalletAddress,
				toWalletAddress: payload.toWalletAddress,
				toWallet: payload.toWallet,
				conversionRate: 1,
				fromAmount: payload.fromAmount,
				toAmount: payload.fromAmount,
				type: TransactionType.DEPOSIT,
				timestamp: new Date().toISOString(),
				status: TransactionStatus.PENDING,
				transactionWalletType: TransactionWalletType.EXTERNAL,
			};

			const wallet: UserWallet | any = wallets.find(
				(wallet) =>
					wallet.currency === payload.toCurrency && wallet.walletType === WalletType.MAIN
			);
			// updates wallet balance
			// this step would be handled by a webhook call to update transaction status and possibly wallet balance
			if (wallet) {
				const newBalance = wallet.balance + payload.fromAmount;
				await db
					.collection(COLLECTIONS.wallets)
					.doc(wallet.id)
					.update({ balance: newBalance });
				await db.collection(COLLECTIONS.transactions).add(transaction);
			}

			return res.status(HttpStatus.OK).json(
				apiResponseHandler({
					type: ResponseType.SUCCESS,
					message: "Deposit transaction submitted for processing!",
					object: { transaction },
				})
			);
		} catch (error: any) {
			throw new Error(`Error with fund deposit: ${error.message}`);
		}
	}

	public async withdrawFunds({ res, ...payload }: IWithdrawFundsPayload): Promise<Response> {
		try {
			const wallets = await this.walletService.getUserWalletBalance({
				userId: payload.userId,
			});
			if (!wallets) {
				return res.status(HttpStatus.BAD_REQUEST).json(
					apiResponseHandler({
						type: ResponseType.ERROR,
						message: "No existing wallets found",
					})
				);
			}
			const wallet: UserWallet | any = wallets.find(
				(wallet) =>
					wallet.currency === payload.toCurrency && wallet.walletType === WalletType.MAIN
			);
			if (wallet.balance < payload.fromAmount) {
				return res.status(HttpStatus.BAD_REQUEST).json(
					apiResponseHandler({
						type: ResponseType.ERROR,
						message: "Insufficient balance",
					})
				);
			}

			// TODO
			// Check external service availability & requirements
			// Retrieve outgoing funds detail and validate

			const transactionId = uuidv4();

			const transaction: ITransaction = {
				transactionId,
				transactionNetwork: payload.network,
				userId: payload.userId,
				fromCurrency: payload.fromCurrency,
				toCurrency: payload.toCurrency,
				fromWalletAddress: payload.fromWalletAddress,
				toWalletAddress: payload.toWalletAddress,
				conversionRate: 1,
				fromAmount: payload.fromAmount,
				toAmount: payload.fromAmount,
				type: TransactionType.WITHDRAWAL,
				timestamp: new Date().toISOString(),
				status: TransactionStatus.PENDING,
				transactionWalletType: TransactionWalletType.EXTERNAL,
			};

			// updates wallet balance
			// this step would be handled by a webhook call to update transaction status and possibly wallet balance
			if (wallet) {
				const newBalance = wallet.balance - payload.fromAmount;
				await db
					.collection(COLLECTIONS.wallets)
					.doc(wallet.id)
					.update({ balance: newBalance });
				await db.collection(COLLECTIONS.transactions).add(transaction);
			}

			return res.status(HttpStatus.OK).json(
				apiResponseHandler({
					type: ResponseType.SUCCESS,
					message: "Withdrawal transaction submitted for processing!!",
					object: { transaction },
				})
			);
		} catch (error: any) {
			throw new Error(`Error with fund withdrawal: ${error.message}`);
		}
	}

	public async convertFunds({ res, ...payload }: IConvertFundsPayload): Promise<Response> {
		try {
			const wallets = await this.walletService.getUserWalletBalance({
				userId: payload.userId,
			});
			if (!wallets) {
				return res.status(HttpStatus.BAD_REQUEST).json(
					apiResponseHandler({
						type: ResponseType.ERROR,
						message: "No existing wallets found",
					})
				);
			}
			const fromWallet: UserWallet | any = wallets.find(
				(wallet) =>
					wallet.currency === payload.fromCurrency &&
					wallet.walletType === WalletType.MAIN
			);
			if (!fromWallet) {
				return res.status(HttpStatus.BAD_REQUEST).json(
					apiResponseHandler({
						type: ResponseType.ERROR,
						message: `${WalletType.MAIN} wallet not found`,
					})
				);
			}
			if (fromWallet.balance < payload.fromAmount) {
				return res.status(HttpStatus.BAD_REQUEST).json(
					apiResponseHandler({
						type: ResponseType.ERROR,
						message: "Insufficient balance",
					})
				);
			}
			const toWallet: UserWallet | any = wallets.find(
				(wallet) =>
					wallet.currency === payload.toCurrency && wallet.walletType === WalletType.MAIN
			);
			if (!toWallet) {
				return res.status(HttpStatus.BAD_REQUEST).json(
					apiResponseHandler({
						type: ResponseType.ERROR,
						message: `${payload.toWallet} wallet not found for specified ${payload.toCurrency}`,
					})
				);
			}
			// TODO
			// Check external service availability & requirements
			// Retrieve outgoing funds detail and validate
			const currentExchangeRate = 1; // To be determined by rates retrieved from external rates service

			const transactionId = uuidv4();

			const transaction: ITransaction = {
				transactionId,
				userId: payload.userId,
				fromWallet: payload.fromWallet,
				toWallet: payload.toWallet,
				fromCurrency: payload.fromCurrency,
				toCurrency: payload.toCurrency,
				conversionRate: currentExchangeRate,
				fromAmount: payload.fromAmount,
				toAmount: payload.fromAmount,
				type: TransactionType.CONVERT,
				timestamp: new Date().toISOString(),
				status: TransactionStatus.SUCCESS,
				transactionWalletType: TransactionWalletType.INTERNAL,
			};

			const convertedFundsValue = payload.fromAmount * currentExchangeRate;
			const newFromBalance = fromWallet.balance - payload.fromAmount;
			const newToBalance = toWallet.balance + convertedFundsValue;
			await db
				.collection(COLLECTIONS.wallets)
				.doc(fromWallet.id)
				.update({ balance: newFromBalance });
			await db
				.collection(COLLECTIONS.wallets)
				.doc(toWallet.id)
				.update({ balance: newToBalance });
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

	public async transferFunds({ res, ...payload }: ITransferFundsPayload): Promise<Response> {
		try {
			const wallets = await this.walletService.getUserWalletBalance({
				userId: payload.userId,
			});
			if (!wallets) {
				return res.status(HttpStatus.BAD_REQUEST).json(
					apiResponseHandler({
						type: ResponseType.ERROR,
						message: "No existing wallets found",
					})
				);
			}
			const fromWallet: UserWallet | any = wallets.find(
				(wallet) =>
					wallet.currency === payload.fromCurrency &&
					wallet.walletType === WalletType.MAIN
			);
			if (!fromWallet) {
				return res.status(HttpStatus.BAD_REQUEST).json(
					apiResponseHandler({
						type: ResponseType.ERROR,
						message: `${WalletType.MAIN} wallet not found`,
					})
				);
			}
			if (fromWallet.balance < payload.fromAmount) {
				return res.status(HttpStatus.BAD_REQUEST).json(
					apiResponseHandler({
						type: ResponseType.ERROR,
						message: "Insufficient balance",
					})
				);
			}
			const toWallet: UserWallet | any = wallets.find(
				(wallet) =>
					wallet.currency === payload.toCurrency && wallet.walletType === payload.toWallet
			);
			if (!toWallet) {
				return res.status(HttpStatus.BAD_REQUEST).json(
					apiResponseHandler({
						type: ResponseType.ERROR,
						message: `${payload.toWallet} wallet not found for specified ${payload.toCurrency}`,
					})
				);
			}
			// TODO
			// Check external service availability & requirements
			// Retrieve outgoing funds detail and validate

			const transactionId = uuidv4();

			const transaction: ITransaction = {
				transactionId,
				userId: payload.userId,
				fromWallet: payload.fromWallet,
				toWallet: payload.toWallet,
				fromCurrency: payload.fromCurrency,
				toCurrency: payload.toCurrency,
				fromAmount: payload.fromAmount,
				toAmount: payload.fromAmount,
				type: TransactionType.TRANSFER,
				timestamp: new Date().toISOString(),
				status: TransactionStatus.SUCCESS,
				transactionWalletType: TransactionWalletType.INTERNAL,
			};

			const newFromBalance = fromWallet.balance - payload.fromAmount;
			const newToBalance = toWallet.balance + payload.fromAmount;
			await db
				.collection(COLLECTIONS.wallets)
				.doc(fromWallet.id)
				.update({ balance: newFromBalance });
			await db
				.collection(COLLECTIONS.wallets)
				.doc(toWallet.id)
				.update({ balance: newToBalance });
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
				const data = doc.data() as ITransaction;
				data.id = doc.id;
				transactions.push(data);
			});

			return transactions;
		} catch (error: any) {
			throw new Error(`Error with getting user transactions: ${error.message}`);
		}
	}
}
