import Currency from "../../models/Currency";

export async function up() {
	console.log("Running migration: 20250404T094234_update-currency-records.ts");
	// Your migration logic here
	await Currency.updateMany(
		{ symbol: "USDT" },
		{
			$set: {
				logoUrl:
					"https://sandbox-cs-ledger.s3.eu-west-1.amazonaws.com/public/currencies/USDT.svg",
			},
		}
	);

	console.log("Currency records updated successfully.");
}

export async function down() {
	console.log("Rolling back migration: 20250404T094234_update-currency-records.ts");
	// Your rollback logic here

	await Currency.updateMany(
		{ symbol: "USDT" },
		{
			$set: {
				logoUrl: "",
			},
		}
	);

	console.log("Currency records rolled back successfully.");
}
