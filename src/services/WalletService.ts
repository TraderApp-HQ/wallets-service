import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";
import {
	IPaymentMethodResponse,
	// Currency,
	// TransactionStatus,
	// TransactionType,
	// TransactionSource,
	WalletType,
} from "../config/interfaces";
import Transaction from "../models/Transaction";
import UserWallet, { IUserWallet } from "../models/UserWallet";
import { CryptoPayClient } from "../clients/CryptoPayClient";
import UserWalletDepositDetail from "../models/UserWalletDepositAddress";
import {
	AddressType,
	PaymentCategoryName,
	PaymentOperation,
	WalletProvider,
} from "../config/enums";
import PaymentMethod, { IPaymentMethod } from "../models/PaymentMethod";
import Provider, { IPaymentProvider } from "../models/PaymentProvider";
import { WalletProviderFactory } from "../factories/WalletProviderFactory";
import WalletTypeModel from "../models/WalletType";
import Currency from "../models/Currency";
import ProviderPaymentMethod from "../models/ProviderPaymentMethod";
import PaymentCategory, { IPaymentCategory } from "../models/PaymentCategory";

interface IWalletInput {
	userId: string;
}

export interface IGetWalletTypeInput {
	userId: string;
	walletTypeName: WalletType;
}

export interface IGetPaymentMethods {
	category: PaymentCategoryName;
	operation?: PaymentOperation;
}

export interface IInitiateDepositInput {
	userId: string;
	currency: string;
	paymentMethodId: string;
	providerId: string;
	network?: string;
	amount?: number;
}
export class WalletService {
	private readonly cryptoPayClient: CryptoPayClient;

	constructor() {
		this.cryptoPayClient = new CryptoPayClient();
	}

	public async createUserWallet({ userId }: IWalletInput): Promise<IUserWallet[]> {
		const walletCombinations = await this.generateUserWalletCombinations({ userId });
		return UserWallet.insertMany(walletCombinations);
	}

	public async getUserWalletBalances({ userId }: IWalletInput): Promise<IUserWallet[]> {
		const existingWallets = await UserWallet.find({ userId }).lean();
		if (existingWallets.length) return existingWallets;
		return this.createUserWallet({ userId });
	}

	public async getUserWalletTypeBalances({
		userId,
		walletTypeName,
	}: IGetWalletTypeInput): Promise<IUserWallet[]> {
		const wallets = await this.getUserWalletBalances({ userId });
		const walletTypeBalances = wallets.filter(
			(wallet) => wallet.walletTypeName === walletTypeName
		);
		if (!walletTypeBalances.length) {
			const error = new Error("No wallet type balances found");
			error.name = "NotFound";
			throw error;
		}

		return walletTypeBalances;
	}

	public async getWalletPaymentCategories(): Promise<IPaymentCategory[]> {
		return PaymentCategory.find({});
	}

	public async getWalletPaymentCategoryPaymentMethods({
		category,
		operation,
	}: IGetPaymentMethods): Promise<IPaymentMethodResponse[]> {
		// Fetch provider payment methods based on category and filter
		const query: any = {
			categoryName: category,
		};

		if (operation === PaymentOperation.DEPOSIT) {
			query.isDepositSupported = true;
		} else if (operation === PaymentOperation.WITHDRAWAL) {
			query.isWithdrawalSupported = true;
		}

		const providerPaymentMethods = await ProviderPaymentMethod.find(query)
			.populate({
				path: "paymentMethod",
				select: "name symbol logoUrl", // Select the fields you need from PaymentMethod
			})
			.populate({
				path: "provider",
				select: "name", // Select the provider name
			});

		// Map the results to include the required fields
		const results: IPaymentMethodResponse[] = providerPaymentMethods.map((method) => {
			const paymentMethod = method.paymentMethod as unknown as IPaymentMethod;
			const provider = method.provider as unknown as IPaymentProvider;

			return {
				paymentMethodId: (paymentMethod._id as mongoose.Types.ObjectId).toString(),
				paymentMethodName: paymentMethod.name,
				logoUrl: (paymentMethod as any).logoUrl,
				symbol: (paymentMethod as any).symbol,
				categoryId: method.category.toString(),
				categoryName: method.categoryName,
				providerId: (provider._id as mongoose.Types.ObjectId).toString(),
				providerName: provider.name,
				isDepositSupported: method.isDepositSupported,
				isWithdrawalSupported: method.isWithdrawalSupported,
				isDefault: method.isDefault,
				supportNetworks: method.supportedNetworks?.map((sn) => ({
					slug: sn.slug,
					name: sn.name,
					precision: sn.precision,
				})),
			};
		});

		// Filter results to include only default items or the only option for each provider/paymentMethod
		const filteredResults = results.filter(
			(item) =>
				item.isDefault ||
				!results.some(
					(other) =>
						other.providerName === item.providerName &&
						other.paymentMethodName === item.paymentMethodName &&
						other.isDefault
				)
		);

		return filteredResults;
	}

