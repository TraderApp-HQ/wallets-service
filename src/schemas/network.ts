import { IAddressInput } from ".";
import { Currency } from "./currency";

export enum Network {
	BSC = "Binance Smart Chain (BEP20)",
	TRX = "Tron (TRC20)",
	SOL = "Solana (SOL)",
	BTC = "Bitcoin (BTC) Network",
	AVAX = "Avalanche (AVAX)",
	XRP = "Ripple (XRP)",
	ETH = "Ethereum (ERC20)",
}

export interface UserNetworkAddress {
	userId: string;
	currency: Currency;
	network: Network;
	address: string;
	createdAt: Date;
}

export interface INetworkAddressPayload extends IAddressInput {
	userId: string;
	network?: Network;
	currency?: Currency;
	address?: string;
}

export interface INetworkAddressInput {
	userId: string;
	network?: Network;
	currency?: Currency;
	address?: string;
}
