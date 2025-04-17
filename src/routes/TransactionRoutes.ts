import { Router } from "express";
import { AuthMiddleware } from "../middlewares/authMiddleware";
import {
	getTransactions,
	depositFunds,
	withdrawFunds,
	convertFunds,
	transferFunds,
	getTransaction,
} from "../controllers/TransactionController/";
import { validateRequest } from "../middlewares/WalletMiddleware";

const router = Router();

router.get("/", validateRequest, getTransactions);
router.get("/get-transaction", validateRequest, getTransaction);
router.post("/deposit", AuthMiddleware, depositFunds);
router.post("/withdrawal", AuthMiddleware, withdrawFunds);
router.post("/convert", AuthMiddleware, convertFunds);
router.post("/transfer", AuthMiddleware, transferFunds);

export default router;
