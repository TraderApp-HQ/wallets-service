import { Currency } from "./currency";
import { TransactionType } from "./transaction";
import { WalletType } from "./wallet";

export const enumToObject = <T extends object>(enumObj: T): Record<string, string> => {
	const result: Record<string, string> = {};
	for (const key in enumObj) {
		if (Object.prototype.hasOwnProperty.call(enumObj, key)) {
			result[key] = (enumObj as any)[key];
		}
	}
	return result;
};

export const transactionTypeValues = enumToObject(TransactionType);
export const currencyTypeValues = enumToObject(Currency);
export const walletTypeValues = enumToObject(WalletType);
