import { v4 as uuidv4 } from "uuid";
import mongoose, { MergeType } from "mongoose";
import {
	IGetWalletResponse,
	IPaginatedResult,
	IPaymentMethodResponse,
	TransactionSource,
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
	CurrencyCategory,
	ErrorName,
	NotificationChannel,
	PaymentCategoryName,
	PaymentOperation,
	WalletProvider,
} from "../../config/enums";
import PaymentMethod, { IPaymentMethod } from "../../models/PaymentMethod";
import Provider, { IPaymentProvider } from "../../models/PaymentProvider";
import { WalletProviderFactory } from "../../factories/WalletProviderFactory";
import WalletTypeModel from "../../models/WalletType";
import Currency, { ICurrencyModel } from "../../models/Currency";
import ProviderPaymentMethod, { IProviderPaymentMethod } from "../../models/ProviderPaymentMethod";
import PaymentCategory, { IPaymentCategory } from "../../models/PaymentCategory";
import { ApplicationError } from "../../config/helpers";
import ExchangeRate, { IExchangeRate } from "../../models/ExchangeRate";
import { ExchangeRateClient } from "../../clients/ExchangeRateClient";
import { FeatureFlagManager } from "../../clients/SplitIOClient";
import {
	MAX_OTP_ATTEMPTS,
	OTP_DEFAULT_CODE,
	OTP_EXPIRES,
	OTP_RATE_LIMIT_EXPIRES,
	WITHDRAWAL_FEES,
	WITHDRAWAL_LIMIT,
	WITHDRAWAL_REQUEST_STATUSES,
	WITHDRAWAL_REQUEST_TTL_SECONDS,
} from "../../config/constants";
import OtpRateLimit from "../../models/OtpRateLimit";
import { generateOTP } from "../../utils/otp";
import OneTimePassword from "../../models/OneTimePassword";
import { publishMessageToQueue } from "../../clients/SQSClient/helpers";
import WithdrawalRequest from "../../models/WithdrawalRequest";
import { roundTo } from "../../utils";

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
	userId: string;
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

interface IInitiateWithdrawalInput {
	userId: string;
	currencyId: string;
	paymentMethodId: string;
	providerId: string;
	network: string;
	amount: number;
	amountToReceive: number;
	destinationAddress: string;
	userEmail: string;
	firstName: string;
	processingFee: number;
	networkFee: number;
}

interface ICompleteWithdrawalInput {
	userId: string;
	otp: string;
	withdrawalRequestId: string;
}
interface IValidateWithdrawalEntitiesArgs {
	paymentMethod:
		| MergeType<IPaymentMethod, { category: { name: string } }>
		| IPaymentMethod
		| null;
	provider: IPaymentProvider | null;
	currency: ICurrencyModel | null;
	userWallet: IUserWallet | null;
	providerPaymentMethod: IProviderPaymentMethod | null;
	network: string;
}

interface IProviderPaymentMethodLean {
	_id: mongoose.Types.ObjectId;
	symbol: string;
	supportedNetworks?: IProviderPaymentMethod["supportedNetworks"];
}

interface ISupportedNetworkUpdateOperation {
	updateOne: {
		filter: { _id: mongoose.Types.ObjectId };
		update: { $set: { supportedNetworks: IProviderPaymentMethod["supportedNetworks"] } };
	};
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
		const supportedCurrencies = await this.getWalletSupportedCurrencies({
			category: CurrencyCategory.FIAT,
		});
		const targetCurrencies = supportedCurrencies.map((currency) => currency.symbol); // Use the predefined conversion currencies

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

	private validateWithdrawalEntities({
		paymentMethod,
		provider,
		currency,
		userWallet,
		providerPaymentMethod,
		network,
	}: IValidateWithdrawalEntitiesArgs) {
		if (!paymentMethod) {
			throw ApplicationError({
				name: ErrorName.VALIDATION,
				message: "Payment method not found",
			});
		}

		if (!provider)
			throw ApplicationError({ name: ErrorName.VALIDATION, message: "Provider not found" });
		if (!currency)
			throw ApplicationError({ name: ErrorName.VALIDATION, message: "Currency not found" });
		if (!userWallet)
			throw ApplicationError({
				name: ErrorName.VALIDATION,
				message: "User wallet not found for this currency",
			});
		if (!providerPaymentMethod) {
			throw ApplicationError({
				name: ErrorName.VALIDATION,
				message: "Provider payment method not found",
			});
		}
		if (!network) {
			throw ApplicationError({ name: ErrorName.VALIDATION, message: "Network not found" });
		}
		if (!providerPaymentMethod.supportedNetworks?.some((sn) => sn.slug === network)) {
			throw ApplicationError({
				name: ErrorName.VALIDATION,
				message: "Network not supported for withdrawal",
			});
		}
		return { paymentMethod, provider, currency, userWallet, providerPaymentMethod, network };
	}

