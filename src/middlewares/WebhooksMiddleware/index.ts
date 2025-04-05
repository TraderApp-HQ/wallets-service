import { Request, Response, NextFunction } from "express";
import { CryptoPayClient } from "../../clients/CryptoPayClient";

export const validateCryptopayWebhooksRequest = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const cryptoPayClient = new CryptoPayClient();
	const signature = req.headers["x-callback-signature"] as string;

	try {
		if (!cryptoPayClient.verifyWebhookSignature(req.body, signature)) {
			return res.status(401).json({ error: "Invalid signature" });
		}
		next();
	} catch (error) {
		next(error);
	}
};
