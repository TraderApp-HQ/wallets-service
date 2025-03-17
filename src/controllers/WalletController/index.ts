import { NextFunction, Request, Response } from "express";
import { apiResponseHandler } from "@traderapp/shared-resources";
import { ResponseType } from "../../config/constants";
import { WalletService } from "../../services/WalletService";
import { HttpStatus } from "../../utils/httpStatus";
import { WalletType } from "../../config/interfaces";
import { PaymentCategoryName, PaymentOperation } from "../../config/enums";

const walletService = new WalletService();

export const createUserWallets = async (req: Request, res: Response, next: NextFunction) => {
	try {
		// const { userId } = req.body;
		// const wallet = await walletService.createUserWallet({ userId });

		return res.status(HttpStatus.CREATED).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				message: "Wallet created successfully",
			})
		);
	} catch (error: any) {
		next(error);
	}
};

export const getUserWallets = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const userId = req.query.userId as string;
		const wallet = await walletService.getUserWalletBalances({ userId });

		return res.status(HttpStatus.OK).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				message: "Wallet retrieved successfully",
				object: wallet,
			})
		);
	} catch (error: any) {
		next(error);
	}
};

export const getUserWalletType = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const userId = req.query.userId as string;
		const walletTypeName = req.query.type as WalletType;
		const wallet = await walletService.getUserWalletTypeBalances({ userId, walletTypeName });

		return res.status(HttpStatus.OK).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				message: "Wallet retrieved successfully",
				object: wallet,
			})
		);
	} catch (error: any) {
		next(error);
	}
};

export const getWalletPaymentCategories = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const paymentCategories = await walletService.getWalletPaymentCategories();

		return res.status(HttpStatus.OK).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				message: "Payment methods retrieved successfully",
				object: paymentCategories,
			})
		);
	} catch (error: any) {
		next(error);
	}
};

export const getWalletPaymentCategoryPaymentMethods = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const category = req.query.category as PaymentCategoryName;
		const operation = req.query.operation as PaymentOperation;
		console.log("varables sent over: ", category, operation);
		const paymentMethods = await walletService.getWalletPaymentCategoryPaymentMethods({
			category,
			operation,
		});

		return res.status(HttpStatus.OK).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				message: "Payment methods retrieved successfully",
				object: paymentMethods,
			})
		);
	} catch (error: any) {
		next(error);
	}
};

export const initiateDeposit = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { userId, currency, network, providerId, paymentMethodId } = req.body;
		const walletService = new WalletService();

		const depositDetails = await walletService.initiateDeposit({
			userId,
			currency,
			network,
			providerId,
			paymentMethodId,
		});

		return res.status(HttpStatus.OK).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				message: "Deposit address generated successfully",
				object: depositDetails,
			})
		);
	} catch (error: any) {
		next(error);
	}
};

export const initiateWithdrawal = async (req: Request, res: Response, next: NextFunction) => {
	try {
		// const { userId, currency, amount } = req.body;
		// const walletService = new WalletService();

		// First debit the user's wallet
		// await walletService.createUserWallet({ userId: "user-1234" });

		// TODO: Initiate withdrawal through CryptoPay API

		return res.status(HttpStatus.OK).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				message: "Withdrawal initiated successfully",
			})
		);
	} catch (error: any) {
		next(error);
	}
};
