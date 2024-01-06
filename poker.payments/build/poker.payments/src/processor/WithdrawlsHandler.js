"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withdraw = void 0;
const PaymentType_1 = require("../../../poker.ui/src/shared/PaymentType");
const PaymentStatus_1 = require("../../../poker.ui/src/shared/PaymentStatus");
const decimal_1 = require("../../../poker.ui/src/shared/decimal");
const GetPaymentsResult_1 = require("../../../poker.engine/src/admin/model/incoming/GetPaymentsResult");
const log4js_1 = require("log4js");
var logger = (0, log4js_1.getLogger)();
async function withdraw(payment, accountService, dataRepository, connectionToGameServer, options) {
    let result = { errorMessage: null };
    if (payment.type !== PaymentType_1.PaymentType.outgoing) {
        result.errorMessage = `invalid payment type: ${payment.type}`;
        return result;
    }
    if (payment.status !== PaymentStatus_1.PaymentStatus.pending && !(payment.status === PaymentStatus_1.PaymentStatus.flagged && options.allowFlagged)) {
        result.errorMessage = `payment has status of ${payment.status} but is required to have status pending`;
        return result;
    }
    let waitingTxHash = await accountService.isWaitingOnPriorTransaction(payment.currency);
    if (waitingTxHash) {
        result.errorMessage = `waiting for prior transaction (${waitingTxHash})`;
        return result;
    }
    payment.error = null;
    let transactionResult = await accountService.newTransaction(payment.currency, payment.address, new decimal_1.Decimal(payment.amount).toNumber(), payment.guid);
    logger.info(`TransactionResult: ${payment._id.toString()} success:${transactionResult.success} amount:${payment.amount}`);
    if (transactionResult.success) {
        payment.status = PaymentStatus_1.PaymentStatus.complete;
        payment.sentAmount = transactionResult.sentAmount;
        payment.fees = transactionResult.fees;
        payment.txId = transactionResult.txHash;
        payment.updated = new Date();
    }
    else {
        payment.error = transactionResult.errorMessage;
    }
    await dataRepository.savePayment(payment);
    if (transactionResult.success) {
        let getPaymentsResult = new GetPaymentsResult_1.GetPaymentsResult();
        getPaymentsResult.payments = [payment];
        connectionToGameServer.send(getPaymentsResult);
    }
    return result;
}
exports.withdraw = withdraw;
//# sourceMappingURL=WithdrawlsHandler.js.map