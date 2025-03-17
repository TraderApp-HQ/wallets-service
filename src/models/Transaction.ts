// src/models/Transaction.ts
import mongoose, { Document, Schema } from "mongoose";
import {
	TransactionType,
	TransactionStatus,
	TransactionSource,
	WalletType,
} from "../config/interfaces";

export interface ITransaction extends Document {
	id: string;
	transactionNetwork: string;
	userId: string;
	fromWallet?: WalletType;
	toWallet?: WalletType;
	currencyName: string;
	fromCurrencyName?: string;
	toCurrencyName?: string;
	conversionRate?: number;
	amount: number;
	fromAmount?: number;
	toAmount?: number;
	transactionType: TransactionType;
	fromWalletAddress?: string;
	toWalletAddress?: string;
	status: TransactionStatus;
	transactionSource: TransactionSource;
	paymentCategoryName: string;
	paymentMethodName: string;
	paymentProviderName: string;
}

const transactionSchema = new Schema<ITransaction>(
	{
		transactionNetwork: { type: String, required: true },
		userId: { type: String, required: true },
		fromWallet: { type: String, enum: Object.values(WalletType) },
		toWallet: { type: String, enum: Object.values(WalletType) },
		currencyName: { type: String, required: true },
		fromCurrencyName: { type: String },
		toCurrencyName: { type: String },
		amount: { type: Number, required: true },
		fromAmount: { type: Number },
		toAmount: Number,
		conversionRate: Number,
		transactionType: { type: String, enum: Object.values(TransactionType), required: true },
		fromWalletAddress: String,
		toWalletAddress: String,
		status: {
			type: String,
			enum: Object.values(TransactionStatus),
			required: true,
			default: TransactionStatus.PENDING,
		},
		transactionSource: {
			type: String,
			enum: Object.values(TransactionSource),
			required: true,
		},
		paymentCategoryName: { type: String, required: true },
		paymentMethodName: { type: String, required: true },
		paymentProviderName: { type: String, required: true },
	},
	{ timestamps: true }
);

// Add indexes for commonly queried fields
transactionSchema.index({
	transactionId: 1,
	userId: 1,
	type: 1,
	status: 1,
	timestamp: 1,
	fromCurrency: 1,
	toCurrency: 1,
	transactionNetwork: 1,
	createdAt: 1,
});

// Add compound indexes for specific query patterns
transactionSchema.index({ userId: 1, status: 1, createdAt: -1 }); // For user transaction history
transactionSchema.index({ status: 1, timestamp: 1 }); // For processing pending transactions
transactionSchema.index({ status: 1 });
transactionSchema.index({ paymentCategoryName: 1 });
transactionSchema.index({ paymentMethodName: 1 });
transactionSchema.index({ paymentProviderName: 1 });

// Override the toJSON method to map _id to id
transactionSchema.set("toJSON", {
	transform: (doc, ret) => {
		ret.id = ret._id; // Map _id to id
		delete ret._id; // Remove _id from the response
		delete ret.__v; // Optionally remove __v
		return ret;
	},
});

export default mongoose.model<ITransaction>("Transaction", transactionSchema);
