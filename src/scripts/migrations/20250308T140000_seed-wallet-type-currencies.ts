import Currency from "../../models/Currency";
import WalletType from "../../models/WalletType";

export async function up() {
	console.log("Running migration: 20250308T140000_seed-wallet-type-currencies.ts");

	// Insert currencies into the Currency collection
	const currenciesData = [
		{ name: "Tether USDT", symbol: "USDT" },
		// { name: "Bitcoin", symbol: "BTC" },
	];

	const currencyIds = await Promise.all(
		currenciesData.map(async (currencyData) => {
			const existingCurrency = await Currency.findOne({ symbol: currencyData.symbol });
			if (existingCurrency) {
				return existingCurrency._id; // Return existing currency ID
			} else {
				const newCurrency = await Currency.create(currencyData);
				return newCurrency._id; // Return newly created currency ID
			}
		})
	);

	// Insert wallet types with currency references
	const walletTypeCurrenciesData = [
		{ walletTypeName: "MAIN", currencies: currencyIds },
		// { walletTypeName: "SPOT", currencies: [currencyIds[0]] },
		// { walletType: "FUTURES", currencies: currencyIds },
	];

	await WalletType.insertMany(walletTypeCurrenciesData);

	console.log("Seeding completed successfully.");
}

export async function down() {
	console.log("Rolling back migration: 20250308T140000_seed-wallet-type-currencies.ts");
	// Your rollback logic here
	await WalletType.deleteMany({});
	await WalletType.collection.dropIndexes();

	await Currency.deleteMany({ symbol: "USDT" });
	await Currency.deleteMany({ symbol: "BTC" });

	console.log("Rollback completed successfully.");
}
