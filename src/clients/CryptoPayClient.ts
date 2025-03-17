import axios from "axios";
import crypto from "crypto";
import "dotenv/config";
import { IFactoryPaymentProviderDepositInput } from "../factories/interfaces";

interface ICreateChannelResponse {
	id: string;
	status: string;
	name: string;
	description: string;
	receiver_currency: string;
	pay_currency: string;
	address: string;
	network: string;
	project_id: string;
	custom_id: string;
	customer_id: string;
	uri: string;
	hosted_page_url: string;
}
export class CryptoPayClient {
	private readonly baseUrl: string;
	private readonly apiKey: string | undefined;
	private readonly apiSecret: string | undefined;

	constructor() {
		this.baseUrl = "https://sandboxcashiers.com";
		this.apiKey = process.env.CRYPTOPAY_DEPOSITS_API_KEY;
		this.apiSecret = process.env.CRYPTOPAY_DEPOSITS_API_SECRET;
	}

	private validateCredentials() {
		if (!this.apiKey || !this.apiSecret) {
			return false;
		}
		return true;
	}

	async generatePermanentAddress(currency: string, network: string) {
		if (!this.validateCredentials()) {
			throw new Error("Missing required CRYPTOPAY environment variables");
		}
		try {
			const response = await axios.post(
				`${this.baseUrl}/api/channels`,
				{
					currency,
					network,
				},
				{
					headers: this.getHeaders(),
				}
			);
			return response.data.data as ICreateChannelResponse;
		} catch (error: any) {
			throw new Error(`Error generating permanent address from cryptopay: ${error.message}`);
		}
	}

	async generateTemporalAddress(currency: string, network: string, expiresIn: number) {
		if (!this.validateCredentials()) {
			throw new Error("Missing required CRYPTOPAY environment variables");
		}
		try {
			const response = await axios.post(
				`${this.baseUrl}/api/invoices`,
				{
					currency,
					network,
					expiresIn,
				},
				{
					headers: this.getHeaders(),
				}
			);
			return response.data;
		} catch (error: any) {
			throw new Error(`Error generating temporal address froon cryptopay: ${error.message}`);
		}
	}

	async generateDepositDetails({
		userId,
		currency,
		addressType,
		network,
	}: IFactoryPaymentProviderDepositInput) {
		console.log("Processing deposit: ", userId, currency);
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
