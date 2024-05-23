import { Router } from "express";
import { WalletController } from "../controllers/WalletController";
import { WalletService } from "../services/WalletService";

const router = async () => {
	const walletService = new WalletService();
	const walletController = new WalletController(walletService);
	const routerInit = Router();

	routerInit.post("/", walletController.createUserWallet.bind(walletController));
	routerInit.get("/", walletController.getUserWallets.bind(walletController));

	return routerInit;
};

export default router;
