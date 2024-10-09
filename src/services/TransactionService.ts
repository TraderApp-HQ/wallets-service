import { COLLECTIONS } from "../config/constants";
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
import { WalletService } from "./WalletService";
import { v4 as uuidv4 } from "uuid";
import { UserWallet, WalletType } from "../schemas/wallet";
import { ITransactionInput } from "../schemas";
import { AddressService } from "./AddressService";
import { DbService } from "./DbService";

// TODO
// Refactor to accomodate the webhook logic
// to update transaction status from third party API services
// eg. TransactionStatus.PENDING ==> TransactionStatus.SUCCESS or TransactionStatus.FAILED

export class TransactionService {
	constructor(
		private readonly walletService: WalletService,
		private readonly addressService: AddressService,
		private readonly dbService: DbService
	) {}

	public async getTransactions({ userId }: ITransactionInput): Promise<ITransaction[]> {
		try {
			const transactions = await this.dbService.getUserTransactions(userId);

			return transactions ?? [];
		} catch (error: any) {
			throw new Error(`Error with getting transactions: ${error.message}`);
		}
	}

	public async depositFunds(payload: IDepositFundsPayload): Promise<ITransaction> {
		try {
			const {
				network,
				userId,
				fromCurrency,
				toCurrency,
				fromWalletAddress,
				toWalletAddress,
				toWallet,
				fromAmount,
			} = payload;
			// Confirm user has an existing wallet
			const wallets: UserWallet[] | null = await this.walletService.getUserWalletBalance({
				userId,
			});
			if (!wallets) {
				throw new Error("No existing wallets found");
			}

			// TODO
			// Check external service availability & requirements
			// Retrieve incoming funds detail and validate

			const transactionId = uuidv4();

			const transaction: ITransaction = {
				transactionId,
				transactionNetwork: network,
				userId,
				fromCurrency,
				toCurrency,
				fromWalletAddress,
				toWalletAddress,
				toWallet,
				conversionRate: 1,
				fromAmount,
				toAmount: fromAmount,
				type: TransactionType.DEPOSIT,
				timestamp: new Date().toISOString(),
				status: TransactionStatus.PENDING,
				transactionWalletType: TransactionWalletType.EXTERNAL,
			};

			const wallet: UserWallet | any = wallets.find(
				(wallet) => wallet.currency === toCurrency && wallet.walletType === WalletType.MAIN
			);
			// updates wallet balance
			// this step would be handled by a webhook call to update transaction status and possibly wallet balance
			if (!wallet) {
				throw new Error("No wallet with specified currency found");
			} else {
				const newBalance = wallet.balance + fromAmount;
				await db
					.collection(COLLECTIONS.wallets)
					.doc(wallet.id)
					.update({ balance: newBalance });
				await db.collection(COLLECTIONS.transactions).add(transaction);
			}
			return transaction;
		} catch (error: any) {
			throw new Error(`Error with fund deposit: ${error.message}`);
		}
	}

	public async withdrawFunds(payload: IWithdrawFundsPayload): Promise<ITransaction> {
		try {
			const {
				network,
				userId,
				fromCurrency,
				toCurrency,
				fromWalletAddress,
				toWalletAddress,
				fromAmount,
			} = payload;
			const wallets = await this.walletService.getUserWalletBalance({
				userId,
			});
			if (!wallets) {
				throw new Error("No existing wallets found");
			}
			const wallet: UserWallet | any = wallets.find(
				(wallet) => wallet.currency === toCurrency && wallet.walletType === WalletType.MAIN
			);
			if (!wallet) {
				throw new Error("No wallet with specified currency found");
			}
			if (wallet.balance < fromAmount) {
				throw new Error("Insufficient balance");
			}

			// TODO
			// Check external service availability & requirements
			// Retrieve outgoing funds detail and validate

			const transactionId = uuidv4();

			const transaction: ITransaction = {
				transactionId,
				transactionNetwork: network,
				userId,
				fromCurrency,
				toCurrency,
				fromWalletAddress,
				toWalletAddress,
				conversionRate: 1,
				fromAmount,
				toAmount: fromAmount,
				type: TransactionType.WITHDRAWAL,
				timestamp: new Date().toISOString(),
				status: TransactionStatus.PENDING,
				transactionWalletType: TransactionWalletType.EXTERNAL,
			};

			// updates wallet balance
			// this step would be handled by a webhook call to update transaction status and possibly wallet balance

			const newBalance = wallet.balance - fromAmount;
			await db.collection(COLLECTIONS.wallets).doc(wallet.id).update({ balance: newBalance });
			await db.collection(COLLECTIONS.transactions).add(transaction);
			return transaction;
		} catch (error: any) {
			throw new Error(`Error with fund withdrawal: ${error.message}`);
		}
	}

