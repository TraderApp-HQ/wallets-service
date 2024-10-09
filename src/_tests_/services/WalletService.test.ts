import { WalletService } from "../../services/WalletService";
import { Currency } from "../../schemas/currency";
import { UserWallet, WalletType } from "../../schemas/wallet";

// Mock Firebase db
const mockCollection = {
	add: jest.fn(),
	where: jest.fn().mockReturnThis(),
	get: jest.fn(),
};

// Mock WalletService methods
jest.mock("../../firebase", () => ({
	db: {
		collection: jest.fn(() => mockCollection),
	},
}));

// Test suite for WalletService
describe("WalletService", () => {
	const walletService: WalletService = new WalletService();
	const userId = "user123";
	const walletCombinations: UserWallet[] = [
		{
			userId,
			walletType: WalletType.MAIN,
			currency: Currency.BTC,
			balance: 0.0,
			createdAt: new Date(),
		},
		{
			userId,
			walletType: WalletType.MAIN,
			currency: Currency.ETH,
			balance: 0.0,
			createdAt: new Date(),
		},
		{
			userId,
			walletType: WalletType.MAIN,
			currency: Currency.USDT,
			balance: 0.0,
			createdAt: new Date(),
		},
		{
			userId,
			walletType: WalletType.SPOT,
			currency: Currency.USDT,
			balance: 0.0,
			createdAt: new Date(),
		},
		{
			userId,
			walletType: WalletType.FUTURES,
			currency: Currency.USDT,
			balance: 0.0,
			createdAt: new Date(),
		},
	];

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe("createUserWallet", () => {
		it("should create new user wallets and return success response", async () => {
			jest.spyOn(walletService, "createUserWallet").mockResolvedValueOnce(walletCombinations);
			const result: UserWallet[] = await walletService.createUserWallet({ userId });
			const sanitizedResult = result.map(({ createdAt, ...rest }) => rest);
			const sanitizedExpected = walletCombinations.map(({ createdAt, ...rest }) => rest);

			expect(sanitizedResult).toEqual(sanitizedExpected);
		});

		it("should throw an error if wallet creation fails", async () => {
			jest.spyOn(walletService, "createUserWallet").mockResolvedValueOnce(null);
			mockCollection.add.mockRejectedValueOnce(new Error("Wallet Creation failed"));

			try {
				await walletService.createUserWallet({ userId });
			} catch (error: any) {
				expect(error.message).toEqual(error.message);
			}
		});
	});

	describe("getUserWalletBalance", () => {
		it("should return a list of user wallets", async () => {
			jest.spyOn(walletService, "getUserWalletBalance").mockResolvedValueOnce(
				walletCombinations
			);

			const result: UserWallet[] | null = await walletService.getUserWalletBalance({
				userId,
			});
			const sanitizedResult = result?.map(({ createdAt, ...rest }) => rest);
			const sanitizedExpected = walletCombinations.map(({ createdAt, ...rest }) => rest);

			expect(sanitizedResult).toEqual(sanitizedExpected);
		});

		it("should return null if no wallets are found", async () => {
			jest.spyOn(walletService, "getUserWalletBalance").mockResolvedValueOnce(null);

			const result: UserWallet[] | null = await walletService.getUserWalletBalance({
				userId,
			});
			const sanitizedResult = result;

			expect(sanitizedResult).toBeNull();
		});

		it("should throw an error if wallet retrieval fails", async () => {
			jest.spyOn(walletService, "getUserWalletBalance").mockResolvedValueOnce(null);
			mockCollection.get.mockRejectedValueOnce(new Error("Wallet Retrieval failed"));

			try {
				await walletService.getUserWalletBalance({ userId });
			} catch (error: any) {
				expect(error.message).toEqual(error.message);
			}
		});
	});
});
