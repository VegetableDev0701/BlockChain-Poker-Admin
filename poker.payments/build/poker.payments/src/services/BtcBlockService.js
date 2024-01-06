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
exports.BtcBlockService = void 0;
const shared_helpers_1 = require("../../../poker.engine/src/shared-helpers");
const log4js_1 = require("log4js");
const Currency_1 = require("../../../poker.ui/src/shared/Currency");
const BtcDepositAddressService = __importStar(require("../../../poker.engine/src/services/BtcDepositAddressService"));
const logger = (0, log4js_1.getLogger)();
class BtcBlockService {
    constructor(dataRepository, blockCypherService) {
        this.dataRepository = dataRepository;
        this.blockCypherService = blockCypherService;
        this.currency = Currency_1.Currency.btc;
    }
    getAddress(currency, xpub, index) {
        return Promise.resolve(BtcDepositAddressService.genAddr(xpub, index));
    }
    async newTransaction(currency, receivingAddress, balance, userGuid) {
        let bcapi = this.blockCypherService.blockCypherApiProvider.getbcypher(currency);
        let walletToken = await this.blockCypherService.ensureWallet(currency, bcapi);
        let newtx = {
            inputs: [{ "wallet_name": walletToken.walletName, "wallet_token": walletToken.token }],
        };
        return await this.blockCypherService.newTX(currency, receivingAddress, balance, newtx, bcapi);
    }
    isWaitingOnPriorTransaction() {
        return Promise.resolve(null);
    }
    async init() {
        let addresses = await this.dataRepository.getUnprocessedAddresses(Currency_1.Currency.btc);
        for (let address of addresses) {
            this.monitorAddress(address);
        }
    }
    async monitorAddress(info) {
        if (!info.guid) {
            info.guid = await (0, shared_helpers_1.randomBytesHex)();
            await this.dataRepository.saveAddress(info);
        }
        let existingHook = this.blockCypherService.hooks.find(h => h.address === info.address);
        if (!existingHook) {
            let currencyConfig = await this.dataRepository.getCurrencyConfig(Currency_1.Currency.btc);
            await this.addHookInternal(info, currencyConfig.requiredNumberOfConfirmations);
        }
    }
    async addHookInternal(info, requiredNumberOfConfirmations) {
        let baseAddress = process.env.POKER_BASE_ADDRESS;
        let callbackUrl = `${baseAddress}/api/payment-callback?guid=${info.guid}`;
        let hook = { "event": "tx-confirmation", "address": info.address, confirmations: requiredNumberOfConfirmations, url: callbackUrl };
        //let hookEvent: any = await this.blockCypherService.createHook(info.currency, hook);
        let [err, hookEvent] = await (0, shared_helpers_1.to)(this.blockCypherService.createHook(info.currency, hook));
        if (!err) {
            logger.info('created hook for address: ' + info.address);
            info.hookId = hookEvent.id;
            this.addHook(hookEvent);
            return this.dataRepository.saveAddress(info);
        }
        else {
            logger.error('unable to create hook: ' + err);
        }
    }
    addHook(hookEvent) {
        this.blockCypherService.hooks.push(hookEvent);
    }
}
exports.BtcBlockService = BtcBlockService;
//# sourceMappingURL=BtcBlockService.js.map