"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncomingPaymentEvent = void 0;
class IncomingPaymentEvent {
    constructor(address, amount, confirmations, txHash) {
        this.address = address;
        this.amount = amount;
        this.confirmations = confirmations;
        this.txHash = txHash;
    }
}
exports.IncomingPaymentEvent = IncomingPaymentEvent;
//# sourceMappingURL=incoming-payment-event.js.map