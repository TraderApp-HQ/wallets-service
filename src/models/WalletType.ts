import mongoose, { Schema, Document } from "mongoose";
import { WalletType } from "../config/interfaces";

export interface IWalletType extends Document {
	id: string;
	walletTypeName: WalletType; // WalletType enum value
	currencies: mongoose.Types.ObjectId[]; // Array of Currency references
}

const WalletTypeSchema: Schema = new Schema({
	walletTypeName: { type: String, enum: Object.values(WalletType), required: true, unique: true },
	currencies: { type: [{ type: Schema.Types.ObjectId, ref: "Currency" }], required: true },
});

// Override the toJSON method to map _id to id
WalletTypeSchema.set("toJSON", {
	transform: (doc, ret) => {
		ret.id = ret._id; // Map _id to id
		delete ret._id; // Remove _id from the response
		delete ret.__v; // Optionally remove __v
		return ret;
	},
});

export default mongoose.model<IWalletType>("wallet-type", WalletTypeSchema);
