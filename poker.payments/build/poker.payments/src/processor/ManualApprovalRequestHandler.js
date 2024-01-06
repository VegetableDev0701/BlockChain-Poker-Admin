"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManualApprovalRequestHandler = void 0;
const PaymentProcessorMessage_1 = require("./PaymentProcessorMessage");
const log4js_1 = require("log4js");
const logger = (0, log4js_1.getLogger)();
const ManualApprovalRequest_1 = require("../model/ManualApprovalRequest");
const WithdrawlsHandler_1 = require("./WithdrawlsHandler");
class ManualApprovalRequestHandler {
    constructor(accountService, dataRepository, connectionToGameServer) {
        this.accountService = accountService;
        this.dataRepository = dataRepository;
        this.connectionToGameServer = connectionToGameServer;
        this.typeName = 'manualApprovalRequest';
    }
    async run(message) {
        let ppResult = new PaymentProcessorMessage_1.PaymentProcessorResult();
        ppResult.manualApprovalResult = new ManualApprovalRequest_1.ManualApprovalResult();
        let payment = await this.dataRepository.getPaymentById(message.manualApprovalRequest.paymentId);
        if (!payment) {
            ppResult.manualApprovalResult.error = `payment not found: ${message.manualApprovalRequest.paymentId}`;
            return ppResult;
        }
        let result = await (0, WithdrawlsHandler_1.withdraw)(payment, this.accountService, this.dataRepository, this.connectionToGameServer, { allowFlagged: true });
        ppResult.manualApprovalResult.payment = payment;
        ppResult.manualApprovalResult.error = result.errorMessage;
        return ppResult;
    }
}
exports.ManualApprovalRequestHandler = ManualApprovalRequestHandler;
//# sourceMappingURL=ManualApprovalRequestHandler.js.map