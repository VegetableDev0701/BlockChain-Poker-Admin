"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecureDataRepository = void 0;
const mongodb_1 = require("mongodb");
const PaymentType_1 = require("../../../poker.ui/src/shared/PaymentType");
const shared_helpers_1 = require("../../../poker.engine/src/shared-helpers");
const ObjectID = require('mongodb').ObjectID;
class SecureDataRepository {
    constructor(dbName) {
        this.dbName = dbName;
    }
    init() {
        this.server = new mongodb_1.Server(process.env.POKER_MONGODB || 'localhost', 27017);
        this.db = new mongodb_1.Db(this.dbName, this.server);
        return this.db.open();
    }
    getAddressesByCurrency(currency) {
        var collection = this.db.collection('addressInfo');
        return collection.find({ currency: currency }).toArray();
    }
    getAddressCount(currency) {
        return this.db.collection('addressInfo').count({ currency: currency });
    }
    getAddressInfo(guid, currency, processed) {
        return this.db.collection('addressInfo').find({ userGuid: guid, currency: currency, processed: processed }).toArray();
    }
    saveAddress(info) {
        if (info._id && typeof info._id === 'string') {
            info._id = ObjectID.createFromHexString(info._id);
        }
        return this.db.collection('addressInfo').save(info);
    }
    getAddressInfoByAddress(address) {
        var collection = this.db.collection('addressInfo');
        return collection.findOne({ address: address });
    }
    getAddressInfoByGuid(guid) {
        var collection = this.db.collection('addressInfo');
        return collection.findOne({ guid: guid });
    }
    getUnprocessedAddresses(currency) {
        var collection = this.db.collection('addressInfo');
        let args = { processed: false, master: { $in: [null, false] } };
        if (currency) {
            args.currency = currency;
        }
        return collection.find(args).toArray();
    }
    getAddressesForSweeping(currency) {
        return this.db.collection('addressInfo').find({ currency: currency, checkSweep: true }).toArray();
    }
    ;
    updateAddressInfo(address, setObj) {
        return this.db.collection('addressInfo').update({ address: address }, { $set: setObj });
    }
    saveSweepEvent(event) {
        return this.db.collection('sweepEvents').save(event);
        ;
    }
    ;
    getSweepEvents(args, limit) {
        let query = this.db.collection('sweepEvents').find(args).sort({ _id: -1 });
        if (limit)
            query = query.limit(limit);
        return query.toArray();
    }
    ;
    getSweepEventById(id) {
        return this.db.collection('sweepEvents').findOne({ '_id': ObjectID(id) });
    }
    ;
    updateSweepEvent(incomingPaymentHash, setObj) {
        return this.db.collection('sweepEvents').update({ incomingPaymentHash: incomingPaymentHash }, { $set: setObj });
    }
    async getCurrencyConfig(currency) {
        var collection = this.db.collection('currencyConfig');
        let config = await collection.findOne({ 'name': currency });
        return config;
    }
    ;
    async getCurrencyConfigs(options) {
        return this.db.collection('currencyConfig').find(options).toArray();
    }
    ;
    async getErc20Tokens() {
        let tokens = await this.getCurrencyConfigs({ contractAddress: /0x.*/ });
        return tokens;
    }
    ;
    saveCurrencyConfig(config) {
        let collection = this.db.collection('currencyConfig');
        if (config._id) {
            config._id = ObjectID.createFromHexString(config._id);
        }
        return collection.replaceOne({ '_id': ObjectID(config._id) }, config, { upsert: true });
    }
    ;
    savePayment(payment) {
        if (payment._id && typeof payment._id === 'string') {
            payment._id = ObjectID.createFromHexString(payment._id);
        }
        payment.timestamp = shared_helpers_1.SharedHelpers.ensureDate(payment.timestamp);
        return this.db.collection('payments').save(payment);
    }
    async getLastProcessedBlock(currency) {
        var collection = this.db.collection('lastProcessedBlock');
        let result = await collection.findOne({ 'currency': currency });
        if (result)
            return Promise.resolve(result.blockNumber);
        return Promise.resolve(0);
    }
    ;
    saveLastProcessedBlock(currency, blockNumber) {
        let collection = this.db.collection('lastProcessedBlock');
        return collection.replaceOne({ 'currency': currency }, { currency: currency, blockNumber: blockNumber }, { upsert: true });
    }
    ;
    addTxLog(txLog) {
        return this.db.collection('txLog').save(txLog);
        ;
    }
    ;
    getTxLog(hash) {
        return this.db.collection('txLog').findOne({ hash: hash });
    }
    getTxLogByRelatedHash(hash, type) {
        return this.db.collection('txLog').findOne({ relatedTxHash: hash, type: type });
    }
    getTxLogs(options) {
        return this.db.collection('txLog').find(options).sort({ _id: -1 }).limit(50).toArray();
    }
    ;
    getPaymentsWithoutFees() {
        var collection = this.db.collection('payments');
        return collection.find({ fees: { $in: [null, 0, '0'] } }).sort({ _id: -1 }).toArray();
    }
    getPaymentByTxId(currency, txId) {
        return this.db.collection('payments').findOne({ currency: currency, txId: txId });
    }
    getPaymentById(id) {
        return this.db.collection('payments').findOne({ '_id': ObjectID(id) });
    }
    getPayments(args) {
        let mongoArgs = shared_helpers_1.SharedHelpers.getPaymentQueryArgs(args);
        let query = this.db.collection('payments').find(mongoArgs).sort({ _id: -1 });
        let limit = parseInt(args.showOption);
        if (!isNaN(limit))
            query = query.limit(limit);
        return query.toArray();
    }
    async getLastOutgoingPayment() {
        let arr = await this.db.collection('payments').find({ type: PaymentType_1.PaymentType.outgoing }).sort({ _id: -1 }).limit(1).toArray();
        if (arr.length)
            return arr[0];
        return null;
    }
    ;
    async getLastAddressInfo() {
        let arr = await this.db.collection('addressInfo').find({}).sort({ _id: -1 }).limit(1).toArray();
        if (arr.length)
            return arr[0];
        return null;
    }
    ;
    getAddressInfoById(id) {
        return this.db.collection('addressInfo').findOne({ '_id': ObjectID(id) });
    }
    getPaymentProcessorSettings() {
        return this.db.collection('paymentProcessorSettings').findOne({});
    }
}
exports.SecureDataRepository = SecureDataRepository;
//# sourceMappingURL=SecureDataRepository.js.map