import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import { config } from "dotenv";

//import routes
import { BalanceRoutes } from "./routes";

config();

const app: Application = express();
const baseUri = "api/v1";

const PORT = process.env.PORT || 8001;

app.listen(PORT, () => {
	console.log(`Server listening at port ${PORT}`);
	startServer();
});

function startServer() {
	//cors
	app.use(
		cors({
			origin: "http://localhost:3000",
			methods: "GET, HEAD, PUT, PATCH, POST, DELETE",
		})
	);

	//parse incoming requests
	app.use(express.urlencoded({ extended: true }));
	app.use(express.json());

	//api routes
	app.use(`/${baseUri}/balances`, BalanceRoutes);

	//health check
	app.get(`/${baseUri}/ping`, (_req, res) => {
		res.status(200).send({ message: "pong" });
	});

	//handle errors
	app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
		const status = "ERROR";
		let error = err.name;
		let error_message = err.message;
		let statusCode;

		if (err.name === "ValidationError") statusCode = 400;
		else if (err.name === "Unauthorized") statusCode = 401;
		else if (err.name === "Forbidden") statusCode = 403;
		else if (err.name === "NotFound") statusCode = 404;
		else {
			statusCode = 500;
			error = "InternalServerError";
			error_message = "Something went wrong. Please try again after a while.";
			console.log("Error name: ", err.name, "Error message: ", err.message);
		}

		res.status(statusCode).json({ status, error, error_message });
	});
}
