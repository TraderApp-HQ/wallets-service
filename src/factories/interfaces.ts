import { AddressType } from "../config/enums";

export interface IFactoryPaymentProviderDepositInput {
	userId: string;
	currency: string;
	addressType?: AddressType;
	network?: string;
}
export interface IFactoryPaymentProvider {
	generateDepositDetails: ({
		userId,
		currency,
		addressType,
		network,
	}: IFactoryPaymentProviderDepositInput) => Promise<any>;
	// processWithdrawal: (userId: string, currency: string, amount: number) => Promise<void>;
}
