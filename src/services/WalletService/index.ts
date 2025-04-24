import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";
import {
	IGetWalletResponse,
	IPaginatedResult,
	IPaymentMethodResponse,
	TransactionStatus,
	TransactionType,
	WalletType,
} from "../../config/interfaces";
import Transaction, { ITransaction } from "../../models/Transaction";
import UserWallet, { IUserWallet } from "../../models/UserWallet";
import { CryptoPayClient } from "../../clients/CryptoPayClient";
import UserWalletDepositDetail from "../../models/UserWalletDepositAddress";
import {
	AddressType,
	ErrorName,
	PaymentCategoryName,
	PaymentOperation,
	WalletProvider,
} from "../../config/enums";
import PaymentMethod, { IPaymentMethod } from "../../models/PaymentMethod";
import Provider, { IPaymentProvider } from "../../models/PaymentProvider";
import { WalletProviderFactory } from "../../factories/WalletProviderFactory";
import WalletTypeModel from "../../models/WalletType";
import Currency, { ICurrencyModel } from "../../models/Currency";
import ProviderPaymentMethod from "../../models/ProviderPaymentMethod";
import PaymentCategory, { IPaymentCategory } from "../../models/PaymentCategory";
import { ApplicationError } from "../../config/helpers";
import ExchangeRate, { IExchangeRate } from "../../models/ExchangeRate";
import { ConversionCurrencies } from "../../config/constants";

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
	currencyId: string;
	paymentMethodId: string;
	providerId: string;
	network?: string;
	amount?: number;
}

interface IGetTransactions {
	userId: string;
	page: number;
	limit: number;
}

interface IAsset {
	name: string;
	symbol: string;
	logoUrl: string;
}
export interface ITransactionsHistory {
	id: string;
	userId: string;
	assetLogo: IAsset;
	transactionType: TransactionType;
	amount: number;
	currency: string;
	status: TransactionStatus;
	createdAt: string;
}

interface ITransactionData extends ITransaction {
	assetLogo: IAsset;
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

	private async getTotalConvertedBalance({
		wallets,
	}: {
		wallets: IUserWallet[];
	}): Promise<IGetWalletResponse> {
		const targetCurrencies = ConversionCurrencies; // Use the predefined conversion currencies

		// Create pairs for all wallet currencies against the target currencies
		const walletCurrencyPairs = wallets.flatMap((wallet) =>
			targetCurrencies.map((targetCurrency) => `${wallet.currencySymbol}/${targetCurrency}`)
		);

		const exchangeRates = await ExchangeRate.find({
			pair: { $in: walletCurrencyPairs },
		}).lean();
		const rateMap = exchangeRates.reduce<Record<string, number>>((acc, rate) => {
			acc[rate.pair] = rate.rate;
			return acc;
		}, {});

		const totalBalances: Record<string, number> = {};

		for (const wallet of wallets) {
			const currency = wallet.currencySymbol;
			const balance = wallet.availableBalance;

			for (const targetCurrency of targetCurrencies) {
				const pair = `${currency}/${targetCurrency}`;
				if (rateMap[pair]) {
					if (!totalBalances[targetCurrency]) {
						totalBalances[targetCurrency] = 0;
					}
					totalBalances[targetCurrency] += balance * rateMap[pair];
				}
			}
		}

		const exchangeRateTotalBalances = Object.entries(totalBalances).map(
			([currency, balance]) => ({
				balance,
				currency,
			})
		);

		return {
			wallets,
			exchangeRates: exchangeRates.map((ex) => ({
				pair: ex.pair,
				rate: ex.rate,
			})) as IExchangeRate[],
			exchangeRateTotalBalances,
		};
	}

	private async queryUserWalletBalance({ userId }: IWalletInput): Promise<IUserWallet[]> {
		const existingWallets = await UserWallet.find({ userId })
			.populate({
				path: "currency",
				select: "name symbol logoUrl",
			})
			.lean();

		return existingWallets.map((wallet) => ({
			...wallet,
			availableBalance: parseFloat(wallet.availableBalance.toString()),
			lockedBalance: parseFloat(wallet.lockedBalance.toString()),
			id: (wallet._id as mongoose.Types.ObjectId).toString(),
		}));
	}

	public async getUserWalletBalances({ userId }: IWalletInput): Promise<IUserWallet[]> {
		const existingWallets = await this.queryUserWalletBalance({ userId });
		if (existingWallets.length) {
			return existingWallets;
		}

		// no user wallet, create wallets for user
		await this.createUserWallet({ userId });
		return this.queryUserWalletBalance({ userId });
	}

