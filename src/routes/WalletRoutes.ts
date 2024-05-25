import { Router } from "express";
import { WalletController } from "../controllers/WalletController";
import { AuthMiddleware } from "../middlewares/authMiddleware";
import { WalletService } from "../services/WalletService";

const router = async () => {
	const walletService = new WalletService();
	const walletController = new WalletController(walletService);
	const routerInit = Router();

	routerInit.post("/", AuthMiddleware, walletController.createUserWallet.bind(walletController));
	routerInit.get("/", AuthMiddleware, walletController.getUserWallets.bind(walletController));

	return routerInit;
};

export default router;
