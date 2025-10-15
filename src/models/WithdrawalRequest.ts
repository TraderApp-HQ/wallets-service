import mongoose, { Document, Schema } from "mongoose";
import { WITHDRAWAL_REQUEST_STATUSES } from "../config/constants";

export interface IWithdrawalRequest extends Document {
	id: string;
	userId: string;
	currencyId: string;
	paymentMethodId: string;
	providerId: string;
	network: string;
	amount: number;
	amountToReceive: number;
	destinationAddress: string;
	status: string;
	transactionId?: string;
	expiresAt: Date;
	createdAt: Date;
	updatedAt: Date;
	withdrawalRequestId: string; // duplicate of _id if you prefer readable alias
}

const withdrawalRequestSchema = new Schema<IWithdrawalRequest>(
	{
		_id: { type: String }, // use generated withdrawalRequestId (uuid)
		withdrawalRequestId: { type: String, required: true }, // mirror
		userId: { type: String, required: true, index: true },
		currencyId: { type: String, required: true },
		paymentMethodId: { type: String, required: true },
		providerId: { type: String, required: true },
		network: { type: String },
		amount: { type: Number, required: true },
		amountToReceive: { type: Number, required: true },
		destinationAddress: { type: String, required: true },
		status: {
			type: String,
			enum: Object.values(WITHDRAWAL_REQUEST_STATUSES),
			required: true,
			default: WITHDRAWAL_REQUEST_STATUSES.INITIATED,
			index: true,
		},
		transactionId: { type: String },
		expiresAt: {
			type: Date,
			required: true,
		},
	},
	{ timestamps: true, versionKey: false }
);

// TTL index (Mongo will remove after expiresAt)
withdrawalRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
withdrawalRequestSchema.index({ userId: 1, status: 1, createdAt: -1 });

withdrawalRequestSchema.set("toJSON", {
	transform: (_doc, ret) => {
		ret.id = ret._id;
		delete ret._id;
		return ret;
	},
});

export default mongoose.model<IWithdrawalRequest>("withdrawal-request", withdrawalRequestSchema);
