"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancelPaymentRequestHandler = void 0;
const PaymentProcessorMessage_1 = require("./PaymentProcessorMessage");
const log4js_1 = require("log4js");
const logger = (0, log4js_1.getLogger)();
const PaymentStatus_1 = require("../../../poker.ui/src/shared/PaymentStatus");
const GetPaymentsResult_1 = require("../../../poker.engine/src/admin/model/incoming/GetPaymentsResult");
const CancelPaymentRequest_1 = require("../model/CancelPaymentRequest");
class CancelPaymentRequestHandler {
    constructor(dataRepository, connectionToGameServer) {
        this.dataRepository = dataRepository;
        this.connectionToGameServer = connectionToGameServer;
        this.typeName = 'cancelPaymentRequest';
    }
    async run(message) {
        let ppResult = new PaymentProcessorMessage_1.PaymentProcessorResult();
        let result = new CancelPaymentRequest_1.CancelPaymentResult();
        ppResult.cancelPaymentResult = result;
        let payment = await this.dataRepository.getPaymentById(message.cancelPaymentRequest.paymentId);
        if (!payment) {
            result.error = `payment not found: ${message.cancelPaymentRequest.paymentId}`;
            return ppResult;
        }
        if (payment.status !== PaymentStatus_1.PaymentStatus.pending) {
            result.error = `payment has status of ${payment.status} but is required to have status pending`;
            return ppResult;
        }
        payment.status = PaymentStatus_1.PaymentStatus.cancelled;
        payment.updated = new Date();
        await this.dataRepository.savePayment(payment);
        let getPaymentsResult = new GetPaymentsResult_1.GetPaymentsResult();
        getPaymentsResult.payments = [payment];
        this.connectionToGameServer.send(getPaymentsResult);
        result.payment = payment;
        return ppResult;
    }
}
exports.CancelPaymentRequestHandler = CancelPaymentRequestHandler;
//# sourceMappingURL=CancelPaymentRequestHandler.js.map