import { Currency } from "./currency";
import { TransactionType } from "./transaction";
import { WalletType } from "./wallet";
import { Response } from "express";

// Helper function to transform data types to object values
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

export interface BaseInput {
	userId: string;
}

export interface ITransactionInput extends BaseInput {
	res: Response;
}

export interface IWalletInput extends BaseInput {}

export interface IAddressInput extends BaseInput {
	res: Response;
}
