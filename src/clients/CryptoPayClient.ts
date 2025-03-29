import axios from "axios";
import crypto from "crypto";
import "dotenv/config";
import {
	IFactoryPaymentProviderDepositInput,
	IFactoryPaymentProviderDepositResponse,
} from "../factories/interfaces";
import CryptoJS from "crypto-js";
import { AddressType, ErrorName } from "../config/enums";
import { throwApplicationError } from "../config/helpers";

interface ICreateChannelResponse {
	id: string;
	status: string;
	name: string;
	description: string | null;
	receiver_currency: string;
	pay_currency: string;
	address: string;
	network: string;
	project_id: string;
	custom_id: string;
	customer_id: string | null;
	uri: string;
	hosted_page_url: string;
}

export interface ICreateInvoiceResponse {
	id: string;
	custom_id: string;
	customer_id: string | null;
	subscription_id: string | null;
	status: string;
	status_context: string | null;
	address: string;
	network: string;
	uri: string;
	price_amount: string;
	price_currency: string;
	pay_amount: string;
	pay_currency: string;
	fee: string;
	fee_currency: string;
	paid_amount: string;
	exchange: {
		pair: string;
		rate: string;
		fee: string;
		fee_currency: string;
	};
	transactions: any[]; // Adjust the type as necessary based on the structure of transactions
	name: string;
	description: string;
	metadata: any | null; // Adjust the type as necessary based on the structure of metadata
	success_redirect_url: string | null;
	unsuccess_redirect_url: string | null;
	hosted_page_url: string;
	created_at: string;
	expires_at: string;
}

export class CryptoPayClient {
	private readonly baseUrl: string;
	private readonly apiKey: string;
	private readonly apiSecret: string;

	constructor() {
		this.baseUrl = process.env.CRYPTOPAY_BASE_URL ?? "";
		this.apiKey = process.env.CRYPTOPAY_DEPOSITS_API_KEY ?? "";
		this.apiSecret = process.env.CRYPTOPAY_DEPOSITS_API_SECRET ?? "";
	}

	private validateCredentials() {
		if (!this.apiKey || !this.apiSecret) {
			return false;
		}
		return true;
	}

	private createSignature(method: string, endpoint: string, requestData: string): string {
		const payloadMD5 = CryptoJS.MD5(requestData).toString();
		const contentType = "application/json";
		const date = new Date(Date.now()).toUTCString();
		const stringToSign =
			method + "\n" + payloadMD5 + "\n" + contentType + "\n" + date + "\n" + endpoint;

		// Generate signature
		const hmac = CryptoJS.HmacSHA1(stringToSign, this.apiSecret ?? "");
		return hmac.toString(CryptoJS.enc.Base64);
	}

	private async generatePermanentAddress({
		currency,
		network,
		userId,
		customId,
		payCurrency,
	}: {
		currency: string;
		network: string;
		userId: string;
		customId: string;
		payCurrency: string;
	}): Promise<ICreateChannelResponse> {
		const CHANNELS_ENDPOINT = "/api/channels";

		if (!this.validateCredentials()) {
			throw new Error("Missing required CRYPTOPAY environment variables");
		}

		const requestData = JSON.stringify({
			pay_currency: payCurrency,
			network,
			receiver_currency: currency,
			name: userId,
			custom_id: customId,
		});

		// Generate signature
		const signature = this.createSignature("POST", CHANNELS_ENDPOINT, requestData);

		try {
			const response = await axios({
				method: "POST",
				url: `${this.baseUrl}${CHANNELS_ENDPOINT}`,
				data: requestData,
				headers: {
					"Content-Type": "application/json",
					"Content-MD5": CryptoJS.MD5(requestData).toString(),
					Date: new Date(Date.now()).toUTCString(),
					Authorization: `HMAC ${this.apiKey}:${signature}`,
				},
			});
			return response.data.data as ICreateChannelResponse;
		} catch (error: any) {
			throw new Error(`Error generating permanent address from cryptopay: ${error.message}`);
		}
	}

