import CryptoJS from "crypto-js";
import axios from "axios";
import Wallet, { IUserWallet } from "./models/UserWallet";
import WalletTypeModel from "./models/WalletType";
// import { WalletType } from "./config/interfaces";
// import { runScript } from "./scripts/config";
import Currency from "./models/Currency";
import mongoose from "mongoose";

// API configuration
const API_KEY = "0Jcos1F79P5RgLXhLbHd0A";
const API_SECRET = "anPRRbpoogfRFX8my6M7YolN49-snzgWT1mJ8UBPwik";
const BASE_URL = "https://sandboxcashiers.com";
const CHANNELS_ENDPOINT = "/api/channels";
const INVOICES_ENDPOINT = "/api/invoices";

export async function createCryptoPayChannel() {
	// Request data
	const requestData = JSON.stringify({
		pay_currency: "USDT",
		network: "bnb_smart_chain",
		receiver_currency: "USDT",
		name: "channel name",
		custom_id: "123",
		customer_id: "123456",
	});

	// Create signature components
	const method = "POST";
	const payloadMD5 = CryptoJS.MD5(requestData).toString();
	const contentType = "application/json";
	const date = new Date(Date.now()).toUTCString();

	// Construct string to sign
	const stringToSign =
		method + "\n" + payloadMD5 + "\n" + contentType + "\n" + date + "\n" + CHANNELS_ENDPOINT;

	// Generate signature
	const hmac = CryptoJS.HmacSHA1(stringToSign, API_SECRET);
	const signature = hmac.toString(CryptoJS.enc.Base64);

	try {
		const response = await axios({
			method,
			url: `${BASE_URL}${CHANNELS_ENDPOINT}`,
			data: requestData,
			headers: {
				"Content-Type": contentType,
				"Content-MD5": payloadMD5,
				Date: date,
				Authorization: `HMAC ${API_KEY}:${signature}`,
			},
		});

		return response.data.data;
	} catch (error: any) {
		console.error("Error creating channel:", error.message);
		throw error;
	}
}

export async function createCryptoPayInvoice() {
	// Request data
	const requestData = JSON.stringify({
		price_amount: 100,
		price_currency: "USDT",
		pay_currency: "BTC",
		network: "bitcoin",
		custom_id: "PAYMENT-1234",
		customer_id: "2095847324",
		name: "John Doe",
		description: "Test payment",
		// metadata: {
		// 	property1: "string",
		// 	property2: "string",
		// },
		// success_redirect_url: "https://web-dashboard-dev.traderapp.finance/account/wallets/main",
		// unsuccess_redirect_url: "https://web-dashboard-dev.traderapp.finance/account/wallets/main",
		// payer_email: "string",
	});

	// Create signature components
	const method = "POST";
	const payloadMD5 = CryptoJS.MD5(requestData).toString();
	const contentType = "application/json";
	const date = new Date(Date.now()).toUTCString();

	// Construct string to sign
	const stringToSign =
		method + "\n" + payloadMD5 + "\n" + contentType + "\n" + date + "\n" + INVOICES_ENDPOINT;

	// Generate signature
	const hmac = CryptoJS.HmacSHA1(stringToSign, API_SECRET);
	const signature = hmac.toString(CryptoJS.enc.Base64);

	try {
		const response = await axios({
			method,
			url: `${BASE_URL}${INVOICES_ENDPOINT}`,
			data: requestData,
			headers: {
				"Content-Type": contentType,
				"Content-MD5": payloadMD5,
				Date: date,
				Authorization: `HMAC ${API_KEY}:${signature}`,
			},
		});

		return response.data;
	} catch (error: any) {
		console.error("Error creating invoice:", error.message);
		throw error;
	}
}

export async function getSupportedCoins() {
	try {
		const response = await axios.get(`${BASE_URL}/api/coins`, {
			headers: {
				Authorization: `Bearer ${API_KEY}`,
				"Content-Type": "application/json",
			},
		});

		const res = response.data.data.map((coin: any) => {
			return {
				name: coin.name,
				currency: coin.currency,
				networks: JSON.stringify(coin.networks),
				logo: coin.logo_url,
			};
		});
		console.log("Supported Coins:", res);
	} catch (error) {
		console.error("Error fetching supported coins:", error);
	}
}

export async function generateUserWalletCombinations(userId: string): Promise<IUserWallet[]> {
	const walletCombinations: IUserWallet[] = [];

	// Fetch wallet types and their supported currencies from the database, populating the currency details
	const walletTypes = await WalletTypeModel.find();
	console.log("returned data from wallets db: ", walletTypes);

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
	console.log("currencies returned: ", currencies);

	// Iterate through each wallet type and its supported currencies and create a new wallet for each combination
	walletTypes.forEach((walletType) => {
		walletType.currencies.forEach((currency) => {
			const newWallet = new Wallet({
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

	const newUserWallet = await Wallet.insertMany(walletCombinations);
	console.log("newly created user wallets: ", newUserWallet);

	return walletCombinations;
}

// getSupportedCoins();

// Usage
// createCryptoPayChannel()
// 	.then((result) => {
// 		console.log("Channel:", result);
// 	})
// 	.catch((error) => {
// 		console.error("Error:", error.message);
// 	});

// Usage
// createCryptoPayInvoice()
// 	.then((result) => {
// 		console.log("Invoice:", result);
// 	})
// 	.catch((error) => {
// 		console.error("Error:", error.message);
// 	});

// generateUserWalletCombinations("user-12345")
// 	.then((result) => {
// 		console.log("wallet data:", result);
// 	})
// 	.catch((error) => {
// 		console.error("Error:", error.message);
// 	});

// runScript({
// 	scriptFunction: async () => {
// 		await generateUserWalletCombinations("user-12345");
// 	},
// });
