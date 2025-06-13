import mongoose, { Document, Schema } from "mongoose";

export interface IUserWalletDepositDetail extends Document {
	id: string;
	userId: string;
	paymentMethod: mongoose.Types.ObjectId;
	provider: mongoose.Types.ObjectId;
	paymentCategoryName: string;
	paymentMethodName: string;
	paymentProviderName: string;
	isActive: boolean;
	walletAddress?: string;
	network?: string;
	paymentUrl?: string;
	shouldRedirect: boolean;
	customWalletId?: string;
	externalWalletId?: string;
}

const userWalletDepositDetailSchema = new Schema<IUserWalletDepositDetail>(
	{
		userId: { type: String, required: true },
		paymentMethod: { type: Schema.Types.ObjectId, ref: "payment-method", required: true },
		provider: { type: Schema.Types.ObjectId, ref: "payment-provider", required: true },
		walletAddress: { type: String },
		network: { type: String },
		paymentUrl: { type: String },
		isActive: { type: Boolean, default: true },
		shouldRedirect: { type: Boolean, default: false },
		paymentCategoryName: { type: String },
		paymentMethodName: { type: String },
		paymentProviderName: { type: String },
		customWalletId: { type: String },
		externalWalletId: { type: String },
	},
	{ timestamps: true, versionKey: false }
);

userWalletDepositDetailSchema.index(
	{ userId: 1, paymentMethod: 1, provider: 1, network: 1 },
	{ unique: true }
);
userWalletDepositDetailSchema.index({ paymentMethodName: 1 });
userWalletDepositDetailSchema.index({ paymentProviderName: 1 });
userWalletDepositDetailSchema.index({ walletAddress: 1 });
userWalletDepositDetailSchema.index({ customWalletId: 1 });
userWalletDepositDetailSchema.index({ externalWalletId: 1 });

// Override the toJSON method to map _id to id
userWalletDepositDetailSchema.set("toJSON", {
	transform: (doc, ret) => {
		ret.id = ret._id; // Map _id to id
		delete ret._id; // Remove _id from the response
		delete ret.__v; // Optionally remove __v
		return ret;
	},
});

export default mongoose.model<IUserWalletDepositDetail>(
	"user-wallet-deposit-detail",
	userWalletDepositDetailSchema
);
