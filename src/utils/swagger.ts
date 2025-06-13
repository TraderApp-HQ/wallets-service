import swaggerJsdoc from "swagger-jsdoc";

import {
	getUserWallets,
	getUserWalletType,
	getWalletPaymentCategories,
	getWalletPaymentMethods,
	initiateDeposit,
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
			securitySchemes: {
				bearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
				},
			},
			schemas: {
				getUserWalletsParams: {
					type: "object",
					properties: {
						userId: {
							type: "string",
							description: "User ID to retrieve wallets for",
							example: "user-12345",
						},
					},
				},
				getUserWalletTypeParams: {
					type: "object",
					properties: {
						userId: {
							type: "string",
							description: "User ID to retrieve wallets for",
							example: "user-12345",
						},
						type: {
							type: "string",
							description: "Wallet type to filter by",
							enum: ["MAIN", "SPOT", "FUTURES"],
							example: "MAIN",
						},
					},
					required: ["type"],
				},
				getWalletPaymentMethodsParams: {
					type: "object",
					properties: {
						category: {
							type: "string",
							description: "Payment category name",
							example: "CRYPTO",
						},
						operation: {
							type: "string",
							description: "Payment operation type",
							enum: ["DEPOSIT", "WITHDRAWAL"],
							example: "DEPOSIT",
						},
					},
					required: ["category", "operation"],
				},
				initiateDepositBody: {
					type: "object",
					properties: {
						userId: {
							type: "string",
							description: "User ID",
							example: "user-12345",
						},
						currencyId: {
							type: "string",
							description: "Currency ID",
							example: "60f1a5b3e6b3f32d4c8b456a",
						},
						paymentMethodId: {
							type: "string",
							description: "Payment method ID",
							example: "60f1a5b3e6b3f32d4c8b456b",
						},
						providerId: {
							type: "string",
							description: "Provider ID",
							example: "60f1a5b3e6b3f32d4c8b456c",
						},
						network: {
							type: "string",
							description: "Network for the transaction",
							example: "tron",
						},
						amount: {
							type: "number",
							description: "Amount to deposit",
							example: 100,
						},
					},
					required: ["currencyId", "paymentMethodId", "providerId"],
				},
			},
		},
		security: [
			{
				bearerAuth: [],
			},
		],
		paths: {
			"/wallets/user-wallets": {
				get: getUserWallets,
			},
			"/wallets/user-wallet-type": {
				get: getUserWalletType,
			},
			"/wallets/payment-categories": {
				get: getWalletPaymentCategories,
			},
			"/wallets/payment-methods": {
				get: getWalletPaymentMethods,
			},
			"/wallets/initiate-deposit": {
				post: initiateDeposit,
			},
		},
	},
	apis: ["./src/routes/*.ts", "./src/models/*.ts"],
};

const specs = swaggerJsdoc(options);

export default specs;
