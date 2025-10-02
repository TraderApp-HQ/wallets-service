import mongoose from "mongoose";
import { WalletService } from "./";
import UserWallet from "../../models/UserWallet";
import { WalletType } from "../../config/interfaces";
import {
	getSecrets,
	ICommonSecrets,
	IWalletsServiceSecrets,
	SecretLocation,
} from "../../config/secrets";
import {
	ENVIRONMENTS,
	OTP_DEFAULT_CODE,
	OTP_EXPIRES,
	WITHDRAWAL_REQUEST_STATUSES,
} from "../../config/constants";
import "dotenv/config";
import { PaymentCategoryName, PaymentOperation } from "../../config/enums";
import PaymentMethod from "../../models/PaymentMethod";
import ProviderPaymentMethod from "../../models/ProviderPaymentMethod";
import Provider from "../../models/PaymentProvider";
import Currency from "../../models/Currency";
import WithdrawalRequest from "../../models/WithdrawalRequest";
import Transaction from "../../models/Transaction";
// Mock feature flags before importing WalletService (must come first)
jest.mock("../../clients/SplitIOClient", () => ({
	FeatureFlagManager: jest.fn().mockImplementation(() => ({
		checkToggleFlag: async () => false, // always disabled -> uses OTP_DEFAULT_CODE & USDT filter
		destroy: () => {},
	})),
}));

jest.mock("../../factories/WalletProviderFactory", () => ({
	WalletProviderFactory: {
		createProvider: () => ({
			generateDepositDetails: jest.fn(),
			processWithdrawal: jest.fn().mockResolvedValue({
				externalId: "mock-external",
				transactionHash: "0xmock",
				status: "sent",
			}),
		}),
	},
}));

// Increase Jest timeout for all tests in this file
jest.setTimeout(90000); // 90 seconds

