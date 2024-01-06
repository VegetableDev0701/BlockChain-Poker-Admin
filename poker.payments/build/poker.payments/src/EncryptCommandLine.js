"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const encryption_1 = require("../../poker.engine/src/framework/encryption");
const result = dotenv_1.default.config();
if (!process.env.POKER_K1) {
    console.log(`process.env.POKER_K1 not defined ${JSON.stringify(result)}`);
    process.exit(1);
}
if (!process.env.POKER_HMAC_KEY) {
    console.log(`process.env.POKER_HMAC_KEY not defined ${JSON.stringify(result)}`);
    process.exit(1);
}
if (!process.argv[2]) {
    console.log(`No input specified!`);
    process.exit(1);
}
let encrypted = (0, encryption_1.encrypt)(process.argv[2]);
let decrypted = (0, encryption_1.decrypt)(encrypted);
if (decrypted != process.argv[2]) {
    console.error(`decrypted does not match input`);
}
else {
    console.log(encrypted);
}
//# sourceMappingURL=EncryptCommandLine.js.map