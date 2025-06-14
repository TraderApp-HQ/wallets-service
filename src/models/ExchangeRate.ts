import mongoose, { Document, Schema } from "mongoose";

export interface IExchangeRate extends Document {
	pair: string; // e.g., "BTC/USD", "BTC/EUR", "USDT/USD", USDT/EUR
	rate: number; // e.g., 45000.00
}

const exchangeRateSchema = new Schema<IExchangeRate>(
	{
		pair: { type: String, required: true, unique: true },
		rate: { type: Number, required: true },
	},
	{ timestamps: true, versionKey: false }
);

export default mongoose.model<IExchangeRate>("exchange-rate", exchangeRateSchema);
