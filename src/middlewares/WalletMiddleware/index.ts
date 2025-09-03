import { Request, Response, NextFunction } from "express";
import { checkAdmin, checkUser } from "../helpers";
import Joi from "joi";
import { WalletType } from "../../config/interfaces";
import { CurrencyCategory, PaymentCategoryName, PaymentOperation } from "../../config/enums";

export const validateGetUserWalletsRequest = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const userId = req.query.userId as string;
	const schema = Joi.object({
		userId: Joi.string().label("userId"),
	});

	const { error } = schema.validate({ userId });

	if (error) {
		error.message = error.message.replace(/\"/g, "");
		next(error);
		return;
	}

	try {
		let id = userId;
		if (userId) await checkAdmin(req);
		else id = (await checkUser(req)).id;
		req.query.userId = id;
		next();
	} catch (err) {
		next(err);
	}
};

export const validateGetUserWalletTypeRequest = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const userId = req.query.userId as string;
	const type = req.query.type as string;
	const schema = Joi.object({
		userId: Joi.string().label("userId"),
		type: Joi.string()
			.valid(...Object.values(WalletType))
			.required()
			.label("Wallet Type"),
	});

	const { error } = schema.validate({ userId, type });

	if (error) {
		error.message = error.message.replace(/\"/g, "");
		next(error);
		return;
	}

	try {
		let id = userId;
		if (userId) await checkAdmin(req);
		else id = (await checkUser(req)).id;
		req.query.userId = id;
		next();
	} catch (err) {
		next(err);
	}
};

export const validateGetWalletCategoryPaymentMethodsRequest = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const category = req.query.category as PaymentCategoryName;
	const operation = req.query.operation as PaymentOperation;
	const schema = Joi.object({
		category: Joi.string()
			.valid(...Object.values(PaymentCategoryName))
			.required()
			.label("Payment Category"),
		operation: Joi.string()
			.valid(...Object.values(PaymentOperation))
			.label("Payment Operation"),
	});

	const { error } = schema.validate({ category, operation });

	if (error) {
		error.message = error.message.replace(/\"/g, "");
		next(error);
		return;
	}

	try {
		const id = (await checkUser(req)).id;
		req.query.userId = id;
		next();
	} catch (err) {
		next(err);
	}
};

export const validateInitiateDepositRequest = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const { userId, currencyId, paymentMethodId, providerId, network } = req.body;
	const schema = Joi.object({
		userId: Joi.string().label("userId"),
		currencyId: Joi.string().required().label("Currency Id"),
		paymentMethodId: Joi.string().required().label("Payment Method Id"),
		providerId: Joi.string().required().label("Provider Id"),
		network: Joi.string().label("Network"),
		amount: Joi.number().label("Amount"),
	});

	const { error } = schema.validate({ userId, currencyId, paymentMethodId, providerId, network });

	if (error) {
		error.message = error.message.replace(/\"/g, "");
		next(error);
		return;
	}

	try {
		// await checkUser(req);
		const id = (await checkUser(req)).id;
		req.body.userId = userId || id;
		next();
	} catch (err) {
		next(err);
	}
};

export const validateRequest = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const id = (await checkUser(req)).id;
		req.body.userId = id;
		next();
	} catch (err) {
		next(err);
	}
};

export const validateGetWalletSupportedCurrencies = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const category = req.query.category as CurrencyCategory;
	const schema = Joi.object({
		category: Joi.string()
			.valid(...Object.values(CurrencyCategory))
			.required()
			.label("Currency Category"),
	});

	const { error } = schema.validate({ category });

	if (error) {
		error.message = error.message.replace(/\"/g, "");
		next(error);
		return;
	}

	try {
		await checkUser(req);
		next();
	} catch (err) {
		next(err);
	}
};

export const validateGetTransactionRequest = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const transactionId = req.query.transactionId as string;
	const userId = req.query.userId as string;
	const schema = Joi.object({
		transactionId: Joi.string().label("transactionId").required(),
		userId: Joi.string().label("userId").optional(),
	});

	const { error } = schema.validate({ transactionId, userId });

	if (error) {
		error.message = error.message.replace(/\"/g, "");
		next(error);
		return;
	}

	try {
		let id = userId;
		if (userId) {
			await checkAdmin(req);
		} else {
			id = (await checkUser(req)).id;
		}

		req.query.userId = id;
		next();
	} catch (err) {
		next(err);
	}
};

export const validateInitiateWithdrawalRequest = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const {
		userId,
		currencyId,
		paymentMethodId,
		providerId,
		network,
		amount,
		amountToReceive,
		destinationAddress,
	} = req.body;

	const schema = Joi.object({
		userId: Joi.string().label("User ID"),
		currencyId: Joi.string().required().label("Currency ID"),
		paymentMethodId: Joi.string().required().label("Payment Method ID"),
		providerId: Joi.string().required().label("Provider ID"),
		network: Joi.string().label("Network"),
		amount: Joi.number().positive().required().label("Amount"),
		amountToReceive: Joi.number().positive().required().label("Amount To Receive"),
		destinationAddress: Joi.string().required().label("Destination Address"),
	});

	const { error } = schema.validate({
		userId,
		currencyId,
		paymentMethodId,
		providerId,
		network,
		amount,
		amountToReceive,
		destinationAddress,
	});
	if (error) {
		error.message = error.message.replace(/\\"/g, "");
		next(error);
		return;
	}

	try {
		const { id, email } = await checkUser(req);
		req.body.userId = userId || id;
		req.body.userEmail = email;
		next();
	} catch (err) {
		next(err);
	}
};

export const validateCompleteWithdrawalRequest = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const { userId, otp, withdrawalRequestId } = req.body;

	const schema = Joi.object({
		userId: Joi.string().label("User ID"),
		otp: Joi.string().length(6).required().label("OTP"),
		withdrawalRequestId: Joi.string().required().label("Withdrawal Request ID"),
	});

	const { error } = schema.validate({
		userId,
		otp,
		withdrawalRequestId,
	});
	if (error) {
		error.message = error.message.replace(/\\"/g, "");
		next(error);
		return;
	}

	try {
		const { id } = await checkUser(req);
		req.body.userId = userId || id;
		next();
	} catch (err) {
		next(err);
	}
};
