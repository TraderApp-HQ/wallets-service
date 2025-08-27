import cron from "node-cron";
import { WalletService } from "../../services/WalletService";

export const currencyExchangeRateJob = () => {
	const walletService = new WalletService();
	// Runs every 30 minutes
	cron.schedule("*/30 * * * *", async () => {
		await walletService.updateCurrenciesExchangeRateInDB();

		console.log("Currency Exchange Rate Update Cron Job successful");
	});
};
