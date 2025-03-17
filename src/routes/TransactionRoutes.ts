import { Router } from "express";
import { AuthMiddleware } from "../middlewares/authMiddleware";
import {
	getTransactions,
	depositFunds,
	withdrawFunds,
	convertFunds,
	transferFunds,
} from "../controllers/TransactionController/";

const router = Router();

router.get("/", AuthMiddleware, getTransactions);
router.post("/deposit", AuthMiddleware, depositFunds);
router.post("/withdrawal", AuthMiddleware, withdrawFunds);
router.post("/convert", AuthMiddleware, convertFunds);
router.post("/transfer", AuthMiddleware, transferFunds);

export default router;
