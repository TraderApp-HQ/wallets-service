import { Currency } from "./currency";

export enum WalletType {
	MAIN = "MAIN",
	SPOT = "SPOT",
	FUTURES = "FUTURES",
}

export interface UserWallet {
	id?: string;
	userId: string;
	walletType: WalletType;
	currency: Currency;
	balance: number;
	createdAt: Date;
}
