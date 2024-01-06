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
exports.DashCoreBlockService = void 0;
const BlockCypherService_1 = require("./BlockCypherService");
const Currency_1 = require("../../../poker.ui/src/shared/Currency");
const shared_helpers_1 = require("../../../poker.engine/src/shared-helpers");
const DashDepositAddressService = __importStar(require("../../../poker.engine/src/services/DashDepositAddressService"));
const { HDPublicKey, Address } = require('@dashevo/dashcore-lib');
var http = require('request-promise-native');
var logger = require('log4js').getLogger();
var fs = require('fs');
class DashCoreBlockService {
    constructor(dataRepository) {
        this.dataRepository = dataRepository;
        this.currency = Currency_1.Currency.dash;
    }
    getAddress(currency, xpub, index) {
        return Promise.resolve(DashDepositAddressService.genAddr(xpub, index));
    }
    async init() {
        await this.checkMissingAddresses();
    }
    async checkMissingAddresses() {
        const walletCount = await this.getColdAddressCount();
        const dbCount = await this.dataRepository.getAddressCount(Currency_1.Currency.dash);
        if (dbCount !== walletCount) {
            const dbAddresses = await this.dataRepository.getAddressesByCurrency(Currency_1.Currency.dash);
            let currencyConfig = await this.dataRepository.getCurrencyConfig(Currency_1.Currency.dash);
            for (let info of dbAddresses) {
                let addr = DashDepositAddressService.getAddress(currencyConfig.xpub, info.index);
                await this.importpubkey(addr.publicKey, info.index);
            }
        }
    }
    async getColdAddressCount() {
        const data = await this.listreceivedbyaddress();
        let count = 0;
        for (let addr of data.result) {
            if (addr.label.includes('cold')) {
                const tokens = addr.label.split('/');
                const index = +tokens[tokens.length - 1];
                if (!isNaN(index)) {
                    count++;
                }
            }
        }
        return count;
    }
    async listreceivedbyaddress() {
        //  List incoming payments grouped by receiving address.
        //Arguments:
        //1. minconf           (numeric, optional, default=1) The minimum number of confirmations before payments are included.
        //2. addlocked         (bool, optional, default=false) Whether to include transactions locked via InstantSend.
        //3. include_empty     (bool, optional, default=false) Whether to include addresses that haven't received any payments.
        //4. include_watchonly (bool, optional, default=false) Whether to include watch-only addresses (see 'importaddress').
        let post_data = { "method": "listreceivedbyaddress", "params": [0, false, true, true] };
        let data = await this.post(post_data);
        return data;
    }
    async monitorAddress(info) {
        let currencyConfig = await this.dataRepository.getCurrencyConfig(Currency_1.Currency.dash);
        let addr = DashDepositAddressService.getAddress(currencyConfig.xpub, info.index);
        await this.importpubkey(addr.publicKey, info.index);
    }
    async newTransaction(currency, receivingAddress, balance, userGuid) {
        let amount = balance / Currency_1.CurrencyUnit.getCurrencyUnit(Currency_1.Currency.dash);
        let post_data = { "method": "sendtoaddress", "params": [receivingAddress, amount, userGuid, "", false] };
        let result = new BlockCypherService_1.TransactionResult();
        let [err, data] = await (0, shared_helpers_1.to)(this.unlockWallet());
        if (!err) {
            [err, data] = await (0, shared_helpers_1.to)(this.post(post_data));
            if (!err && data) {
                this.writeResult(receivingAddress, data);
                result.txHash = data.result;
                result.fees = '0';
                result.sentAmount = balance;
                result.success = true;
            }
        }
        await (0, shared_helpers_1.to)(this.lockWallet());
        if (!result.success) {
            if (err.error && err.error.error && err.error.error.message)
                result.errorMessage = err.error.error.message;
            else if (err.message)
                result.errorMessage = err.message;
            else
                result.errorMessage = err;
        }
        return result;
    }
    isWaitingOnPriorTransaction() {
        return Promise.resolve(null);
    }
    unlockWallet() {
        return new Promise((resolve, reject) => {
            let post_data = { "method": "walletpassphrase", "params": [process.env.POKER_UNLOCK_WALLET, 10] };
            this.post(post_data)
                .then((data => {
                if (!data.error) {
                    resolve(null);
                }
                else {
                    reject(`unexpecting result unlocking wallet ${JSON.stringify(data)}`);
                }
            })).catch((err) => {
                reject(`unexpecting result unlocking wallet ${JSON.stringify(err)}`);
            });
        });
    }
    lockWallet() {
        return new Promise((resolve, reject) => {
            let post_data = { "method": "walletlock" };
            this.post(post_data)
                .then((data => {
                if (!data.error) {
                    resolve(null);
                }
                else {
                    reject(`lockWallet ${JSON.stringify(data)}`);
                }
            })).catch((err) => {
                reject(`lockWallet ${JSON.stringify(err)}`);
            });
        });
    }
    writeResult(receivingAddress, data) {
        fs.writeFile(`sendtoaddress_result_${receivingAddress}.json`, JSON.stringify(data), (err) => {
            if (err) {
                console.log('error writing to file: ' + err);
            }
            ;
        });
    }
    async importpubkey(pubKeyHex, index) {
        //view imported addresses using
        let post_data = { "method": "importpubkey", "params": [`${pubKeyHex}`, `cold m/0/${index}`, false] };
        return this.post(post_data);
    }
    async deriveAddress(index) {
        //let pubKey = new HDPublicKey('xpub661MyMwAqRbcF8dQCNnr92GPFUCsjQs5EwKjh8rzkuDGNarXvSNHKSL3iv94kwqVfhmRNMnFXQpEeZK7crNuotMe46vfX2PXV7iVAWdwTcX');  
        let currencyConfig = await this.dataRepository.getCurrencyConfig(Currency_1.Currency.dash);
        let pubKey = new HDPublicKey(currencyConfig.xpub);
        let account1 = pubKey.derive(0);
        let addr = account1.derive(index);
        return addr;
    }
    async getTransaction(txid) {
        let post_data = { "method": "gettransaction", "params": [txid, true] };
        return this.post(post_data);
    }
    post(post_data) {
        var options = {
            method: 'POST',
            uri: 'http://127.0.0.1:9998',
            body: post_data,
            headers: {
                "Authorization": "Basic dHJveTpmMDBiYXIx"
            },
            json: true // Automatically stringifies the body to JSON
        };
        return http(options);
    }
}
exports.DashCoreBlockService = DashCoreBlockService;
//# sourceMappingURL=DashCoreBlockService.js.map