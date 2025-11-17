import { cryptopayNetworkFeesJob } from "./CryptoPayNetworkFees";
import { currencyExchangeRateJob } from "./CurrencyExchangeRate";

const runAllJobs = () => {
	currencyExchangeRateJob();
	cryptopayNetworkFeesJob();
};

export default runAllJobs;
