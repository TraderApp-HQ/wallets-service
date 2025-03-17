import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import "dotenv/config";
import { logger, initSecrets, apiResponseHandler } from "@traderapp/shared-resources";
import { ENVIRONMENTS, ResponseType } from "./config/constants";
import secretsJson from "./env.json";
import swaggerUi from "swagger-ui-express";
import specs from "./utils/swagger";
import mongoose from "mongoose";
import TransactionRoutes from "./routes/TransactionRoutes";
import WalletRoutes from "./routes/WalletRoutes";

const app: Application = express();

const env = process.env.NODE_ENV;
if (!env) {
	logger.error("Error: Environment variable not set");
	process.exit(1);
}
const suffix = ENVIRONMENTS[env];
const secretNames = ["common-secrets", "wallets-service-secrets"];

(async function () {
	await initSecrets({
		env: suffix,
		secretNames,
		secretsJson,
	});
	const port = process.env.PORT;
	// const port = 8083;
	const dbUrl = process.env.WALLET_SERVICE_DB_URL ?? "";
	mongoose
		.connect(dbUrl)
		.then(() => {
			app.listen(port, () => {
				startServer();
				logger.log(`Server listening at port ${port}`);
				logger.log(`Docs available at http://localhost:${port}/api-docs`);
			});
		})
		.catch((err) => {
			logger.error(`Unable to connect to mongodb. Error === ${JSON.stringify(err)}`);
		});
})();

function startServer() {
	// Define an array of allowed origins
	const allowedOrigins = [
		"http://localhost:3000",
		"https://web-dashboard-dev.traderapp.finance",
		"https://www.web-dashboard-dev.traderapp.finance",
		"https://web-dashboard-staging.traderapp.finance",
		"https://www.web-dashboard-staging.traderapp.finance",
	];

	const corsOptions = {
		origin: (
			origin: string | undefined,
			callback: (error: Error | null, allow?: boolean) => void
		) => {
			// Allow requests with no origin (like mobile apps or curl requests)
			if (!origin) {
				callback(null, true);
				return;
			}
			if (allowedOrigins.includes(origin)) {
				callback(null, true);
			} else {
				callback(new Error(`Not allowed by CORS: ${origin}`));
			}
		},
		methods: "GET, HEAD, PUT, PATCH, POST, DELETE",
		credentials: true, // Allow credentials
	};
	// cors
	app.use(cors(corsOptions));

	// parse incoming requests
	app.use(express.urlencoded({ extended: true }));
	app.use(express.json());

	// documentation
	app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

	// // api routes handler
	app.use(`/transactions`, TransactionRoutes);
	app.use(`/wallets`, WalletRoutes);

	// health check
	app.get(`/ping`, (_req, res) => {
		res.status(200).send({ message: "pong" });
	});

	// handle errors
	app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
		let errorName = err.name;
		let errorMessage = err.message;
		let statusCode;

		if (err.name === "ValidationError") statusCode = 400;
		else if (err.name === "Unauthorized") statusCode = 401;
		else if (err.name === "Forbidden") statusCode = 403;
		else if (err.name === "NotFound") statusCode = 404;
		else {
			statusCode = 500;
			errorName = "InternalServerError";
			errorMessage = "Something went wrong. Please try again after a while.";
			console.log("Error name: ", errorName, "Error message: ", err.message, err);
		}

		res.status(statusCode).json(
			apiResponseHandler({
				type: ResponseType.ERROR,
				message: errorMessage,
				object: err,
			})
		);
	});
}
