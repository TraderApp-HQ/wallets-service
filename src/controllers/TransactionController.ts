import { apiResponseHandler } from "@traderapp/shared-resources";
import { Request, Response, NextFunction } from "express";
import { ResponseType } from "../config/constants";
import {
	IConvertFundsPayload,
	IDepositFundsPayload,
	ITransferFundsPayload,
	IWithdrawFundsPayload,
} from "../schemas/transaction";
import { TransactionService } from "../services/TransactionService";
import { HttpStatus } from "../utils/httpStatus";

export class TransactionController {
	private readonly transactionService: TransactionService;

	constructor(transactionService: TransactionService) {
		this.transactionService = transactionService;
	}

	public async getTransactions(req: Request, res: Response, next: NextFunction) {
		const { userId } = req.body;
		try {
			const transactions = await this.transactionService.getTransactions({ userId, res });
			if (!transactions) {
				return res.status(HttpStatus.OK).json(
					apiResponseHandler({
						type: ResponseType.SUCCESS,
						message: "No transactions found!",
					})
				);
			}

			return res.status(HttpStatus.OK).json(
				apiResponseHandler({
					type: ResponseType.SUCCESS,
					message: "List of user transactions!",
					object: { transactions },
				})
			);
		} catch (error) {
			next(error);
		}
	}

	public async depositFunds(req: Request, res: Response, next: NextFunction) {
		const payload: IDepositFundsPayload = req.body;
		try {
			return await this.transactionService.depositFunds({ ...payload, res });
		} catch (error) {
			next(error);
		}
	}

	public async withdrawFunds(req: Request, res: Response, next: NextFunction) {
		const payload: IWithdrawFundsPayload = req.body;
		try {
			return await this.transactionService.withdrawFunds({ ...payload, res });
		} catch (error) {
			next(error);
		}
	}

	public async convertFunds(req: Request, res: Response, next: NextFunction) {
		const payload: IConvertFundsPayload = req.body;
		try {
			return await this.transactionService.convertFunds({ ...payload, res });
		} catch (error) {
			next(error);
		}
	}

	public async transferFunds(req: Request, res: Response, next: NextFunction) {
		const payload: ITransferFundsPayload = req.body;
		try {
			return await this.transactionService.transferFunds({ ...payload, res });
		} catch (error) {
			next(error);
		}
	}
}
