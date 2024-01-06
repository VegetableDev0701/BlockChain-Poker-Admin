"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountService = exports.IAccountService = void 0;
const Payment_1 = require("../../../poker.engine/src/model/Payment");
const log4js_1 = require("log4js");
const logger = (0, log4js_1.getLogger)();
const decimal_1 = require("../../../poker.ui/src/shared/decimal");
const shared_helpers_1 = require("../../../poker.engine/src/shared-helpers");
const AccountFundedResult_1 = require("../../../poker.engine/src/model/AccountFundedResult");
const Currency_1 = require("../../../poker.ui/src/shared/Currency");
const PaymentType_1 = require("../../../poker.ui/src/shared/PaymentType");
const PaymentStatus_1 = require("../../../poker.ui/src/shared/PaymentStatus");
class IAccountService {
    loadCurrencyConfigs() { throw new Error("Method not implemented."); }
    handlePayment(event) { throw new Error("Not implemented"); }
    ;
    monitorAddress(addressInfo) { throw new Error("Method not implemented."); }
    isWaitingOnPriorTransaction(currency) { throw new Error("Not implemented"); }
    async newTransaction(currency, receivingAddress, balance, userGuid) { throw new Error("Not implemented"); }
}
exports.IAccountService = IAccountService;
class AccountService {
    constructor(blockCypherService, dataRepository, services) {
        this.services = services;
        this.dataRepository = dataRepository;
        this.blockCypherService = blockCypherService;
    }
    async monitorAddress(info) {
        let service = this.getService(info.currency);
        if (service != null) {
            let currencyConfig = await this.dataRepository.getCurrencyConfig(info.currency);
            let address = await service.getAddress(info.currency, currencyConfig.xpub, info.index);
            if (address === info.address) {
                service.monitorAddress(info);
            }
            else {
                logger.warn(`addresses do not match! received ${info} and using xpub:${currencyConfig.xpub} and ${info.index} calculated address=${address}`);
            }
        }
        else {
            throw new Error(`currency not supported: ${info.currency}`);
        }
    }
    async newTransaction(currency, receivingAddress, balance, userGuid) {
        let service = this.getService(currency);
        if (service != null) {
            return service.newTransaction(currency, receivingAddress, balance, userGuid);
        }
        else {
            throw new Error(`currency not supported: ${currency}`);
        }
    }
    getService(currency) {
        let config = this.blockCypherService.currencyConfigs.find(x => x.name == currency);
        currency = shared_helpers_1.SharedHelpers.getCurrency(config);
        let service = this.services.find(s => s.currency == currency);
        return service;
    }
    async init() {
        await this.loadCurrencyConfigs();
        await this.blockCypherService.init();
        for (let service of this.services) {
            await service.init();
        }
    }
    async loadCurrencyConfigs() {
        await this.blockCypherService.loadCurrencyConfigs();
        let ethBlockService = this.services.find(s => s.currency == Currency_1.Currency.eth);
        if (ethBlockService) {
            await ethBlockService.loadCurrencyConfig();
        }
    }
    isWaitingOnPriorTransaction(currency) {
        let service = this.getService(currency);
        return service.isWaitingOnPriorTransaction();
    }
    async handlePayment(event) {
        let info = await this.dataRepository.getAddressInfoByAddress(event.address);
        let amountDecimal = new decimal_1.Decimal(event.amount);
        let remainder = amountDecimal.minus(amountDecimal.floor());
        let amount = amountDecimal.floor().toNumber();
        let confirmations = event.confirmations;
        logger.info(`creditAccount: address: ${info.address} confirmations ${confirmations} amount ${amount} instantlock: ${event.instantlock}`);
        let currencyConfig = await this.dataRepository.getCurrencyConfig(info.currency);
        if (!currencyConfig.requiredNumberOfConfirmations) {
            logger.warn(`requiredNumberOfConfirmations is not defined for currency config ${info.currency}`);
            return null;
        }
        if (info.incomingTxHashes.find(h => h == event.txHash)) {
            logger.info(`address ${info.address} has already processed tx ${event.txHash}`);
            return null;
        }
        let payment = await this.dataRepository.getPaymentByTxId(info.currency, event.txHash);
        if (payment != null && payment.status == PaymentStatus_1.PaymentStatus.complete) {
            //should not get here ever due to info.incomingTxHashes catch above
            logger.warn(`payment is complete but is missing expected entry in incomingTxHashes. address:${info.address} event.txHash:${event.txHash}`);
            return null;
        }
        if (payment == null) {
            let currency = (event.currency || info.currency).toLowerCase();
            payment = new Payment_1.Payment();
            payment.type = PaymentType_1.PaymentType.incoming;
            payment.currency = currency;
            payment.guid = info.userGuid;
            payment.screenName = info.screenName;
            payment.timestamp = new Date();
            payment.address = info.address;
            payment.txId = event.txHash;
            payment.amount = amount + '';
        }
        if (payment.confirmations !== confirmations) {
            payment.confirmations = confirmations;
            payment.status = confirmations < currencyConfig.requiredNumberOfConfirmations ? PaymentStatus_1.PaymentStatus.pending : PaymentStatus_1.PaymentStatus.complete;
            payment.sweepFeeUsed = false;
            payment.remainder = remainder.toString();
            payment.updated = new Date();
            if (payment.status == PaymentStatus_1.PaymentStatus.complete) {
                info.incomingTxHashes.push(event.txHash);
                await this.dataRepository.saveAddress(info);
            }
            await this.dataRepository.savePayment(payment);
            this.sendAccountFunded(payment);
            return payment;
        }
    }
    sendAccountFunded(payment) {
        let accountFundedResult = new AccountFundedResult_1.AccountFundedResult();
        accountFundedResult.payment = payment;
        this.connectionToGameServer.send(accountFundedResult);
    }
    getPayment(currency, guid, bcResult, address, screenName) {
        let payment = new Payment_1.Payment();
        payment.currency = currency.toLowerCase();
        payment.address = address;
        payment.amount = bcResult.sentAmount + '';
        payment.guid = guid;
        payment.timestamp = new Date();
        payment.type = PaymentType_1.PaymentType.outgoing;
        payment.fees = bcResult.fees;
        payment.txId = bcResult.txHash;
        payment.screenName = screenName;
        return payment;
    }
    async checkPayment(address) {
        let info = await this.dataRepository.getAddressInfoByAddress(address);
        if (!info) {
            logger.warn(`checkPayment for address ${address} but no address found`);
            return Promise.resolve();
        }
    }
}
exports.AccountService = AccountService;
//# sourceMappingURL=AccountService.js.map