	/**
	 * Generates wallet combinations for a user by creating multiple wallet types.
	 */
	private async generateUserWalletCombinations({ userId }: IWalletInput): Promise<IUserWallet[]> {
		const walletCombinations: IUserWallet[] = [];

		// Fetch wallet types and their supported currencies from the database
		const walletTypes = await WalletTypeModel.find();

		// Collect unique currency IDs
		const uniqueCurrencyIds = new Set<string>();
		walletTypes.forEach((walletType) => {
			walletType.currencies.forEach((currency) => {
				uniqueCurrencyIds.add(currency._id.toString()); // Ensure currency ID is a string
			});
		});
		const currencyIdsArray = Array.from(uniqueCurrencyIds); // Convert Set to Array

		// Fetch all currencies in a single batch request
		const currencies = await Currency.find({ _id: { $in: currencyIdsArray } });

		// Iterate through each wallet type and its supported currencies and create a new wallet for each combination
		walletTypes.forEach((walletType) => {
			walletType.currencies.forEach((currency) => {
				const newWallet = new UserWallet({
					userId,
					walletType: walletType._id as mongoose.Types.ObjectId,
					walletTypeName: walletType.walletTypeName,
					currency: currency._id,
					currencyName:
						currencies.find(
							(curr) =>
								(curr._id as mongoose.Types.ObjectId).toString() ===
								currency._id.toString()
						)?.name ?? "",
					availableBalance: 0.0,
					lockedBalance: 0.0,
				});
				walletCombinations.push(newWallet);
			});
		});

		return walletCombinations;
	}

	public async getTransactions({ userId }: IWalletInput) {
		try {
			const transactions = await Transaction.find({ userId });
			return transactions;
		} catch (error: any) {
			throw new Error(`Error with getting transactions: ${error.message}`);
		}
	}

	public async initiateDeposit({
		userId,
		currency,
		paymentMethodId,
		providerId,
		network,
		amount,
	}: IInitiateDepositInput) {
		const [paymentMethod, provider] = await Promise.all([
			PaymentMethod.findOne({ _id: paymentMethodId }).populate({
				path: "category",
				select: "name",
			}),
			Provider.findOne({ _id: providerId }),
		]);

		if (!paymentMethod) {
			throw new Error("Payment method not found");
		}

		if (!provider) {
			throw new Error("No default provider found for this payment method");
		}

		const providerInstance = WalletProviderFactory.createProvider(
			provider.name as WalletProvider
		);

		// check if currency and paymentMethodName match
		if (paymentMethod.symbol.toLowerCase() === currency.toLowerCase()) {
			// check user wallet deposit details and see if the user already has details for the payment method and provider
			const userDepositAddress = await UserWalletDepositDetail.findOne({
				userId,
				paymentMethod: paymentMethodId,
				provider: providerId,
				network,
			});

			if (userDepositAddress) return userDepositAddress;

			// call provider instance to generate a permanent wallet address
			const depositDetails = await providerInstance.generateDepositDetails({
				userId,
				currency,
				payCurrency: paymentMethod.symbol,
				addressType: AddressType.PERMANENT,
				network,
				customId: uuidv4(),
			});

			// save deposit details
			await UserWalletDepositDetail.create({
				userId,
				paymentMethod: paymentMethod._id,
				provider: provider._id,
				network: depositDetails.network,
				paymentMethodName: paymentMethod.name,
				paymentProviderName: provider.name,
				paymentUrl: depositDetails.paymentUrl,
				paymentCategoryName: (paymentMethod.category as unknown as IPaymentCategory).name,
				walletAddress: depositDetails.walletAddress,
				shouldRedirect: depositDetails.shouldRedirect ?? false,
				customWalletId: depositDetails.customWalletId,
				externalWalletId: depositDetails.id,
			});

			return depositDetails;
		}

		return providerInstance.generateDepositDetails({
			userId,
			currency,
			payCurrency: paymentMethod.symbol,
			addressType: AddressType.DYNAMIC,
			network,
			amount,
		});
	}

