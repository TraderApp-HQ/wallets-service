import { NextFunction, Request, Response } from "express";
import "dotenv/config";
import { apiResponseHandler } from "@traderapp/shared-resources";
import { ResponseType } from "../../config/constants";
import { HttpStatus } from "../../utils/httpStatus";
import { publishMessageToQueue } from "../../clients/SQSClient/helpers";

export const processCryptopayWebhooks = async (req: Request, res: Response, next: NextFunction) => {
	try {
		// queue cryptopay webhook
		const queueUrl = process.env.CRYPTOPAY_CHANNELS_WEBHOOKS_QUEUE ?? "";
		await publishMessageToQueue({ queueUrl, message: req.body });
		console.log("cryptopay webhook published to queue", { obect: req.body });
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
