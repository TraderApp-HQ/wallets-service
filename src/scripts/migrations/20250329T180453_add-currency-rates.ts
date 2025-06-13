import ExchangeRate from "../../models/ExchangeRate";

export async function up() {
	console.log("Running migration: 20250329T180453_add-currency-rates.ts");

	const rates = [
		{ pair: "USDT/USD", rate: 1 },
		{ pair: "USDT/NGN", rate: 1500 },
		{ pair: "BTC/USD", rate: 83000 },
		{ pair: "BTC/NGN", rate: 124500000 },
	];

	await ExchangeRate.insertMany(rates);
	console.log("Currency rates added successfully.");
}

export async function down() {
	console.log("Rolling back migration: 20250329T180453_add-currency-rates.ts");

	await ExchangeRate.deleteMany({
		pair: { $in: ["USDT/USD", "USDT/NGN"] },
	});

	console.log("Currency rates removed successfully.");
}
