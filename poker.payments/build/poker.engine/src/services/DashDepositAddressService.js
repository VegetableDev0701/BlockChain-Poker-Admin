"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAddress = exports.genAddr = void 0;
const { HDPublicKey, Address } = require('@dashevo/dashcore-lib');
function genAddr(xpub, index) {
    let addr = getAddress(xpub, index);
    let child = new Address(addr.publicKey, addr.network);
    //console.log(`${index} address ${child.toString()}`);
    //console.log(`addr.publicKey ${addr.publicKey}`);
    let address = child.toString();
    return address;
}
exports.genAddr = genAddr;
function getAddress(xpub, index) {
    let pubKey = new HDPublicKey(xpub);
    let account1 = pubKey.derive(0);
    let addr = account1.derive(index);
    return addr;
}
exports.getAddress = getAddress;
//# sourceMappingURL=DashDepositAddressService.js.map