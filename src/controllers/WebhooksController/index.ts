import { NextFunction, Request, Response } from "express";
import { apiResponseHandler } from "@traderapp/shared-resources";
import { ResponseType } from "../../config/constants";
import { HttpStatus } from "../../utils/httpStatus";

export const processCryptopayWebhooks = async (req: Request, res: Response, next: NextFunction) => {
	try {
		// queue cryptopay webhook
		console.log("cryptopay webhook received##########", req.body);
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
