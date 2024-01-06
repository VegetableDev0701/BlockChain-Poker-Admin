"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentProcessor = void 0;
const PaymentProcessorMessage_1 = require("./PaymentProcessorMessage");
const AbstractProcessor_1 = require("../../../poker.engine/src/framework/AbstractProcessor");
const DepositAddressTrigger_1 = require("../../../poker.engine/src/admin/model/outgoing/DepositAddressTrigger");
class PaymentProcessor extends AbstractProcessor_1.AbstractProcessor {
    constructor(timeoutMs) {
        super(PaymentProcessorMessage_1.PaymentProcessorResult, timeoutMs);
    }
    sendCheckWithdrawls() {
        let message = new PaymentProcessorMessage_1.PaymentProcessorMessage();
        message.checkWithdrawls = {};
        this.sendMessage(message);
    }
    sendCheckDepositAddresses() {
        let message = new PaymentProcessorMessage_1.PaymentProcessorMessage();
        message.checkDepositAddresses = new DepositAddressTrigger_1.DepositAddressTrigger();
        this.sendMessage(message);
    }
}
exports.PaymentProcessor = PaymentProcessor;
//# sourceMappingURL=PaymentProcessor.js.map