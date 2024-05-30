import { apiResponseHandler } from "@traderapp/shared-resources";
import { COLLECTIONS, ResponseType } from "../config/constants";
import { db } from "../firebase";
import { BaseInput, IAddressInput } from "../schemas";
import { UserNetworkAddress } from "../schemas/network";
import { HttpStatus } from "../utils/httpStatus";

export class AddressService {
	public async createUserNetworkAddress({ res, ...payload }: IAddressInput): Promise<any> {
		try {
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

	public async getAddresses({ userId, res }: IAddressInput): Promise<any> {
		try {
			const addresses = await this.getUserAddresses({ userId });
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

	public async getUserAddresses({ userId }: BaseInput): Promise<UserNetworkAddress[] | null> {
		try {
			const docs = await db
				.collection(COLLECTIONS.addresses)
				.where("userId", "==", `${userId}`)
				.get();

			const addresses: UserNetworkAddress[] = [];

			if (docs.empty) {
				return null;
			}

			docs.forEach((doc) => {
				addresses.push(doc.data() as UserNetworkAddress);
			});

			return addresses;
		} catch (error: any) {
			throw new Error(error.message);
		}
	}
}
