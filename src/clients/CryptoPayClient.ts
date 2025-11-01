import axios from "axios";
import crypto from "crypto";
import "dotenv/config";
import {
	ICurrencyNetworkFees,
	IFactoryPaymentProviderDepositInput,
	IFactoryPaymentProviderDepositResponse,
	IProcessWithdrawalInput,
	IProcessWithdrawalResponse,
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

export enum CryptopayWebhookEventStatus {
	pending = "pending",
	completed = "completed",
	onHold = "on_hold",
	refunded = "refunded",
	cancelled = "cancelled",
	new = "new",
	unresolved = "unresolved",
	processing = "processing",
}

export interface ICryptopayWebhookEvent {
	type: "ChannelPayment" | "Invoice" | "CoinWithdrawal";
	event:
		| "created"
		| "completed"
		| "on_hold"
		| "refunded"
		| "cancelled"
		| "transaction_created"
		| "transaction_confirmed"
		| "status_changed";
	data: {
		id: string;
		txid: string;
		paid_amount: string;
		paid_currency: string;
		received_amount: string;
		received_currency: string;
		fee: string;
		fee_currency: string;
		status: CryptopayWebhookEventStatus;
		status_context: string | null;
		channel_id: string;
		address: string;
		network: string;
		custom_id: string;
		customer_id: string | null;
		risk: any | null;
		refund_address: string | null;
		coin_withdrawal_id: string | null;
		created_at: string;
	};
}

export interface ICryptopayNetworkFee {
	level: "slow" | "average" | "fast";
	fee: string;
	currency: string;
	network: string;
}

export interface ICryptoNetworkFeeResponse {
	data: ICryptopayNetworkFee[];
}

export interface ICryptoPayFetchFeesOptions {
	allNetworks?: boolean;
}

export class CryptoPayClient {
	private readonly baseUrl: string;
	private readonly apiKey: string;
	private readonly apiSecret: string;
	private readonly webhooksSharedSecret: string;
	private readonly withdrawalApiKey: string;
	private readonly withdrawalApiSecret: string;

	constructor() {
		this.baseUrl = process.env.CRYPTOPAY_BASE_URL ?? "";
		this.apiKey = process.env.CRYPTOPAY_DEPOSITS_API_KEY ?? "";
		this.apiSecret = process.env.CRYPTOPAY_DEPOSITS_API_SECRET ?? "";
		this.webhooksSharedSecret = process.env.CRYPTOPAY_WEBHOOK_SHARED_SECRET ?? "";
		this.withdrawalApiKey = process.env.CRYPTOPAY_WITHDRAWALS_API_KEY ?? "";
		this.withdrawalApiSecret = process.env.CRYPTOPAY_WITHDRAWALS_API_SECRET ?? "";
	}

	private validateCredentials() {
		if (!this.apiKey || !this.apiSecret) {
			return false;
		}
		return true;
	}

	private validateWithdrawalCredentials() {
		return this.withdrawalApiKey && this.withdrawalApiSecret;
	}

	private createSignature(
		method: string,
		endpoint: string,
		requestData: string,
		apiSecret: string,
		date: string = new Date(Date.now()).toUTCString()
	): string {
		const payloadMD5 = CryptoJS.MD5(requestData).toString();
		const contentType = "application/json";
		const stringToSign =
			method + "\n" + payloadMD5 + "\n" + contentType + "\n" + date + "\n" + endpoint;

		// Generate signature
		const hmac = CryptoJS.HmacSHA1(stringToSign, apiSecret ?? "");
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
		const signature = this.createSignature(
			"POST",
			CHANNELS_ENDPOINT,
			requestData,
			this.apiSecret
		);

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
		const signature = this.createSignature(
			"POST",
			INVOICES_ENDPOINT,
			requestData,
			this.apiSecret
		);

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

	private groupFeesByCurrency(data: ICryptopayNetworkFee[]): ICurrencyNetworkFees {
		const result: ICurrencyNetworkFees = {};

		for (const { currency, network, level, fee } of data) {
			if (!result[currency]) {
				result[currency] = { networks: [], fees: {} };
			}
			const entry = result[currency];

			if (!entry.networks.includes(network)) {
				entry.networks.push(network);
			}
			if (!entry.fees[network]) {
				entry.fees[network] = {};
			}
			entry.fees[network][level] = fee; // single fee per level
		}

		// Sort networks and levels for consistency
		for (const currency in result) {
			result[currency].networks.sort();
			for (const network in result[currency].fees) {
				const levels = result[currency].fees[network];
				const sortedLevels: Record<string, string> = {};
				Object.keys(levels)
					.sort()
					.forEach((lvl) => (sortedLevels[lvl] = levels[lvl]));
				result[currency].fees[network] = sortedLevels;
			}
		}

		return result;
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

	verifyWebhookSignature(payload: any, signature: string): boolean {
		if (!this.webhooksSharedSecret) {
			throw new Error("Missing CRYPTOPAY_WEBHOOK_SHARED_SECRET environment variable");
		}

		// Ensure the payload is properly stringified and matches the exact format
		const stringifiedPayload = JSON.stringify(payload, null, 0);

		const computedSignature = crypto
			.createHmac("sha256", this.webhooksSharedSecret)
			.update(stringifiedPayload)
			.digest("hex");

		console.log("Payload received:", stringifiedPayload);
		console.log("Signature received:", signature);
		console.log("Computed signature:", computedSignature);

		return this.secureCompare(computedSignature, signature);
	}

	// verifyWebhookSignature(payload: any, signature: string): boolean {
	// 	if (!this.webhooksSharedSecret) {
	// 		throw new Error("Missing CRYPTOPAY_WEBHOOK_SHARED_SECRET environment variable");
	// 	}
	// 	const computedSignature = crypto
	// 		.createHmac("sha256", this.webhooksSharedSecret)
	// 		.update(JSON.stringify(payload))
	// 		.digest("hex");

	// 	console.log("shared secret:#####", this.webhooksSharedSecret);
	// 	console.log("copted signatire:#####", computedSignature);
	// 	return computedSignature === signature;
	// }

	async fetchNetworkFees({ allNetworks = true }: ICryptoPayFetchFeesOptions = {}): Promise<
		ICryptopayNetworkFee[]
	> {
		const endpoint = `/api/coin_withdrawals/network_fees${
			allNetworks ? "?all_networks=true" : ""
		}`;
		const requestData = JSON.stringify({});
		const date = new Date(Date.now()).toUTCString();
		const signature = this.createSignature(
			"GET",
			endpoint,
			requestData,
			this.withdrawalApiSecret,
			date
		);

		try {
			const response = await axios<ICryptoNetworkFeeResponse>({
				method: "GET",
				url: this.baseUrl + endpoint,
				data: requestData,
				headers: {
					"Content-Type": "application/json",
					Date: date,
					Authorization: `HMAC ${this.withdrawalApiKey}:${signature}`,
				},
			});

			const data = response.data.data;
			return data;
		} catch (error: any) {
			if (error.response) {
				console.error("Network fee fetch error:", {
					status: error.response.status,
					data: error.response.data,
					headers: error.response.headers,
				});
			} else {
				console.error("Network fee fetch failed before response:", error.message);
			}
			throw new Error(`Error fetching network fees: ${error.message}`);
		}
	}

	async getNetworkFeesByCurrency() {
		const fees = await this.fetchNetworkFees();
		return this.groupFeesByCurrency(fees);
	}

	async processWithdrawal({
		userId,
		currency,
		amount,
		destinationAddress,
		network,
		customId,
	}: IProcessWithdrawalInput): Promise<IProcessWithdrawalResponse> {
		const WITHDRAWALS_ENDPOINT = "/api/coin_withdrawals";

		if (!this.validateWithdrawalCredentials()) {
			throw new Error("Missing required CRYPTOPAY withdrawal environment variables");
		}

		const requestData = JSON.stringify({
			charged_currency: currency,
			received_amount: amount.toString(),
			received_currency: currency,
			address: destinationAddress,
			network,
			custom_id: customId,
			force_commit: true,
		});
		const date = new Date(Date.now()).toUTCString();
		const signature = this.createSignature(
			"POST",
			WITHDRAWALS_ENDPOINT,
			requestData,
			this.withdrawalApiSecret,
			date
		);

		try {
			const response = await axios({
				method: "POST",
				url: this.baseUrl + WITHDRAWALS_ENDPOINT,
				data: requestData,
				headers: {
					"Content-Type": "application/json",
					// "Content-MD5": CryptoJS.MD5(requestData).toString(),
					Date: date,
					Authorization: `HMAC ${this.withdrawalApiKey}:${signature}`,
				},
			});

			const data = response.data.data;

			return {
				externalId: data.id,
				transactionHash: data.txid,
				status: data.status,
				providerFee: parseFloat(data.fee),
				networkFee: parseFloat(data.network_fee),
			};
		} catch (error: any) {
			if (error.response) {
				console.error("Withdrawal error response:", {
					status: error.response.status,
					data: error.response.data,
					details: error.response.data.error?.details,
					headers: error.response.headers,
				});
				if (error.response.status === 403) {
					console.error(
						"Hint: check withdrawal API key/secret, signature algorithm, field spelling and baseUrl environment."
					);
				}
			} else {
				console.error("Withdrawal request failed before response:", error.message);
			}
			throw new Error(`Error processing withdrawal: ${error.message}`);
		}
	}

	private secureCompare(str1: string, str2: string): boolean {
		if (!str1 || !str2 || str1.length !== str2.length) {
			return false;
		}

		const buf1 = Buffer.from(str1);
		const buf2 = Buffer.from(str2);

		let result = 0;
		for (let i = 0; i < buf1.length; i++) {
			result |= buf1[i] ^ buf2[i];
		}

		return result === 0;
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
