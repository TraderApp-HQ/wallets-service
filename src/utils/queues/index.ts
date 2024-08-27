import { WalletService } from "../../services/WalletService";
import { deleteMessagesFromQueue, readMessagesFromQueue } from "./helpers";

export const pollWalletCreationQueue = async () => {
	try {
		const queueUrl = process.env.WALLETS_SERVICE_QUEUE_URL ?? "";
		const messages = await readMessagesFromQueue({ queueUrl });

		if (messages) {
			const walletService = new WalletService();
			for (const message of messages) {
				const userId: string | any = message.Body.messageObject.messageBody;
				await walletService.createUserWallet(userId);
			}

			await deleteMessagesFromQueue({ queueUrl, messages });
			console.log(`${messages.length} Messages deleted`);
		}
	} catch (error) {
		console.error("Error receiving or processing messages:", error);
	}
};
