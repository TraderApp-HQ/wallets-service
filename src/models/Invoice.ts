import mongoose, { Document, Schema, Model, PaginateResult, PaginateOptions } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { InvoiceStatus, InvoiceType, TradeSide } from "../config/enums";
import { Currency } from "../config/interfaces";

export interface IInvoice extends Document {
	id: string;
	userId: string;
	invoiceType: InvoiceType;
	currency: Currency;
	amountDue: number;
	amountPaid: number;
	amountOutstanding: number;
	status: InvoiceStatus;
	tradeId: string;
	tradeSide: TradeSide;
	baseAsset: string;
	logoUrl: string;
	quoteCurrency: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface IInvoiceModel extends Model<IInvoice> {
	paginate: (query?: object, options?: PaginateOptions) => Promise<PaginateResult<IInvoice>>;
}

const invoiceSchema = new Schema<IInvoice>(
	{
		userId: { type: String, required: true, index: true },
		invoiceType: { type: String, required: true, enum: Object.values(InvoiceType) },
		currency: { type: String, required: true, enum: Object.values(Currency) },
		amountDue: { type: Number, required: true },
		amountPaid: { type: Number, required: true },
		amountOutstanding: { type: Number, required: true },
		status: { type: String, required: true, enum: Object.values(InvoiceStatus) },
		tradeId: { type: String, required: true },
		tradeSide: { type: String, required: true, enum: Object.values(TradeSide) },
		baseAsset: { type: String, required: true },
		logoUrl: { type: String, required: true },
		quoteCurrency: { type: String, required: true },
	},
	{
		timestamps: true,
		versionKey: false,
		toJSON: {
			virtuals: true,
			transform: (_doc, ret) => {
				delete ret._id;
				return ret;
			},
		},
	}
);

invoiceSchema.plugin(mongoosePaginate);

invoiceSchema.index({ userId: 1, createdAt: -1 });
invoiceSchema.index({ userId: 1, status: 1 });
invoiceSchema.index({ userId: 1, amountOutstanding: 1 });

export default mongoose.model<IInvoice, IInvoiceModel>("invoice", invoiceSchema);
