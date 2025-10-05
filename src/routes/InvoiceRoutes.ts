import { Router } from "express";
import { getUserInvoices } from "../controllers/InvoiceController";
import { validateGetUserInvoicesRequest } from "../middlewares/InvoiceMiddleware";

const router = Router();

router.get("/", validateGetUserInvoicesRequest, getUserInvoices);

export default router;
