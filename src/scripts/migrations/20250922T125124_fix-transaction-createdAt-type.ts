import mongoose from "mongoose";
import Transaction from "../../models/Transaction";

const backupCollectionName = "migration_backup_createdAt_strings";
const transactionsCollectionName = Transaction.collection.name;

export async function up() {
	console.log("Running migration: 20250922T125124_fix-transaction-createdAt-type.ts");

	// Find all Transaction documents where createdAt is a string
	const transactionsWithStringCreatedAt = await Transaction.find({
		createdAt: { $type: 2 }, // BSON type for string
	});

	console.log(
		`Found ${transactionsWithStringCreatedAt.length} transactions with string createdAt.`
	);

	// Backup original string values for rollback
	const db = mongoose.connection.db;
	if (!db) {
		throw new Error("Database connection is not available");
	}
	const backupCollection = db.collection(backupCollectionName);

	const backupData = transactionsWithStringCreatedAt.map((tx) => ({
		_id: tx._id,
		originalCreatedAt: tx.createdAt, // string value
	}));
	if (backupData.length > 0) {
		await backupCollection.insertMany(backupData, { ordered: false });
		console.log(`Backed up ${backupData.length} original createdAt strings.`);
	}

	const operations = [];
	for (const tx of transactionsWithStringCreatedAt) {
		const dateValue = new Date(tx.createdAt);
		if (isNaN(dateValue.getTime())) {
			console.warn(
				`Skipping invalid date string '${
					tx.createdAt as unknown as string
				}' for transaction ${tx.id}`
			);
			continue;
		}

		operations.push({
			updateOne: {
				filter: { _id: tx._id },
				update: { $set: { createdAt: dateValue } },
				upsert: false,
			},
		});
	}

	if (operations.length > 0) {
		await db.collection(transactionsCollectionName).bulkWrite(operations);
		console.log(`Successfully updated ${operations.length} transactions.`);
	}

	const remainingStringDates = await Transaction.find({
		createdAt: { $type: 2 },
	});

	console.log(`Found ${remainingStringDates.length} transactions still with string createdAt.`);
}

export async function down() {
	console.log("Rolling back migration: 20250922T125124_fix-transaction-createdAt-type.ts");

	const db = mongoose.connection.db;
	if (!db) {
		throw new Error("Database connection is not available");
	}
	const backupCollection = db.collection(backupCollectionName);

	// Retrieve backup data
	const backupData = await backupCollection.find({}).toArray();
	if (backupData.length === 0) {
		console.log("No backup data found; rollback not possible.");
		return;
	}

	// Build rollback operations
	const rollbackOperations = backupData.map((backup) => ({
		updateOne: {
			filter: { _id: backup._id },
			update: { $set: { createdAt: backup.originalCreatedAt } },
			upsert: false,
		},
	}));

	// Execute rollback
	await db.collection(transactionsCollectionName).bulkWrite(rollbackOperations);
	console.log(`Successfully rolled back ${rollbackOperations.length} transactions.`);

	// Clean up backup collection
	await backupCollection.drop();
	console.log("Dropped backup collection.");
}
