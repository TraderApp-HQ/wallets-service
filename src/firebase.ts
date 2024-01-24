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
		admin.initializeApp({
			credential: admin.credential.cert(serviceAccount),
			databaseURL: `https://${projectId}.firebaseio.com`,
			storageBucket: `${projectId}.appspot.com`,
		});
		db = admin.firestore();
		storage = admin.storage();
	} catch (error) {
		console.log(`Error initializing firebase ${JSON.stringify(error)}`);
	}
}

export default initFirebase;
