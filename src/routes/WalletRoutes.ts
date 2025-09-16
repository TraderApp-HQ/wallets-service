import { Router } from "express";
import {
	completeWithdrawal,
	/* createUserWallets, */
	getUserWallets,
	getUserWalletType,
	getWalletPaymentCategories,
	getWalletPaymentCategoryPaymentMethods,
	getWalletSupportedCurrencies,
	initiateDeposit,
	initiateWithdrawal,
	resendWithdrawalOTP,
} from "../controllers/WalletController/";
import {
	validateCompleteWithdrawalRequest,
	validateGetUserWalletsRequest,
	validateGetUserWalletTypeRequest,
	validateGetWalletCategoryPaymentMethodsRequest,
	validateGetWalletSupportedCurrencies,
	validateInitiateDepositRequest,
	validateInitiateWithdrawalRequest,
	validateRequest,
	validateResendWithdrawalOTPRequest,
} from "../middlewares/WalletMiddleware";

const router = Router();

// router.post("/create", AuthMiddleware, createUserWallets);
router.get(
	"/supported-currencies",
	validateGetWalletSupportedCurrencies,
	getWalletSupportedCurrencies
);
router.get("/user-wallets", validateGetUserWalletsRequest, getUserWallets);
router.get("/user-wallet-type", validateGetUserWalletTypeRequest, getUserWalletType);
router.get(
	"/payment-methods",
	validateGetWalletCategoryPaymentMethodsRequest,
	getWalletPaymentCategoryPaymentMethods
);
router.get("/payment-categories", validateRequest, getWalletPaymentCategories);
router.post("/initiate-deposit", validateInitiateDepositRequest, initiateDeposit);
router.post("/initiate-withdrawal", validateInitiateWithdrawalRequest, initiateWithdrawal);
router.post("/complete-withdrawal", validateCompleteWithdrawalRequest, completeWithdrawal);
router.post("/resend-withdrawal-otp", validateResendWithdrawalOTPRequest, resendWithdrawalOTP);

export default router;
