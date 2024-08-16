import { WalletService } from "../../services/WalletService";
import { Currency } from "../../schemas/currency";
import { WalletType } from "../../schemas/wallet";
import { Response } from "express";

// Mock Firebase db
const mockCollection = {
	add: jest.fn(),
	where: jest.fn().mockReturnThis(),
	get: jest.fn(),
};

// Mock API response handler
const mockResponse = (): Partial<Response> => {
	const res: Partial<Response> = {};
	res.status = jest.fn().mockReturnValue(res);
	res.json = jest.fn().mockReturnValue(res);
	return res;
};

const mockRes = mockResponse() as Response;

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
	const walletCombinations = [
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
			currency: Currency.BTC,
			balance: 0.0,
			createdAt: new Date(),
		},
		{
			userId,
			walletType: WalletType.MAIN,
			currency: Currency.BTC,
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
			jest.spyOn(walletService, "getUserWalletBalance").mockResolvedValueOnce(null);
			mockCollection.add.mockResolvedValueOnce({});

			await walletService.createUserWallet({ userId, res: mockRes });

			// walletCombinations.forEach(wallet => {
			//     expect(mockCollection.add).toHaveBeenCalledWith(wallet);
			// });
		});

		it("should return error if user wallet already exists", async () => {
			jest.spyOn(walletService, "getUserWalletBalance").mockResolvedValueOnce(
				walletCombinations
			);

			await walletService.createUserWallet({ userId, res: mockRes });
		});

		it("should throw an error if wallet creation fails", async () => {
			jest.spyOn(walletService, "getUserWalletBalance").mockResolvedValueOnce(null);
			mockCollection.add.mockRejectedValueOnce(new Error("Error creating wallet"));

			await expect(walletService.createUserWallet({ userId, res: mockRes })).rejects.toThrow(
				"Error creating wallet: Error creating wallet"
			);
		});
	});

	describe("getWalletBalance", () => {
		it("should return a list of user wallets", async () => {
			jest.spyOn(walletService, "getUserWalletBalance").mockResolvedValueOnce(
				walletCombinations
			);

			await walletService.getWalletBalance({ userId, res: mockRes });
		});

		it("should return a message if no wallets are found", async () => {
			jest.spyOn(walletService, "getUserWalletBalance").mockResolvedValueOnce(null);

			await walletService.getWalletBalance({ userId, res: mockRes });
		});
	});

	describe("getUserWalletBalance", () => {
		it("should return user wallet balances from Firebase", async () => {
			// const docs = [
			// 	{ id: "1", data: () => walletCombinations[0] },
			// 	{ id: "2", data: () => walletCombinations[1] },
			// ];
			// (mockCollection.get.mockResolvedValueOnce({
			// 	empty: false,
			// 	forEach: (callback: any) => docs.forEach(callback),
			// }));
			// const result = await walletService.getUserWalletBalance({ userId });
		});

		it("should return null if no wallets are found", async () => {
			mockCollection.get.mockResolvedValueOnce({ empty: true });

			const result = await walletService.getUserWalletBalance({ userId });
			expect(result).toBeNull();
		});
	});
});
