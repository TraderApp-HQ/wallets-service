import mongoose, { Schema, Document } from "mongoose";
import { NotificationChannel } from "../config/enums";
import { OTP_RATE_LIMIT_EXPIRES } from "../config/constants";

interface IOtpRateLimit extends Document {
	_id: string;
	channel: NotificationChannel;
	attempts: number;
	rateLimitStart: Date;
}

const schema = new Schema<IOtpRateLimit>(
	{
		_id: { type: String, required: true },
		channel: { type: String, enum: NotificationChannel, required: true },
		attempts: { type: Number, default: 0 },
		rateLimitStart: { type: Date, default: Date.now },
	},
	{ versionKey: false }
);

schema.index({ _id: 1, channel: 1 }, { unique: true });
schema.index({ rateLimitStart: 1 }, { expireAfterSeconds: OTP_RATE_LIMIT_EXPIRES });

export default mongoose.model<IOtpRateLimit>("otp-rate-limit", schema);
