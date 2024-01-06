"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParityModule = exports.IParityModule = void 0;
var http = require('request-promise-native');
class IParityModule {
    async nextNonce(address) {
        throw new Error("Method not implemented.");
    }
    async eth_getTransactionReceipt(hash) {
        throw new Error("Method not implemented.");
    }
}
exports.IParityModule = IParityModule;
class ParityModule {
    async nextNonce(address) {
        //let post_data = { "method": "parity_nextNonce", "params": [address], "id": 1, "jsonrpc": "2.0" };
        let post_data = { "jsonrpc": "2.0", "method": "eth_getTransactionCount", "params": [address, "pending"], "id": 1 };
        let data = await this.post(post_data);
        if (data) {
            if (data.error)
                throw new Error(JSON.stringify(data.error));
            return data.result;
        }
    }
    async eth_getTransactionReceipt(hash) {
        let post_data = { "jsonrpc": "2.0", "method": "eth_getTransactionReceipt", "params": [hash], "id": 1 };
        let data = await this.post(post_data);
        if (data) {
            if (data.error)
                throw new Error(JSON.stringify(data.error));
            return data.result;
        }
    }
    post(post_data) {
        let url = `https://mainnet.infura.io/v3/6a6f87faddeb42c59da65bb2e8193be8`;
        var options = {
            method: 'POST',
            uri: url,
            body: post_data,
            json: true // Automatically stringifies the body to JSON
        };
        return http(options);
    }
}
exports.ParityModule = ParityModule;
//# sourceMappingURL=parity-module.js.map