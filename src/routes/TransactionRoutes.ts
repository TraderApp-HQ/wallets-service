import { Router } from "express";
import { TransactionController } from "../controllers/TransactionController";
// import { AuthMiddleware } from "../middlewares/authMiddleware";
import { TransactionService } from "../services/TransactionService";
import { WalletService } from "../services/WalletService";

const router = async () => {
	const walletService = new WalletService();
	const transactionService = new TransactionService(walletService);
	const transactionController = new TransactionController(transactionService);
	const routerInit = Router();

	routerInit.get("/", transactionController.getTransactions.bind(transactionController));
	routerInit.post("/deposit", transactionController.depositFunds.bind(transactionController));
	routerInit.post("/withdrawal", transactionController.withdrawFunds.bind(transactionController));

	return routerInit;
};

export default router;
