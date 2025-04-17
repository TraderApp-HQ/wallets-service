import { NextFunction, Request, Response } from "express";
import { apiResponseHandler } from "@traderapp/shared-resources";
import { PAGINATION, ResponseType } from "../../config/constants";
import { WalletService } from "../../services/WalletService";
import { HttpStatus } from "../../utils/httpStatus";

const walletService = new WalletService();

export const getTransactions = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { userId } = req.body;
		const { page, limit } = req.query;
		const options = {
			userId,
			page: Number((page as string) ?? PAGINATION.PAGE),
			limit: Number((limit as string) ?? PAGINATION.LIMIT),
		};
		const transactions = await walletService.getTransactions(options);

		return res.status(HttpStatus.OK).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				message: "Transactions retrieved successfully",
				object: transactions,
			})
		);
	} catch (error: any) {
		next(error);
	}
};

export const getTransaction = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { id } = req.query;
		if (typeof id !== "string") {
			return res.status(HttpStatus.BAD_REQUEST).json(
				apiResponseHandler({
					type: ResponseType.ERROR,
					message: "Invalid transaction ID",
				})
			);
		}
		const transaction = await walletService.getTransaction(id);

		return res.status(HttpStatus.OK).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				message: "Transaction retrieved successfully",
				object: transaction,
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
