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
import { WalletService } from "../services/WalletService";
import { HttpStatus } from "../utils/httpStatus";

export class TransactionController {
	private readonly transactionService: TransactionService;
	private readonly walletService: WalletService;

	constructor(transactionService: TransactionService, walletService: WalletService) {
		this.transactionService = transactionService;
		this.walletService = walletService;
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
			const transaction = await this.transactionService.depositFunds(payload);
			return res.status(HttpStatus.OK).json(
				apiResponseHandler({
					type: ResponseType.SUCCESS,
					message: "Deposit transaction submitted for processing!",
					object: { transaction },
				})
			);
		} catch (error) {
			next(error);
		}
	}

	public async withdrawFunds(req: Request, res: Response, next: NextFunction) {
		const payload: IWithdrawFundsPayload = req.body;
		try {
			const transaction = await this.transactionService.withdrawFunds(payload);
			return res.status(HttpStatus.OK).json(
				apiResponseHandler({
					type: ResponseType.SUCCESS,
					message: "Withdrawal transaction submitted for processing!!",
					object: { transaction },
				})
			);
		} catch (error) {
			next(error);
		}
	}

	public async convertFunds(req: Request, res: Response, next: NextFunction) {
		const payload: IConvertFundsPayload = req.body;
		try {
			const transaction = await this.transactionService.convertFunds(payload);

			return res.status(HttpStatus.OK).json(
				apiResponseHandler({
					type: ResponseType.SUCCESS,
					message: "Funds conversion completed successfully!",
					object: { transaction },
				})
			);
		} catch (error) {
			next(error);
		}
	}

	public async transferFunds(req: Request, res: Response, next: NextFunction) {
		const payload: ITransferFundsPayload = req.body;
		try {
			const transaction = await this.transactionService.transferFunds(payload);
			return res.status(HttpStatus.OK).json(
				apiResponseHandler({
					type: ResponseType.SUCCESS,
					message: "Funds transfer completed successfully!",
					object: { transaction },
				})
			);
		} catch (error) {
			next(error);
		}
	}
}