	private async validateWithdrawalAmount(
		currencySymbol: string,
		amount: number,
		amountToReceive: number,
		availableBalance: number
	) {
		const min =
			(WITHDRAWAL_LIMIT.MINIMUM_AMOUNTS as Record<string, number>)[currencySymbol] ?? 6;
		const max =
			(WITHDRAWAL_LIMIT.MAXIMUM_AMOUNTS as Record<string, number>)[currencySymbol] ?? 50000;

		if (amountToReceive < min) {
			throw ApplicationError({
				name: ErrorName.VALIDATION,
				message: `Amount is below the minimum withdrawal of ${min} ${currencySymbol}`,
			});
		}

		if (amountToReceive > max) {
			throw ApplicationError({
				name: ErrorName.VALIDATION,
				message: `Maximum withdrawal amount is ${max} ${currencySymbol}`,
			});
		}

		if (amount > availableBalance) {
			throw ApplicationError({
				name: ErrorName.VALIDATION,
				message: "Insufficient funds for withdrawal",
			});
		}
	}

	private async sendOTP({
		userId,
		withdrawalRequestId,
		amount,
		currencySymbol,
		recipientEmail,
		recipientFirstName,
	}: {
		userId: string;
		withdrawalRequestId: string;
		amount: number;
		currencySymbol: string;
		recipientEmail: string;
		recipientFirstName: string;
	}) {
		const featureFlags = new FeatureFlagManager();
		const isEnabled = await featureFlags.checkToggleFlag("release-send-otp", userId);
		if (!isEnabled) return;

		const rateLimit = await OtpRateLimit.findOneAndUpdate(
			{ _id: userId, channel: NotificationChannel.EMAIL },
			{ $inc: { attempts: 1 } },
			{ upsert: true, new: true }
		);

		if (
			rateLimit.attempts > MAX_OTP_ATTEMPTS &&
			Date.now() - rateLimit.rateLimitStart.getTime() < OTP_RATE_LIMIT_EXPIRES * 1000
		) {
			throw ApplicationError({
				name: ErrorName.VALIDATION,
				message: "Maximum OTP requests exceeded. Try again later.",
			});
		}

		if (Date.now() - rateLimit.rateLimitStart.getTime() >= OTP_RATE_LIMIT_EXPIRES * 1000) {
			await OtpRateLimit.updateOne(
				{ _id: userId, channel: NotificationChannel.EMAIL },
				{ $set: { attempts: 1, rateLimitStart: new Date() } }
			);
		}

		const otp = generateOTP(6);

		await OneTimePassword.updateOne(
			{ _id: userId, channel: NotificationChannel.EMAIL, context: "WITHDRAWAL" },
			{ otp, withdrawalRequestId, createdAt: new Date() },
			{ upsert: true }
		);

		const queueUrl = process.env.EMAIL_OTP_QUEUE ?? "";
		if (!queueUrl) {
			console.error("EMAIL_OTP_QUEUE environment variable is not configured.");
			throw ApplicationError({
				name: ErrorName.INTERNAL_ERROR,
				message: "Unable to send OTP. Please try again later or contact support.",
			});
		}

		const message = {
			recipients: [{ emailAddress: recipientEmail, firstName: recipientFirstName }],
			message: otp,
			event: "OTP",
			amount,
			currency: currencySymbol,
		};

		await publishMessageToQueue({ message, queueUrl });
	}

	private async sendWithdrawalOTP({
		userId,
		withdrawalRequestId,
		amount,
		currencySymbol,
		recipientEmail,
		recipientFirstName,
	}: {
		userId: string;
		withdrawalRequestId: string;
		amount: number;
		currencySymbol: string;
		recipientEmail: string;
		recipientFirstName: string;
	}) {
		await this.sendOTP({
			userId,
			withdrawalRequestId,
			amount,
			currencySymbol,
			recipientEmail,
			recipientFirstName,
		});
	}

