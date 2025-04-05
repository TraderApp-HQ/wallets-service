import PaymentMethod from "../../models/PaymentMethod";
import Currency from "../../models/Currency";

const cryptoLogoUrls = [
	{ symbol: "BTC", logoUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png" },
	{ symbol: "USDT", logoUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/825.png" },
	{ symbol: "ADA", logoUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/2010.png" },
	{ symbol: "TRX", logoUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/1958.png" },
	{ symbol: "DOGE", logoUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/74.png" },
	{ symbol: "DAI", logoUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/4943.png" },
	{ symbol: "USDC", logoUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png" },
	{ symbol: "SOL", logoUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png" },
	{ symbol: "BNB", logoUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png" },
	{ symbol: "BCH", logoUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/1831.png" },
	{ symbol: "XRP", logoUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/52.png" },
	{ symbol: "ETH", logoUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png" },
	{ symbol: "LTC", logoUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/2.png" },
];

export async function up() {
	console.log("Running migration: 20250405T020724_update-crypto-logo-urls.ts");

	// Store original logo URLs for rollback
	const originalPaymentMethodLogoUrls: Array<{ symbol: string; originalLogoUrl: string }> = [];
	// const originalCurrencyLogoUrls = [];

	// Update each payment method with the new logo URL
	// for (const { symbol, logoUrl } of cryptoLogoUrls) {
	const promises = cryptoLogoUrls.map(async ({ symbol, logoUrl }) => {
		// Find the payment method by symbol
		const [paymentMethod] = await Promise.all([
			PaymentMethod.findOne({ symbol }),
			Currency.findOne({ symbol }),
		]);

		if (paymentMethod) {
			// Store original logo URL for rollback
			originalPaymentMethodLogoUrls.push({
				symbol,
				originalLogoUrl: paymentMethod.logoUrl,
			});

			// Update the logo URL
			await PaymentMethod.updateOne({ symbol }, { $set: { logoUrl } });

			console.log(`Updated logo URL for ${symbol} to ${logoUrl}`);
		} else {
			console.log(`Payment method with symbol ${symbol} not found`);
		}

		// if (currency) {
		// 	// Store original logo URL for rollback
		// 	originalCurrencyLogoUrls.push({
		// 		symbol,
		// 		originalLogoUrl: currency.logoUrl,
		// 	});

		// 	// Update the logo URL
		// 	await PaymentMethod.updateOne({ symbol }, { $set: { logoUrl } });

		// 	console.log(`Updated logo URL for ${symbol} to ${logoUrl}`);
		// } else {
		// 	console.log(`Payment method with symbol ${symbol} not found`);
		// }
	});
	// }

	await Promise.all(promises);

	// Store the original URLs in a separate collection for rollback
	if (originalPaymentMethodLogoUrls.length > 0) {
		// Create a temporary collection to store original values
		const db = PaymentMethod.db;
		const collection = db.collection("migration_20250405T020724_backup");
		await collection.insertMany(originalPaymentMethodLogoUrls);
		console.log(
			`Stored ${originalPaymentMethodLogoUrls.length} original logo URLs for potential rollback`
		);
	}

	console.log("Migration completed successfully");
}

export async function down() {
	console.log("Rolling back migration: 20250405T020724_update-crypto-logo-urls.ts");

	// Retrieve the original logo URLs from the backup collection
	const db = PaymentMethod.db;
	const collection = db.collection("migration_20250405T020724_backup");
	const backup = await collection.findOne({});

	if (backup && backup.originalLogoUrls) {
		// Restore each payment method's original logo URL
		for (const { symbol, originalLogoUrl } of backup.originalLogoUrls) {
			await PaymentMethod.updateOne({ symbol }, { $set: { logoUrl: originalLogoUrl } });

			console.log(`Restored original logo URL for ${symbol}: ${originalLogoUrl}`);
		}

		// Remove the backup collection
		await collection.drop();
		console.log("Removed backup collection");
	} else {
		console.log("No backup data found, unable to rollback");
	}

	console.log("Rollback completed successfully");
}
