import { Request, Response, NextFunction } from "express";
import { firebase } from "../firebase";
import { apiResponseHandler } from "@traderapp/shared-resources";
import { ResponseType } from "../config/constants";

// trading fees value in %
const TRADING_FEES = 0.5;

// A function to check balance, deduct/add order amount and fees
export async function processOrder(req: Request, res: Response, next: NextFunction) {
	// get firebase db ref
	const { db } = await firebase();

	const { userId, currencyId, amount, transactionType } = req.body;

	// new amount after fees is deducted
	let newAmount;

	// walletId of user wallet
	let walletId: string = "";

	// wallet balance
	let balance;

	try {
		// get user balance on the selected currency
		const docs = await db
			.collection("balances")
			.where("userId", "==", `${userId}`)
			.where("currencyId", "==", currencyId)
			.where("canTrade", "==", true)
			.get();

		if (docs.empty) {
			const error = new Error("Balance not tradable");
			error.name = "Forbidden";
			throw error;
		}

		// loop through results and get the first item
		docs.forEach((doc) => {
			// get wallet balance
			balance = doc.data()?.amount as number;
			walletId = doc.id;

			// check transaction type and debit/credit balance
			if (transactionType === "DEBIT") {
				balance -= amount;
			} else {
				balance += amount;
			}

			// deduct trading fees from amount
			newAmount = amount - (amount * TRADING_FEES) / 100;
		});

		// update balance in db
		await db.collection("balances").doc(walletId).update({ amount: balance });

		res.status(200).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				message: "Wallet was placed successfully!",
				object: { userId, currencyId, amount: newAmount },
			})
		);
	} catch (error: any) {
		next(error);
	}
}
