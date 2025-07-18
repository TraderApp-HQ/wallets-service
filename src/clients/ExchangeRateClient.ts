import axios from "axios";
import "dotenv/config";

export class ExchangeRateClient {
	private readonly baseUrl: string;
	private readonly apiKey: string;

	constructor() {
		this.baseUrl = "https://v6.exchangerate-api.com/v6/latest/USD";
		this.apiKey = process.env.EXCHANGE_RATES_API_KEY ?? "";
	}

	private validateCredentials() {
		if (!this.apiKey) {
			return false;
		}
		return true;
	}

	public async getExchangeRates() {
		if (!this.validateCredentials()) {
			throw new Error("Missing required Exchange Rate API environment variables");
		}

		try {
			const response = await axios({
				method: "GET",
				url: this.baseUrl,
				headers: {
					Authorization: `Bearer ${this.apiKey}`,
				},
			});

			return response.data?.["conversion_rates"] as unknown as Record<string, number>;
		} catch (error: unknown) {
			if (axios.isAxiosError(error)) {
				throw new Error(
					`Currency Exchange API Error - ${error.response?.data?.["error-type"]}`
				);
			}

			throw new Error(
				`Unknown error from currency exchange API - ${(error as Error).message}`
			);
		}
	}
}
