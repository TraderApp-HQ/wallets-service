import admin from "firebase-admin";
import { Storage } from "firebase-admin/lib/storage/storage";
import "dotenv/config";

let db: admin.firestore.Firestore;
let storage: Storage;

function initFirebase() {
	try {
		const projectId = process.env.FIREBASE_PROJECT_ID || "";
		const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);

		if (!admin.apps.length) {
			admin.initializeApp({
				credential: admin.credential.cert(serviceAccount),
				projectId,
			});
			db = admin.firestore();
			storage = admin.storage();
			console.log("Firebase initialized successfully");
		}
	} catch (error) {
		console.log(`Error initializing firebase: ${JSON.stringify(error)}`);
	}
}

initFirebase(); // Initialize Firebase when this module is imported

export { db, storage };