	private async generateTemporalAddress(currency: string, network: string) {
		const INVOICES_ENDPOINT = "/api/invoices";

		if (!this.validateCredentials()) {
			throw new Error("Missing required CRYPTOPAY environment variables");
		}

		// Request data
		const requestData = JSON.stringify({
			currency,
			network,
			name: "John Doe", // Example name, adjust as necessary
			description: "Test payment", // Example description, adjust as necessary
		});

		// Generate signature
		const signature = this.createSignature("POST", INVOICES_ENDPOINT, requestData);

		try {
			const response = await axios({
				method: "POST",
				url: `${this.baseUrl}${INVOICES_ENDPOINT}`,
				data: requestData,
				headers: {
					"Content-Type": "application/json",
					"Content-MD5": CryptoJS.MD5(requestData).toString(),
					Date: new Date(Date.now()).toUTCString(),
					Authorization: `HMAC ${this.apiKey}:${signature}`,
				},
			});
			return response.data; // Adjust return type as necessary
		} catch (error: any) {
			throw new Error(`Error generating temporal address from cryptopay: ${error.message}`);
		}
	}

	async generateDepositDetails({
		userId,
		currency,
		payCurrency,
		addressType,
		network,
		customId,
	}: IFactoryPaymentProviderDepositInput): Promise<IFactoryPaymentProviderDepositResponse> {
		console.log("Generate deposit details Input: ", {
			userId,
			currency,
			payCurrency,
			addressType,
			network,
			customId,
		});

		if (!network) {
			throwApplicationError({
				name: ErrorName.VALIDATION,
				message: "No network was passed to generate address",
			});
		}

		let resObject: IFactoryPaymentProviderDepositResponse = { id: "", currency, network };
		if (addressType === AddressType.PERMANENT) {
			if (!customId) {
				throwApplicationError({
					name: ErrorName.VALIDATION,
					message: "No customId was passed to generate address",
				});
			}

			const permAddress = await this.generatePermanentAddress({
				currency,
				network: network ?? "",
				payCurrency: currency,
				userId,
				customId: customId ?? "",
			});

			resObject = {
				...resObject,
				id: permAddress.id,
				walletAddress: permAddress.address,
				paymentUrl: permAddress.hosted_page_url,
				customWalletId: permAddress.custom_id,
				externalWalletId: permAddress.id,
				currency: permAddress.receiver_currency,
				payCurrency: permAddress.pay_currency,
			};
		} else {
			console.log("No implementation for the address type");
		}
		// return {
		// 	id: "",
		// 	currency,
		// 	walletAddress: "",
		// 	network: "",
		// 	paymentUrl: "",
		// 	shouldRedirect: false,
		// 	customWalletId: "",
		// 	externalWalletId: "",
		// };

		return resObject;
	}

	async verifyPayment(paymentId: string) {
		if (!this.validateCredentials()) {
			throw new Error("Missing required CRYPTOPAY environment variables");
		}
		try {
			const response = await axios.get(`${this.baseUrl}/v1/payments/${paymentId}`, {
				headers: this.getHeaders(),
			});
			return response.data;
		} catch (error: any) {
			throw new Error(`Error verifying payment: ${error.message}`);
		}
	}

	verifyWebhookSignature(payload: any, signature: string): boolean {
		if (!this.apiSecret) {
			throw new Error("Missing CRYPTOPAY_DEPOSITS_API_SECRET environment variable");
		}
		const computedSignature = crypto
			.createHmac("sha256", this.apiSecret)
			.update(JSON.stringify(payload))
			.digest("hex");
		return computedSignature === signature;
	}

	private getHeaders() {
		if (!this.apiKey) {
			throw new Error("Missing CRYPTOPAY_DEPOSITS_API_KEY environment variable");
		}
		return {
			Authorization: `Bearer ${this.apiKey}`,
			"Content-Type": "application/json",
		};
	}
}
