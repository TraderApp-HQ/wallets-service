import { NextFunction, Request, Response } from "express";
import { apiResponseHandler } from "@traderapp/shared-resources";
import { ResponseType } from "../../config/constants";
// import { WalletService } from "../../services/WalletService";
import { HttpStatus } from "../../utils/httpStatus";

// const walletService = new WalletService();

export const getTransactions = async (req: Request, res: Response, next: NextFunction) => {
	try {
		// const { userId } = req.body;
		// const transactions = await walletService.getTransactions({ userId });
		console.log("request came in");

		return res.status(HttpStatus.OK).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				message: "Transactions retrieved successfully",
				object: [],
			})
		);
	} catch (error: any) {
		next(error);
	}
};

export const depositFunds = async (req: Request, res: Response, next: NextFunction) => {
	try {
		// const { userId } = req.body;
		// const transaction = await walletService.depositFunds({ userId });

		return res.status(HttpStatus.OK).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				message: "Deposit initiated successfully",
			})
		);
	} catch (error: any) {
		next(error);
	}
};

export const withdrawFunds = async (req: Request, res: Response, next: NextFunction) => {
	try {
		return res.status(HttpStatus.OK).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				message: "Withdrawal initiated successfully",
			})
		);
	} catch (error: any) {
		next(error);
	}
};

export const convertFunds = async (req: Request, res: Response, next: NextFunction) => {
	try {
		return res.status(HttpStatus.OK).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				message: "Conversion initiated successfully",
			})
		);
	} catch (error: any) {
		next(error);
	}
};

export const transferFunds = async (req: Request, res: Response, next: NextFunction) => {
	try {
		return res.status(HttpStatus.OK).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				message: "Transfer initiated successfully",
			})
		);
	} catch (error: any) {
		next(error);
	}
};
