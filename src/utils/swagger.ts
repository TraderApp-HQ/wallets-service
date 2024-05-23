import swaggerJsdoc from "swagger-jsdoc";

import { ROUTES } from "../config/constants";
import {
	createUserWallet,
	createUserWalletBody,
	getWallets,
	getWalletsParams,
} from "../documentation/getWallets";
import { createProcessOrder, createProcessOrderBody } from "../documentation/processOrder";

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
				createProcessOrderBody,
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
			[`/balances${ROUTES.processOrder}`]: { patch: createProcessOrder },
			[`${ROUTES.getWallets}`]: { post: createUserWallet, get: getWallets },
		},
	},
	apis: ["./src/routes/*.ts", "./src/models/*.ts"], // Point to your route files
};

const specs = swaggerJsdoc(options);

export default specs;
