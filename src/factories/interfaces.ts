import { AddressType } from "../config/enums";

export interface IFactoryPaymentProviderDepositInput {
	userId: string;
	currency: string; // currency in traderapp wallet we want to fund
	payCurrency: string; // currency which we want to use to send funds
	addressType?: AddressType;
	network?: string;
	amount?: number;
	customId?: string;
}

export interface IFactoryPaymentProviderDepositResponse {
	id: string;
	currency: string;
	amount?: number;
	walletAddress?: string;
	network?: string;
	paymentUrl?: string;
	paymentUri?: string; // e.g. bitcoin:tb1qf54gqt8sk7rmawqg7j9xvvwjrc35js5pska40d?amount=0.001159
	shouldRedirect?: boolean;
	customWalletId?: string;
	externalWalletId?: string;
	description?: string;
	metadata?: any;
	successRedirectUrl?: string;
	failureRedirectUrl?: string;
	createdAt?: string;
	expiresAt?: string;
	payCurrency?: string; // the currency in which the payment will be made
	payAmount?: number; // the amount that will be paid using the payCurrency
	fee?: number;
	feeCurrency?: string; // the currency in which the fee will be paid
	exchangePair?: string;
	exchangeRate?: number;
	exchangeFee?: number;
	exchangeFeeCurrency?: string;
}

export interface IProcessWithdrawalInput {
	userId: string;
	currency: string;
	amount: number;
	destinationAddress: string;
	network: string;
	customId: string;
}

export interface IProcessWithdrawalResponse {
	externalId: string;
	transactionHash?: string;
	status: string;
}

export interface ICurrencyNetworkFees
	extends Record<
		string,
		{
			networks: string[];
			fees: Record<string, Record<string, string>>;
		}
	> {}

export interface IFactoryPaymentProvider {
	generateDepositDetails: ({
		userId,
		currency,
		addressType,
		network,
	}: IFactoryPaymentProviderDepositInput) => Promise<IFactoryPaymentProviderDepositResponse>;
	processWithdrawal: (data: IProcessWithdrawalInput) => Promise<IProcessWithdrawalResponse>;
	getNetworkFeesByCurrency: () => Promise<ICurrencyNetworkFees>;
}
