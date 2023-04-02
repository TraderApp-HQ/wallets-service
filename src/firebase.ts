import admin from "firebase-admin";
import { config } from "dotenv";

config();

//get firebase service account key from env
const firebaseKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string;

//parse firebase key back to js object
const serviceAccountKey = JSON.parse(firebaseKey);

//initialize firebase
admin.initializeApp({
	credential: admin.credential.cert(serviceAccountKey),
	databaseURL: "https://wallets-service-demo.firebaseio.com",
});

export default admin.firestore();