	public async getUserWalletTypeBalances({
		userId,
		walletTypeName,
	}: IGetWalletTypeInput): Promise<IGetWalletResponse> {
		const wallets = await this.getUserWalletBalances({ userId });
		const walletTypeBalances = wallets.filter(
			(wallet) => wallet.walletTypeName === walletTypeName
		);

		if (!walletTypeBalances.length) {
			const error = new Error("No wallet type balances found");
			error.name = "NotFound";
			throw error;
		}
		return this.getTotalConvertedBalance({ wallets: walletTypeBalances });
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
					currencySymbol:
						currencies.find(
							(curr) =>
								(curr._id as mongoose.Types.ObjectId).toString() ===
								currency._id.toString()
						)?.symbol ?? "",
					availableBalance: mongoose.Types.Decimal128.fromString("0"),
					lockedBalance: mongoose.Types.Decimal128.fromString("0"),
				});
				walletCombinations.push(newWallet);
			});
		});

		return walletCombinations;
	}

	public async getTransactions({
		userId,
		page,
		limit,
	}: IGetTransactions): Promise<IPaginatedResult<ITransactionsHistory>> {
		try {
			const transactions = await Transaction.paginate({ userId }, { page, limit });
			let assetLogo: IAsset[];

			// Get currency logo symbol and url
			if (transactions.totalDocs > 0) {
				const currencies = await Currency.find().select("name symbol logoUrl -_id"); // Get all supported currencies for their logo url

				assetLogo = currencies as unknown as IAsset[];
			}

			// Modified Transaction History Data
			const newDocs = transactions.docs.map((doc) => {
				const transaction = doc.toObject(); // Convert to plain object

				return {
					id: transaction._id,
					userId: transaction.userId,
					amount: transaction.amount,
					currency: transaction.currencyName,
					transactionType: transaction.transactionType,
					status: transaction.status,
					createdAt: transaction.createdAt,
					assetLogo: assetLogo.find((asset) => asset.symbol === transaction.currencyName),
				};
			}) as ITransactionsHistory[];

			const recentTransactionsData = {
				...transactions,
				docs: newDocs,
			};

			return recentTransactionsData as IPaginatedResult<ITransactionsHistory>;
		} catch (error: any) {
			throw new Error(`Error with getting transactions: ${error.message}`);
		}
	}

	public async getTransaction({
		transactionId,
		userId,
	}: {
		transactionId: string;
		userId: string;
	}): Promise<ITransactionData> {
		try {
			const transaction = await Transaction.findOne({ _id: transactionId, userId });
			let assetLogo: IAsset = { name: "", symbol: "", logoUrl: "" };

			// Get currency logo symbol and url
			if (transaction) {
				const currencies = (await Currency.find().select(
					"name symbol logoUrl -_id"
				)) as unknown as IAsset[];

				const asset = currencies.find(
					(cur: IAsset) => cur.symbol === transaction.currencyName
				);

				// Only resets assetLogo if matching asset is found
				if (asset) {
					assetLogo = asset;
				}
			}
			const transactionData = {
				...(transaction?.toObject() as ITransaction),
				assetLogo,
			} as unknown as ITransactionData;

			return transactionData;
		} catch (error: any) {
			throw new Error(`Error with getting transactions: ${error.message}`);
		}
	}

	public async initiateDeposit({
		userId,
		currencyId,
		paymentMethodId,
		providerId,
		network,
		amount,
	}: IInitiateDepositInput) {
		const [paymentMethod, provider, providerPaymentMethod, currency] = await Promise.all([
			PaymentMethod.findOne({ _id: paymentMethodId }).populate({
				path: "category",
				select: "name",
			}),
			Provider.findOne({ _id: providerId }),
			ProviderPaymentMethod.findOne({ paymentMethod: paymentMethodId, provider: providerId }),
			Currency.findOne({ _id: currencyId }),
		]);

		if (!paymentMethod) {
			throw ApplicationError({
				name: ErrorName.VALIDATION,
				message: "Payment method not found",
			});
		}

		if (!provider) {
			throw ApplicationError({
				name: ErrorName.VALIDATION,
				message: "No default provider found for this payment method",
			});
		}

		if (!currency) {
			throw ApplicationError({
				name: ErrorName.VALIDATION,
				message: "Currency not found or supported",
			});
		}

		// check if network is passed and validate it against the networks supported by the provider payment method
		if (
			network &&
			!providerPaymentMethod?.supportedNetworks?.some((sn) => sn.slug === network)
		) {
			throw ApplicationError({
				name: ErrorName.VALIDATION,
				message: "The network passed is not supported",
			});
		}

		const providerInstance = WalletProviderFactory.createProvider(
			provider.name as WalletProvider
		);

		// check if currency and paymentMethodName match
		if (paymentMethod.symbol.toLowerCase() === currency.symbol.toLowerCase()) {
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
				currency: currency.symbol,
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
			currency: currency.symbol,
			payCurrency: paymentMethod.symbol,
			addressType: AddressType.DYNAMIC,
			network,
			amount,
			customId: uuidv4(),
		});
	}

	public async getWalletSupportedCurrencies(): Promise<ICurrencyModel[]> {
		try {
			const supportedCurrencies = await Currency.find({});
			return supportedCurrencies;
		} catch (error: any) {
			throw new Error(`Error with getting transactions: ${error.message}`);
		}
	}

	// public async withdrawFunds(
	// 	userId: string,
	// 	currency: string,
	// 	amount: number,
	// 	paymentMethodName: string
	// ) {
	// 	const paymentMethod = await PaymentMethod.findOne({ name: paymentMethodName });
	// 	if (!paymentMethod) {
	// 		throw new Error("Payment method not found");
	// 	}

	// 	const provider = await Provider.findOne({
	// 		paymentMethods: paymentMethod._id,
	// 		default: true,
	// 	});
	// 	if (!provider) {
	// 		throw new Error("No default provider found for this payment method");
	// 	}

	// 	// const providerInstance = WalletProviderFactory.createProvider(provider.name as WalletProvider);
	// 	// await providerInstance.processWithdrawal(userId, currency, amount);

	// 	const transaction = new Transaction({
	// 		transactionId: uuidv4(),
	// 		userId,
	// 		currency,
	// 		amount,
	// 		paymentMethod: paymentMethodName,
	// 		provider: provider.name,
	// 		status: "completed",
	// 	});

	// 	await transaction.save();
	// }
}
