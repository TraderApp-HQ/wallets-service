import mongoose, { Document, Schema } from "mongoose";
import { WalletType } from "../config/interfaces";

export interface IUserWallet extends Document {
	id: string;
	userId: string;
	walletType: mongoose.Types.ObjectId;
	walletTypeName: WalletType;
	currencyName: string;
	currency: mongoose.Types.ObjectId;
	availableBalance: number;
	lockedBalance: number;
}

const userWalletSchema = new Schema<IUserWallet>(
	{
		userId: { type: String, required: true },
		walletType: { type: Schema.Types.ObjectId, ref: "wallet-type", required: true },
		walletTypeName: { type: String, enum: Object.values(WalletType), required: true },
		currency: { type: Schema.Types.ObjectId, ref: "Currency", required: true },
		currencyName: String,
		availableBalance: { type: Number, required: true, default: 0 },
		lockedBalance: { type: Number, required: true, default: 0 },
	},
	{ timestamps: true, versionKey: false }
);

// Create a unique compound index to ensure each user can only have one wallet per type and currency
userWalletSchema.index({ userId: 1, walletType: 1, currency: 1 }, { unique: true });

// Index for querying wallets by user and wallet type
userWalletSchema.index({ userId: 1, walletType: 1 });

// Index for querying all wallets belonging to a user
userWalletSchema.index({ userId: 1 });
userWalletSchema.index({ walletTypeName: 1 });

// Index for querying/sorting wallets by available and locked balance
userWalletSchema.index({ availableBalance: 1, lockedBalance: 1 });

// Override the toJSON method to map _id to id
userWalletSchema.set("toJSON", {
	transform: (doc, ret) => {
		ret.id = ret._id; // Map _id to id
		delete ret._id; // Remove _id from the response
		delete ret.__v; // Optionally remove __v
		return ret;
	},
});
export default mongoose.model<IUserWallet>("user-wallet", userWalletSchema);
