import axios from "axios";
import crypto from "crypto";
import "dotenv/config";
import {
	IFactoryPaymentProviderDepositInput,
	IFactoryPaymentProviderDepositResponse,
} from "../factories/interfaces";
import CryptoJS from "crypto-js";
import { AddressType, ErrorName } from "../config/enums";
import { ApplicationError } from "../config/helpers";

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
	exchange?: {
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

export interface IGenerateAddressInput {
	currency: string;
	network: string;
	userId: string;
	customId: string;
	payCurrency: string;
	amount?: number;
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
	}: IGenerateAddressInput): Promise<ICreateChannelResponse> {
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

	private async generateTemporalAddress({
		currency,
		network,
		userId,
		customId,
		payCurrency,
		amount,
	}: IGenerateAddressInput): Promise<ICreateInvoiceResponse> {
		const INVOICES_ENDPOINT = "/api/invoices";

		if (!this.validateCredentials()) {
			throw new Error("Missing required CRYPTOPAY environment variables");
		}

		// Request data
		const requestData = JSON.stringify({
			price_amount: amount,
			price_currency: currency,
			pay_currency: payCurrency,
			network,
			custom_id: customId,
			// customer_id: "2095847324222335544334433",
			name: userId,
			description: userId,
			// metadata: {
			// 	property1: "string",
			// 	property2: "string",
			// },
			// success_redirect_url: "https://web-dashboard-dev.traderapp.finance/account/wallets/main",
			// unsuccess_redirect_url: "https://web-dashboard-dev.traderapp.finance/account/wallets/main",
			// payer_email: "string",
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
			return response.data.data as ICreateInvoiceResponse;
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
		amount,
	}: IFactoryPaymentProviderDepositInput): Promise<IFactoryPaymentProviderDepositResponse> {
		console.log("Generate deposit details Input: ", {
			userId,
			currency,
			payCurrency,
			addressType,
			network,
			customId,
			amount,
		});

		if (!network) {
			throw ApplicationError({
				name: ErrorName.VALIDATION,
				message: "No network was passed to generate address",
			});
		}

		let resObject: IFactoryPaymentProviderDepositResponse = { id: "", currency, network };
		if (addressType === AddressType.PERMANENT) {
			if (!customId) {
				throw ApplicationError({
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
				paymentUri: permAddress.uri,
				customWalletId: permAddress.custom_id,
				externalWalletId: permAddress.id,
				currency: permAddress.receiver_currency,
				payCurrency: permAddress.pay_currency,
				shouldRedirect: false,
			};
		} else {
			// validate that an amount was passed
			if (!amount || amount <= 0) {
				throw ApplicationError({
					name: ErrorName.VALIDATION,
					message: "Amount must be a valid number greater than zero",
				});
			}

			const tempAddress = await this.generateTemporalAddress({
				currency,
				network: network ?? "",
				payCurrency,
				userId,
				customId: customId ?? "",
				amount,
			});
			console.log("temporal invoice details:################", tempAddress);

			resObject = {
				...resObject,
				id: tempAddress.id,
				walletAddress: tempAddress.address,
				paymentUrl: tempAddress.hosted_page_url,
				paymentUri: tempAddress.uri,
				customWalletId: tempAddress.custom_id,
				externalWalletId: tempAddress.id,
				amount: Number(tempAddress.price_amount),
				currency: tempAddress.price_currency,
				payAmount: Number(tempAddress.pay_amount),
				payCurrency: tempAddress.pay_currency,
				shouldRedirect: false,
				exchangePair: tempAddress.exchange?.pair,
				exchangeRate: Number(tempAddress.exchange?.rate),
				createdAt: tempAddress.created_at,
				expiresAt: tempAddress.expires_at,
			};
		}

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
