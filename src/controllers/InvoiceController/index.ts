import { NextFunction, Request, Response } from "express";
import { apiResponseHandler } from "@traderapp/shared-resources";
import { PAGINATION, ResponseType } from "../../config/constants";
import { HttpStatus } from "../../utils/httpStatus";
import { InvoiceService } from "../../services/InvoiceService";
import { ErrorName } from "../../config/enums";
import { ApplicationError } from "../../config/helpers";

const invoiceService = new InvoiceService();

export const getUserInvoices = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const userId = res.locals.invoiceUserId as string | undefined;

		if (!userId) {
			throw ApplicationError({
				name: ErrorName.UNAUTHORIZED,
				message: "Unable to resolve user context",
			});
		}

		const filters = res.locals.invoiceFilters ?? {};
		const pagination = res.locals.invoicePagination ?? {
			page: PAGINATION.PAGE,
			limit: PAGINATION.LIMIT,
		};
		const useMockData = true;

		const invoices = await invoiceService.getUserInvoices({
			userId,
			outstandingOnly: filters.outstandingOnly,
			status: filters.status,
			page: pagination.page,
			limit: pagination.limit,
			useMockData,
		});

		return res.status(HttpStatus.OK).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				message: "Invoices retrieved successfully",
				object: invoices,
			})
		);
	} catch (error) {
		next(error);
	}
};
