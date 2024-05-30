import { apiResponseHandler } from "@traderapp/shared-resources";
import { COLLECTIONS, ResponseType } from "../config/constants";
import { db } from "../firebase";
import {
	INetworkAddressInput,
	INetworkAddressPayload,
	UserNetworkAddress,
} from "../schemas/network";
import { HttpStatus } from "../utils/httpStatus";

export class AddressService {
	public async createUserNetworkAddress({
		res,
		...payload
	}: INetworkAddressPayload): Promise<any> {
		try {
			// generate randomNetworkAddress
			payload.address = `${payload.network}-${payload.currency}:${payload.userId}`;
			await db.collection(COLLECTIONS.addresses).add(payload);
			return res.status(HttpStatus.OK).json(
				apiResponseHandler({
					type: ResponseType.SUCCESS,
					message: "User network address created successfully!",
					object: { payload },
				})
			);
		} catch (error: any) {
			throw new Error(`Error creating network address: ${error.message}`);
		}
	}

	public async getAddresses({ res, ...payload }: INetworkAddressPayload): Promise<any> {
		try {
			const addresses = await this.getUserAddresses({ ...payload });
			if (!addresses) {
				return res.status(200).json(
					apiResponseHandler({
						type: ResponseType.SUCCESS,
						message: "No existing network address found!",
					})
				);
			}

			return res.status(200).json(
				apiResponseHandler({
					type: ResponseType.SUCCESS,
					message: "List of user network addresses!",
					object: { addresses },
				})
			);
		} catch (error: any) {
			throw new Error(error.message);
		}
	}

	public async getUserAddresses(
		payload: INetworkAddressInput
	): Promise<UserNetworkAddress[] | null> {
		try {
			let query: any = db.collection(COLLECTIONS.addresses);
			query = query.where("userId", "==", payload.userId);
			if (payload.currency) {
				query = query.where("currency", "==", payload.currency);
			}
			if (payload.network) {
				query = query.where("network", "==", payload.network);
			}
			const docs = await query.get();

			const addresses: UserNetworkAddress[] = [];

			if (docs.empty) {
				return null;
			}

			docs.forEach((doc: any) => {
				const data = doc.data() as UserNetworkAddress;
				data.id = doc.id;
				addresses.push(data);
			});

			return addresses;
		} catch (error: any) {
			throw new Error(error.message);
		}
	}
}
