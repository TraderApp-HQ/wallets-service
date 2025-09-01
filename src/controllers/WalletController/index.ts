import { NextFunction, Request, Response } from "express";
import { apiResponseHandler } from "@traderapp/shared-resources";
import { ResponseType } from "../../config/constants";
import { WalletService } from "../../services/WalletService";
import { HttpStatus } from "../../utils/httpStatus";
import { WalletType } from "../../config/interfaces";
import { CurrencyCategory, PaymentCategoryName, PaymentOperation } from "../../config/enums";

export const createUserWallets = async (req: Request, res: Response, next: NextFunction) => {
	try {
		// const { userId } = req.body;
		// const walletService = new WalletService();
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
		const walletService = new WalletService();
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

		const walletService = new WalletService();
		const wallets = await walletService.getUserWalletTypeBalances({ userId, walletTypeName });

		return res.status(HttpStatus.OK).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				message: "Wallet retrieved successfully",
				object: wallets,
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
		const walletService = new WalletService();
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
		const userId = req.query.userId as string;

		const walletService = new WalletService();
		const paymentMethods = await walletService.getWalletPaymentCategoryPaymentMethods({
			category,
			operation,
			userId,
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
		const { userId, currencyId, network, providerId, paymentMethodId, amount } = req.body;
		const walletService = new WalletService();

		const depositDetails = await walletService.initiateDeposit({
			userId,
			currencyId,
			network,
			providerId,
			paymentMethodId,
			amount,
		});

		return res.status(HttpStatus.OK).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				message: "Deposit details generated successfully",
				object: depositDetails,
			})
		);
	} catch (error: any) {
		next(error);
	}
};

export const initiateWithdrawal = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const {
			userId,
			currencyId,
			paymentMethodId,
			providerId,
			network,
			amount,
			destinationAddress,
			userEmail,
		} = req.body;

		const walletService = new WalletService();

		const result = await walletService.initiateWithdrawalRequest({
			userId,
			currencyId,
			paymentMethodId,
			providerId,
			network,
			amount,
			userEmail,
			destinationAddress,
		});

		return res.status(HttpStatus.OK).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				message: "Withdrawal initiated successfully",
				object: result,
			})
		);
	} catch (error: any) {
		next(error);
	}
};

export const completeWithdrawal = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { userId, otp, withdrawalRequestId } = req.body;

		const walletService = new WalletService();
		const result = await walletService.completeWithdrawal({
			userId,
			otp,
			withdrawalRequestId,
		});

		return res.status(HttpStatus.OK).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				message: "Withdrawal initiated successfully",
				object: result,
			})
		);
	} catch (error) {
		next(error);
	}
};

export const getWalletSupportedCurrencies = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const category = req.query.category as CurrencyCategory;
		const walletService = new WalletService();
		const supportedCurrencies = await walletService.getWalletSupportedCurrencies({ category });

		return res.status(HttpStatus.OK).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				message: "Wallet supported currencies retrieved successfully",
				object: supportedCurrencies,
			})
		);
	} catch (error: any) {
		next(error);
	}
};
