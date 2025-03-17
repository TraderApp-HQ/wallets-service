import mongoose, { Document, Schema } from "mongoose";

interface ICurrencyModel extends Document {
	id: string;
	name: string;
	symbol: string;
}

const currencySchema = new Schema<ICurrencyModel>(
	{
		name: { type: String, required: true },
		symbol: { type: String, required: true, unique: true },
	},
	{ timestamps: true, versionKey: false }
);

// Override the toJSON method to map _id to id
currencySchema.set("toJSON", {
	transform: (doc, ret) => {
		ret.id = ret._id; // Map _id to id
		delete ret._id; // Remove _id from the response
		delete ret.__v; // Optionally remove __v
		return ret;
	},
});

export default mongoose.model<ICurrencyModel>("Currency", currencySchema);
