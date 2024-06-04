import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import { config } from "dotenv";
import { logger, initSecrets, apiResponseHandler } from "@traderapp/shared-resources";
import { ENVIRONMENTS, ResponseType } from "./config/constants";
import secretsJson from "./env.json";

import swaggerUi from "swagger-ui-express";
import specs from "./utils/swagger";

// import routes
// import initFirebase from "./firebase";
import { routeHandler } from "./routes";

config();

const app: Application = express();

const env = process.env.NODE_ENV || "development";
const suffix = ENVIRONMENTS[env];
const secretNames = ["common-secrets", "wallets-service-secrets"];

initSecrets({
	env: suffix,
	secretNames,
	secretsJson,
})
	.then(async () => {
		const PORT = process.env.PORT;
		app.listen(PORT, () => {
			logger.log(`Server listening at port ${PORT}`);
			startServer();
			logger.log(`Docs available at http://localhost:${PORT}/api-docs`);
		});
	})
	.catch((err: any) => {
		logger.error(`Error getting secrets. Error == ${JSON.stringify(err)}`);
		throw err;
	});

function startServer() {
	// cors
	app.use(
		cors({
			origin: "http://localhost:3000",
			methods: "GET, HEAD, PUT, PATCH, POST, DELETE",
		})
	);

	// parse incoming requests
	app.use(express.urlencoded({ extended: true }));
	app.use(express.json());

	// documentation
	app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

	// // api routes handler
	routeHandler(app);

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
			console.log("Error name: ", errorName, "Error message: ", err.message);
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
