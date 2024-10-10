import { Firestore } from "@google-cloud/firestore"; // or the correct path for your Firestore import
import { COLLECTIONS } from "../config/constants";
import { ITransaction } from "../schemas/transaction";

export class DbService {
	constructor(private readonly db: Firestore) {}

	public async getUserTransactions(userId: string) {
		try {
			const docs = await this.db
				.collection(COLLECTIONS.transactions)
				.where("userId", "==", userId)
				.get();

			const transactions: ITransaction[] = [];
			if (docs.empty) {
				return null;
			}

			docs.forEach((doc) => {
				const data = doc.data();
				transactions.push({
					id: doc.id,
					...data,
					transactionId: data.transactionId,
					userId: data.userId,
					fromCurrency: data.fromCurrency,
					fromAmount: data.fromAmount,
					type: data.type,
					timestamp: "",
					status: data.status,
					transactionWalletType: data.transactionWalletType,
				});
			});

			return transactions;
		} catch (error: any) {
			throw new Error(`Error with getting user transactions: ${error.message}`);
		}
	}
}
