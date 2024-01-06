"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IBlockCypherService = void 0;
class IBlockCypherService {
    createHook(currency, hook) { throw new Error("Not implemented"); }
    delHook(currency, hookId) { throw new Error("Not implemented"); }
    usesHooks(currency) { throw new Error("Not implemented"); }
    getAddrBal(address, currency) { throw new Error("Not implemented"); }
    supportsWallet(currency) { throw new Error("Not implemented"); }
    getTx(hash, currency) { throw new Error("Not implemented"); }
    loadCurrencyConfigs() { throw new Error("Not implemented"); }
    init() { throw new Error("Method not implemented."); }
    ensureWallet(currency, bcapi) { throw new Error("Method not implemented."); }
    newTX(currency, receivingAddress, balance, newtx, bcapi) { throw new Error("Method not implemented."); }
}
exports.IBlockCypherService = IBlockCypherService;
//# sourceMappingURL=IBlockCypherService.js.map