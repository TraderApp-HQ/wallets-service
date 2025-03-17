import { Request, Response, NextFunction } from "express";
import { INetworkAddressPayload } from "../schemas/network";
import { AddressService } from "../services/AddressService";

export class AddressController {
	private readonly addressService: AddressService;

	constructor(AddressService: AddressService) {
		this.addressService = AddressService;
	}

	public async createUserAddress(req: Request, res: Response, next: NextFunction) {
		const payload: INetworkAddressPayload = req.body;
		try {
			return await this.addressService.createUserNetworkAddress({ ...payload, res });
		} catch (error) {
			next(error);
		}
	}

	public async getUserAddress(req: Request, res: Response, next: NextFunction) {
		const payload = req.query;
		try {
			return await this.addressService.getAddresses({
				...payload,
				userId: req.body.userId,
				res,
			});
		} catch (error) {
			next(error);
		}
	}
}
