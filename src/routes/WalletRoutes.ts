import { Router } from "express";
import { ROUTES } from "../config/constants";
import { getWallets } from "../controllers/WalletController";

const router = Router();

router.get(ROUTES.getWallets, getWallets);

export default router;
