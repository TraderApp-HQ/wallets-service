import { Request, Response, NextFunction } from "express";
import { WalletService } from "../services/WalletService";

export class WalletController {
	private readonly walletService: WalletService;

	constructor(walletService: WalletService) {
		this.walletService = walletService;
	}

	public async createUserWallet(req: Request, res: Response, next: NextFunction) {
		const { userId } = req.body;

		return await this.walletService.createUserWallet(userId, res);
	}

	public async getUserWallets(req: Request, res: Response, next: NextFunction) {
		const { userId } = req.body;

		return await this.walletService.getWalletBalance(userId, res);
	}
}
