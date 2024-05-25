import { Request, Response, NextFunction } from "express";
import { TransactionService } from "../services/TransactionService";

export class TransactionController {
	private readonly transactionService: TransactionService;

	constructor(transactionService: TransactionService) {
		this.transactionService = transactionService;
	}

	public async getTransactions(req: Request, res: Response, next: NextFunction) {
		const { userId } = req.body;
		try {
			return await this.transactionService.getTransactions({ userId, res });
		} catch (error) {
			next(error);
		}
	}

	public async depositFunds(req: Request, res: Response, next: NextFunction) {
		const { userId } = req.body;
		try {
			return await this.transactionService.depositFunds({ userId, res });
		} catch (error) {
			next(error);
		}
	}

	public async withdrawFunds(req: Request, res: Response, next: NextFunction) {
		const { userId } = req.body;
		try {
			return await this.transactionService.withdrawFunds({ userId, res });
		} catch (error) {
			next(error);
		}
	}

	public async convertFunds(req: Request, res: Response, next: NextFunction) {
		const { userId } = req.body;
		try {
			return await this.transactionService.convertFunds({ userId, res });
		} catch (error) {
			next(error);
		}
	}

	public async transferFunds(req: Request, res: Response, next: NextFunction) {
		const { userId } = req.body;
		try {
			return await this.transactionService.transferFunds({ userId, res });
		} catch (error) {
			next(error);
		}
	}
}
