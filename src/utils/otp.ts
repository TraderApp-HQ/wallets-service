import { randomInt } from "crypto";

export function generateOTP(length = 6): string {
	const max = 10 ** length;
	const min = 10 ** (length - 1);
	return randomInt(min, max).toString();
}
