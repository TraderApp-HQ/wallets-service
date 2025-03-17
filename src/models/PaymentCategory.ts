import mongoose, { Document, Schema } from "mongoose";

export interface IPaymentCategory extends Document {
	id: string;
	name: string; // e.g., "CRYPTO", "WALLETS"
}

const paymentCategorySchema = new Schema<IPaymentCategory>(
	{
		name: { type: String, required: true, unique: true },
	},
	{ timestamps: true, versionKey: false }
);

// Override the toJSON method to map _id to id
paymentCategorySchema.set("toJSON", {
	transform: (doc, ret) => {
		ret.id = ret._id; // Map _id to id
		delete ret._id; // Remove _id from the response
		delete ret.__v; // Optionally remove __v
		return ret;
	},
});

paymentCategorySchema.index({ id: 1 }); // Index for querying by id

export default mongoose.model<IPaymentCategory>("payment-category", paymentCategorySchema);
