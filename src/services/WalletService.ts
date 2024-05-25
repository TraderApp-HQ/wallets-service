import { apiResponseHandler } from "@traderapp/shared-resources";
import { COLLECTIONS, ResponseType } from "../config/constants";
import { db } from "../firebase";
import { BaseInput, IWalletInput } from "../schemas";
import { Currency } from "../schemas/currency";
import { UserWallet, WalletType } from "../schemas/wallet";
import { HttpStatus } from "../utils/httpStatus";

export class WalletService {
	public async createUserWallet({ userId, res }: IWalletInput): Promise<any> {
		try {
			const wallets = await this.getUserWalletBalance({ userId });
			if (wallets) {
				return res.status(HttpStatus.BAD_REQUEST).json(
					apiResponseHandler({
						type: ResponseType.ERROR,
						message: "User wallet exists already",
					})
				);
			}
			const walletCombinations = this.generateWalletCombinations({ userId });
			for (const wallet of walletCombinations) {
				await db.collection(COLLECTIONS.wallets).add(wallet);
			}
			return res.status(HttpStatus.OK).json(
				apiResponseHandler({
					type: ResponseType.SUCCESS,
					message: "User wallet(s) created successfully!",
					object: { walletCombinations },
				})
			);
		} catch (error: any) {
			throw new Error(`Error creating wallet: ${error.message}`);
		}
	}

	public async getWalletBalance({ userId, res }: IWalletInput): Promise<any> {
		try {
			const wallets = await this.getUserWalletBalance({ userId });
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
		} catch (error: any) {
			throw new Error(error.message);
		}
	}

	public async getUserWalletBalance({ userId }: BaseInput): Promise<UserWallet[] | null> {
		try {
			const docs = await db
				.collection(COLLECTIONS.wallets)
				.where("userId", "==", `${userId}`)
				.get();

			const wallets: UserWallet[] = [];

			if (docs.empty) {
				return null;
			}

			docs.forEach((doc) => {
				wallets.push(doc.data() as UserWallet);
			});

			return wallets;
		} catch (error: any) {
			throw new Error(error.message);
		}
	}

	private generateWalletCombinations({ userId }: BaseInput): UserWallet[] {
		const walletTypes = Object.values(WalletType);
		const currencies = Object.values(Currency);
		const walletCombinations: UserWallet[] = [];

		walletTypes.forEach((walletType) => {
			currencies.forEach((currency) => {
				return walletCombinations.push({
					userId,
					walletType,
					currency,
					balance: 0.0,
					createdAt: new Date(),
				});
			});
		});

		return walletCombinations;
	}
}
