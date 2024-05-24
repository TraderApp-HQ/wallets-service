import { Request, Response, NextFunction } from "express";
import { TransactionService } from "../services/TransactionService";

export class TransactionController {
	private readonly transactionService: TransactionService;

	constructor(transactionService: TransactionService) {
		this.transactionService = transactionService;
	}

	public async getTransactions(req: Request, res: Response, next: NextFunction) {
		const { userId } = req.body;

		return await this.transactionService.getTransactions(userId, res);
	}

	public async depositFunds(req: Request, res: Response, next: NextFunction) {
		const { userId } = req.body;

		return await this.transactionService.depositFunds(userId, res);
	}

	public async withdrawFunds(req: Request, res: Response, next: NextFunction) {
		const { userId } = req.body;

		return await this.transactionService.withdrawFunds(userId, res);
	}

	public async convertFunds(req: Request, res: Response, next: NextFunction) {
		const { userId } = req.body;

		return await this.transactionService.convertFunds(userId, res);
	}

	public async transferFunds(req: Request, res: Response, next: NextFunction) {
		const { userId } = req.body;

		return await this.transactionService.transferFunds(userId, res);
	}
}
