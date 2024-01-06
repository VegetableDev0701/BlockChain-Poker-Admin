"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPaymentsRequestHandler = void 0;
const GetPaymentsResult_1 = require("../../../../poker.engine/src/admin/model/incoming/GetPaymentsResult");
const PaymentStatus_1 = require("../../../../poker.ui/src/shared/PaymentStatus");
class GetPaymentsRequestHandler {
    constructor(dataRepository, connectionToGameServer) {
        this.dataRepository = dataRepository;
        this.connectionToGameServer = connectionToGameServer;
    }
    async run(request) {
        let args = { status: { $ne: PaymentStatus_1.PaymentStatus.flagged } };
        if (request.lastUpdated) {
            args.updated = { $gte: request.lastUpdated };
        }
        let payments = await this.dataRepository.getPayments(args);
        let result = new GetPaymentsResult_1.GetPaymentsResult();
        for (let payment of payments) {
            payment.error = null;
        }
        result.payments = payments;
        this.connectionToGameServer.send(result);
    }
}
exports.GetPaymentsRequestHandler = GetPaymentsRequestHandler;
//# sourceMappingURL=GetPaymentsRequestHandler.js.map