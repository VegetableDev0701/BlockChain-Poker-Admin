"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashTxController = void 0;
const PaymentProcessorMessage_1 = require("./../processor/PaymentProcessorMessage");
const express_1 = require("express");
const decimal_1 = require("../../../poker.ui/src/shared/decimal");
const log4js_1 = require("log4js");
const Currency_1 = require("../../../poker.ui/src/shared/Currency");
const incoming_payment_event_1 = require("../model/incoming-payment-event");
const shared_helpers_1 = require("../../../poker.engine/src/shared-helpers");
const logger = (0, log4js_1.getLogger)();
const fs = require('fs');
class DashTxController {
    constructor(dataRepository, paymentProcessor, dashCoreBlockService) {
        this.dataRepository = dataRepository;
        this.paymentProcessor = paymentProcessor;
        this.dashCoreBlockService = dashCoreBlockService;
        this.router = (0, express_1.Router)();
        this.logJson = true;
        this.index = 0;
        this.setupRoutes();
    }
    setupRoutes() {
        this.router.get('/', async (req, res) => {
            let [err, data] = await (0, shared_helpers_1.to)(this.run(req.query.txid));
            if (err) {
                logger.error(err);
            }
            res.send({});
        });
    }
    async run(txid) {
        const warnings = [];
        const infoLog = [];
        /*
          Arguments:
          1. "txid"                  (string, required) The transaction id
          2. "include_watchonly"     (bool, optional, default=false) Whether to include watch-only addresses in balance calculation and details[]
          */
        txid = txid.substring(0, 64);
        let [err, data] = await (0, shared_helpers_1.to)(this.dashCoreBlockService.getTransaction(txid));
        if (err) {
            if (err.message) {
                logger.error(err.message);
            }
            else {
                logger.error(err);
            }
            return;
        }
        if (this.logJson) {
            this.index++;
            fs.writeFile(`dash_gettransaction_${txid}_${this.index}.json`, JSON.stringify(data), (err) => {
                if (err) {
                    logger.error(err);
                }
                ;
            });
        }
        if (data.result) {
            let tx = data.result;
            let currencyConfig = await this.dataRepository.getCurrencyConfig(Currency_1.Currency.dash);
            let masterAccountPublic = currencyConfig.masterAccount != null ? currencyConfig.masterAccount.public : '';
            let detail = tx.details.find(d => d.category == 'receive' && d.address == masterAccountPublic);
            if (detail) {
                infoLog.push(`received credit to master account ${currencyConfig.masterAccount.public} of ${detail.amount} confirmations:${tx.confirmations} txid:${tx.txid}`);
            }
            else {
                await this.process(tx, currencyConfig, warnings, infoLog);
            }
        }
        else {
            warnings.push('data.result not defined', data);
        }
        if (warnings.length) {
            logger.warn(warnings.join());
        }
        if (infoLog.length) {
            logger.info(infoLog.join());
        }
        return [warnings, infoLog];
    }
    async process(tx, currencyConfig, warnings, infoLog) {
        for (let detail of tx.details) {
            let address = detail.address;
            if (detail.category === "receive") {
                let info = await this.dataRepository.getAddressInfoByAddress(address);
                if (info) {
                    let amount = new decimal_1.Decimal(tx.amount).mul(Currency_1.CurrencyUnit.getCurrencyUnit(Currency_1.Currency.dash)).toString();
                    let event = new incoming_payment_event_1.IncomingPaymentEvent(info.address, amount, tx.confirmations, tx.txid);
                    event.instantlock = tx.instantlock;
                    if (event.instantlock) {
                        //for instantsend set confirmations to the required number so creditAccount proceeds              
                        event.confirmations = currencyConfig.requiredNumberOfConfirmations;
                    }
                    let ppMessage = new PaymentProcessorMessage_1.PaymentProcessorMessage();
                    ppMessage.incomingPaymentEvent = event;
                    this.paymentProcessor.sendMessage(ppMessage);
                }
                else {
                    warnings.push(`TxCallback cannot handle txid: ${tx.txid} for ${address}. This address is unknown`);
                }
            }
            else if (detail.category === "send") {
                if (tx.confirmations == 0) {
                    //may have been outgoing payment that was just pushed
                    setTimeout(async () => {
                        await this.checkSend(tx, address);
                    }, 2000);
                }
                else {
                    await this.checkSend(tx, address);
                }
            }
        }
    }
    async checkSend(tx, address) {
        const payment = await this.dataRepository.getPaymentByTxId(Currency_1.Currency.dash, tx.txid);
        if (payment) {
            logger.info(`DashTxController category send txid: ${tx.txid} for ${address}. payment: ${payment._id.toString()}`);
        }
        else {
            logger.warn(`DashTxController cannot handle txid: ${tx.txid} for ${address}. There is no outgoing payment with this address`);
        }
    }
}
exports.DashTxController = DashTxController;
//# sourceMappingURL=dash-tx.controller.js.map