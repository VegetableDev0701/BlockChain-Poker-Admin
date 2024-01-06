"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ISecureDataRepository = void 0;
class ISecureDataRepository {
    getAddressesByCurrency(currency) { throw new Error('not implemented'); }
    getAddressCount(currency) { throw new Error('not implemented'); }
    saveAddress(info) { throw new Error("Not implemented"); }
    ;
    getUnprocessedAddresses(currency) { throw new Error("Not implemented"); }
    ;
    getAddressInfoByAddress(address) { throw new Error("Not implemented"); }
    ;
    getAddressInfo(guid, currency, processed) { throw new Error("Not implemented"); }
    ;
    getAddressInfoByGuid(guid) { throw new Error("Not implemented"); }
    ;
    getAddressesForSweeping(currency) { throw new Error("Not implemented"); }
    ;
    saveSweepEvent(event) { throw new Error("Not implemented"); }
    ;
    getSweepEvents(args, limit) { throw new Error("Not implemented"); }
    ;
    updateSweepEvent(incomingPaymentHash, setObj) { throw new Error("Not implemented"); }
    ;
    getSweepEventById(id) { throw new Error("Not implemented"); }
    ;
    getCurrencyConfig(currency) { throw new Error("Not implemented"); }
    ;
    getCurrencyConfigs(options) { throw new Error("Not implemented"); }
    ;
    getErc20Tokens() { throw new Error("Not implemented"); }
    ;
    saveCurrencyConfig(token) { throw new Error("Not implemented"); }
    ;
    savePayment(payment) { throw new Error("Not implemented"); }
    ;
    getLastProcessedBlock(currency) { throw new Error("Not implemented"); }
    ;
    saveLastProcessedBlock(currency, blockNumber) { throw new Error("Not implemented"); }
    ;
    addTxLog(txLog) { throw new Error("Not implemented"); }
    ;
    getTxLog(txHash) { throw new Error("Not implemented"); }
    ;
    getTxLogs(options) { throw new Error("Not implemented"); }
    ;
    getTxLogByRelatedHash(txHash, type) { throw new Error("Not implemented"); }
    ;
    getPaymentsWithoutFees() { throw new Error("Not implemented"); }
    ;
    getPaymentByTxId(currency, txId) { throw new Error("Not implemented"); }
    ;
    getLastOutgoingPayment() { throw new Error("Not implemented"); }
    ;
    getPaymentById(id) { throw new Error("Not implemented"); }
    getPayments(args) { throw new Error("Not implemented"); }
    getPaymentProcessorSettings() { throw new Error("Not implemented"); }
    getLastAddressInfo() { throw new Error("Not implemented"); }
    getAddressInfoById(id) { throw new Error("Not implemented"); }
}
exports.ISecureDataRepository = ISecureDataRepository;
//# sourceMappingURL=ISecureDataRepository.js.map