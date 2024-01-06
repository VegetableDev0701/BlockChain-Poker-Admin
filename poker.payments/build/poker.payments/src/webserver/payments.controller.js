"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsController = void 0;
const express_1 = require("express");
const PaymentProcessorMessage_1 = require("../processor/PaymentProcessorMessage");
const ManualApprovalRequest_1 = require("../model/ManualApprovalRequest");
const shared_helpers_1 = require("../../../poker.engine/src/shared-helpers");
const log4js_1 = require("log4js");
const CancelPaymentRequest_1 = require("../model/CancelPaymentRequest");
const logger = (0, log4js_1.getLogger)();
class PaymentsController {
    constructor(dataRepository, paymentProcessor) {
        this.dataRepository = dataRepository;
        this.paymentProcessor = paymentProcessor;
        this.router = (0, express_1.Router)();
        this.setupRoutes();
    }
    setupRoutes() {
        this.router.get('/', async (req, res) => {
            let payments = await this.dataRepository.getPayments(req.query);
            res.send(payments);
        });
        this.router.post('/approve', async (req, res) => {
            let message = new PaymentProcessorMessage_1.PaymentProcessorMessage();
            message.manualApprovalRequest = new ManualApprovalRequest_1.ManualApprovalRequest(req.query.id);
            let [err, data] = await (0, shared_helpers_1.to)(this.paymentProcessor.sendMessage(message));
            if (err) {
                logger.error(err);
            }
            else if (data.manualApprovalResult) {
                res.send(data.manualApprovalResult);
            }
            else {
                logger.error('unexpected error PaymentsController');
            }
        });
        this.router.post('/cancel', async (req, res) => {
            let message = new PaymentProcessorMessage_1.PaymentProcessorMessage();
            message.cancelPaymentRequest = new CancelPaymentRequest_1.CancelPaymentRequest(req.query.id);
            let [err, data] = await (0, shared_helpers_1.to)(this.paymentProcessor.sendMessage(message));
            if (err) {
                logger.error(err);
            }
            else if (data.cancelPaymentResult) {
                res.send(data.cancelPaymentResult);
            }
            else {
                logger.error('unexpected error PaymentsController');
            }
        });
    }
}
exports.PaymentsController = PaymentsController;
//# sourceMappingURL=payments.controller.js.map