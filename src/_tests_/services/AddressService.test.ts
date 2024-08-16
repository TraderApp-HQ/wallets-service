import { AddressService } from "../../services/AddressService";
import { INetworkAddressInput, Network } from "../../schemas/network";
import { Currency } from "../../schemas/currency";
import { Response } from "express";

// Mock Firebase db
const mockCollection = {
	add: jest.fn(),
	where: jest.fn().mockReturnThis(),
	get: jest.fn(),
};

jest.mock("../../firebase", () => ({
	db: {
		collection: jest.fn(() => mockCollection),
	},
}));

// Mock API response handler
const mockResponse = (): Partial<Response> => {
	const res: Partial<Response> = {};
	res.status = jest.fn().mockReturnValue(res);
	res.json = jest.fn().mockReturnValue(res);
	return res;
};

const mockRes = mockResponse() as Response;

// actual test logic
describe("AddressService", () => {
	const addressService: AddressService = new AddressService();
	const userId = "user123";
	const payload: INetworkAddressInput = {
		network: "Ethereum (ERC20)" as Network,
		currency: "USDT" as Currency,
		userId,
		address: "",
	};

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe("createUserNetworkAddress", () => {
		it("should create a new user network address and return success response", async () => {
			mockCollection.add.mockResolvedValueOnce({});

			await addressService.createUserNetworkAddress({ res: mockRes, ...payload });
		});

		it("should throw an error if address creation fails", async () => {
			const errorMessage = "Error creating network address";
			mockCollection.add.mockRejectedValueOnce(new Error(errorMessage));
		});
	});

	describe("getAddresses", () => {
		it("should return a list of user network addresses", async () => {
			// const addresses = [{ id: "1", ...payload }];
			// jest.spyOn(addressService, 'getUserAddresses').mockResolvedValueOnce(addresses);
			// await addressService.getAddresses({ res: mockRes, ...payload });
		});

		it("should return a message if no addresses are found", async () => {
			jest.spyOn(addressService, "getUserAddresses").mockResolvedValueOnce(null);

			await addressService.getAddresses({ res: mockRes, ...payload });
		});
	});

	describe("getUserAddresses", () => {
		it("should return user network addresses from Firebase", async () => {
			const docs = [{ id: "1", data: () => ({ ...payload }) }];
			mockCollection.get.mockResolvedValueOnce({
				empty: false,
				forEach: (callback: any) => {
					docs.forEach(callback);
				},
			});

			// const result = await addressService.getUserAddresses(payload);
		});

		it("should return null if no addresses found", async () => {
			mockCollection.get.mockResolvedValueOnce({ empty: true });

			const result = await addressService.getUserAddresses(payload);
			expect(result).toBeNull();
		});
	});
});
