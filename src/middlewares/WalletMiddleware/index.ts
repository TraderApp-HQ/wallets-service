import { Request, Response, NextFunction } from "express";
import { checkAdmin, checkUser } from "../helpers";
import Joi from "joi";
import { WalletType } from "../../config/interfaces";
import { PaymentCategoryName, PaymentOperation } from "../../config/enums";

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
		await checkUser(req);
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
	const { userId, currency, paymentMethodId, providerId, network } = req.body;
	const schema = Joi.object({
		userId: Joi.string().label("userId"),
		currency: Joi.string().required().label("Currency"),
		paymentMethodId: Joi.string().required().label("Payment Method Id"),
		providerId: Joi.string().required().label("Provider Id"),
		network: Joi.string().label("Network"),
		amount: Joi.number().label("Amount"),
	});

	const { error } = schema.validate({ userId, currency, paymentMethodId, providerId, network });

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
