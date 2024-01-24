import admin from "firebase-admin";
import { Storage } from "firebase-admin/lib/storage/storage";
import "dotenv/config";

let db: admin.firestore.Firestore;
let storage: Storage;

export async function firebase() {
	return { db, storage };
}

function initFirebase() {
	try {
		const projectId = process.env.FIREBASE_PROJECT_ID || "";
		const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);

		if (projectId && serviceAccount) {
			return;
		}
	} catch (error) {
		console.log(`Error initializing firebase ${JSON.stringify(error)}`);
	}
}

export default initFirebase;
