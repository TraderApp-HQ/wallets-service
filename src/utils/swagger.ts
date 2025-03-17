import swaggerJsdoc from "swagger-jsdoc";

import { ROUTES } from "../config/constants";
import {
	createUserWallet,
	createUserWalletBody,
	getWallets,
	getWalletsParams,
} from "../documentation/wallets";

const options: swaggerJsdoc.Options = {
	swaggerDefinition: {
		openapi: "3.0.0",
		info: {
			title: "Wallets Service API",
			version: "1.0.0",
			description: "API documentation for Wallets Service Trader App",
		},
		components: {
			securitySchemas: {
				bearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
				},
			},
			schemas: {
				getWalletsParams,
				createUserWalletBody,
			},
		},
		security: [
			{
				bearerAuth: [],
			},
		],
		paths: {
			[`${ROUTES.getWallets}`]: { post: createUserWallet, get: getWallets },
		},
	},
	apis: ["./src/routes/*.ts", "./src/models/*.ts"], // Point to your route files
};

const specs = swaggerJsdoc(options);

export default specs;
