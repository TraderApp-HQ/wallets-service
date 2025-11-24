import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { InvoiceStatus } from "../../config/enums";
import { PAGINATION } from "../../config/constants";
import { checkUser } from "../helpers";

interface InvoiceFilters {
	outstandingOnly?: boolean;
	status?: InvoiceStatus;
}

interface InvoicePagination {
	page: number;
	limit: number;
}

export const validateGetUserInvoicesRequest = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const schema = Joi.object({
		outstandingOnly: Joi.boolean().truthy("true").falsy("false").label("outstandingOnly"),
		status: Joi.string()
			.valid(...Object.values(InvoiceStatus))
			.label("status"),
		page: Joi.number().integer().min(1).label("page"),
		limit: Joi.number().integer().min(1).label("limit"),
	});

	const { error, value } = schema.validate({
		outstandingOnly: req.query.outstandingOnly,
		status: req.query.status,
		page: req.query.page,
		limit: req.query.limit,
	});

	if (error) {
		error.message = error.message.replace(/\"/g, "");
		next(error);
		return;
	}

	try {
		const { id: userId } = await checkUser(req);

		const filters: InvoiceFilters = {};
		const pagination: InvoicePagination = {
			page: value.page ?? PAGINATION.PAGE,
			limit: value.limit ?? PAGINATION.LIMIT,
		};

		if (typeof value.outstandingOnly === "boolean") {
			filters.outstandingOnly = value.outstandingOnly;
		}

		if (value.status) {
			filters.status = value.status as InvoiceStatus;
		}

		res.locals.invoiceFilters = filters;
		res.locals.invoicePagination = pagination;
		res.locals.invoiceUserId = userId;

		next();
	} catch (err) {
		next(err);
	}
};
