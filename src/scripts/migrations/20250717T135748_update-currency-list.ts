import { CurrencyCategory } from "../../config/enums";
import Currency from "../../models/Currency";

export async function up() {
	console.log("Running migration: 20250717T135748_update-currency-list.ts");

	// Your migration logic here

	// Add new currency documents
	const newCurrencies = [
		{
			name: "Naira",
			symbol: "NGN",
			logoUrl: "",
			category: CurrencyCategory.FIAT,
		},
		{
			name: "Dollar",
			symbol: "USD",
			logoUrl: "",
			category: CurrencyCategory.FIAT,
		},
	];

	// Insert new currencies and update existing ones
	await Promise.all([
		Currency.insertMany(newCurrencies),
		Currency.updateMany(
			{ symbol: "USDT", category: { $exists: false } },
			{ $set: { category: CurrencyCategory.CRYPTO } }
		),
	]);

	console.log("Migration completed successfully: 20250717T135748_update-currency-list.ts");
}

export async function down() {
	console.log("Rolling back migration: 20250717T135748_update-currency-list.ts");

	// Your rollback logic here

	await Promise.all([
		// Remove the category from USDT
		Currency.updateMany(
			{ symbol: "USDT", category: CurrencyCategory.CRYPTO },
			{ $unset: { category: "" } }
		),

		// Remove the newly added currencies
		Currency.deleteMany({
			$or: [{ symbol: "NGN" }, { symbol: "USD" }],
		}),
	]);

	console.log("Rollback completed for migration: 20250717T135748_update-currency-list.ts");
}
