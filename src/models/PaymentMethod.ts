import mongoose, { Document, Schema } from "mongoose";

export interface IPaymentMethod extends Document {
	id: string; // This will be the same as _id
	name: string;
	symbol: string;
	logoUrl: string;
	category: mongoose.Types.ObjectId;
}

const paymentMethodSchema = new Schema<IPaymentMethod>(
	{
		name: { type: String, required: true },
		symbol: { type: String, required: true },
		logoUrl: String,
		category: { type: Schema.Types.ObjectId, ref: "payment-category", required: true },
	},
	{ timestamps: true, versionKey: false }
);

// Override the toJSON method to map _id to id
paymentMethodSchema.set("toJSON", {
	transform: (doc, ret) => {
		ret.id = ret._id; // Map _id to id
		delete ret._id; // Remove _id from the response
		delete ret.__v; // Optionally remove __v
		return ret;
	},
});

paymentMethodSchema.index({ id: 1 }); // Index for querying by id
paymentMethodSchema.index({ category: 1 }); // Index for querying by categoryId

export default mongoose.model<IPaymentMethod>("payment-method", paymentMethodSchema);
