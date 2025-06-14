import PaymentCategory from "../../models/PaymentCategory";
import PaymentMethod from "../../models/PaymentMethod";
import PaymentProvider from "../../models/PaymentProvider";
import ProviderPaymentMethod from "../../models/ProviderPaymentMethod";
import { paymentProviders, paymentMethods, paymentCatgories } from "../seed-data";

export async function up() {
	console.log("Running migration: 20250308T120336_seed-wallets-data.ts");

	// Insert Payment Categories
	const categories = await PaymentCategory.insertMany(
		paymentCatgories.map((category) => ({
			name: category.name,
		}))
	);

	// Insert Payment Methods
	const methods = await PaymentMethod.insertMany(
		paymentMethods.map((method) => {
			const category = categories.find((cat) => cat.name === "Crypto");
			return {
				name: method.name,
				symbol: method.currency,
				logoUrl: method.logo,
				category: category?._id, // Use the ID from the inserted category
			};
		})
	);

	// Insert Payment Providers
	const providers = await PaymentProvider.insertMany(
		paymentProviders.map((provider) => ({
			name: provider.name,
		}))
	);

	// Insert cryptopay Provider Payment Methods
	const cryptoPayProvider = providers.find((provider) => provider.name === "CryptoPay");
	const cryptoCategory = categories.find((category) => category.name === "Crypto");
	await ProviderPaymentMethod.insertMany(
		methods.map((method) => ({
			paymentMethod: method._id, // Reference to PaymentMethod
			paymentMethodName: method.name,
			provider: cryptoPayProvider?._id, // Reference to PaymentProvider
			providerName: cryptoPayProvider?.name,
			isDepositSupported: true,
			isWithdrawalSupported: true,
			isDefault: true,
			supportedNetworks: paymentMethods
				.find((pm) => pm.currency === method.symbol)
				?.networks.map((network) => ({
					slug: network.network,
					name: network.name,
					precision: network.precision,
				})),
			category: cryptoCategory?._id,
			categoryName: cryptoCategory?.name,
		}))
	);

	console.log("Seeding completed successfully.");
}

export async function down() {
	console.log("Rolling back migration: 20250308T120336_seed-wallets-data.ts");

	// Remove Provider Payment Methods
	await ProviderPaymentMethod.deleteMany({
		isDepositSupported: true,
		isWithdrawalSupported: true,
		isDefault: true,
	});
	await ProviderPaymentMethod.collection.dropIndexes();

	// Remove Payment Methods
	await PaymentMethod.deleteMany({});
	await PaymentMethod.collection.dropIndexes();

	// Remove Payment Providers
	await PaymentProvider.deleteMany({});
	await PaymentProvider.collection.dropIndexes();

	// Remove Payment Categories
	await PaymentCategory.deleteMany({});
	await PaymentCategory.collection.dropIndexes();

	console.log("Rollback completed successfully.");
}
