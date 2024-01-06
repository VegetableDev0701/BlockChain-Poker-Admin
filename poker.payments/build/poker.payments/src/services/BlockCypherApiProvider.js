"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockCypherApiProvider = void 0;
const Currency_1 = require("../../../poker.ui/src/shared/Currency");
var bcypher = require('blockcypher');
class BlockCypherApiProvider {
    constructor() {
        this.blockCypherApiKey = 'b44865eb69aa4d1abbbffed567e26e75';
    }
    getbcypher(currency) {
        let result = this.getCoinChain(currency);
        if (result) {
            return new bcypher(result.coin, result.chain, this.blockCypherApiKey);
        }
        else {
            throw new Error('currency not supported: ' + currency);
        }
    }
    getCoinChain(currency) {
        let result = {
            coin: currency,
            chain: 'main'
        };
        if (currency == Currency_1.Currency.bcy || currency == Currency_1.Currency.beth) {
            result.chain = 'test';
        }
        return result;
    }
}
exports.BlockCypherApiProvider = BlockCypherApiProvider;
//# sourceMappingURL=BlockCypherApiProvider.js.map