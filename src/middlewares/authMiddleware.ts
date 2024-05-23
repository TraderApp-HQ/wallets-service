import { apiResponseHandler } from "@traderapp/shared-resources";
import dotenv from "dotenv";
import { Request, Response, NextFunction } from "express";
import { ResponseType } from "../config/constants";
import { HttpStatus } from "../utils/httpStatus";
import * as jwt from "jsonwebtoken";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "";

interface AuthPayload {
	user: {
		id: string;
	};
}

export const AuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
	const { authorization } = req.headers;

	if (!authorization) {
		return res.status(HttpStatus.FORBIDDEN).json(
			apiResponseHandler({
				type: ResponseType.ERROR,
				message: "No Authorization header provided",
			})
		);
	}

	const token = authorization.split(" ")[1];

	if (!token) {
		return res.status(HttpStatus.FORBIDDEN).json(
			apiResponseHandler({
				type: ResponseType.ERROR,
				message: "Authorization token missing",
			})
		);
	}

	try {
		const auth = await verifyToken(token, JWT_SECRET);

		if (!auth) {
			return res.status(HttpStatus.FORBIDDEN).json(
				apiResponseHandler({
					type: ResponseType.ERROR,
					message: "Invalid token",
				})
			);
		} else {
			req.body.userId = auth.user.id;
			next();
		}
	} catch (error: any) {
		return res.status(HttpStatus.FORBIDDEN).json(
			apiResponseHandler({
				type: ResponseType.ERROR,
				message: error.message,
			})
		);
	}
};

const verifyToken = async (token: string, secret: string): Promise<AuthPayload | null> => {
	return new Promise((resolve, reject) => {
		jwt.verify(token, secret, (error, decoded) => {
			if (error) {
				reject(new Error("Token verification failed"));
			} else {
				resolve(decoded as AuthPayload);
			}
		});
	});
};
