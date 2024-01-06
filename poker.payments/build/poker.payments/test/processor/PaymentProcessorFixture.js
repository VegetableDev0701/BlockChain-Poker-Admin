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
const assert = __importStar(require("assert"));
const PaymentProcessor_1 = require("../../src/processor/PaymentProcessor");
const PaymentProcessorMessage_1 = require("../../src/processor/PaymentProcessorMessage");
describe('PaymentProcessorFixture', () => {
    let processor;
    beforeEach(() => {
        processor = new PaymentProcessor_1.PaymentProcessor(50);
    });
    let testHandler = {
        run: (m) => {
            let message = (m);
            let id = message.test.id;
            return new Promise((resolve, reject) => {
                let timeout = 10;
                if (id == 7) {
                    reject('bad message');
                }
                else if (id == 6) {
                    throw new Error('some other error');
                }
                else {
                    setTimeout(() => {
                        let result = new PaymentProcessorMessage_1.PaymentProcessorResult();
                        result.id = id;
                        resolve(result);
                    }, timeout);
                }
            });
        },
        typeName: 'test'
    };
    it('sendMessage', async () => {
        processor.addHandler(testHandler);
        let promises = [];
        for (let i = 0; i < 10; i++) {
            let promise = new Promise((resolve, reject) => {
                setTimeout(async () => {
                    let message = (new PaymentProcessorMessage_1.PaymentProcessorMessage());
                    message['test'] = { id: i };
                    let result = await processor.sendMessage(Object.assign(message, { id: i }));
                    resolve(result);
                }, 1);
            });
            promises.push(promise);
        }
        const results = await Promise.all(promises);
        assert.equal(results.length, 10);
        assert.equal(results[0].id, 0);
        assert.equal(results[1].id, 1);
        assert.equal(results[2].id, 2);
        assert.equal(results[3].id, 3);
        assert.equal(results[4].id, 4);
        assert.equal(results[5].id, 5);
        assert.equal(results[6].error.indexOf('error handling message PaymentProcessorMessage { test: { id: 6 }, id: 6 }: some other error Error: some other error') > -1, true, results[6].error);
        assert.equal(results[7].error, 'error handling message PaymentProcessorMessage { test: { id: 7 }, id: 7 }: bad message');
        assert.equal(results[8].id, 8);
        assert.equal(results[9].id, 9);
    });
    it('sendMessage timeout', async () => {
        let handler = {
            run: (m) => {
                return new Promise((resolve, reject) => {
                    let id = m.test.id;
                    if (id != 6) {
                        resolve(id);
                    }
                });
            },
            typeName: 'test'
        };
        processor.addHandler(handler);
        for (let i = 0; i < 10; i++) {
            let message = (new PaymentProcessorMessage_1.PaymentProcessorMessage());
            message['test'] = { id: i };
            let result = await processor.sendMessage(message);
            if (i != 6) {
                assert.equal(i, result);
            }
            else {
                assert.equal(result.error.indexOf('message did not complete execution after timeout of 50') > -1, true);
            }
        }
    });
});
//# sourceMappingURL=PaymentProcessorFixture.js.map