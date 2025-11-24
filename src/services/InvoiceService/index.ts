import { v4 as uuidv4 } from "uuid";
import { FilterQuery, PaginateResult } from "mongoose";
import Invoice, { IInvoice } from "../../models/Invoice";
import { InvoiceStatus, InvoiceType, TradeSide } from "../../config/enums";
import { Currency } from "../../config/interfaces";

export interface IGetUserInvoicesInput {
	userId: string;
	outstandingOnly?: boolean;
	status?: InvoiceStatus;
	page: number;
	limit: number;
	useMockData?: boolean;
}

export interface IInvoiceDoc {
	id: string;
	userId: string;
	amountDue: number;
	amountPaid: number;
	amountOutstanding: number;
	currency: Currency;
	tradeSide: TradeSide;
	tradePair: string;
	logoUrl: string;
	invoiceType: InvoiceType;
	createdAt: Date;
}

interface IBuildMockInvoicesArgs {
	userId: string;
	outstandingOnly?: boolean;
	status?: InvoiceStatus;
	page: number;
	limit: number;
}

interface IMockInvoice {
	id: string;
	userId: string;
	amountDue: number;
	amountPaid: number;
	amountOutstanding: number;
	currency: Currency;
	tradeSide: TradeSide;
	baseAsset: string;
	quoteCurrency: string;
	logoUrl: string;
	invoiceType: InvoiceType;
	createdAt: Date;
	status: InvoiceStatus;
}

export class InvoiceService {
	public async getUserInvoices({
		userId,
		outstandingOnly,
		status,
		page,
		limit,
		useMockData,
	}: IGetUserInvoicesInput): Promise<PaginateResult<IInvoiceDoc>> {
		if (useMockData) {
			return this.buildMockInvoices({ userId, outstandingOnly, status, page, limit });
		}

		const filters: FilterQuery<IInvoice> = { userId };

		if (outstandingOnly) {
			filters.amountOutstanding = { $gt: 0 };
		}

		if (status) {
			filters.status = status;
		}

		const invoices = await Invoice.paginate(filters, {
			page,
			limit,
			sort: { createdAt: -1 },
		});

		const docs = invoices.docs.map((invoice) => this.mapToInvoiceListItem(invoice));

		const invoicesData = {
			...invoices,
			docs,
		};

		return invoicesData;
	}

	private buildMockInvoices({
		userId,
		outstandingOnly,
		status,
		page,
		limit,
	}: IBuildMockInvoicesArgs): PaginateResult<IInvoiceDoc> {
		const MILLISECONDS_PER_MINUTE = 1000 * 60;
		const MILLISECONDS_PER_HOUR = MILLISECONDS_PER_MINUTE * 60;
		const MILLISECONDS_PER_DAY = MILLISECONDS_PER_HOUR * 24;

		const now = new Date();
		const mockInvoices: IMockInvoice[] = [
			{
				id: uuidv4(),
				userId,
				invoiceType: InvoiceType.PROFIT_SHARE,
				currency: Currency.USDT,
				amountDue: 150,
				amountPaid: 50,
				amountOutstanding: 100,
				status: InvoiceStatus.PENDING,
				tradeSide: TradeSide.LONG,
				baseAsset: "BTC",
				logoUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
				quoteCurrency: "USDT",
				createdAt: new Date(now.getTime() - MILLISECONDS_PER_DAY),
			},
			{
				id: uuidv4(),
				userId,
				invoiceType: InvoiceType.TRADING_FEE,
				currency: Currency.USDT,
				amountDue: 200,
				amountPaid: 180,
				amountOutstanding: 20,
				status: InvoiceStatus.PAID,
				tradeSide: TradeSide.SHORT,
				baseAsset: "ETH",
				logoUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
				quoteCurrency: "USDT",
				createdAt: new Date(now.getTime() - MILLISECONDS_PER_DAY * 2),
			},
			{
				id: uuidv4(),
				userId,
				invoiceType: InvoiceType.PROFIT_SHARE,
				currency: Currency.USDT,
				amountDue: 350,
				amountPaid: 150,
				amountOutstanding: 200,
				status: InvoiceStatus.PENDING,
				tradeSide: TradeSide.LONG,
				baseAsset: "BNB",
				logoUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png",
				quoteCurrency: "USDT",
				createdAt: new Date(now.getTime() - MILLISECONDS_PER_MINUTE * 30),
			},
			{
				id: uuidv4(),
				userId,
				invoiceType: InvoiceType.PROFIT_SHARE,
				currency: Currency.USDT,
				amountDue: 200,
				amountPaid: 200,
				amountOutstanding: 0,
				status: InvoiceStatus.PAID,
				tradeSide: TradeSide.SHORT,
				baseAsset: "ETH",
				logoUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
				quoteCurrency: "USDT",
				createdAt: new Date(now.getTime() - MILLISECONDS_PER_DAY * 2),
			},
		];

		let filteredInvoices = mockInvoices;

		if (outstandingOnly) {
			filteredInvoices = filteredInvoices.filter((invoice) => invoice.amountOutstanding > 0);
		}

		if (status) {
			filteredInvoices = filteredInvoices.filter((invoice) => invoice.status === status);
		}

		filteredInvoices = filteredInvoices
			.slice()
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

		const totalDocs = filteredInvoices.length;
		const totalPages = limit > 0 ? Math.ceil(totalDocs / limit) : 0;
		const pageNumber = Math.max(page, 1);
		const skip = (pageNumber - 1) * limit;
		const docs = filteredInvoices
			.slice(skip, skip + limit)
			.map((invoice) => this.mapToInvoiceListItem(invoice));

		const hasPrevPage = pageNumber > 1 && totalDocs > 0;
		const hasNextPage = pageNumber < totalPages;

		const res = {
			docs,
			totalDocs,
			limit,
			page: pageNumber,
			totalPages,
			pagingCounter: totalDocs === 0 ? 0 : skip + 1,
			hasPrevPage,
			hasNextPage,
			prevPage: hasPrevPage ? pageNumber - 1 : null,
			nextPage: hasNextPage ? pageNumber + 1 : null,
			offset: skip,
		};

		return res;
	}

	private mapToInvoiceListItem(invoice: IInvoice | IMockInvoice): IInvoiceDoc {
		const invoiceData =
			typeof (invoice as IInvoice).toObject === "function"
				? (invoice as IInvoice).toObject<IInvoice>({
						virtuals: true,
						transform: (_, r) => {
							delete r._id;
							return r;
						},
				  })
				: invoice;
		const { id } = invoiceData;
		const tradePair =
			invoiceData.baseAsset && invoiceData.quoteCurrency
				? `${invoiceData.baseAsset}/${invoiceData.quoteCurrency}`
				: invoiceData.baseAsset ?? "";
		const createdAt =
			invoiceData.createdAt instanceof Date
				? invoiceData.createdAt
				: new Date(invoiceData.createdAt);

		return {
			id,
			userId: invoiceData.userId,
			amountDue: invoiceData.amountDue,
			amountPaid: invoiceData.amountPaid,
			amountOutstanding: invoiceData.amountOutstanding,
			currency: invoiceData.currency,
			tradeSide: invoiceData.tradeSide,
			tradePair,
			logoUrl: invoiceData.logoUrl,
			invoiceType: invoiceData.invoiceType,
			createdAt,
		};
	}
}
