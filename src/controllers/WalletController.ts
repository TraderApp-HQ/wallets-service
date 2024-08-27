import { apiResponseHandler } from "@traderapp/shared-resources";
import { Request, Response, NextFunction } from "express";
import { ResponseType } from "../config/constants";
import { WalletService } from "../services/WalletService";
import { HttpStatus } from "../utils/httpStatus";

export class WalletController {
	private readonly walletService: WalletService;

	constructor(walletService: WalletService) {
		this.walletService = walletService;
	}

	public async createUserWallet(req: Request, res: Response, next: NextFunction) {
		const { userId } = req.body;
		try {
			const wallets = await this.walletService.createUserWallet({ userId });
			if (!wallets) {
				return res.status(HttpStatus.BAD_REQUEST).json(
					apiResponseHandler({
						type: ResponseType.ERROR,
						message: "User wallet exists already",
					})
				);
			}
			return res.status(HttpStatus.OK).json(
				apiResponseHandler({
					type: ResponseType.SUCCESS,
					message: "User wallet(s) created successfully!",
					object: { wallets },
				})
			);
		} catch (error) {
			next(error);
		}
	}

	public async getUserWallets(req: Request, res: Response, next: NextFunction) {
		const { userId } = req.body;
		try {
			const wallets = await this.walletService.getWalletBalance({ userId });
			if (!wallets) {
				return res.status(200).json(
					apiResponseHandler({
						type: ResponseType.SUCCESS,
						message: "No existing wallets found!",
					})
				);
			}
			return res.status(200).json(
				apiResponseHandler({
					type: ResponseType.SUCCESS,
					message: "List of user wallets!",
					object: { wallets },
				})
			);
		} catch (error) {
			next(error);
		}
	}
}
