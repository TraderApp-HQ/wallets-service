import cron from "node-cron";
import { WalletService } from "../../services/WalletService";
import { WalletProvider } from "../../config/enums";

export const cryptopayNetworkFeesJob = () => {
	const walletService = new WalletService();
	// Runs every 30 minutes
	cron.schedule("*/30 * * * *", async () => {
		try {
			await walletService.updateNetworkFeesInDB(WalletProvider.CRYPTOPAY);
			console.log("Cryptopay Network Fees Update Cron Job successful");
		} catch (error) {
			console.error("Error updating Cryptopay Network Fees:", error);
		}
	});
};
