import { Router } from "express";
import { TransactionController } from "../controllers/TransactionController";
import { AuthMiddleware } from "../middlewares/authMiddleware";
import { TransactionService } from "../services/TransactionService";
import { WalletService } from "../services/WalletService";

const router = async () => {
	const walletService = new WalletService();
	const transactionService = new TransactionService(walletService);
	const transactionController = new TransactionController(transactionService);
	const routerInit = Router();

	routerInit.get(
		"/",
		AuthMiddleware,
		transactionController.getTransactions.bind(transactionController)
	);
	routerInit.post(
		"/deposit",
		AuthMiddleware,
		transactionController.depositFunds.bind(transactionController)
	);
	routerInit.post(
		"/withdrawal",
		AuthMiddleware,
		transactionController.withdrawFunds.bind(transactionController)
	);
	routerInit.post(
		"/convert",
		AuthMiddleware,
		transactionController.convertFunds.bind(transactionController)
	);
	routerInit.post(
		"/transfer",
		AuthMiddleware,
		transactionController.transferFunds.bind(transactionController)
	);

	return routerInit;
};

export default router;
