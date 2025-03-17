import { Router } from "express";
import {
	/* createUserWallets, */
	getUserWallets,
	getUserWalletType,
	getWalletPaymentCategories,
	getWalletPaymentCategoryPaymentMethods,
	initiateDeposit,
} from "../controllers/WalletController/";
import {
	validateGetUserWalletsRequest,
	validateGetUserWalletTypeRequest,
	validateGetWalletCategoryPaymentMethodsRequest,
	validateInitiateDepositRequest,
	validateRequest,
} from "../middlewares/WalletMiddleware";

const router = Router();

// router.post("/create", AuthMiddleware, createUserWallets);
router.get("/user-wallets", validateGetUserWalletsRequest, getUserWallets);
router.get("/user-wallet-type", validateGetUserWalletTypeRequest, getUserWalletType);
router.get(
	"/payment-methods",
	validateGetWalletCategoryPaymentMethodsRequest,
	getWalletPaymentCategoryPaymentMethods
);
router.get("/payment-categories", validateRequest, getWalletPaymentCategories);
router.post("/initiate-deposit", validateInitiateDepositRequest, initiateDeposit);

export default router;
