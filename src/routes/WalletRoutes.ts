import { Router } from "express";
import { getWallets } from "../controllers/WalletController";

const router = Router();

router.get("/", getWallets);

export default router;
