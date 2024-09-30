import { COLLECTIONS } from "../config/constants";
import { db } from "../firebase";
import { BaseInput, IWalletInput } from "../schemas";
import { Currency } from "../schemas/currency";
import { UserWallet, WalletType } from "../schemas/wallet";

export class WalletService {
	public async createUserWallet({ userId }: BaseInput): Promise<any> {
		try {
			const walletCombinations = this.generateWalletCombinations({ userId });
			for (const wallet of walletCombinations) {
				await db.collection(COLLECTIONS.wallets).add(wallet);
			}
			return walletCombinations;
		} catch (error: any) {
			throw new Error(`Error creating wallet: ${error.message}`);
		}
	}

	public async getUserWalletBalance({
		userId,
		userType,
	}: IWalletInput): Promise<UserWallet[] | null> {
		try {
			let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection(
				COLLECTIONS.wallets
			);

			// Check if userType is provided
			if (!userType) {
				query = query.where("userId", "==", `${userId}`);
			}

			const docs = await query.get();

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
