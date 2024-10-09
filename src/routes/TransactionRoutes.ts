import { Router } from "express";
import { TransactionController } from "../controllers/TransactionController";
import { db } from "../firebase";
import { AuthMiddleware } from "../middlewares/authMiddleware";
import { AddressService } from "../services/AddressService";
import { DbService } from "../services/DbService";
import { TransactionService } from "../services/TransactionService";
import { WalletService } from "../services/WalletService";

const router = async () => {
	const walletService = new WalletService();
	const addressService = new AddressService();
	const dbService = new DbService(db);
	const transactionService = new TransactionService(walletService, addressService, dbService);
	const transactionController = new TransactionController(transactionService, walletService);
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
