import { Request, Response } from "express";
import { WalletService } from "../services/WalletService";
import { CryptoPayClient } from "../clients/CryptoPayClient";

const walletService = new WalletService();
const cryptoPayClient = new CryptoPayClient();

export const handleCryptoPayWebhook = async (req: Request, res: Response) => {
	try {
		const signature = req.headers["x-cryptopay-signature"] as string;

		if (!cryptoPayClient.verifyWebhookSignature(req.body, signature)) {
			return res.status(401).json({ error: "Invalid signature" });
		}

		const { event } = req.body;

		switch (event) {
			case "payment.created":
				// Handle payment created
				break;
			case "payment.completed":
				await walletService.createUserWallet({ userId: "user-1234" });
				break;
			default:
				console.log(`Unhandled webhook event: ${event}`);
		}

		res.status(200).json({ received: true });
	} catch (error: any) {
		console.error("Webhook error:", error);
		res.status(400).json({ error: error.message });
	}
};
