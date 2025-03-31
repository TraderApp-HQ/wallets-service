import mongoose from "mongoose";
import { WalletService } from "./";
import UserWallet from "../../models/UserWallet";
import { WalletType } from "../../config/interfaces";
import { getSecrets, IWalletsServiceSecrets, SecretLocation } from "../../config/secrets";
import { ENVIRONMENTS } from "../../config/constants";
import "dotenv/config";
import { PaymentCategoryName, PaymentOperation } from "../../config/enums";

// Increase Jest timeout for all tests in this file
jest.setTimeout(90000); // 90 seconds

describe("Wallet Service Tests", () => {
	let walletService: WalletService;
	const testUserId = `test-user-12345`;
	const deleteIds = [testUserId];

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
			const walletsServiceSecrets = await getSecrets<IWalletsServiceSecrets>(
				`${SecretLocation.walletsServiceSecrets}/${suffix}`
			);
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
	});

	afterAll(async () => {
		// Clean up test data - batch delete all test users
		await UserWallet.deleteMany({
			userId: { $in: deleteIds },
		});

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

		test("should retrieve payment methods for a category", async () => {
			const paymentMethods = await walletService.getWalletPaymentCategoryPaymentMethods({
				category: PaymentCategoryName.CRYPTO,
				operation: PaymentOperation.DEPOSIT,
			});

			expect(paymentMethods).toBeDefined();
			expect(Array.isArray(paymentMethods)).toBe(true);

			if (paymentMethods.length > 0) {
				const method = paymentMethods[0];
				expect(method.paymentMethodId).toBeDefined();
				expect(method.paymentMethodName).toBeDefined();
				expect(method.categoryName).toBeDefined();
				expect(method.providerId).toBeDefined();
				expect(method.providerName).toBeDefined();
			}
		});
	});
});
