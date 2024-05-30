import { Router } from "express";
import { AddressController } from "../controllers/AddressController";
import { AuthMiddleware } from "../middlewares/authMiddleware";
import { AddressService } from "../services/AddressService";

const router = async () => {
	const addressService = new AddressService();
	const addressController = new AddressController(addressService);
	const routerInit = Router();

	routerInit.post(
		"/",
		AuthMiddleware,
		addressController.createUserAddress.bind(addressController)
	);
	routerInit.get("/", AuthMiddleware, addressController.getUserAddress.bind(addressController));

	return routerInit;
};

export default router;
