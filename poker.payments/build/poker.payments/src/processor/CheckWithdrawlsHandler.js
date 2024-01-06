"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckWithdrawlsHandler = void 0;
const PaymentProcessorMessage_1 = require("./PaymentProcessorMessage");
const helpers_1 = require("../helpers");
const PaymentType_1 = require("../../../poker.ui/src/shared/PaymentType");
const log4js_1 = require("log4js");
var logger = (0, log4js_1.getLogger)();
const Currency_1 = require("../../../poker.ui/src/shared/Currency");
const decimal_1 = require("../../../poker.ui/src/shared/decimal");
const PaymentStatus_1 = require("../../../poker.ui/src/shared/PaymentStatus");
class CheckWithdrawlsHandler {
    constructor(dataRepository, http, telegramService) {
        this.dataRepository = dataRepository;
        this.http = http;
        this.telegramService = telegramService;
        this.typeName = 'checkWithdrawls';
    }
    async run(message) {
        let result = new PaymentProcessorMessage_1.PaymentProcessorResult();
        let lastWithdrawl = await this.dataRepository.getLastOutgoingPayment();
        let connectionConfig = (0, helpers_1.getAdminEndpointResult)();
        let endpoint = connectionConfig.endpoint + '/api/payments-since';
        if (lastWithdrawl) {
            endpoint += `?id=${lastWithdrawl._id.toString()}`;
        }
        let options = {
            headers: connectionConfig.headers,
            json: true,
            timeout: 5000
        };
        let payments = await this.http.get(endpoint, options)
            .catch((r => {
            logger.info(`checkWithdrawls failed: ${r}`);
        }));
        if (payments) {
            for (let payment of payments) {
                await this.importPayment(payment);
            }
        }
        return Promise.resolve(result);
    }
    async importPayment(payment) {
        let dbPayment = await this.dataRepository.getPaymentById(payment._id);
        if (!dbPayment) {
            if (payment.type == PaymentType_1.PaymentType.outgoing) {
                if (payment.status) {
                    if (payment.status == PaymentStatus_1.PaymentStatus.pending) {
                        await this.importOutgoingPendingPayment(payment);
                    }
                    else {
                        await this.dataRepository.savePayment(payment);
                    }
                }
                else {
                    logger.warn(`payment status not defined! ${JSON.stringify(payment)}`);
                }
            }
            else if (payment.type == PaymentType_1.PaymentType.incoming) {
                await this.dataRepository.savePayment(payment); //tournament transfer
            }
            else {
                logger.warn(`received payment ${payment._id} with unexpected payment type ${payment.type}`);
            }
        }
    }
    async importOutgoingPendingPayment(payment) {
        let currencyConfig = await this.dataRepository.getCurrencyConfig(payment.currency);
        let amount = new decimal_1.Decimal(payment.amount).dividedBy(Currency_1.CurrencyUnit.getCurrencyUnit(payment.currency));
        let shouldFlag = amount.greaterThan(new decimal_1.Decimal(currencyConfig.flagAmount));
        payment.status = shouldFlag ? PaymentStatus_1.PaymentStatus.flagged : PaymentStatus_1.PaymentStatus.pending;
        let processingDelayStr = '';
        if (!shouldFlag) {
            processingDelayStr = ' Processing delay:';
            processingDelayStr += (currencyConfig.processingDelayMin || -1) < 0 ? 'disabled' : `${currencyConfig.processingDelayMin} min`;
        }
        let txtMsg = `Received new withdrawl (${payment.status}) from ${payment.screenName} for ${amount.toString()} ${payment.currency}.${processingDelayStr}`;
        let sent = await this.telegramService.sendTelegram(txtMsg);
        if (!sent) {
            logger.info(`not saving payment ${payment._id} as telegram send failed`);
        }
        else {
            payment.timestamp = new Date(); //use our date as timestamp to avoid hack where malicious user predates the timestamp
            this.dataRepository.savePayment(payment);
        }
    }
}
exports.CheckWithdrawlsHandler = CheckWithdrawlsHandler;
//# sourceMappingURL=CheckWithdrawlsHandler.js.map