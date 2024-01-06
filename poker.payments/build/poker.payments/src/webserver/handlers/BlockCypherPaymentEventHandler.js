"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockCypherPaymentEventHandler = void 0;
const PaymentStatus_1 = require("./../../../../poker.ui/src/shared/PaymentStatus");
const PaymentProcessorMessage_1 = require("./../../processor/PaymentProcessorMessage");
const log4js_1 = require("log4js");
const incoming_payment_event_1 = require("../../model/incoming-payment-event");
const shared_helpers_1 = require("../../../../poker.engine/src/shared-helpers");
const EventHook_1 = require("../../model/EventHook");
const logger = (0, log4js_1.getLogger)();
class BlockCypherPaymentEventHandler {
    constructor(dataRepository, accountService, blockCypherService, paymentProcessor) {
        this.dataRepository = dataRepository;
        this.accountService = accountService;
        this.blockCypherService = blockCypherService;
        this.paymentProcessor = paymentProcessor;
    }
    async run(event) {
        let guid = event.guid;
        let info = await this.dataRepository.getAddressInfoByGuid(guid);
        if (!info) {
            logger.warn(`callback received for address guid ${guid} but no address info found`);
            return Promise.resolve();
        }
        let tx = await this.blockCypherService.getTx(event.tx.hash, info.currency);
        await this.handleBlockCypherPaymentCallback(tx, info);
    }
    async handleBlockCypherPaymentCallback(tx, info) {
        let confirmations;
        let value;
        let output = tx.outputs.find((o) => o.addresses[0] === info.address);
        let event;
        if (output != null) {
            logger.info(`found ${tx.confirmations} confirmations for ${output.addresses[0]}`);
            confirmations = parseInt(tx.confirmations);
            value = shared_helpers_1.SharedHelpers.convertToLocalAmount(info.currency, output.value);
            let existingHook = this.blockCypherService.hooks.find((h) => h.address === info.address);
            let lastInputAddr = '';
            if (tx.inputs && tx.inputs.length)
                lastInputAddr = tx.inputs[tx.inputs.length - 1].addresses[0];
            event = new incoming_payment_event_1.IncomingPaymentEvent(info.address, value, confirmations, tx.hash);
            event.lastInputAddr = lastInputAddr;
            //
            let ppMessage = new PaymentProcessorMessage_1.PaymentProcessorMessage();
            ppMessage.incomingPaymentEvent = event;
            let paymentProcessorResult = await this.paymentProcessor.sendMessage(ppMessage);
            let incomingPaymentResult = paymentProcessorResult.incomingPaymentResult;
            if (incomingPaymentResult != null && incomingPaymentResult.payment != null && incomingPaymentResult.payment.status == PaymentStatus_1.PaymentStatus.complete && existingHook) {
                await this.blockCypherService.delHook(info.currency, info.hookId);
                logger.info('deleted hook: ' + info.hookId);
                existingHook.result = new EventHook_1.EventHookResult(confirmations, parseFloat(value));
                this.blockCypherService.hooks.splice(this.blockCypherService.hooks.indexOf(existingHook), 1);
            }
        }
        else {
            logger.info(`callback received for address guid ${info.guid} but output does not contain target address ${info.address}. tx.outputs=${JSON.stringify(tx.outputs)}`);
        }
        return Promise.resolve(info);
    }
}
exports.BlockCypherPaymentEventHandler = BlockCypherPaymentEventHandler;
//# sourceMappingURL=BlockCypherPaymentEventHandler.js.map