	private async verifyWithdrawalOTP({
		userId,
		otp,
		withdrawalRequestId,
	}: {
		userId: string;
		otp: string;
		withdrawalRequestId: string;
	}) {
		const featureFlags = new FeatureFlagManager();
		const isEnabled = await featureFlags.checkToggleFlag("release-send-otp", userId);

		if (!isEnabled) {
			if (otp !== OTP_DEFAULT_CODE) {
				throw ApplicationError({ name: ErrorName.VALIDATION, message: "Invalid OTP" });
			}
			return;
		}

		// Atomically verify-and-consume the OTP
		const record = await OneTimePassword.findOneAndDelete({
			_id: userId,
			channel: NotificationChannel.EMAIL,
			context: "WITHDRAWAL",
			withdrawalRequestId,
			otp, // ensure the exact OTP matches
			createdAt: { $gte: new Date(Date.now() - OTP_EXPIRES * 1000) },
		});

		if (!record) {
			throw ApplicationError({
				name: ErrorName.VALIDATION,
				message: "Invalid or expired OTP",
			});
		}

		// best-effort cleanup for rate limit doc
		await OtpRateLimit.deleteOne({ _id: userId, channel: NotificationChannel.EMAIL });
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

	private computeProcessingFee(amount: number, rate: number, minFee: number) {
		if (!Number.isFinite(amount) || amount <= 0) {
			throw new Error("Amount must be a finite positive number");
		}

		const fee = Math.max(rate * amount, minFee);
		return roundTo(fee);
	}

	private computeNetAmount(amount: number, networkFee: number, processingFee: number) {
		const net = amount - networkFee - processingFee;
		return roundTo(net);
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
		userId,
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
					fees: sn.fees,
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

		// Add feature flag
		const featureFlags = new FeatureFlagManager();
		const isMultiCryptoPaymentMethodEnabled = await featureFlags.checkToggleFlag(
			"release-multi-crypto-payment-methods",
			userId
		);

		if (!isMultiCryptoPaymentMethodEnabled && category === PaymentCategoryName.CRYPTO) {
			return filteredResults.filter((item) => item.symbol === "USDT");
		}

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
		const currencies = await Currency.find({
			_id: { $in: currencyIdsArray },
			category: CurrencyCategory.CRYPTO, // Ensure only crypto supported currencies are fetched
		});

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
			const transactions = await Transaction.paginate(
				{ userId },
				// Sort transactions by creation date in descending order to show the most recent first
				{ page, limit, sort: { createdAt: -1 } }
			);
			let assetLogo: IAsset[];

			// Get currency logo symbol and url
			if (transactions.totalDocs > 0) {
				const currencies = await Currency.find({
					category: CurrencyCategory.CRYPTO,
				}).select("name symbol logoUrl -_id"); // Get all crypto supported currencies for their logo url

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
				const currencies = (await Currency.find({
					category: CurrencyCategory.CRYPTO,
				}).select("name symbol logoUrl -_id")) as unknown as IAsset[];

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

	public async getWalletSupportedCurrencies({
		category,
	}: {
		category: CurrencyCategory;
	}): Promise<ICurrencyModel[]> {
		try {
			const supportedCurrencies = await Currency.find({ category });
			return supportedCurrencies;
		} catch (error: any) {
			throw new Error(`Error with getting transactions: ${error.message}`);
		}
	}

	public async updateCurrenciesExchangeRateInDB() {
		const exchangeRateClient = new ExchangeRateClient();

		try {
			// Get exchange rates and supported currencies
			const [exchangeRates, supportedCurrencies] = await Promise.all([
				exchangeRateClient.getExchangeRates(),
				this.getWalletSupportedCurrencies({
					category: CurrencyCategory.FIAT,
				}),
			]);

			const bulkExchangeRateUpdate = supportedCurrencies.map((currency) => {
				const pair = `USDT/${currency.symbol}`;
				const rate = exchangeRates[currency.symbol];
				return {
					updateOne: {
						filter: { pair },
						update: {
							$set: { rate },
						},
					},
				};
			});

			// Update exchange rate record
			await ExchangeRate.bulkWrite(bulkExchangeRateUpdate);
		} catch (err) {
			console.log("Error updating currency exchange rates - ", err);
		}
	}

	public async updateNetworkFeesInDB(provider: WalletProvider) {
		try {
			const providerInstance = WalletProviderFactory.createProvider(provider);
			const networkFeesByCurrency = await providerInstance.getNetworkFeesByCurrency();
			if (!networkFeesByCurrency)
				throw new Error(`${provider} Provider returned no fee data`);

			const symbols = Object.keys(networkFeesByCurrency);
			if (!symbols.length) return;

			const providerPaymentMethods = await ProviderPaymentMethod.find({
				providerName: provider,
				symbol: { $in: symbols },
			})
				.select("symbol supportedNetworks")
				.lean<IProviderPaymentMethodLean[]>();

			if (!providerPaymentMethods.length) return;

			const operations = providerPaymentMethods.reduce<ISupportedNetworkUpdateOperation[]>(
				(acc, providerPaymentMethod) => {
					const feesData = networkFeesByCurrency[providerPaymentMethod.symbol];
					if (!feesData || !providerPaymentMethod.supportedNetworks?.length) return acc;

					const updatedNetworks = providerPaymentMethod.supportedNetworks.map(
						(network) => ({
							...network,
							fees: feesData.fees[network.slug] || {},
						})
					);

					acc.push({
						updateOne: {
							filter: { _id: providerPaymentMethod._id },
							update: { $set: { supportedNetworks: updatedNetworks } },
						},
					});
					return acc;
				},
				[]
			);

			if (!operations.length) return;
			await ProviderPaymentMethod.bulkWrite(operations);
		} catch (error) {
			console.error(`Failed to update ${provider} network fees`, error);
		}
	}

	public async initiateWithdrawalRequest({
		userId,
		currencyId,
		paymentMethodId,
		providerId,
		network,
		amount,
		amountToReceive,
		userEmail,
		firstName,
		destinationAddress,
		processingFee,
		networkFee,
	}: IInitiateWithdrawalInput) {
		const [paymentMethod, provider, currency, userWallet, providerPaymentMethod] =
			await Promise.all([
				PaymentMethod.findOne({ _id: paymentMethodId }),
				Provider.findOne({ _id: providerId }),
				Currency.findOne({ _id: currencyId }),
				UserWallet.findOne({ userId, currency: currencyId }),
				ProviderPaymentMethod.findOne({
					paymentMethod: paymentMethodId,
					provider: providerId,
					isWithdrawalSupported: true,
				}),
			]);
		const { currency: validatedCurrency, userWallet: validatedUserWallet } =
			this.validateWithdrawalEntities({
				paymentMethod,
				provider,
				currency,
				userWallet,
				providerPaymentMethod,
				network,
			});

		await this.validateWithdrawalAmount(
			validatedCurrency.symbol,
			amount,
			amountToReceive,
			validatedUserWallet.availableBalance
		);

		// TODO: Basic destination address check. Replace/extend with appropriate implementation/library
		if (!destinationAddress || destinationAddress.length < 10) {
			throw ApplicationError({
				name: ErrorName.VALIDATION,
				message: "Invalid destination address",
			});
		}

		const withdrawalRequestId = uuidv4();

		await WithdrawalRequest.create({
			_id: withdrawalRequestId,
			withdrawalRequestId,
			userId,
			currencyId,
			paymentMethodId,
			providerId,
			network,
			amount,
			amountToReceive,
			destinationAddress,
			status: WITHDRAWAL_REQUEST_STATUSES.INITIATED,
			expiresAt: new Date(Date.now() + WITHDRAWAL_REQUEST_TTL_SECONDS * 1000),
			processingFee,
			networkFee,
		});

		await this.sendWithdrawalOTP({
			userId,
			withdrawalRequestId,
			amount,
			currencySymbol: validatedCurrency.symbol,
			recipientEmail: userEmail,
			recipientFirstName: firstName,
		});

		return {
			withdrawalRequestId,
			expiresInSec: OTP_EXPIRES,
			status: WITHDRAWAL_REQUEST_STATUSES.INITIATED,
		};
	}

	public async completeWithdrawal({
		userId,
		otp,
		withdrawalRequestId,
	}: ICompleteWithdrawalInput) {
		const request = await WithdrawalRequest.findOne({
			_id: withdrawalRequestId,
			userId,
			status: WITHDRAWAL_REQUEST_STATUSES.INITIATED,
			expiresAt: { $gt: new Date() },
		});

		if (!request) {
			throw ApplicationError({
				name: ErrorName.VALIDATION,
				message:
					"Withdrawal request is invalid or expired. Please initiate a new withdrawal.",
			});
		}

		await this.verifyWithdrawalOTP({ userId, otp, withdrawalRequestId });

		// Update the withdrawal request status to SUBMITTING after OTP verification
		await WithdrawalRequest.findOneAndUpdate(
			{
				_id: withdrawalRequestId,
				userId,
				status: WITHDRAWAL_REQUEST_STATUSES.INITIATED,
				expiresAt: { $gt: new Date() },
			},
			{ $set: { status: WITHDRAWAL_REQUEST_STATUSES.SUBMITTING } },
			{ new: true }
		);

		const [paymentMethod, provider, currency, userWallet, providerPaymentMethod] =
			await Promise.all([
				PaymentMethod.findOne({ _id: request.paymentMethodId }).populate<{
					category: { name: string };
				}>({
					path: "category",
					select: "name",
				}),
				Provider.findOne({ _id: request.providerId }),
				Currency.findOne({ _id: request.currencyId }),
				UserWallet.findOne({ userId, currency: request.currencyId }),
				ProviderPaymentMethod.findOne({
					paymentMethod: request.paymentMethodId,
					provider: request.providerId,
					isWithdrawalSupported: true,
				}),
			]);

		const {
			currency: validatedCurrency,
			userWallet: validatedUserWallet,
			paymentMethod: validatedPaymentMethod,
			provider: validatedProvider,
		} = this.validateWithdrawalEntities({
			paymentMethod,
			provider,
			currency,
			userWallet,
			providerPaymentMethod,
			network: request.network,
		});

		await this.validateWithdrawalAmount(
			validatedCurrency.symbol,
			request.amount,
			request.amountToReceive,
			validatedUserWallet?.availableBalance
		);

		const session = await mongoose.startSession();
		let transaction: ITransaction;

		try {
			transaction = await session.withTransaction<ITransaction>(async () => {
				// Conditional debit to avoid race conditions
				const debitRes = await UserWallet.updateOne(
					{ _id: validatedUserWallet._id, availableBalance: { $gte: request.amount } },
					{ $inc: { availableBalance: -request.amount } },
					{ session }
				);
				if (debitRes.modifiedCount === 0) {
					throw ApplicationError({
						name: ErrorName.VALIDATION,
						message: "Insufficient funds for withdrawal",
					});
				}

				const [doc] = await Transaction.create(
					[
						{
							userId,
							currencyName: validatedCurrency.symbol,
							amount: request.amountToReceive,
							transactionType: TransactionType.WITHDRAWAL,
							toWalletAddress: request.destinationAddress,
							status: TransactionStatus.PENDING,
							transactionSource: TransactionSource.EXTERNAL,
							paymentCategoryName: (
								validatedPaymentMethod.category as { name: string }
							).name,
							paymentMethodName: validatedPaymentMethod.symbol,
							paymentProviderName: validatedProvider.name,
							transactionNetwork: request.network ?? "",
							externalTransactionId: "PENDING",
							processingFee: request.processingFee,
						},
					],
					{ session }
				);
				return doc;
			});
		} finally {
			session.endSession();
		}

		try {
			const providerInstance = WalletProviderFactory.createProvider(validatedProvider.name);

			const withdrawalResult = await providerInstance.processWithdrawal({
				userId,
				currency: validatedCurrency.symbol,
				// Use amountToReceive here to ensure the provider processes the net amount after fees, not the original requested amount.
				amount: request.amountToReceive,
				destinationAddress: request.destinationAddress,
				network: request.network ?? "",
				customId: transaction.id,
			});

			const updateSession = await mongoose.startSession();
			try {
				await updateSession.withTransaction(async () => {
					await Transaction.findByIdAndUpdate(
						transaction._id,
						{
							$set: {
								externalTransactionId: withdrawalResult.externalId,
								transactionHash: withdrawalResult.transactionHash ?? "",
								providerFee: withdrawalResult.providerFee,
								networkFee: withdrawalResult.networkFee,
							},
						},
						{ session: updateSession }
					);

					await WithdrawalRequest.findByIdAndUpdate(
						request._id,
						{
							$set: {
								status: WITHDRAWAL_REQUEST_STATUSES.SUBMITTED,
								transactionId: transaction.id,
							},
							$unset: { expiresAt: "" }, // prevent TTL deletion of submitted request
						},
						{ session: updateSession }
					);
				});
			} finally {
				updateSession.endSession();
			}

			return {
				transactionId: transaction.id,
				status: TransactionStatus.PENDING,
				externalTransactionId: withdrawalResult.externalId,
				withdrawalRequestStatus: WITHDRAWAL_REQUEST_STATUSES.SUBMITTED,
			};
		} catch (error: any) {
			// Provider call failed - mark transaction as failed and return funds
			const revertSession = await mongoose.startSession();
			try {
				await revertSession.withTransaction(async () => {
					await Transaction.findByIdAndUpdate(
						transaction._id,
						{
							$set: {
								status: TransactionStatus.FAILED,
								externalTransactionId: "ERROR",
							},
						},
						{ session: revertSession }
					);

					await UserWallet.findByIdAndUpdate(
						validatedUserWallet._id,
						{
							$inc: { availableBalance: request.amount },
						},
						{ session: revertSession }
					);
				});
			} finally {
				revertSession.endSession();
			}

			throw ApplicationError({
				name: ErrorName.INTERNAL_ERROR,
				message: `Withdrawal processing failed${
					error?.message ? `: ${error.message}` : ""
				}`,
			});
		}
	}

	public async resendWithdrawalOTP({
		userId,
		withdrawalRequestId,
		userEmail,
		firstName,
	}: {
		userId: string;
		withdrawalRequestId: string;
		userEmail: string;
		firstName: string;
	}) {
		// Validate the original request exists and is still initiatable (not expired or submitted)
		const originalRequest = await WithdrawalRequest.findOne({
			_id: withdrawalRequestId,
			userId,
			status: WITHDRAWAL_REQUEST_STATUSES.INITIATED,
			expiresAt: { $gt: new Date() },
		});

		if (!originalRequest) {
			throw ApplicationError({
				name: ErrorName.VALIDATION,
				message:
					"Withdrawal request is invalid or expired. Please initiate a new withdrawal.",
			});
		}

		const currency = await Currency.findById(originalRequest.currencyId);
		if (!currency) {
			throw ApplicationError({
				name: ErrorName.VALIDATION,
				message:
					"Currency associated with withdrawal request not found. Please contact support.",
			});
		}
		const currencySymbol = currency.symbol;

		await this.sendOTP({
			userId,
			withdrawalRequestId,
			amount: originalRequest.amount,
			currencySymbol,
			recipientEmail: userEmail,
			recipientFirstName: firstName,
		});

		return {
			withdrawalRequestId,
			expiresInSec: OTP_EXPIRES,
			status: WITHDRAWAL_REQUEST_STATUSES.INITIATED,
		};
	}

	public async getWithdrawalFeesQuote({
		amount,
		paymentMethodId,
		providerId,
		network,
	}: {
		amount: number;
		paymentMethodId: string;
		providerId: string;
		network: string;
	}): Promise<{
		networkFee: number;
		processingFee: number;
		netAmount: number;
		isValid: boolean;
		reason?: string;
	}> {
		if (!Number.isFinite(amount) || amount <= 0) {
			throw ApplicationError({
				name: ErrorName.VALIDATION,
				message: "Amount must be a valid positive number",
			});
		}

		const providerPaymentMethod = await ProviderPaymentMethod.findOne({
			paymentMethod: paymentMethodId,
			provider: providerId,
		}).lean<IProviderPaymentMethod | null>();

		if (!providerPaymentMethod) {
			throw ApplicationError({
				name: ErrorName.VALIDATION,
				message: "Provider payment method not found",
			});
		}

		const symbol = providerPaymentMethod.symbol;
		const supportedNetwork = providerPaymentMethod.supportedNetworks?.find(
			(sn) => sn.slug === network
		);
		if (!supportedNetwork) {
			throw ApplicationError({
				name: ErrorName.VALIDATION,
				message: "Network not supported for withdrawal",
			});
		}

		// Use average fee only; error if missing/malformed
		const avg = supportedNetwork.fees?.average;
		if (!avg) {
			throw ApplicationError({
				name: ErrorName.VALIDATION,
				message: "Network fee not available",
			});
		}
		const networkFee = parseFloat(avg);
		if (!Number.isFinite(networkFee)) {
			throw ApplicationError({
				name: ErrorName.VALIDATION,
				message: "Network fee is invalid or malformed",
			});
		}

		const processingFee = this.computeProcessingFee(
			amount,
			WITHDRAWAL_FEES.PROCESSING_RATE,
			WITHDRAWAL_FEES.MIN_PROCESSING_FEE
		);

		const netAmount = this.computeNetAmount(amount, networkFee, processingFee);

		const min = (WITHDRAWAL_LIMIT.MINIMUM_AMOUNTS as Record<string, number>)?.[symbol] ?? 6;
		if (netAmount < min) {
			return {
				networkFee,
				processingFee,
				netAmount,
				isValid: false,
				reason: `Amount is below the minimum withdrawal of ${min} ${symbol}`,
			};
		}

		return { networkFee, processingFee, netAmount, isValid: true };
	}
}
