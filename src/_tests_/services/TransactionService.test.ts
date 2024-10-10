/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { TransactionService } from "../../services/TransactionService";
import { WalletService } from "../../services/WalletService";
import { AddressService } from "../../services/AddressService";
import {
	ITransaction,
	TransactionStatus,
	TransactionType,
	TransactionWalletType,
} from "../../schemas/transaction";
import { UserWallet, WalletType } from "../../schemas/wallet";
import { v4 as uuidv4 } from "uuid";
import { DbService } from "../../services/DbService";
import { Network } from "../../schemas/network";
import { Currency } from "../../schemas/currency";

// Mock dependencies
const mockWalletService: WalletService = {
	getUserWalletBalance: jest.fn().mockResolvedValueOnce([{} as UserWallet]),
	createUserWallet: jest.fn(),
	getWalletBalance: jest.fn(),
} as unknown as WalletService;

const mockAddressService: AddressService = {
	createUserNetworkAddress: jest.fn(),
	getUserAddresses: jest.fn(),
};

let mockDbService: Partial<DbService> = {
	getUserTransactions: jest
		.fn()
		.mockResolvedValue([{ id: "1", userId: "user1234" } as ITransaction]),
};

const mockTransaction = {
	id: "0a3XLhKCrit8kn4jsvCk",
	fromAmount: 65,
	toAmount: 65,
	fromWalletAddress: "walletAddressReference",
	type: TransactionType.TRANSFER,
	userId: "abd95506-f14e-478f-8480-30aec4fa6ed0",
	conversionRate: 1,
	transactionWalletType: TransactionWalletType.EXTERNAL,
	transactionId: "b33087d0-074c-4239-8c5a-bce680683548",
	toWallet: WalletType.MAIN,
	toCurrency: Currency.BTC,
	fromCurrency: Currency.BTC,
	toWalletAddress: "toWalletAddressRefence",
	transactionNetwork: Network.TRX,
	timestamp: "",
	status: TransactionStatus.SUCCESS,
} as ITransaction;

jest.mock("uuid", () => ({
	v4: jest.fn() as jest.MockedFunction<typeof uuidv4>,
}));

describe("TransactionService", () => {
	let transactionService: TransactionService;

	beforeEach(() => {
		mockDbService = {
			getUserTransactions: jest.fn().mockResolvedValue([mockTransaction as ITransaction]),
		};
		transactionService = new TransactionService(
			mockWalletService as any,
			mockAddressService as any,
			mockDbService as any
		);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe("getTransactions", () => {
		it("should return a list of user transactions", async () => {
			const userId = "user123";
			const expectedTransactions = [mockTransaction as ITransaction];
			(mockDbService.getUserTransactions as jest.Mock).mockResolvedValueOnce(
				expectedTransactions
			);
			const result = await transactionService.getTransactions({ userId });

			expect(mockDbService.getUserTransactions).toHaveBeenCalledWith(userId);
			expect(result).toEqual(expectedTransactions);
		});

		it("should return an empty array if no transactions are found", async () => {
			const userId = "user123";
			(mockDbService.getUserTransactions as jest.Mock).mockResolvedValueOnce([]);
			const result = await transactionService.getTransactions({ userId });

			expect(mockDbService.getUserTransactions).toHaveBeenCalledWith(userId);
			expect(result).toEqual([]);
		});

		it("should throw an error if fetching transactions fails", async () => {
			const userId = "user123";
			(mockDbService.getUserTransactions as jest.Mock).mockRejectedValueOnce(
				new Error("Error fetching transactions")
			);
			await expect(transactionService.getTransactions({ userId })).rejects.toThrow(
				"Error fetching transactions"
			);
			expect(mockDbService.getUserTransactions).toHaveBeenCalledWith(userId);
		});
	});
});
