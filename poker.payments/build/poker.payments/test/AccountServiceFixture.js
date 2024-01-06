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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AccountService_1 = require("../src/services/AccountService");
const BlockCypherService_1 = require("../src/services/BlockCypherService");
const IBlockCypherService_1 = require("../src/services/IBlockCypherService");
const AddressInfo_1 = require("../src/model/AddressInfo");
const incoming_payment_event_1 = require("../src/model/incoming-payment-event");
const assert = __importStar(require("assert"));
const ISecureDataRepository_1 = require("../src/repository/ISecureDataRepository");
const currency_config_1 = require("../src/model/currency-config");
const GetDepositAddressRequest_1 = require("../../poker.engine/src/admin/model/outgoing/GetDepositAddressRequest");
const UserSmall_1 = require("../../poker.engine/src/model/UserSmall");
const jssubstitute_1 = __importDefault(require("jssubstitute"));
const ConnectionToGameServer_1 = require("../src/services/ConnectionToGameServer");
const Payment_1 = require("../../poker.engine/src/model/Payment");
const PaymentStatus_1 = require("../../poker.ui/src/shared/PaymentStatus");
const PaymentType_1 = require("../../poker.ui/src/shared/PaymentType");
const bjs = require("bitcoinjs-lib");
const b58 = require('bs58check');
const encryption = __importStar(require("../../poker.engine/src/framework/encryption"));
const EthBlockService_1 = require("../src/services/EthBlockService");
const BtcBlockService_1 = require("../src/services/BtcBlockService");
var ethereumjs = require('ethereumjs-wallet');
var hdkey = require('ethereumjs-wallet/hdkey');
describe('AccountServiceFixture', function () {
    jssubstitute_1.default.throwErrors();
    const cryptoAddress = 'C2PvtxEGGRXpnpHr4xeoJpEzvCRzj78xbn';
    let addressInfo;
    let hookEvent = { id: 'hookId', address: 'someAddressThatAlreadyExisted' };
    let repository;
    let accountService;
    let connectionToGameServer;
    let blockCypherService;
    let currencyConfig = new currency_config_1.CurrencyConfig();
    let ethConfig = new currency_config_1.CurrencyConfig();
    ethConfig.name = 'eth';
    ethConfig.xpub = 'xpub661MyMwAqRbcF8dQCNnr92GPFUCsjQs5EwKjh8rzkuDGNarXvSNHKSL3iv94kwqVfhmRNMnFXQpEeZK7crNuotMe46vfX2PXV7iVAWdwTcX';
    let btcConfig = new currency_config_1.CurrencyConfig();
    btcConfig.name = 'btc';
    btcConfig.xpub = 'ypub6a4xyVLxwfTP5TBKioN832qK3HbH1LtN1iRbjz3T9x8WPfqbvtTzAGurbkTrctaA3jJ7Exsq3ssbyuLygWDuXZTFBpKw6BkXVgViMnAfpGP';
    btcConfig.masterAccount = new currency_config_1.AddressSmall();
    btcConfig.masterAccount.public = '13EZuGMUjjPZ2FdMJEkm6rfTWkSPUu2648';
    //unencrypted 'L1C2DYqzcFhEwosNsWcuebproQkJufNmYCqSdkMteacuJ1hXoNAu';    
    btcConfig.masterAccount.wif = '02b0d3885d6d12acd66c36ba7c5ebc31c77ced02295d8d989710a640c5605623889ff1c74700dafc5d746e1e43732abdc8ae0a6c7dda4cd86ab107fafa79effe$880b3749b02590a2ceb788926a8575cf$0d2b3ea3854b2f0f96574ea5a188800c09a027f6644167b2e915eecbec02d840$d7339d354ff8469be226c4c11f56d635$e411c1ffaa02e1048fe0156e921deac79b2d4716f4591e32e7a079329e6b9a43';
    beforeEach(function () {
        process.env.POKER_K1 = '6DEF53033BC4A95E93E0995F297D97326F5C4A4BD06AB2FF106823C890D928E2';
        process.env.POKER_HMAC_KEY = 'C2B344D43A82A15CC149374D4FF3DF331398F9FBD7847633097D87E711F8EECC';
        //console.log(encryption.encrypt('zzzz'))
        addressInfo = new AddressInfo_1.AddressInfo();
        addressInfo.address = cryptoAddress;
        currencyConfig.name = 'bcy';
        currencyConfig.requiredNumberOfConfirmations = 1;
        currencyConfig.masterAccount = new currency_config_1.AddressSmall();
        currencyConfig.masterAccount.public = 'C4jhPuD3pLqHMwuUwjg3yVCPD4P67TZ56r';
        currencyConfig.withdrawlFee = "2000";
        //unencrypted '3ecc45ade352144e16b6e9d7d823aa1d18260c4facf68af6b8dd74757253863d';        
        currencyConfig.masterAccount.private = 'a7d3cfbc26d656112429c9a3e89cca21e4000461deb464aebb3a59709db1b7dd17d8c058eb5bc26c4d1e0d46118110cfd531b66d48421ea70cf55f3f85bc52fe99d9aab1366fb1c1ec75097533ecf55f$eac61ec2303f93dfa05e2e502f58dc30$54e0ecf1f69251d5e6f1b1eb95c2e576df68306546cd22dc06dfb27e7f93f2d7';
        blockCypherService = jssubstitute_1.default.for(new IBlockCypherService_1.IBlockCypherService());
        connectionToGameServer = jssubstitute_1.default.for(new ConnectionToGameServer_1.IConnectionToGameServer());
        //blockCypherService.returns('getCoinChain', { coin: "bcy", chain: 'test' });
        blockCypherService.returns('createHook', Promise.resolve(hookEvent));
        blockCypherService.returns('delHook', Promise.resolve());
        blockCypherService.returns('supportsWallet', true);
        repository = jssubstitute_1.default.for(new ISecureDataRepository_1.ISecureDataRepository());
        repository.returns('getErc20Tokens', Promise.resolve([]));
        repository.returnsFor('getCurrencyConfig', ethConfig, 'eth');
        repository.returnsFor('getCurrencyConfig', btcConfig, 'btc');
        repository.returnsFor('getCurrencyConfig', currencyConfig, jssubstitute_1.default.arg.any);
        repository.returns('getCurrencyConfigs', Promise.resolve([currencyConfig, btcConfig, ethConfig]));
        repository.returns('getAddressInfo', Promise.resolve([]));
        repository.returns('getAddressCount', Promise.resolve(0));
        repository.returns('getAddressInfoByAddress', Promise.resolve(addressInfo));
        repository.returns('getCurrencyConfigs', Promise.resolve([ethConfig, btcConfig, currencyConfig]));
        accountService = new AccountService_1.AccountService(blockCypherService, repository, []);
        accountService.connectionToGameServer = connectionToGameServer;
    });
    let setupHandleFundAccountRequest = () => {
        let request = new GetDepositAddressRequest_1.GetDepositAddressRequest();
        request.currency = "bcy";
        request.user = new UserSmall_1.UserSmall("ABCDEF", "abcdef");
        let addressInfo = new AddressInfo_1.AddressInfo();
        addressInfo.address = 'someAddressThatAlreadyExisted';
        addressInfo.currency = "bcy";
        addressInfo.userGuid = request.user.guid;
        return { addressInfo: addressInfo, request: request };
    };
    it('handlePayment_payment_has_less_than_required_number_of_confirmations', async () => {
        addressInfo.address = cryptoAddress;
        addressInfo.userGuid = "ABCDEF";
        addressInfo.screenName = "user1";
        addressInfo.currency = "bcy";
        let event = new incoming_payment_event_1.IncomingPaymentEvent(addressInfo.address, '1000000', 0, "example-txHash");
        let result = await accountService.handlePayment(event);
        assert.equal(0, addressInfo.incomingTxHashes.length);
        let assertPayment = (payment) => {
            if (payment == undefined)
                return false;
            assert.equal(payment.type, PaymentType_1.PaymentType.incoming);
            assert.equal(payment.currency, 'bcy');
            assert.equal(payment.guid, 'ABCDEF');
            assert.equal(payment.screenName, 'user1');
            assert.equal(payment.timestamp != null, true);
            assert.equal(payment.address, cryptoAddress);
            assert.equal(payment.txId, 'example-txHash');
            assert.equal(payment.amount === '1000000', true);
            assert.equal(payment.confirmations, 0);
            assert.equal(payment.status, PaymentStatus_1.PaymentStatus.pending);
            return true;
        };
        repository.receivedWith('savePayment', jssubstitute_1.default.arg.matchUsing(assertPayment));
        repository.didNotReceive('saveAddress');
        connectionToGameServer.receivedWith('send', jssubstitute_1.default.arg.matchUsing((message) => {
            if (message == undefined)
                return false;
            let accountFundedResult = message;
            return assertPayment(accountFundedResult.payment);
        }));
    });
    it('handlePayment_payment_made', async () => {
        addressInfo.userGuid = "ABCDEF";
        addressInfo.currency = "bcy";
        let event = new incoming_payment_event_1.IncomingPaymentEvent(addressInfo.address, '1000000', 1, "example-txHash");
        let dbPayment = new Payment_1.Payment();
        dbPayment.status = PaymentStatus_1.PaymentStatus.pending;
        repository.returnsFor('getPaymentByTxId', dbPayment, 'bcy', event.txHash);
        let result = await accountService.handlePayment(event);
        assert.equal(addressInfo.incomingTxHashes[0], "example-txHash");
        assert.equal(result, dbPayment);
        repository.receivedWith('savePayment', jssubstitute_1.default.arg.matchUsing((payment) => {
            if (payment == undefined)
                return false;
            assert.equal(dbPayment, payment);
            assert.equal(payment.status, PaymentStatus_1.PaymentStatus.complete);
            return true;
        }));
        repository.receivedWith('saveAddress', addressInfo);
    });
    it('handlePayment_confirmations_is_updated', async () => {
        currencyConfig.requiredNumberOfConfirmations = 2;
        addressInfo.userGuid = "ABCDEF";
        addressInfo.currency = "bcy";
        let event = new incoming_payment_event_1.IncomingPaymentEvent(addressInfo.address, '1000000', 1, "example-txHash");
        let dbPayment = new Payment_1.Payment();
        dbPayment.status = PaymentStatus_1.PaymentStatus.pending;
        dbPayment.confirmations = 0;
        repository.returnsFor('getPaymentByTxId', dbPayment, 'bcy', event.txHash);
        let result = await accountService.handlePayment(event);
        assert.equal(0, addressInfo.incomingTxHashes.length);
        repository.receivedWith('savePayment', jssubstitute_1.default.arg.matchUsing((payment) => {
            if (payment == undefined)
                return false;
            assert.equal(dbPayment, payment);
            assert.equal(payment.status, PaymentStatus_1.PaymentStatus.pending);
            assert.equal(payment.confirmations, 1);
            return true;
        }));
    });
    it('duplicate_payment_is_made_assert_2nd_payment_is_rejected', async () => {
        addressInfo.userGuid = "ABCDEF";
        addressInfo.processed = false;
        addressInfo.currency = "bcy";
        let event = new incoming_payment_event_1.IncomingPaymentEvent(addressInfo.address, '1000000', 1, "example-txHash");
        let result1 = await accountService.handlePayment(event);
        let result2 = await accountService.handlePayment(event);
        assert.equal(addressInfo.incomingTxHashes.length, 1);
        assert.equal(result1.amount === '1000000', true);
        assert.equal(result2 == null, true);
    });
    it('payment is complete but is missing expected entry in incomingTxHashes', async () => {
        addressInfo.address = cryptoAddress;
        addressInfo.userGuid = "ABCDEF";
        addressInfo.currency = "bcy";
        let event = new incoming_payment_event_1.IncomingPaymentEvent(addressInfo.address, '1000000', 1, "example-txHash");
        let dbPayment = new Payment_1.Payment();
        dbPayment.status = PaymentStatus_1.PaymentStatus.complete;
        dbPayment.confirmations = 1;
        repository.returnsFor('getPaymentByTxId', dbPayment, 'bcy', event.txHash);
        let result = await accountService.handlePayment(event);
        assert.equal(result, null);
        repository.didNotReceive('savePayment');
    });
    let getBlockCypherService = async () => {
        let api = {
            newTX(tx, callback) {
                setTimeout(() => {
                    callback(null, JSON.parse('{"tx":{"block_height":-1,"block_index":-1,"hash":"43420bf7ef53a8e934922723c761f45e0bc30ddd5ff29cd76124cca620d7b01b","addresses":["C4jhPuD3pLqHMwuUwjg3yVCPD4P67TZ56r","By6JsQn9qU1UQ9U6du5f8q6oaFK1nuRhLy"],"total":10958000,"fees":2000,"size":160,"preference":"medium","relayed_by":"220.253.234.40","received":"2018-10-08T05:55:50.674909066Z","ver":1,"double_spend":false,"vin_sz":2,"vout_sz":2,"confirmations":0,"inputs":[{"prev_hash":"0a0da1f1e73e8410a6127fb792fb59d39c5d2d23566d5e7ee291323ee0c3741f","output_index":0,"output_value":980000,"sequence":4294967295,"addresses":["C4jhPuD3pLqHMwuUwjg3yVCPD4P67TZ56r"],"script_type":"pay-to-pubkey-hash","age":1460793},{"prev_hash":"bdcda0aeddb31d35620777a1027b56a4c957fbcb44c986e872b1f2dd1086db9e","output_index":0,"output_value":9980000,"sequence":4294967295,"addresses":["C4jhPuD3pLqHMwuUwjg3yVCPD4P67TZ56r"],"script_type":"pay-to-pubkey-hash","age":1463662}],"outputs":[{"value":9998000,"script":"76a9144170fea46aa089845744c6f9d27229e2c1c8daf188ac","addresses":["By6JsQn9qU1UQ9U6du5f8q6oaFK1nuRhLy"],"script_type":"pay-to-pubkey-hash"},{"value":960000,"script":"76a9147f5bd154f2f0b10402aa1aa892eb90162a39d80e88ac","addresses":["C4jhPuD3pLqHMwuUwjg3yVCPD4P67TZ56r"],"script_type":"pay-to-pubkey-hash"}]},"tosign":["06c93519d72cd1741d5a661ae47d62396bb6c42ddaa2f5fd3c4ec3e473cf121c","c2710305053139070bd17964614de12768632a297af8123a15ca25a6d52d62c4"]}'));
                }, 0);
            },
            sendTX(tx, callback) {
                setTimeout(() => {
                    callback(null, { tx: {} });
                }, 0);
            },
            listHooks(callback) {
                setTimeout(() => {
                    callback(null, []);
                }, 0);
            }
        };
        let blockCypherApi = jssubstitute_1.default.for(api);
        blockCypherApi.callsThrough('newTX');
        blockCypherApi.callsThrough('sendTX');
        blockCypherApi.callsThrough('listHooks');
        let blockCypherApiProvider = { getbcypher: (currency) => {
                return blockCypherApi;
            } };
        let blockCypherService = new BlockCypherService_1.BlockCypherService(repository, blockCypherApiProvider);
        await blockCypherService.init();
        await blockCypherService.loadCurrencyConfigs();
        return [blockCypherService, blockCypherApi];
    };
    it('signTX', async () => {
        let [blockCypherService, blockCypherApi] = await getBlockCypherService();
        await blockCypherService.newTX('bcy', 'By6JsQn9qU1UQ9U6du5f8q6oaFK1nuRhLy', 1000000, blockCypherApi);
        let args = blockCypherApi.argsForCall('sendTX', 0)[0];
        //{"tx":{"block_height":-1,"block_index":-1,"hash":"e6d834f369d7b3697950384370a9e9f6ebe036d878507b1acc3097da2ad2af4b","addresses":["C4jhPuD3pLqHMwuUwjg3yVCPD4P67TZ56r","By6JsQn9qU1UQ9U6du5f8q6oaFK1nuRhLy"],"total":99978000,"fees":2000,"size":119,"preference":"medium","relayed_by":"220.253.234.40","received":"2018-10-08T04:06:29.968219492Z","ver":1,"double_spend":false,"vin_sz":1,"vout_sz":2,"confirmations":0,"inputs":[{"prev_hash":"b0f535a18e43fef15d9f031b2375d8845cad819c32d38b2823b8a1413495d5a6","output_index":0,"output_value":99980000,"sequence":4294967295,"addresses":["C4jhPuD3pLqHMwuUwjg3yVCPD4P67TZ56r"],"script_type":"pay-to-pubkey-hash","age":1458306}],"outputs":[{"value":9998000,"script":"76a9144170fea46aa089845744c6f9d27229e2c1c8daf188ac","addresses":["By6JsQn9qU1UQ9U6du5f8q6oaFK1nuRhLy"],"script_type":"pay-to-pubkey-hash"},{"value":89980000,"script":"76a9147f5bd154f2f0b10402aa1aa892eb90162a39d80e88ac","addresses":["C4jhPuD3pLqHMwuUwjg3yVCPD4P67TZ56r"],"script_type":"pay-to-pubkey-hash"}]},"tosign":["618e739475c030978485b4976121cfa0d7cb4489b825fe9ae47dbae9ba096546"],"pubkeys":["0288876ebcc46d15a796d76249c08911be2d7689981a1d7de0085e90de8be231f6"],"signatures":["3045022100bf3765c85e1dc2856e8765ef8987c34e28281158363390ee5a0df2e814a8d7e702201ca67ed07df2f8c34e8c0dda013874a78f2fdb05b204bd685c50d071797b13bb"]}
        assert.equal(args.signatures[0], '3045022100aad55d6fbf52268c7e58b954b06806f08c6945eaae16b011d7a5d1e4fb1d3083022047d9527a7904418be497c50fab2e9e292185fbb72cdec2ad1f75e9a6db056760');
        assert.equal(args.signatures[1], '30450221009dae72eb79ce1982848fd78361b3330ed88732743fd6016241e64a4ba2de1c63022029a42298aa2617de29f723c2873627eb5b1c28d284a2b50571bd1056b1f29a4a');
        assert.equal(args.pubkeys[0], '0288876ebcc46d15a796d76249c08911be2d7689981a1d7de0085e90de8be231f6');
        assert.equal(args.pubkeys[1], '0288876ebcc46d15a796d76249c08911be2d7689981a1d7de0085e90de8be231f6');
    });
    it.skip('ensureMasterAddressInWallet', async () => {
        //this test uses the blockcypher API 
        currencyConfig.name = 'btc';
        currencyConfig.masterAccount.public = '13EZuGMUjjPZ2FdMJEkm6rfTWkSPUu2648';
        let blockCypherService = new BlockCypherService_1.BlockCypherService(repository, null);
        await blockCypherService.ensureMasterAddressInWallet('btc');
    });
    it('wifToAddress', () => {
        let pKey = encryption.decrypt(btcConfig.masterAccount.wif);
        let keypair = bjs.ECPair.fromWIF(pKey);
        const { address } = bjs.payments.p2pkh({ pubkey: keypair.publicKey });
        assert.equal(address, btcConfig.masterAccount.public);
    });
    it.skip('createTx', async () => {
        //WARNING - this will send a real tx bia blockcypher API
        let blockCypherService = new BlockCypherService_1.BlockCypherService(repository, null);
        let btcService = new BtcBlockService_1.BtcBlockService(repository, blockCypherService);
        let result = await btcService.newTransaction('btc', '3EXDNuJutL6HoZuB1T2ciNuP5A863nXTuY', 75526, null);
        console.log('result', result);
    });
    it('eth genAddr', async () => {
        let ethBlockService = new EthBlockService_1.EthBlockService(repository, null, null, {});
        // let info = await ethBlockService.genAddr('eth', 'guid1');
        // assert.equal(info.address, '0xD4F4f8561f978cddd06895860e0A9277478F1871')        
    });
});
//# sourceMappingURL=AccountServiceFixture.js.map