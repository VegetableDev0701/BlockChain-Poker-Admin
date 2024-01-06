"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessWithdrawlsHandler = void 0;
const PaymentProcessorMessage_1 = require("./PaymentProcessorMessage");
const PaymentType_1 = require("../../../poker.ui/src/shared/PaymentType");
const log4js_1 = require("log4js");
var logger = (0, log4js_1.getLogger)();
const PaymentStatus_1 = require("../../../poker.ui/src/shared/PaymentStatus");
const WithdrawlsHandler_1 = require("./WithdrawlsHandler");
class ProcessWithdrawlsHandler {
    constructor(accountService, dataRepository, connectionToGameServer, http) {
        this.accountService = accountService;
        this.dataRepository = dataRepository;
        this.connectionToGameServer = connectionToGameServer;
        this.http = http;
        this.typeName = 'processWithdrawls';
    }
    async run(message) {
        let result = new PaymentProcessorMessage_1.PaymentProcessorResult();
        if (await this.checkMacroSetting()) {
            let configs = await this.dataRepository.getCurrencyConfigs();
            for (let config of configs) {
                if ((config.processingDelayMin || -1) < 0) {
                    continue;
                }
                await this.check(config);
            }
        }
        else {
            logger.info(`payments disabled at a macro level`);
        }
        return result;
    }
    async check(config) {
        let date = new Date();
        let queryDate = this.getDate(date, config.processingDelayMin || ProcessWithdrawlsHandler.DefaultProcessingDelayMin);
        let payments = await this.dataRepository.getPayments({ timestamp: { $lte: queryDate }, status: PaymentStatus_1.PaymentStatus.pending, type: PaymentType_1.PaymentType.outgoing, currency: config.name });
        for (let payment of payments) {
            if (!payment.error) {
                let completedQueryDate = this.getDate(date, config.withdrawlLimitPerMin || ProcessWithdrawlsHandler.DefaultWithdrawlLimitPerMin);
                let completePayments = await this.dataRepository.getPayments({ timestamp: { $gte: completedQueryDate }, status: PaymentStatus_1.PaymentStatus.complete, type: PaymentType_1.PaymentType.outgoing, currency: config.name });
                if (completePayments.length < (config.withdrawlLimitNumber || ProcessWithdrawlsHandler.DefaultWithdrawlLimitNumber)) {
                    let transactionResult = await (0, WithdrawlsHandler_1.withdraw)(payment, this.accountService, this.dataRepository, this.connectionToGameServer, { allowFlagged: false });
                    logger.info(`ProcessWithdrawlsHandler transactionResult payment ${payment._id + ''}: ${JSON.stringify(transactionResult)}`);
                }
            }
        }
    }
    async checkMacroSetting() {
        if (process.env.POKER_DISABLE_PAYMENTS_MACRO_IP) {
            let url = `http://${process.env.POKER_DISABLE_PAYMENTS_MACRO_IP}/disable.json`;
            let response = await this.http.get(url, {
                json: true,
                timeout: 15000
            });
            return !response.disabled;
        }
        return Promise.resolve(true);
    }
    getDate(date, delayMin) {
        return new Date(date.getTime() - delayMin * 1000 * 60);
    }
}
exports.ProcessWithdrawlsHandler = ProcessWithdrawlsHandler;
ProcessWithdrawlsHandler.DefaultProcessingDelayMin = 30;
ProcessWithdrawlsHandler.DefaultWithdrawlLimitPerMin = 10;
ProcessWithdrawlsHandler.DefaultWithdrawlLimitNumber = 3;
//# sourceMappingURL=ProcessWithdrawlsHandler.js.map