	public async withdrawFunds(
		userId: string,
		currency: string,
		amount: number,
		paymentMethodName: string
	) {
		const paymentMethod = await PaymentMethod.findOne({ name: paymentMethodName });
		if (!paymentMethod) {
			throw new Error("Payment method not found");
		}

		const provider = await Provider.findOne({
			paymentMethods: paymentMethod._id,
			default: true,
		});
		if (!provider) {
			throw new Error("No default provider found for this payment method");
		}

		// const providerInstance = WalletProviderFactory.createProvider(provider.name as WalletProvider);
		// await providerInstance.processWithdrawal(userId, currency, amount);

		const transaction = new Transaction({
			transactionId: uuidv4(),
			userId,
			currency,
			amount,
			paymentMethod: paymentMethodName,
			provider: provider.name,
			status: "completed",
		});

		await transaction.save();
	}

	// async getUserWalletDepositDetails({
	// 	userId,
	// 	paymentMethodId,
	// 	providerId,
	// 	network,
	// 	currency,
	// }: {
	// 	userId: string;
	// 	paymentMethodId: string;
	// 	providerId: string;
	// 	network: string;
	// 	currency: string;
	// }) {
	// 	try {
	// 		// Check existing active wallet address
	// 		const existingWallet = await UserWalletDepositDetail.findOne({
	// 			userId,
	// 			paymentMethod: paymentMethodId,
	// 			provider: providerId,
	// 			network,
	// 			isActive: true,
	// 		});

	// 		if (existingWallet) {
	// 			return existingWallet;
	// 		}

	// 		// Generate new address based on type
	// 		// const addressResponse =
	// 		// 	addressType === AddressType.DIRECT
	// 		// 		? await this.cryptoPayClient.generatePermanentAddress(currency, network)
	// 		// 		: await this.cryptoPayClient.generateTemporalAddress(currency, network, 3600); // 1 hour expiry

	// 		// const newWalletDeposit = new UserWalletDepositAddress({
	// 		// 	userId,
	// 		// 	networkName,
	// 		// 	walletAddress: addressResponse.address,
	// 		// 	hostedPageUrl: addressResponse.hostedPageUrl,
	// 		// 	provider: WalletProvider.CRYPTOPAY,
	// 		// 	expiresAt:
	// 		// 		addressType === AddressType.DYNAMIC
	// 		// 			? new Date(Date.now() + 3600000)
	// 		// 			: undefined,
	// 		// });

	// 		// await newWalletDeposit.save();
	// 		// return newWalletDeposit;
	// 	} catch (error: any) {
	// 		throw new Error(`Error getting wallet deposit details: ${error.message}`);
	// 	}
	// }

	// async creditUserWallet(userId: string, currency: Currency, amount: number) {
	// 	try {
	// 		const wallet = await Wallet.findOne({ userId, currency });
	// 		if (!wallet) {
	// 			throw new Error("Wallet not found");
	// 		}

	// 		wallet.balance += amount;
	// 		await wallet.save();
	// 		return wallet;
	// 	} catch (error: any) {
	// 		throw new Error(`Error crediting wallet: ${error.message}`);
	// 	}
	// }

	// async debitUserWallet(userId: string, currency: Currency, amount: number) {
	// 	try {
	// 		const wallet = await Wallet.findOne({ userId, currency });
	// 		if (!wallet) {
	// 			throw new Error("Wallet not found");
	// 		}

	// 		if (wallet.balance < amount) {
	// 			throw new Error("Insufficient balance");
	// 		}

	// 		wallet.balance -= amount;
	// 		await wallet.save();
	// 		return wallet;
	// 	} catch (error: any) {
	// 		throw new Error(`Error debiting wallet: ${error.message}`);
	// 	}
	// }
}
