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
const jssubstitute_1 = __importDefault(require("jssubstitute"));
const CheckWithdrawlsHandler_1 = require("../../../src/processor/CheckWithdrawlsHandler");
const ISecureDataRepository_1 = require("../../../src/repository/ISecureDataRepository");
const PaymentProcessorMessage_1 = require("../../../src/processor/PaymentProcessorMessage");
const IHttp_1 = require("../../../src/services/IHttp");
const Payment_1 = require("../../../../poker.engine/src/model/Payment");
const PaymentType_1 = require("../../../../poker.ui/src/shared/PaymentType");
const ITelegramService_1 = require("../../../../poker.engine/src/framework/telegram/ITelegramService");
const PaymentStatus_1 = require("../../../../poker.ui/src/shared/PaymentStatus");
const currency_config_1 = require("../../../src/model/currency-config");
const UserSmall_1 = require("../../../../poker.engine/src/model/UserSmall");
describe('CheckWithdrawlsHandler', () => {
    jssubstitute_1.default.throwErrors();
    let handler;
    let http;
    let telegramService;
    let dataRepository;
    let payment;
    let currencyConfig = new currency_config_1.CurrencyConfig();
    currencyConfig.flagAmount = '0.25';
    currencyConfig.processingDelayMin = 30;
    beforeEach(() => {
        const repo = new ISecureDataRepository_1.ISecureDataRepository();
        repo.getCurrencyConfig = (currency) => { return Promise.resolve(currencyConfig); };
        dataRepository = jssubstitute_1.default.for(repo);
        http = jssubstitute_1.default.for(new IHttp_1.IHttp());
        let tService = new ITelegramService_1.ITelegramService();
        tService.sendTelegram = (text) => { return Promise.resolve(true); };
        telegramService = jssubstitute_1.default.for(tService);
        handler = new CheckWithdrawlsHandler_1.CheckWithdrawlsHandler(dataRepository, http, telegramService);
        payment = new Payment_1.Payment();
        payment.address = 'C2PvtxEGGRXpnpHr4xeoJpEzvCRzj78xbn';
        payment.type = PaymentType_1.PaymentType.outgoing;
        payment.screenName = 'john';
        payment.amount = '1000000';
        payment.currency = 'dash';
        payment.status = PaymentStatus_1.PaymentStatus.pending;
        telegramService.callsThrough('sendTelegram');
        dataRepository.callsThrough('getCurrencyConfig');
    });
    it('payment is saved as pending', async () => {
        http.get = (uri, options, callback) => {
            return Promise.resolve([payment]);
        };
        await handler.run(new PaymentProcessorMessage_1.PaymentProcessorMessage());
        let dbPayment = dataRepository.argsForCall('savePayment', 0)[0];
        assert.equal(dbPayment, payment);
        assert.equal(dbPayment.status, PaymentStatus_1.PaymentStatus.pending);
        let telegram = telegramService.argsForCall('sendTelegram', 0)[0];
        assert.equal(telegram, 'Received new withdrawl (pending) from john for 0.01 dash. Processing delay:30 min');
    });
    it('large payment is flagged', async () => {
        http.get = (uri, options, callback) => {
            return Promise.resolve([payment]);
        };
        payment.amount = '50000000';
        await handler.run(new PaymentProcessorMessage_1.PaymentProcessorMessage());
        let dbPayment = dataRepository.argsForCall('savePayment', 0)[0];
        assert.equal(dbPayment, payment);
        assert.equal(dbPayment.status, PaymentStatus_1.PaymentStatus.flagged);
        let telegram = telegramService.argsForCall('sendTelegram', 0)[0];
        assert.equal(telegram, 'Received new withdrawl (flagged) from john for 0.5 dash.');
    });
    it('internal transfer is not processed', async () => {
        http.get = (uri, options, callback) => {
            return Promise.resolve([payment]);
        };
        payment.transferTo = new UserSmall_1.UserSmall('guid1', 'user1');
        payment.status = PaymentStatus_1.PaymentStatus.complete;
        await handler.run(new PaymentProcessorMessage_1.PaymentProcessorMessage());
        let dbPayment = dataRepository.argsForCall('savePayment', 0)[0];
        assert.equal(dbPayment, payment);
        assert.equal(dbPayment.status, PaymentStatus_1.PaymentStatus.complete);
        telegramService.didNotReceive('sendTelegram');
    });
});
//# sourceMappingURL=CheckWithdrawlsHandlerFixture.js.map