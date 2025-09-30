import mongoose, { Document, Schema } from "mongoose";
import { InvoiceStatus, InvoiceType, TradeSide } from "../config/enums";
import { Currency } from "../config/interfaces";

export interface IInvoice extends Document {
	id: string;
	userId: string;
	invoiceType: InvoiceType;
	currency: Currency; // Currency to be paid in
	amountDue: number;
	amountPaid: number;
	amountOutstanding: number; // amountDue - amountPaid
	status: InvoiceStatus;
	tradeId: string;
	tradeSide: TradeSide;
	baseAsset: string; // Asset that is being traded
	logoUrl: string; // Logo of the baseAsset
	quoteCurrency: string; // Currency in which the baseAsset is priced
	createdAt: string;
	updatedAt: string;
}

const currencySchema = new Schema<IInvoice>(
	{
		userId: { type: String, required: true },
		invoiceType: { type: String, required: true },
		currency: { type: String, required: true },
		amountDue: { type: Number, required: true },
		amountPaid: { type: Number, required: true },
		amountOutstanding: { type: Number, required: true },
		status: { type: String, required: true },
		tradeId: { type: String, required: true },
		tradeSide: { type: String, required: true },
		baseAsset: { type: String, required: true },
		logoUrl: { type: String, required: true },
		quoteCurrency: { type: String, required: true },
	},
	{ timestamps: true, versionKey: false }
);

// Override the toJSON method to map _id to id
currencySchema.set("toJSON", {
	transform: (doc, ret) => {
		ret.id = ret._id; // Map _id to id
		delete ret._id; // Remove _id from the response
		delete ret.__v; // Optionally remove __v
		return ret;
	},
});

export default mongoose.model<IInvoice>("invoice", currencySchema);
