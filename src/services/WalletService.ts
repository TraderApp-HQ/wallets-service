import { COLLECTIONS } from "../config/constants";
import { db } from "../firebase";
import { BaseInput, IWalletInput } from "../schemas";
import { Currency } from "../schemas/currency";
import { UserWallet, WalletType } from "../schemas/wallet";

export class WalletService {
	public async createUserWallet({ userId }: IWalletInput): Promise<any> {
		try {
			const wallets = await this.getUserWalletBalance({ userId });
			if (wallets) {
				return null;
			}
			const walletCombinations = this.generateWalletCombinations({ userId });
			for (const wallet of walletCombinations) {
				await db.collection(COLLECTIONS.wallets).add(wallet);
			}
			return walletCombinations;
		} catch (error: any) {
			throw new Error(`Error creating wallet: ${error.message}`);
		}
	}

	public async getWalletBalance({ userId }: IWalletInput): Promise<any> {
		try {
			const wallets = await this.getUserWalletBalance({ userId });
			if (!wallets) {
				return null;
			}
			return wallets;
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
				const data = doc.data() as UserWallet;
				data.id = doc.id;
				wallets.push(data);
			});

			return wallets;
		} catch (error: any) {
			throw new Error(error.message);
		}
	}

	private generateWalletCombinations({ userId }: BaseInput): UserWallet[] {
		// Define the wallet type to currency mapping
		const walletTypeCurrency = {
			[WalletType.MAIN]: [Currency.BTC, Currency.ETH, Currency.USDT],
			[WalletType.SPOT]: [Currency.USDT],
			[WalletType.FUTURES]: [Currency.USDT],
		};
		const walletCombinations: UserWallet[] = [];

		for (const [walletType, currencies] of Object.entries(walletTypeCurrency)) {
			currencies.forEach((currency) => {
				walletCombinations.push({
					userId,
					walletType: walletType as WalletType,
					currency,
					balance: 0.0,
					createdAt: new Date(),
				});
			});
		}

		return walletCombinations;
	}
}
