import { Router } from "express";
import { processOrder } from "../controllers/BalanceController";
import { ROUTES } from "../config/constants";

const router = Router();

router.patch(ROUTES.processOrder, processOrder);

export default router;
