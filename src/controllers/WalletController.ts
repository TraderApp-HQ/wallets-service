import { Request, Response, NextFunction } from "express";
// import { firebase } from "../firebase";
import { apiResponseHandler } from "@traderapp/shared-resources";
import { ResponseType } from "../config/constants";
import { UserWallet } from "../schemas/wallet";

// A function to get wallet information
export async function getWallets(req: Request, res: Response, next: NextFunction) {
	// get firebase db ref
	// const { db } = await firebase();

	// const { currency, walletType, page } = req.query;

	try {
		// get all wallet records
		// const docs = await db
		// 	.collection("wallets")
		// 	.where("currency", "==", `${currency}`)
		// 	.where("walletType", "==", `${walletType}`)
		// 	.get();

		// 	console.log('docs', docs)
		// 	if (docs.empty) {
		// 		const error = new Error("No wallets available");
		// 		error.name = "Not Found";
		// 		throw error;
		// 	}

		const wallets: UserWallet[] = [];

		res.status(200).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				message: "List of wallets!",
				object: { wallets },
			})
		);
	} catch (error: any) {
		next(error);
	}
}
