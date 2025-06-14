import mongoose, { Document, Schema } from "mongoose";

export interface IProviderPaymentMethod extends Document {
	paymentMethod: mongoose.Types.ObjectId;
	paymentMethodName: string;
	provider: mongoose.Types.ObjectId;
	providerName: string;
	isDepositSupported: boolean;
	isWithdrawalSupported: boolean;
	isDefault: boolean;
	supportedNetworks?: Array<{ slug: string; name: string; precision: number }>;
	category: mongoose.Types.ObjectId;
	categoryName: string;
}

const providerPaymentMethodSchema = new Schema<IProviderPaymentMethod>(
	{
		paymentMethod: { type: Schema.Types.ObjectId, ref: "payment-method", required: true },
		paymentMethodName: { type: String, required: true },
		provider: { type: Schema.Types.ObjectId, ref: "payment-provider", required: true },
		providerName: { type: String, required: true },
		isDepositSupported: { type: Boolean, default: true },
		isWithdrawalSupported: { type: Boolean, default: true },
		isDefault: { type: Boolean, default: false },
		supportedNetworks: { type: [{ slug: String, name: String, precision: Number }] },
		category: { type: Schema.Types.ObjectId, ref: "payment-category", required: true },
		categoryName: { type: String, required: true },
	},
	{ timestamps: true, versionKey: false }
);

// Add a composite unique index
providerPaymentMethodSchema.index({ paymentMethod: 1, provider: 1 }, { unique: true });

// Add individual indexes for querying
providerPaymentMethodSchema.index({ paymentMethod: 1 });
providerPaymentMethodSchema.index({ provider: 1 });
providerPaymentMethodSchema.index({ isDefault: 1 });
providerPaymentMethodSchema.index({ categoryName: 1 });
providerPaymentMethodSchema.index({ isDepositSupported: 1 });
providerPaymentMethodSchema.index({ isWithdrawalSupported: 1 });

export default mongoose.model<IProviderPaymentMethod>(
	"provider-payment-method",
	providerPaymentMethodSchema
);