describe("Wallet Service Tests", () => {
	let walletService: WalletService;
	const testUserId = `test-user-12345`;
	const deleteIds = [testUserId];
	let usdtCurrencyId: string | undefined;
	let usdtPaymentMethodId: string | undefined;
	let providerId: string | undefined;
	let sampleNetwork: string | undefined;

	beforeAll(async () => {
		// Get environment suffix
		const env = process.env.NODE_ENV;
		if (!env) {
			throw new Error("Error: Environment variable not set");
		}
		const suffix = ENVIRONMENTS[env];

		// Get database URL from secrets manager
		try {
			console.log("Retrieving secrets...");
			const [walletsServiceSecrets, commonSecrets] = await Promise.all([
				getSecrets<IWalletsServiceSecrets>(
					`${SecretLocation.walletsServiceSecrets}/${suffix}`
				),
				getSecrets<ICommonSecrets>(`${SecretLocation.commonSecrets}/${suffix}`),
			]);
			process.env.SPLIT_IO_CLIENT_KEY = commonSecrets.SPLIT_IO_CLIENT_KEY;
			console.log("Secrets retrieved successfully.");

			// Connect to MongoDB
			console.log("Connecting to MongoDB for tests...");
			await mongoose.connect(walletsServiceSecrets.WALLET_SERVICE_DB_URL);
			console.log("Connected to MongoDB successfully.");
		} catch (error: any) {
			console.error("Error during setup:", error.message);
			process.exit(1);
		}

		walletService = new WalletService();

		// Prepare reference IDs (USDT assumed seeded)
		const currency = await Currency.findOne({ symbol: "USDT" });
		const paymentMethod = await PaymentMethod.findOne({ symbol: "USDT" });
		const providerPayment = await ProviderPaymentMethod.findOne({
			paymentMethod: paymentMethod?._id,
			isDepositSupported: true,
		});
		const provider = providerPayment
			? await Provider.findById(providerPayment.provider)
			: await Provider.findOne({});

		usdtCurrencyId = currency?._id?.toString();
		usdtPaymentMethodId = paymentMethod?._id?.toString();
		providerId = provider?._id?.toString();
		sampleNetwork = providerPayment?.supportedNetworks?.[0]?.slug;
	});

	afterAll(async () => {
		// Clean up test data - batch delete all test data
		await UserWallet.deleteMany({ userId: { $in: deleteIds } });
		await WithdrawalRequest.deleteMany({ userId: { $in: deleteIds } });
		await Transaction.deleteMany({ userId: { $in: deleteIds } });

		// Disconnect from MongoDB
		await mongoose.connection.close();
		console.log("Disconnected from MongoDB.");
	});

	describe("User Wallet Creation", () => {
		test("should create wallets for a new user", async () => {
			const wallets = await walletService.createUserWallet({ userId: testUserId });

			expect(wallets).toBeDefined();
			expect(Array.isArray(wallets)).toBe(true);
			expect(wallets.length).toBeGreaterThan(0);

			// Check wallet properties
			const wallet = wallets[0];
			expect(wallet.userId).toBe(testUserId);
			expect(wallet.availableBalance).toBe(0);
			expect(wallet.lockedBalance).toBe(0);
			expect(wallet.walletTypeName).toBeDefined();
			expect(wallet.currencyName).toBeDefined();
			expect(wallet.currencySymbol).toBeDefined();
		});
	});

	describe("User Wallet Retrieval", () => {
		test("should retrieve wallets for an existing user and should create and retrieve wallets for a non-existing user", async () => {
			const newUserId = `new-test-user-12345`;
			const [existingUserWallets, newUserWallets] = await Promise.all([
				walletService.getUserWalletBalances({ userId: testUserId }),
				walletService.getUserWalletBalances({ userId: newUserId }),
			]);
			expect(existingUserWallets).toBeDefined();
			expect(Array.isArray(existingUserWallets)).toBe(true);
			expect(existingUserWallets.length).toBeGreaterThan(0);

			// Check wallet properties for existing user
			const wallet = existingUserWallets[0];
			expect(wallet.userId).toBe(testUserId);
			expect(typeof wallet.availableBalance).toBe("number");
			expect(typeof wallet.lockedBalance).toBe("number");

			// check  wallet properties for new user
			expect(newUserWallets).toBeDefined();
			expect(Array.isArray(newUserWallets)).toBe(true);
			expect(newUserWallets.length).toBeGreaterThan(0);

			// Clean up
			// await UserWallet.deleteMany({ userId: newUserId });
			deleteIds.push(newUserId);
		});
	});

	describe("Wallet Type Balances", () => {
		test("should retrieve wallets of a specific type", async () => {
			const walletResponse = await walletService.getUserWalletTypeBalances({
				userId: testUserId,
				walletTypeName: WalletType.MAIN,
			});

			expect(walletResponse).toBeDefined();
			expect(walletResponse.wallets).toBeDefined();
			expect(Array.isArray(walletResponse.wallets)).toBe(true);
			expect(walletResponse.wallets.length).toBeGreaterThan(0);

			// Check that all returned wallets are of the requested type
			walletResponse.wallets.forEach((wallet) => {
				expect(wallet.walletTypeName).toBe(WalletType.MAIN);
			});

			// Check that exchange rates are returned
			expect(walletResponse.exchangeRates).toBeDefined();
			expect(walletResponse.exchangeRateTotalBalances).toBeDefined();
		});
	});

	describe("Payment Methods", () => {
		test("should retrieve payment categories", async () => {
			const categories = await walletService.getWalletPaymentCategories();

			expect(categories).toBeDefined();
			expect(Array.isArray(categories)).toBe(true);
		});

		test("should retrieve (filtered) payment methods for a category", async () => {
			const paymentMethods = await walletService.getWalletPaymentCategoryPaymentMethods({
				category: PaymentCategoryName.CRYPTO,
				operation: PaymentOperation.DEPOSIT,
				userId: testUserId,
			});

			expect(paymentMethods).toBeDefined();
			expect(Array.isArray(paymentMethods)).toBe(true);

			// Feature flag mocked off -> only USDT for CRYPTO should be returned
			if (paymentMethods.length > 0) {
				paymentMethods.forEach((method) => {
					expect(method.paymentMethodId).toBeDefined();
					expect(method.paymentMethodName).toBeDefined();
					expect(method.categoryName).toBeDefined();
					expect(method.providerId).toBeDefined();
					expect(method.providerName).toBeDefined();
					expect(method.symbol).toBe("USDT");
				});
			}
		});
	});

	describe("Withdrawals", () => {
		const withdrawalAmount = 15; // > minimum (10)
		const fees = 5;
		const amountToReceive = withdrawalAmount - fees;
		let withdrawalRequestId: string;

		beforeAll(async () => {
			if (!usdtCurrencyId || !usdtPaymentMethodId || !providerId) {
				console.warn("Skipping withdrawal tests due to missing seeded references.");
				return;
			}
			// Top up user's USDT wallet balance
			await UserWallet.updateOne(
				{ userId: testUserId, currency: usdtCurrencyId },
				{ $inc: { availableBalance: withdrawalAmount * 2 } }
			);
		});

		test("should initiate a withdrawal request", async () => {
			if (!usdtCurrencyId || !usdtPaymentMethodId || !providerId) return;

			const res = await walletService.initiateWithdrawalRequest({
				userId: testUserId,
				currencyId: usdtCurrencyId,
				paymentMethodId: usdtPaymentMethodId,
				providerId,
				network: sampleNetwork,
				amount: withdrawalAmount,
				amountToReceive,
				userEmail: "test@example.com",
				destinationAddress: "TDESTINATIONADDRESS1234567890",
				firstName: "Test",
			});

			expect(res).toBeDefined();
			expect(res.withdrawalRequestId).toBeDefined();
			expect(res.status).toBe("INITIATED");
			withdrawalRequestId = res.withdrawalRequestId;

			const wr = await WithdrawalRequest.findById(withdrawalRequestId);
			expect(wr).toBeTruthy();
			expect(wr?.amount).toBe(withdrawalAmount);
		});

		test("should complete withdrawal", async () => {
			if (!withdrawalRequestId) return;

			// Capture pre-debit balance
			const preWallet = await UserWallet.findOne({
				userId: testUserId,
				currency: usdtCurrencyId,
			}).lean();
			const preBalance = preWallet?.availableBalance ?? 0;

			const result = await walletService.completeWithdrawal({
				userId: testUserId,
				otp: OTP_DEFAULT_CODE,
				withdrawalRequestId,
			});

			expect(result).toBeDefined();
			expect(result.transactionId).toBeDefined();
			expect(result.status).toBe("PENDING");
			expect(result.withdrawalRequestStatus).toBe("SUBMITTED");

			// Capture post-debit balance and assert single debit
			const postWallet = await UserWallet.findOne({
				userId: testUserId,
				currency: usdtCurrencyId,
			}).lean();
			const postBalance = postWallet?.availableBalance ?? 0;
			expect(preBalance - postBalance).toStrictEqual(withdrawalAmount);
		});

		test("should fail to complete withdrawal with invalid OTP", async () => {
			// Need a fresh request because previous one is already submitted
			if (!usdtCurrencyId || !usdtPaymentMethodId || !providerId) return;
			const { withdrawalRequestId: freshId } = await walletService.initiateWithdrawalRequest({
				userId: testUserId,
				currencyId: usdtCurrencyId,
				paymentMethodId: usdtPaymentMethodId,
				providerId,
				network: sampleNetwork,
				amount: withdrawalAmount,
				amountToReceive,
				userEmail: "test@example.com",
				destinationAddress: "TDESTINATIONADDRESS1234567890",
				firstName: "Test",
			});
			await expect(
				walletService.completeWithdrawal({
					userId: testUserId,
					otp: "999999", // wrong
					withdrawalRequestId: freshId,
				})
			).rejects.toThrow(/Invalid OTP|Invalid or expired OTP/i);
		});

		test("should reject withdrawal initiation below minimum amount", async () => {
			if (!usdtCurrencyId || !usdtPaymentMethodId || !providerId) return;
			await expect(
				walletService.initiateWithdrawalRequest({
					userId: testUserId,
					currencyId: usdtCurrencyId,
					paymentMethodId: usdtPaymentMethodId,
					providerId,
					network: sampleNetwork,
					amount: 7, // below min 10
					amountToReceive: 2,
					userEmail: "test@example.com",
					destinationAddress: "TDESTINATIONADDRESS1234567890",
					firstName: "Test",
				})
			).rejects.toThrow(/Minimum withdrawal amount/i);
		});

		test("should reject withdrawal initiation due to insufficient balance", async () => {
			if (!usdtCurrencyId || !usdtPaymentMethodId || !providerId) return;
			const lowUser = "low-balance-user";
			await walletService.getUserWalletBalances({ userId: lowUser }); // creates wallets with 0
			await expect(
				walletService.initiateWithdrawalRequest({
					userId: lowUser,
					currencyId: usdtCurrencyId,
					paymentMethodId: usdtPaymentMethodId,
					providerId,
					network: sampleNetwork,
					amount: 20,
					amountToReceive: 15,
					userEmail: "low@example.com",
					destinationAddress: "TDESTINATIONADDRESS1234567890",
					firstName: "Test",
				})
			).rejects.toThrow(/Insufficient funds for withdrawal/i);
			deleteIds.push(lowUser);
		});

		test("should resend OTP for an active withdrawal", async () => {
			if (!usdtCurrencyId || !usdtPaymentMethodId || !providerId) return;

			// Create initial request
			const init = await walletService.initiateWithdrawalRequest({
				userId: testUserId,
				currencyId: usdtCurrencyId,
				paymentMethodId: usdtPaymentMethodId,
				providerId,
				network: sampleNetwork,
				amount: withdrawalAmount,
				amountToReceive,
				userEmail: "test@example.com",
				destinationAddress: "TDESTINATIONADDRESS1234567890",
				firstName: "Test",
			});

			const originalId = init.withdrawalRequestId;

			const resend = await walletService.resendWithdrawalOTP({
				userId: testUserId,
				withdrawalRequestId: originalId,
				userEmail: "test@example.com",
				firstName: "Test",
			});

			expect(resend).toBeDefined();
			expect(resend.withdrawalRequestId).toBeDefined();
			expect(resend.withdrawalRequestId).toBe(originalId);
			expect(resend.status).toBe(WITHDRAWAL_REQUEST_STATUSES.INITIATED);
			expect(resend.expiresInSec).toBe(OTP_EXPIRES);

			const fresh = await WithdrawalRequest.findById(resend.withdrawalRequestId);
			expect(fresh).toBeTruthy();
			expect(fresh?.status).toBe(WITHDRAWAL_REQUEST_STATUSES.INITIATED);
			expect(fresh?.expiresAt.getTime()).toBeGreaterThan(Date.now());
			expect(fresh?.amount).toBe(withdrawalAmount);
		});

		test("should fail to resend OTP when original request is expired", async () => {
			if (!usdtCurrencyId || !usdtPaymentMethodId || !providerId) return;

			// Create initial request
			const init = await walletService.initiateWithdrawalRequest({
				userId: testUserId,
				currencyId: usdtCurrencyId,
				paymentMethodId: usdtPaymentMethodId,
				providerId,
				network: sampleNetwork,
				amount: withdrawalAmount,
				amountToReceive,
				userEmail: "test@example.com",
				destinationAddress: "TDESTINATIONADDRESS1234567890",
				firstName: "Test",
			});

			// Force-expire it
			await WithdrawalRequest.findByIdAndUpdate(init.withdrawalRequestId, {
				$set: { expiresAt: new Date(Date.now() - 1000) },
			});

			await expect(
				walletService.resendWithdrawalOTP({
					userId: testUserId,
					withdrawalRequestId: init.withdrawalRequestId,
					userEmail: "test@example.com",
					firstName: "Test",
				})
			).rejects.toThrow(/invalid or expired/i);
		});

		test("should fail to resend OTP when original request is already submitted", async () => {
			if (!usdtCurrencyId || !usdtPaymentMethodId || !providerId) return;

			// Create initial request
			const init = await walletService.initiateWithdrawalRequest({
				userId: testUserId,
				currencyId: usdtCurrencyId,
				paymentMethodId: usdtPaymentMethodId,
				providerId,
				network: sampleNetwork,
				amount: withdrawalAmount,
				amountToReceive,
				userEmail: "test@example.com",
				destinationAddress: "TDESTINATIONADDRESS1234567890",
				firstName: "Test",
			});

			// Mark it as SUBMITTED (no longer INITIATED)
			await WithdrawalRequest.findByIdAndUpdate(init.withdrawalRequestId, {
				$set: { status: WITHDRAWAL_REQUEST_STATUSES.SUBMITTED },
			});

			await expect(
				walletService.resendWithdrawalOTP({
					userId: testUserId,
					withdrawalRequestId: init.withdrawalRequestId,
					userEmail: "test@example.com",
					firstName: "Test",
				})
			).rejects.toThrow(/invalid or expired/i);
		});
	});
});