	public async convertFunds(payload: IConvertFundsPayload): Promise<ITransaction> {
		try {
			const { userId, fromCurrency, toCurrency, fromAmount } = payload;
			const wallets = await this.walletService.getUserWalletBalance({
				userId,
			});
			if (!wallets) {
				throw new Error("No existing wallets found");
			}
			const fromWallet: UserWallet | any = wallets.find(
				(wallet) =>
					wallet.currency === fromCurrency && wallet.walletType === WalletType.MAIN
			);
			if (!fromWallet) {
				throw new Error(`${WalletType.MAIN} wallet not found`);
			}
			if (fromWallet.balance < fromAmount) {
				throw new Error("Insufficient balance");
			}
			const toWallet: UserWallet | any = wallets.find(
				(wallet) => wallet.currency === toCurrency && wallet.walletType === WalletType.MAIN
			);
			if (!toWallet) {
				throw new Error(`${toWallet} wallet not found for specified ${toCurrency}`);
			}
			// TODO
			// Check external service availability & requirements
			// Retrieve outgoing funds detail and validate
			const currentExchangeRate = 1; // To be determined by rates retrieved from external rates service

			const transactionId = uuidv4();

			const transaction: ITransaction = {
				transactionId,
				userId,
				fromWallet,
				toWallet,
				fromCurrency,
				toCurrency,
				conversionRate: currentExchangeRate,
				fromAmount,
				toAmount: fromAmount,
				type: TransactionType.CONVERT,
				timestamp: new Date().toISOString(),
				status: TransactionStatus.SUCCESS,
				transactionWalletType: TransactionWalletType.INTERNAL,
			};

			const convertedFundsValue = fromAmount * currentExchangeRate;
			const newFromBalance = fromWallet.balance - fromAmount;
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

			return transaction;
		} catch (error: any) {
			throw new Error(`Error with fund conversion: ${error.message}`);
		}
	}

	public async transferFunds(payload: ITransferFundsPayload): Promise<ITransaction> {
		try {
			const { userId, fromCurrency, toCurrency, fromAmount } = payload;
			const wallets = await this.walletService.getUserWalletBalance({
				userId,
			});
			if (!wallets) {
				throw new Error("No existing wallets found");
			}
			const fromWallet: UserWallet | any = wallets.find(
				(wallet) =>
					wallet.currency === fromCurrency && wallet.walletType === WalletType.MAIN
			);
			if (!fromWallet) {
				throw new Error(`${WalletType.MAIN} wallet not found`);
			}
			if (fromWallet.balance < fromAmount) {
				throw new Error("Insufficient balance");
			}
			const toWallet: UserWallet | any = wallets.find(
				(wallet) => wallet.currency === toCurrency && wallet.walletType === WalletType.MAIN
			);
			if (!toWallet) {
				throw new Error(`${toWallet} wallet not found for specified ${toCurrency}`);
			}
			// TODO
			// Check external service availability & requirements
			// Retrieve outgoing funds detail and validate

			const transactionId = uuidv4();

			const transaction: ITransaction = {
				transactionId,
				userId,
				fromWallet,
				toWallet,
				fromCurrency,
				toCurrency,
				fromAmount,
				toAmount: fromAmount,
				type: TransactionType.TRANSFER,
				timestamp: new Date().toISOString(),
				status: TransactionStatus.SUCCESS,
				transactionWalletType: TransactionWalletType.INTERNAL,
			};

			const newFromBalance = fromWallet.balance - fromAmount;
			const newToBalance = toWallet.balance + fromAmount;

			if (fromWallet?.id === toWallet?.id) {
				throw new Error("Funds transfer from and to same wallet is not permitted");
			}
			await db
				.collection(COLLECTIONS.wallets)
				.doc(fromWallet.id)
				.update({ balance: newFromBalance });
			await db
				.collection(COLLECTIONS.wallets)
				.doc(toWallet.id)
				.update({ balance: newToBalance });
			await db.collection(COLLECTIONS.transactions).add(transaction);

			return transaction;
		} catch (error: any) {
			throw new Error(`Error with fund transfer: ${error.message}`);
		}
	}
}
