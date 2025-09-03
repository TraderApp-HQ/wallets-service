import mongoose, { Document, Schema } from "mongoose";
import { WalletProvider } from "../config/enums";

export interface IPaymentProvider extends Document {
	id: string;
	name: WalletProvider; // e.g., "CryptoPay"
}

const paymentProviderSchema = new Schema<IPaymentProvider>(
	{
		name: { type: String, required: true, enum: WalletProvider },
	},
	{ timestamps: true, versionKey: false }
);

// Override the toJSON method to map _id to id
paymentProviderSchema.set("toJSON", {
	transform: (doc, ret) => {
		ret.id = ret._id; // Map _id to id
		delete ret._id; // Remove _id from the response
		delete ret.__v; // Optionally remove __v
		return ret;
	},
});

paymentProviderSchema.index({ id: 1 }); // Index for querying by id

export default mongoose.model<IPaymentProvider>("payment-provider", paymentProviderSchema);
