import { COLLECTIONS } from "../config/constants";
import { db } from "../firebase";
import { IAddressInput } from "../schemas";
import { INetworkAddressPayload, UserNetworkAddress } from "../schemas/network";

export class AddressService {
	public async createUserNetworkAddress(payload: INetworkAddressPayload): Promise<any> {
		try {
			const { userId, currency, network } = payload;
			// generate randomNetworkAddress
			payload.address = `${network}-${currency}:${userId}`;
			const networkAddress = payload;
			await db.collection(COLLECTIONS.addresses).add(networkAddress);
			return networkAddress;
		} catch (error: any) {
			throw new Error(`Error creating network address: ${error.message}`);
		}
	}

	public async getUserAddresses(payload: IAddressInput): Promise<UserNetworkAddress[] | null> {
		try {
			const { userId, currency, network, userType } = payload;
			let query: any = db.collection(COLLECTIONS.addresses);
			// Check if userType is provided
			if (!userType) {
				query = query.where("userId", "==", `${userId}`);
			}
			query = query.where("userId", "==", userId);
			if (currency) {
				query = query.where("currency", "==", currency);
			}
			if (network) {
				query = query.where("network", "==", network);
			}
			const docs = await query.get();

			const addresses: UserNetworkAddress[] = [];

			if (docs.empty) {
				return [];
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
