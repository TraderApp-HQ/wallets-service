import { apiResponseHandler } from "@traderapp/shared-resources";
import { Request, Response, NextFunction } from "express";
import { ResponseType } from "../config/constants";
import { UserType } from "../schemas";
import { INetworkAddressPayload } from "../schemas/network";
import { AddressService } from "../services/AddressService";
import { HttpStatus } from "../utils/httpStatus";

export class AddressController {
	private readonly addressService: AddressService;

	constructor(AddressService: AddressService) {
		this.addressService = AddressService;
	}

	public async createUserAddress(req: Request, res: Response, next: NextFunction) {
		const payload: INetworkAddressPayload = req.body;
		try {
			const { userType, ...rest } = payload;
			const networkAddress = await this.addressService.createUserNetworkAddress(rest);
			return res.status(HttpStatus.OK).json(
				apiResponseHandler({
					type: ResponseType.SUCCESS,
					message: "User network address created successfully!",
					object: { networkAddress },
				})
			);
		} catch (error) {
			next(error);
		}
	}

	public async getUserAddress(req: Request, res: Response, next: NextFunction) {
		const payload = req.query;
		const { userId, userType } = req.body;
		try {
			const networkAddress = await this.addressService.getUserAddresses({
				...payload,
				userId: userId,
				userType: userType as UserType.ADMIN,
			});
			return res.status(HttpStatus.OK).json(
				apiResponseHandler({
					type: ResponseType.SUCCESS,
					message: "List of user network addresses",
					object: { networkAddress },
				})
			);
		} catch (error) {
			next(error);
		}
	}
}
