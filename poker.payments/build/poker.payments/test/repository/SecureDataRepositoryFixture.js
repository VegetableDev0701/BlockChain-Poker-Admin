"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
var clean = require('mongo-clean');
const SecureDataRepository_1 = require("../../src/repository/SecureDataRepository");
const PaymentType_1 = require("../../../poker.ui/src/shared/PaymentType");
const PaymentStatus_1 = require("../../../poker.ui/src/shared/PaymentStatus");
describe('SecureDataRepositoryFixture', () => {
    let dbName = 'pokerPaymentServerUnitTests';
    let repository;
    let setup;
    beforeEach(() => {
        repository = new SecureDataRepository_1.SecureDataRepository(dbName);
        setup = repository.init()
            .then(() => cleanDb(repository.db));
    });
    it('getPaymentsUpdatedAfter', async () => {
        let now = new Date();
        await setup;
        await repository.savePayment({ guid: '1', type: PaymentType_1.PaymentType.incoming, updated: new Date(now.getTime() - 1000 * 60 * 5) }); //updated 5 min ago
        await repository.savePayment({ guid: '2', type: PaymentType_1.PaymentType.incoming, updated: new Date(now.getTime() - 1000 * 60 * 60) }); //updated 60 min ago
        await repository.savePayment({ guid: '3', type: PaymentType_1.PaymentType.incoming, updated: new Date(now.getTime() - 1000 * 60 * 15) }); //updated 15 min ago
        await repository.savePayment({ guid: '4', type: PaymentType_1.PaymentType.outgoing, updated: new Date(now.getTime() - 1000 * 60 * 1) }); //updated 15 min ago
        let queryDate = new Date(now.getTime() - 1000 * 60 * 20).toISOString();
        let results = await repository.getPayments({ type: PaymentType_1.PaymentType.incoming, updated: { $gte: queryDate } });
        assert.equal(results.length, 2);
        assert.equal(results[0].guid, '3'); //most recent first
        assert.equal(results[1].guid, '1');
    });
    it('getPayments not flagged', async () => {
        await setup;
        await repository.savePayment({ guid: '1', status: PaymentStatus_1.PaymentStatus.pending });
        await repository.savePayment({ guid: '2', status: PaymentStatus_1.PaymentStatus.flagged });
        await repository.savePayment({ guid: '3', status: PaymentStatus_1.PaymentStatus.complete });
        let args = { status: { $ne: PaymentStatus_1.PaymentStatus.flagged } };
        let results = await repository.getPayments(args);
        assert.equal(results.length, 2);
        assert.equal(results[0].guid, 3);
        assert.equal(results[1].guid, 1);
    });
    it('getPayments by timestamp', async () => {
        let now = new Date();
        await setup;
        await repository.savePayment({ guid: '1', type: PaymentType_1.PaymentType.outgoing, timestamp: new Date(now.getTime() - 1000 * 60 * 11) }); //added 11 min ago
        await repository.savePayment({ guid: '2', type: PaymentType_1.PaymentType.outgoing, timestamp: new Date(now.getTime() - 1000 * 60 * 1) }); //added 1 min ago
        await repository.savePayment({ guid: '3', type: PaymentType_1.PaymentType.outgoing, timestamp: new Date(now.getTime() - 1000 * 60 * 5) }); //added 5 min ago
        let queryDate = new Date(now.getTime() - 1000 * 60 * 10).toISOString(); //get payments 10 minutes or older
        let results = await repository.getPayments({ type: PaymentType_1.PaymentType.outgoing, timestamp: { $lte: queryDate } });
        assert.equal(results.length, 1);
        assert.equal(results[0].guid, '1');
    });
});
function cleanDb(db) {
    return new Promise((fulfill, reject) => {
        clean(db, (err, db) => {
            if (err)
                reject();
            else
                fulfill();
        });
    });
}
//# sourceMappingURL=SecureDataRepositoryFixture.js.map