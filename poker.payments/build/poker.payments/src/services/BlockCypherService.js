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
exports.WalletToken = exports.TransactionResult = exports.BlockCypherService = void 0;
const bjs = require("bitcoinjs-lib");
const log4js_1 = require("log4js");
const logger = (0, log4js_1.getLogger)();
var fs = require('fs');
const encryption = __importStar(require("../../../poker.engine/src/framework/encryption"));
const Currency_1 = require("../../../poker.ui/src/shared/Currency");
const shared_helpers_1 = require("../../../poker.engine/src/shared-helpers");
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
const BlockCypherApiProvider_1 = require("./BlockCypherApiProvider");
const decimal_1 = require("../../../poker.ui/src/shared/decimal");
const b58 = require('bs58check');
const bip32 = require('bip32');
class BlockCypherService {
    constructor(dataRepository, blockCypherApiProvider) {
        this.blockCypherApiProvider = blockCypherApiProvider;
        this.logJson = true;
        this.hooks = [];
        this.walletTokens = [];
        this.dataRepository = dataRepository;
        if (!blockCypherApiProvider) {
            this.blockCypherApiProvider = new BlockCypherApiProvider_1.BlockCypherApiProvider();
        }
    }
    usesHooks(currency) {
        return currency == Currency_1.Currency.btc || currency == Currency_1.Currency.bcy || currency == Currency_1.Currency.beth;
    }
    async init() {
        this.hooks = await this.listHooks('btc');
    }
    async loadCurrencyConfigs() {
        this.currencyConfigs = await this.dataRepository.getCurrencyConfigs();
    }
    genAddressInternal(currency, bcapi) {
        return new Promise((resolve, reject) => {
            this.generateAddress(currency, bcapi, (err, data) => {
                //this.printResponse(err, data);
                if (err !== null) {
                    reject(err);
                }
                else {
                    resolve(data);
                }
            });
        });
    }
    supportsWallet(currency) {
        return currency != Currency_1.Currency.eth && currency != Currency_1.Currency.beth;
    }
    getTx(hash, currency) {
        return new Promise((resolve, reject) => {
            let bcapi = this.blockCypherApiProvider.getbcypher(currency);
            bcapi.getTX(hash, {}, (err, data) => {
                if (err) {
                    return reject(err);
                }
                else {
                    return resolve(data);
                }
            });
        });
    }
    addAddrToWallet(address, currency, bcapi) {
        if (this.supportsWallet(currency)) {
            return new Promise((resolve, reject) => {
                let walletName = this.getWalletName(currency);
                bcapi.addAddrWallet(walletName, [address], (err2, data2) => {
                    if (err2 !== null || data2.error) {
                        reject(err2);
                    }
                    else {
                        resolve();
                    }
                });
            });
        }
        return Promise.resolve();
    }
    generateAddress(currency, bcapi, callback) {
        bcapi.genAddr({}, callback);
    }
    async ensureMasterAddressInWallet(currency) {
        let bcapi = this.blockCypherApiProvider.getbcypher(currency);
        let currencyConfig = this.currencyConfigs.find(c => c.name == currency);
        let walletName = this.getWalletName(currency);
        let addresses = await this.getWalletAddresses(bcapi, walletName);
        for (let addr of addresses.filter(a => a != currencyConfig.masterAccount.public)) {
            await this.removeAddressFromWallet(bcapi, walletName, addr);
        }
        if (!addresses.filter(a => a === currencyConfig.masterAccount.public)) {
            logger.info(`master address for currency ${currency} not in wallet ${walletName}. Adding...`);
            await this.addAddrWallet(bcapi, walletName, [currencyConfig.masterAccount.public]);
        }
        addresses = await this.getWalletAddresses(bcapi, walletName);
        if (addresses.length !== 1 || addresses[0] !== currencyConfig.masterAccount.public) {
            throw new Error(`wallet ${walletName} has unexpected items. ${addresses.join()}`);
        }
    }
    addAddrWallet(bcapi, walletName, addresses) {
        return new Promise((resolve, reject) => {
            bcapi.addAddrWallet(walletName, addresses, (err, data) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }
    removeAddressFromWallet(bcapi, walletName, address) {
        return new Promise((resolve, reject) => {
            bcapi.delAddrsWallet(walletName, [address], (err, data) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }
    getWalletAddresses(bcapi, walletName) {
        return new Promise((resolve, reject) => {
            bcapi.getWallet(walletName, (err, data) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(data.addresses);
                }
            });
        });
    }
    ensureWallet(currency, bcapi) {
        return new Promise((resolve, reject) => {
            let walletName = this.getWalletName(currency);
            let walletToken = this.walletTokens.find(wt => wt.walletName === walletName);
            if (!walletToken) {
                bcapi.getWallet(walletName, (err, data) => {
                    if (err)
                        reject(err);
                    else if (data.error && data.error.toLowerCase().indexOf('not found') > -1) {
                        bcapi.createWallet({ "name": walletName }, (err, data) => {
                            if (err)
                                reject(err);
                            else {
                                resolve(this.addWalletToken(data.token, walletName));
                            }
                        });
                    }
                    else if (data.token) {
                        resolve(this.addWalletToken(data.token, walletName));
                    }
                    else {
                        reject('unknown result');
                    }
                });
            }
            else {
                resolve(walletToken);
            }
        });
    }
    addWalletToken(token, walletName) {
        let walletToken = new WalletToken();
        walletToken.token = token;
        walletToken.walletName = walletName;
        this.walletTokens.push(walletToken);
        return walletToken;
    }
    getWalletName(currency) {
        return 'th-' + currency.toLowerCase();
    }
    getAddrBal(address, currency) {
        return new Promise((resolve, reject) => {
            let bcapi = this.blockCypherApiProvider.getbcypher(currency);
            bcapi.getAddrBal(address, {}, (err, data) => {
                //this.printResponse(err, data);
                if (err !== null) {
                    reject(err);
                }
                else {
                    resolve(data.balance);
                }
            });
        });
    }
    async newTX(currency, receivingAddress, balance, newtx, bcapi) {
        let result = new TransactionResult(); //includeToSignTx
        if (!bcapi)
            bcapi = this.blockCypherApiProvider.getbcypher(currency);
        let currencyConfig = this.currencyConfigs.find(c => c.name == currency);
        if (!currencyConfig.withdrawlFee) {
            result.errorMessage = 'withdrawlFee not defined';
            return result;
        }
        balance = shared_helpers_1.SharedHelpers.convertToNativeAmount(currency, balance);
        let withdrawlFeeDecimal = new decimal_1.Decimal(currencyConfig.withdrawlFee);
        let withdrawlFee = withdrawlFeeDecimal.toNumber();
        let value = new decimal_1.Decimal(balance).minus(withdrawlFeeDecimal).toNumber();
        newtx.outputs = [{ "addresses": [receivingAddress], value: value }];
        newtx.fees = withdrawlFee;
        let promise = new Promise(async (resolve, reject) => {
            bcapi.newTX(newtx, (err, tmptx) => {
                if (err) {
                    result.errorMessage = err;
                    resolve(result);
                }
                else if (tmptx.errors && tmptx.errors.length) {
                    result.errorMessage = tmptx.errors[0].error;
                    resolve(result);
                }
                else {
                    //console.log('tmptx:', tmptx);
                    this.signTX(tmptx, currencyConfig)
                        .then((data) => {
                        tmptx.signatures = data;
                        if (this.logJson) {
                            fs.writeFile(`tmptx_${receivingAddress}.json`, JSON.stringify(tmptx), (err) => {
                                if (err) {
                                    logger.error(err);
                                }
                                ;
                            });
                        }
                        bcapi.sendTX(tmptx, (err, data) => {
                            if (err || data.error || data.errors) {
                                result.errorMessage = err || data.error || JSON.stringify(data.errors);
                                resolve(result);
                            }
                            else {
                                result.txHash = data.tx.hash;
                                result.fees = shared_helpers_1.SharedHelpers.convertToLocalAmount(currency, withdrawlFee) + '';
                                result.sentAmount = parseFloat(shared_helpers_1.SharedHelpers.convertToLocalAmount(currency, value));
                                result.success = true;
                                resolve(result);
                            }
                        });
                    }).catch((err) => {
                        logger.error('error on signTX', err);
                        result.errorMessage = 'Internal Server Error';
                        resolve(result);
                    });
                }
            });
        });
        return promise;
    }
    async signTX(tmptx, currencyConfig) {
        tmptx.pubkeys = [];
        let signed = [];
        for (let i = 0; i < tmptx.tosign.length; i++) {
            let result = await this.signAddress(tmptx.tosign[i], i, tmptx, currencyConfig);
            signed.push(result);
        }
        return signed;
    }
    async signAddress(tosign, n, tmptx, currencyConfig) {
        var addr = tmptx.tx.inputs[n].addresses[0];
        if (addr != currencyConfig.masterAccount.public) {
            throw new Error(`address mismatch. expecting ${currencyConfig.masterAccount.public} but got ${addr}`);
        }
        let keypair = null;
        if (currencyConfig.masterAccount.private) {
            let pKey = encryption.decrypt(currencyConfig.masterAccount.private);
            keypair = bitcoinjs_lib_1.ECPair.fromPrivateKey(Buffer.from(pKey, "hex"));
        }
        else if (currencyConfig.masterAccount.wif) {
            let pKey = encryption.decrypt(currencyConfig.masterAccount.wif);
            keypair = bitcoinjs_lib_1.ECPair.fromWIF(pKey);
        }
        tmptx.pubkeys.push(keypair.publicKey.toString("hex"));
        let signature = keypair.sign(Buffer.from(tosign, "hex"));
        let encodedSignature = bjs.script.signature.encode(signature, bjs.Transaction.SIGHASH_NONE);
        let hexStr = encodedSignature.toString("hex");
        hexStr = hexStr.substring(0, hexStr.length - 2);
        return hexStr;
    }
    printResponse(err, data) {
        console.log('blockcypher result:');
        if (err !== null) {
            console.log(err);
        }
        else {
            console.log(data);
        }
    }
    createHook(currency, hook) {
        return new Promise((resolve, reject) => {
            let bcapi = this.blockCypherApiProvider.getbcypher(currency);
            bcapi.createHook(hook, (err, data) => {
                if (err !== null || data.error) {
                    reject(err || data.error);
                }
                else {
                    resolve(data);
                }
            });
        });
    }
    listHooks(currency) {
        return new Promise((resolve, reject) => {
            let bcapi = this.blockCypherApiProvider.getbcypher(currency);
            bcapi.listHooks((err, data) => {
                if (err !== null || data.error) {
                    reject(err || data.error);
                }
                else {
                    resolve(data);
                }
            });
        });
    }
    delHook(currency, hookId) {
        return new Promise((resolve, reject) => {
            let bcapi = this.blockCypherApiProvider.getbcypher(currency);
            bcapi.delHook(hookId, (err2, data2) => {
                if (err2 !== null || data2.error) {
                    reject(err2);
                }
                else {
                    resolve();
                }
            });
        });
    }
}
exports.BlockCypherService = BlockCypherService;
class TransactionResult {
    constructor() {
        this.success = false;
    }
}
exports.TransactionResult = TransactionResult;
class WalletToken {
}
exports.WalletToken = WalletToken;
//# sourceMappingURL=BlockCypherService.js.map