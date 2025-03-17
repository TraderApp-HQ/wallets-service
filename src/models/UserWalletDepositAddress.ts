import mongoose, { Document, Schema } from "mongoose";

export interface IUserWalletDepositAddress extends Document {
	id: string;
	userId: string;
	paymentMethod: mongoose.Types.ObjectId;
	provider: mongoose.Types.ObjectId;
	paymentCategoryName: string;
	paymentMethodName: string;
	paymentProviderName: string;
	isActive: boolean;
	walletAddress?: string;
	networkName?: string;
	networkSlug?: string;
	paymentUrl?: string;
	shouldRedirect: boolean;
}

const userWalletDepositAddressSchema = new Schema<IUserWalletDepositAddress>(
	{
		userId: { type: String, required: true },
		paymentMethod: { type: Schema.Types.ObjectId, ref: "payment-method", required: true },
		provider: { type: Schema.Types.ObjectId, ref: "payment-provider", required: true },
		walletAddress: { type: String },
		networkName: { type: String },
		paymentUrl: { type: String },
		isActive: { type: Boolean, default: true },
		shouldRedirect: { type: Boolean, default: false },
		paymentCategoryName: { type: String },
		paymentMethodName: { type: String },
		paymentProviderName: { type: String },
	},
	{ timestamps: true }
);

userWalletDepositAddressSchema.index(
	{ userId: 1, paymentMethod: 1, provider: 1 },
	{ unique: true }
);
userWalletDepositAddressSchema.index({ userId: 1, paymentMethod: 1, provider: 1, networkName: 1 });
userWalletDepositAddressSchema.index({ paymentMethodName: 1 });
userWalletDepositAddressSchema.index({ paymentProviderName: 1 });
userWalletDepositAddressSchema.index({ walletAddress: 1 });

// Override the toJSON method to map _id to id
userWalletDepositAddressSchema.set("toJSON", {
	transform: (doc, ret) => {
		ret.id = ret._id; // Map _id to id
		delete ret._id; // Remove _id from the response
		delete ret.__v; // Optionally remove __v
		return ret;
	},
});

export default mongoose.model<IUserWalletDepositAddress>(
	"user-wallet-deposit-address",
	userWalletDepositAddressSchema
);
