import { NextFunction, Request, Response } from "express";
import "dotenv/config";
import { apiResponseHandler } from "@traderapp/shared-resources";
import { ResponseType } from "../../config/constants";
import { HttpStatus } from "../../utils/httpStatus";
import { publishMessageToQueue } from "../../clients/SQSClient/helpers";
import { ICryptopayWebhookEvent } from "../../clients/CryptoPayClient";

export const processCryptopayWebhooks = async (req: Request, res: Response, next: NextFunction) => {
	try {
		// queue cryptopay webhook
		const data = req.body as ICryptopayWebhookEvent;
		const queueUrl =
			data.type === "ChannelPayment"
				? process.env.CRYPTOPAY_CHANNELS_WEBHOOKS_QUEUE ?? ""
				: process.env.CRYPTOPAY_INVOICE_WEBHOOKS_QUEUE ?? "";
		await publishMessageToQueue({ queueUrl, message: data });
		console.log("cryptopay webhook published to queue", { data });
		return res.status(HttpStatus.OK).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				message: "Webhook received successfully.",
			})
		);
	} catch (error: any) {
		next(error);
	}
};
