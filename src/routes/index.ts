import BalanceRoutes from "./BalanceRoutes";
import WalletRoutes from "./WalletRoutes";

export const routeHandler = async (app: { use: (arg0: string, arg1: any) => void }) => {
	app.use("/balances", BalanceRoutes);
	app.use("/wallets", await WalletRoutes());
};
