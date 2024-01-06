"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncomingPaymentEventHandler = void 0;
const PaymentProcessorMessage_1 = require("./PaymentProcessorMessage");
const IncomingPaymentResult_1 = require("../model/IncomingPaymentResult");
class IncomingPaymentEventHandler {
    constructor(accountService, dataRepository) {
        this.accountService = accountService;
        this.dataRepository = dataRepository;
        this.typeName = 'incomingPaymentEvent';
    }
    async run(message) {
        let result = new PaymentProcessorMessage_1.PaymentProcessorResult();
        let payment = await this.accountService.handlePayment(message.incomingPaymentEvent);
        result.incomingPaymentResult = new IncomingPaymentResult_1.IncomingPaymentResult(payment);
        return Promise.resolve(result);
    }
}
exports.IncomingPaymentEventHandler = IncomingPaymentEventHandler;
//# sourceMappingURL=IncomingPaymentEventHandler.js.map