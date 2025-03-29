import { Request } from "express";
import JWT from "jsonwebtoken";
import { config } from "dotenv";
import { RESPONSE_FLAGS } from "../config/constants";
import { IAccessToken } from "../config/interfaces";
import { UserRoles } from "../config/enums";

config();

export async function verifyAccessToken(accessToken: string) {
	const secret = process.env.ACCESS_TOKEN_SECRET as string;

	return new Promise((resolve, reject) => {
		JWT.verify(accessToken, secret, (err, payload) => {
			if (err) {
				err.name = "Unauthorized";
				err.message = "Invalid Token";
				reject(err);
			}

			// return payload
			resolve(payload);
		});
	});
}

export async function getAccessTokenPayload(req: Request) {
	// get accessToken from req headers
	const accessToken = req.headers.authorization?.split(" ")[1];

	// check if access token was supplied
	if (!accessToken) {
		const error = new Error("Invalid Token");
		error.name = RESPONSE_FLAGS.unauthorized;
		throw error;
	}

	// verify accessToken and return payload
	const payload = await verifyAccessToken(accessToken);
	return payload as IAccessToken;
}

// A function to get accessToken from headers, verify it and check if user is admin
export async function checkAdmin(req: Request) {
	const user = await getAccessTokenPayload(req);
	if (!user.role.includes(UserRoles.ADMIN) && !user.role.includes(UserRoles.SUPER_ADMIN)) {
		const error = new Error(
			"You don't have the necessary permission to perform this operation."
		);
		error.name = "Forbidden";
		throw error;
	}
	return user;
}

export async function checkSuperAdmin(req: Request) {
	const user = await getAccessTokenPayload(req);
	if (!user.role.includes(UserRoles.SUPER_ADMIN)) {
		const error = new Error(
			"You don't have the necessary permission to perform this operation."
		);
		error.name = "Forbidden";
		throw error;
	}
	return user;
}

//  check if user exist
export async function checkUser(req: Request) {
	const user = await getAccessTokenPayload(req);
	return user;
}
