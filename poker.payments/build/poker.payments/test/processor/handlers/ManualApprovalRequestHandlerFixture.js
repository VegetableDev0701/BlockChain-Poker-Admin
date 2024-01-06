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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const ManualApprovalRequestHandler_1 = require("../../../src/processor/ManualApprovalRequestHandler");
const jssubstitute_1 = __importDefault(require("jssubstitute"));
const ISecureDataRepository_1 = require("../../../src/repository/ISecureDataRepository");
const PaymentProcessorMessage_1 = require("../../../src/processor/PaymentProcessorMessage");
const ManualApprovalRequest_1 = require("../../../src/model/ManualApprovalRequest");
const PaymentType_1 = require("../../../../poker.ui/src/shared/PaymentType");
const PaymentStatus_1 = require("../../../../poker.ui/src/shared/PaymentStatus");
const BlockCypherService_1 = require("../../../src/services/BlockCypherService");
const ConnectionToGameServer_1 = require("../../../src/services/ConnectionToGameServer");
const AccountService_1 = require("../../../src/services/AccountService");
describe('ManualApprovalRequestHandlerFixture', () => {
    jssubstitute_1.default.throwErrors();
    let handler;
    let accountService;
    let dataRepository;
    let connectionToGameServer;
    beforeEach(() => {
        accountService = jssubstitute_1.default.for(new AccountService_1.IAccountService());
        dataRepository = jssubstitute_1.default.for(new ISecureDataRepository_1.ISecureDataRepository());
        connectionToGameServer = jssubstitute_1.default.for(new ConnectionToGameServer_1.IConnectionToGameServer());
        handler = new ManualApprovalRequestHandler_1.ManualApprovalRequestHandler(accountService, dataRepository, connectionToGameServer);
    });
    it('payment not found', async () => {
        let message = new PaymentProcessorMessage_1.PaymentProcessorMessage();
        message.manualApprovalRequest = new ManualApprovalRequest_1.ManualApprovalRequest('id1');
        let result = await handler.run(message);
        assert.equal(result.manualApprovalResult.error, 'payment not found: id1');
        dataRepository.didNotReceive('savePayment');
    });
    it('invalid payment type', async () => {
        dataRepository.getPaymentById = (id) => {
            return Promise.resolve({ type: PaymentType_1.PaymentType.incoming });
        };
        let message = new PaymentProcessorMessage_1.PaymentProcessorMessage();
        message.manualApprovalRequest = new ManualApprovalRequest_1.ManualApprovalRequest(null);
        let result = await handler.run(message);
        assert.equal(result.manualApprovalResult.error, 'invalid payment type: incoming');
        dataRepository.didNotReceive('savePayment');
    });
    it('waiting for prior transaction to confirm', async () => {
        let payment = { status: PaymentStatus_1.PaymentStatus.pending, type: PaymentType_1.PaymentType.outgoing, _id: '' };
        dataRepository.getPaymentById = (id) => {
            return Promise.resolve(payment);
        };
        accountService.isWaitingOnPriorTransaction = (currency) => {
            return Promise.resolve('0x544641fa8754fce6409804ca60362f0df67570e53452eded0c80ce807e730ca8');
        };
        let message = new PaymentProcessorMessage_1.PaymentProcessorMessage();
        message.manualApprovalRequest = new ManualApprovalRequest_1.ManualApprovalRequest(null);
        let result = await handler.run(message);
        assert.equal(result.manualApprovalResult.error, 'waiting for prior transaction (0x544641fa8754fce6409804ca60362f0df67570e53452eded0c80ce807e730ca8)');
        dataRepository.didNotReceive('savePayment');
    });
    it('payment status must be pending', async () => {
        dataRepository.getPaymentById = (id) => {
            return Promise.resolve({ status: PaymentStatus_1.PaymentStatus.complete, type: PaymentType_1.PaymentType.outgoing });
        };
        let message = new PaymentProcessorMessage_1.PaymentProcessorMessage();
        message.manualApprovalRequest = new ManualApprovalRequest_1.ManualApprovalRequest(null);
        let result = await handler.run(message);
        assert.equal(result.manualApprovalResult.error, 'payment has status of complete but is required to have status pending');
        dataRepository.didNotReceive('savePayment');
    });
    it('error on blockCypherService', async () => {
        let payment = { status: PaymentStatus_1.PaymentStatus.pending, type: PaymentType_1.PaymentType.outgoing, _id: '' };
        dataRepository.getPaymentById = (id) => {
            return Promise.resolve(payment);
        };
        accountService.newTransaction = (currency, receivingAddress, balance, userGuid) => {
            let transactionResult = new BlockCypherService_1.TransactionResult();
            transactionResult.errorMessage = 'errorMessage';
            return Promise.resolve(transactionResult);
        };
        let message = new PaymentProcessorMessage_1.PaymentProcessorMessage();
        message.manualApprovalRequest = new ManualApprovalRequest_1.ManualApprovalRequest(null);
        let result = await handler.run(message);
        assert.equal(result.manualApprovalResult.error, undefined);
        assert.equal(result.manualApprovalResult.payment.error, 'errorMessage');
        connectionToGameServer.didNotReceive('send');
    });
    it('success', async () => {
        let payment = { status: PaymentStatus_1.PaymentStatus.pending, type: PaymentType_1.PaymentType.outgoing, _id: '' };
        dataRepository.getPaymentById = (id) => {
            return Promise.resolve(payment);
        };
        accountService.newTransaction = (currency, receivingAddress, balance, userGuid) => {
            let transactionResult = new BlockCypherService_1.TransactionResult();
            transactionResult.success = true;
            transactionResult.txHash = 'abcd';
            return Promise.resolve(transactionResult);
        };
        let message = new PaymentProcessorMessage_1.PaymentProcessorMessage();
        message.manualApprovalRequest = new ManualApprovalRequest_1.ManualApprovalRequest(null);
        let result = await handler.run(message);
        assert.equal(result.manualApprovalResult.error, undefined);
        assert.equal(result.manualApprovalResult.payment.error, undefined);
        assert.equal(result.manualApprovalResult.payment.txId, 'abcd');
        connectionToGameServer.receivedWith('send', jssubstitute_1.default.arg.matchUsing((m) => {
            if (!m) {
                return false;
            }
            else {
                let getPaymentsResult = m;
                assert.equal(getPaymentsResult.payments[0], payment);
                return true;
            }
        }));
    });
});
//# sourceMappingURL=ManualApprovalRequestHandlerFixture.js.map