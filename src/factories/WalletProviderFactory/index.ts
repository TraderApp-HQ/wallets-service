/* eslint-disable @typescript-eslint/no-extraneous-class */
import { CryptoPayClient } from "../../clients/CryptoPayClient";
import { WalletProvider } from "../../config/enums";
import { IFactoryPaymentProvider } from "../interfaces";

export class WalletProviderFactory {
	static createProvider(providerName: WalletProvider): IFactoryPaymentProvider {
		switch (providerName) {
			case WalletProvider.CRYPTOPAY:
				return new CryptoPayClient();
			// Add more providers as needed
			default:
				throw new Error("Provider not supported");
		}
	}
}
