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
const currency_config_1 = require("./../../../src/model/currency-config");
const assert = __importStar(require("assert"));
const jssubstitute_1 = __importDefault(require("jssubstitute"));
const ISecureDataRepository_1 = require("../../../src/repository/ISecureDataRepository");
const PaymentProcessorMessage_1 = require("../../../src/processor/PaymentProcessorMessage");
const PaymentType_1 = require("../../../../poker.ui/src/shared/PaymentType");
const PaymentStatus_1 = require("../../../../poker.ui/src/shared/PaymentStatus");
const BlockCypherService_1 = require("../../../src/services/BlockCypherService");
const ConnectionToGameServer_1 = require("../../../src/services/ConnectionToGameServer");
const ProcessWithdrawlsHandler_1 = require("../../../src/processor/ProcessWithdrawlsHandler");
const IHttp_1 = require("../../../src/services/IHttp");
const AccountService_1 = require("../../../src/services/AccountService");
describe('ProcessWithdrawlsHandler', () => {
    jssubstitute_1.default.throwErrors();
    let handler;
    let accountService;
    let dataRepository;
    let connectionToGameServer;
    let http;
    let currencyConfig = new currency_config_1.CurrencyConfig();
    currencyConfig.name = 'dash';
    currencyConfig.processingDelayMin = 20;
    currencyConfig.withdrawlLimitPerMin = 10;
    currencyConfig.withdrawlLimitNumber = 3;
    let pendingPayments;
    let completePayments;
    beforeEach(() => {
        pendingPayments = [];
        completePayments = [];
        let as = new AccountService_1.IAccountService();
        as.newTransaction = () => { return Promise.resolve(new BlockCypherService_1.TransactionResult()); };
        accountService = jssubstitute_1.default.for(as);
        accountService.callsThrough('newTransaction');
        http = jssubstitute_1.default.for(new IHttp_1.IHttp());
        let repo = new ISecureDataRepository_1.ISecureDataRepository();
        repo.getPayments = (args) => {
            if (args.status == PaymentStatus_1.PaymentStatus.pending) {
                return Promise.resolve(pendingPayments);
            }
            else if (args.status == PaymentStatus_1.PaymentStatus.complete) {
                return Promise.resolve(completePayments);
            }
            return Promise.resolve([]);
        };
        repo.getCurrencyConfigs = () => { return Promise.resolve([currencyConfig]); };
        dataRepository = jssubstitute_1.default.for(repo);
        connectionToGameServer = jssubstitute_1.default.for(new ConnectionToGameServer_1.IConnectionToGameServer());
        handler = new ProcessWithdrawlsHandler_1.ProcessWithdrawlsHandler(accountService, dataRepository, connectionToGameServer, http);
        dataRepository.callsThrough('getPayments');
        dataRepository.callsThrough('getCurrencyConfigs');
    });
    let assertFirstPaymentsCall = () => {
        let args1 = dataRepository.argsForCall('getPayments', 0)[0];
        assert.equal(4, Object.keys(args1).length);
        let diff1 = (new Date().getTime() - args1.timestamp.$lte.getTime()) / 1000 / 60;
        assert.equal(Math.round(diff1), currencyConfig.processingDelayMin);
        assert.equal(args1.status, PaymentStatus_1.PaymentStatus.pending);
        assert.equal(args1.type, PaymentType_1.PaymentType.outgoing);
        assert.equal(args1.currency, 'dash');
    };
    let assertPaymentsCall = () => {
        //first call
        assertFirstPaymentsCall();
        //second call
        {
            let args2 = dataRepository.argsForCall('getPayments', 1)[0];
            assert.equal(4, Object.keys(args2).length);
            let diff2 = (new Date().getTime() - args2.timestamp.$gte.getTime()) / 1000 / 60;
            assert.equal(Math.round(diff2), currencyConfig.withdrawlLimitPerMin);
            assert.equal(args2.status, PaymentStatus_1.PaymentStatus.complete);
            assert.equal(args2.type, PaymentType_1.PaymentType.outgoing);
            assert.equal(args2.currency, 'dash');
        }
    };
    it('error on blockCypherService', async () => {
        pendingPayments = [{ status: PaymentStatus_1.PaymentStatus.pending, type: PaymentType_1.PaymentType.outgoing, _id: '' }];
        accountService.newTransaction = (currency, receivingAddress, balance, userGuid) => {
            let transactionResult = new BlockCypherService_1.TransactionResult();
            transactionResult.errorMessage = 'errorMessage';
            return Promise.resolve(transactionResult);
        };
        await handler.run(new PaymentProcessorMessage_1.PaymentProcessorMessage());
        assertPaymentsCall();
        let savePaymentCall = dataRepository.argsForCall('savePayment', 0);
        assert.equal(savePaymentCall[0].error, 'errorMessage');
        connectionToGameServer.didNotReceive('send');
    });
    it('exceeds withdrawl limit per minute', async () => {
        pendingPayments = [{ status: PaymentStatus_1.PaymentStatus.pending, type: PaymentType_1.PaymentType.outgoing, _id: '' }];
        completePayments = [{}, {}, {}];
        await handler.run(new PaymentProcessorMessage_1.PaymentProcessorMessage());
        assertPaymentsCall();
        dataRepository.didNotReceive('savePayment');
        connectionToGameServer.didNotReceive('send');
    });
    it('pending payment with prior error is skipped', async () => {
        pendingPayments = [{ status: PaymentStatus_1.PaymentStatus.pending, type: PaymentType_1.PaymentType.outgoing, _id: '', error: 'someError' }];
        await handler.run(new PaymentProcessorMessage_1.PaymentProcessorMessage());
        assertFirstPaymentsCall();
        dataRepository.didNotReceive('savePayment');
        connectionToGameServer.didNotReceive('send');
    });
    it('payment status must be pending', async () => {
        let payment = { status: PaymentStatus_1.PaymentStatus.flagged, type: PaymentType_1.PaymentType.outgoing, _id: '' };
        pendingPayments = [payment];
        await handler.run(new PaymentProcessorMessage_1.PaymentProcessorMessage());
        assertFirstPaymentsCall();
        dataRepository.didNotReceive('savePayment');
    });
    it('auto payment is disabled', async () => {
        currencyConfig.processingDelayMin = -1;
        let payment = setupSuccess();
        await handler.run(new PaymentProcessorMessage_1.PaymentProcessorMessage());
        dataRepository.didNotReceive('getPayments');
        connectionToGameServer.didNotReceive('send');
    });
    it('skip payments where blockchain is waiting on prior tx', async () => {
        let payment = { status: PaymentStatus_1.PaymentStatus.pending, type: PaymentType_1.PaymentType.outgoing, _id: '' };
        pendingPayments = [payment];
        currencyConfig.processingDelayMin = 30;
        accountService.isWaitingOnPriorTransaction = () => { return Promise.resolve('foo'); };
        await handler.run(new PaymentProcessorMessage_1.PaymentProcessorMessage());
        accountService.didNotReceive('newTransaction');
        dataRepository.didNotReceive('savePayment');
        connectionToGameServer.didNotReceive('send');
    });
    let setupSuccess = () => {
        let payment = { status: PaymentStatus_1.PaymentStatus.pending, type: PaymentType_1.PaymentType.outgoing, _id: '' };
        pendingPayments = [payment];
        accountService.newTransaction = (currency, receivingAddress, balance, userGuid) => {
            let transactionResult = new BlockCypherService_1.TransactionResult();
            transactionResult.success = true;
            transactionResult.txHash = 'abcd';
            return Promise.resolve(transactionResult);
        };
        return payment;
    };
    it('success', async () => {
        let payment = setupSuccess();
        currencyConfig.processingDelayMin = 30;
        await handler.run(new PaymentProcessorMessage_1.PaymentProcessorMessage());
        assertPaymentsCall();
        assert.equal(payment.error, undefined);
        assert.equal(payment.txId, 'abcd');
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
//# sourceMappingURL=ProcessWithdrawlsHandlerFixture.js.map