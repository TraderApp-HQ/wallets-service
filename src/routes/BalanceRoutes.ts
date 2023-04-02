import { Router } from "express";
import { processOrder } from "../controllers/BalanceController";

const router = Router();

router.patch("/process", processOrder);

export default router;
