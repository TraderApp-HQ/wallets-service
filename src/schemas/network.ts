import { Currency } from "./currency";

export enum Network {
	BSC = "Binance Smart Chain",
	TRX = "Tron",
	SOL = "Solana",
	BTC = "Bitcoin (BTC) Network",
	AVAX = "Avalanche",
	XRP = "Ripple",
}

export interface UserNetworkAddress {
	userId: string;
	currency: Currency;
	network: Network;
	address: string;
	createdAt: Date;
}
