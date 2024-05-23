import { Request, Response, NextFunction } from "express";
import { TransactionService } from "../services/TransactionService";

export class TransactionController {
	private readonly transactionService: TransactionService;

	constructor(transactionService: TransactionService) {
		this.transactionService = transactionService;
	}

	public async getTransactions(req: Request, res: Response, next: NextFunction) {
		const userId: string = "123456789";
		// const { userId } = req.body;

		return await this.transactionService.getTransactions(userId, res);
	}

	public async depositFunds(req: Request, res: Response, next: NextFunction) {
		const userId: string = "123456789";
		// const { userId } = req.body;

		return await this.transactionService.depositFunds(userId, res);
	}

	public async withdrawFunds(req: Request, res: Response, next: NextFunction) {
		const userId: string = "123456789";
		// const { userId } = req.body;

		return await this.transactionService.withdrawFunds(userId, res);
	}
}
