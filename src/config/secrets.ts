import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

export enum SecretLocation {
	commonSecrets = "common-secrets",
	walletsServiceSecrets = "wallets-service-secrets",
}

export interface IWalletsServiceSecrets {
	WALLET_SERVICE_DB_URL: string;
}

const client = new SecretsManagerClient({
	region: process.env.AWS_REGION || "eu-west-1",
});

export const getSecrets = async <T>(secretName: string): Promise<T> => {
	console.log(`getting ${secretName} secrets`);
	const command = new GetSecretValueCommand({ SecretId: secretName });
	const response = await client.send(command);

	return JSON.parse(response.SecretString || "{}") as T;
};
