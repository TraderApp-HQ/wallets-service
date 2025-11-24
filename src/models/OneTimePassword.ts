import mongoose, { Document, Schema } from "mongoose";
import { NotificationChannel } from "../config/enums";
import { OTP_EXPIRES } from "../config/constants";

interface IOneTimePassword extends Document {
	_id: string;
	otp: string;
	channel: NotificationChannel;
	context: string;
	withdrawalRequestId: string;
	createdAt: Date;
}

const schema = new Schema<IOneTimePassword>(
	{
		_id: { type: String, required: true },
		otp: { type: String, required: true },
		channel: { type: String, required: true, enum: NotificationChannel },
		context: { type: String, required: true, index: true },
		withdrawalRequestId: { type: String, required: true, index: true },
		createdAt: { type: Date, default: Date.now },
	},
	{ versionKey: false }
);

schema.index({ createdAt: 1 }, { expireAfterSeconds: OTP_EXPIRES });
schema.index({ _id: 1, channel: 1, context: 1 }, { unique: true });

export default mongoose.model<IOneTimePassword>("one-time-password", schema);
