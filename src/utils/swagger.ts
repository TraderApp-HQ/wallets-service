import swaggerJsdoc from "swagger-jsdoc";

import { ROUTES } from "../config/constants";
import {
	createUserWallet,
	createUserWalletBody,
	getWallets,
	getWalletsParams,
} from "../documentation/wallets";
import { createProcessOrder, createProcessOrderBody } from "../documentation/processOrder";
import {
	convertFunds,
	convertFundsBody,
	depositFunds,
	depositFundsBody,
	getTransactions,
	getTransactionsParams,
	transferFunds,
	transferFundsBody,
	withdrawFunds,
	withdrawFundsBody,
} from "../documentation/transactions";
import {
	createUserNetworkAddress,
	createUserNetworkAddressBody,
	getNetworkAddresses,
	getNetworkAddressParams,
} from "../documentation/addresses";

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
				depositFundsBody,
				withdrawFundsBody,
				convertFundsBody,
				transferFundsBody,
				getTransactionsParams,
				getNetworkAddressParams,
				createUserNetworkAddressBody,
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
			[`${ROUTES.transactions}`]: { get: getTransactions },
			[`${ROUTES.transactions}/deposit`]: { post: depositFunds },
			[`${ROUTES.transactions}/withdrawal`]: { post: withdrawFunds },
			[`${ROUTES.transactions}/convert`]: { post: convertFunds },
			[`${ROUTES.transactions}/transfer`]: { post: transferFunds },
			[`${ROUTES.addresses}`]: { post: createUserNetworkAddress, get: getNetworkAddresses },
		},
	},
	apis: ["./src/routes/*.ts", "./src/models/*.ts"], // Point to your route files
};

const specs = swaggerJsdoc(options);

export default specs;
