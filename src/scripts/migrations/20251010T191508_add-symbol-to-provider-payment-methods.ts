import ProviderPaymentMethod, { IProviderPaymentMethod } from "../../models/ProviderPaymentMethod";
import PaymentMethod, { IPaymentMethod } from "../../models/PaymentMethod";

export async function up() {
	console.log("Running migration: 20251010T191508_add-symbol-to-provider-payment-methods.ts");
	const providerPaymentMethods = await ProviderPaymentMethod.find<
		Omit<IProviderPaymentMethod, "paymentMethod"> & {
			paymentMethod: Pick<IPaymentMethod, "symbol">;
		}
	>({}).populate({
		path: "paymentMethod",
		model: PaymentMethod,
		select: "symbol",
	});

	for (const providerPaymentMethod of providerPaymentMethods) {
		const symbol = providerPaymentMethod.paymentMethod.symbol;
		if (!symbol) continue;

		if (!providerPaymentMethod.symbol) {
			providerPaymentMethod.symbol = symbol;
			await providerPaymentMethod.save();
		}
	}

	console.log("Symbol backfill completed.");
}

export async function down() {
	console.log(
		"Rolling back migration: 20251010T191508_add-symbol-to-provider-payment-methods.ts"
	);
	await ProviderPaymentMethod.updateMany({}, { $unset: { symbol: "" } });

	console.log("Symbol removed from provider-payment-methods.");
}
