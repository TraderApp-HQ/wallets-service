import { Router } from "express";
import { validateCryptopayWebhooksRequest } from "../middlewares/WebhooksMiddleware";
import { processCryptopayWebhooks } from "../controllers/WebhooksController";

const router = Router();

router.post("/cryptopay", validateCryptopayWebhooksRequest, processCryptopayWebhooks);

export default router;
