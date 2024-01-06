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
exports.EthBlockService = void 0;
const sweep_event_1 = require("./../model/sweep-event");
const decimal_1 = require("../../../poker.ui/src/shared/decimal");
const encryption = __importStar(require("../../../poker.engine/src/framework/encryption"));
const incoming_payment_event_1 = require("./../model/incoming-payment-event");
var Tx = require('ethereumjs-tx');
const util = require('ethereumjs-util'); //a dependency of ethereumjs-tx
const log4js_1 = require("log4js");
const logger = (0, log4js_1.getLogger)();
const BlockCypherService_1 = require("./BlockCypherService");
var _ = require('lodash');
const shared_helpers_1 = require("../../../poker.engine/src/shared-helpers");
const tx_log_1 = require("../model/tx-log");
const Currency_1 = require("../../../poker.ui/src/shared/Currency");
const PaymentProcessorMessage_1 = require("../processor/PaymentProcessorMessage");
const web3_1 = __importDefault(require("web3"));
const EthDepositAddressService = __importStar(require("../../../poker.engine/src/services/EthDepositAddressService"));
class EthBlockService {
    constructor(dataRepository, web3provider, processor, parityModule) {
        this.dataRepository = dataRepository;
        this.web3provider = web3provider;
        this.processor = processor;
        this.parityModule = parityModule;
        this.currency = Currency_1.Currency.eth;
        this.blocks = [];
        this.unprocessedAddresses = [];
        this.monitoredAddresses = [];
        this.firstRun = true;
        this.abi = JSON.parse('[{ "constant": true, "inputs": [], "name": "mintingFinished", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "type": "function" }, { "constant": true, "inputs": [], "name": "name", "outputs": [{ "name": "", "type": "string" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "_spender", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "approve", "outputs": [], "payable": false, "type": "function" }, { "constant": true, "inputs": [], "name": "totalSupply", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "_from", "type": "address" }, { "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "transferFrom", "outputs": [], "payable": false, "type": "function" }, { "constant": true, "inputs": [], "name": "decimals", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [], "name": "unpause", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "_to", "type": "address" }, { "name": "_amount", "type": "uint256" }], "name": "mint", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "type": "function" }, { "constant": true, "inputs": [], "name": "paused", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "type": "function" }, { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "balance", "type": "uint256" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [], "name": "finishMinting", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [], "name": "pause", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "type": "function" }, { "constant": true, "inputs": [], "name": "owner", "outputs": [{ "name": "", "type": "address" }], "payable": false, "type": "function" }, { "constant": true, "inputs": [], "name": "symbol", "outputs": [{ "name": "", "type": "string" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "transfer", "outputs": [], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "_to", "type": "address" }, { "name": "_amount", "type": "uint256" }, { "name": "_releaseTime", "type": "uint256" }], "name": "mintTimelocked", "outputs": [{ "name": "", "type": "address" }], "payable": false, "type": "function" }, { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }, { "name": "_spender", "type": "address" }], "name": "allowance", "outputs": [{ "name": "remaining", "type": "uint256" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "newOwner", "type": "address" }], "name": "transferOwnership", "outputs": [], "payable": false, "type": "function" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "to", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" }], "name": "Mint", "type": "event" }, { "anonymous": false, "inputs": [], "name": "MintFinished", "type": "event" }, { "anonymous": false, "inputs": [], "name": "Pause", "type": "event" }, { "anonymous": false, "inputs": [], "name": "Unpause", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "owner", "type": "address" }, { "indexed": true, "name": "spender", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" }], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "from", "type": "address" }, { "indexed": true, "name": "to", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" }], "name": "Transfer", "type": "event" }]');
        this.lastBlockWarningTime = new Date(-8640000000000000).getTime();
        this.lastLowSweepBalanceTime = new Date(-8640000000000000).getTime();
        this.parityIp = process.env.POKER_PARITY_API_IP || 'mainnet.infura.io/ws'; //former should include the apiKey from infura
        this.parityModule.parityIp = this.parityIp;
    }
    async init() {
        if (process.env.POKER_DISABLE_ETH)
            return;
        this.unprocessedAddresses = await this.dataRepository.getUnprocessedAddresses(Currency_1.Currency.eth);
        await this.subscribe();
        for (let txLog of await this.getQueuedTx()) {
            let receipt = await this.parityModule.eth_getTransactionReceipt(txLog.hash);
            if (receipt && receipt.blockNumber) {
                this.saveTxLogAsComplete(txLog, receipt);
            }
        }
    }
    async loadCurrencyConfig() {
        this.config = await this.dataRepository.getCurrencyConfig(Currency_1.Currency.eth);
        if (this.config == null && !process.env.POKER_DISABLE_ETH) {
            logger.warn('eth currency config is null. exiting');
            process.exit(1);
        }
        await this.loadErc20s();
    }
    async loadErc20s() {
        this.erc20Tokens = await this.dataRepository.getErc20Tokens();
    }
    getAddress(currency, xpub, index) {
        return Promise.resolve(EthDepositAddressService.genAddr(xpub, index));
    }
    async subscribe() {
        try {
            let args = null;
            if (this.web3provider.name === 'Web3') {
                args = new web3_1.default.providers.WebsocketProvider(`wss://${this.parityIp}`);
            }
            this.web3 = new this.web3provider(args);
            let latestBlock = await this.web3.eth.getBlock('latest');
            let lastProcessedBlock = await this.dataRepository.getLastProcessedBlock('eth');
            this.latestBlockNumber = (lastProcessedBlock || latestBlock.number) - this.config.requiredNumberOfConfirmations;
            this.log(`parityIp: ${this.parityIp} eth lastProcessedBlock: ${lastProcessedBlock} latestBlockNumber: ${latestBlock.number}`);
            //let block = await this.web3.eth.getBlock(7466105, true);             
            //this.checkBlock(block, this.unprocessedAddresses);
            //let bal = await this.getContractBalance('0x689c56aef474df92d44a1b70850f808488f9769c', this.erc20Tokens[0].contractAddress);
            //this.newBlockHeadersSubscription = this.web3.eth.subscribe('newBlockHeaders', this.newBlockHeaders.bind(this));            
            this.newBlockHeadersSubscription = await this.web3.eth.subscribe('newBlockHeaders');
            this.newBlockHeadersSubscription.on("data", (blockHeader) => {
                this.newBlockHeaders(blockHeader);
            });
            this.newBlockHeadersSubscription.on("error", (e) => {
                this.onConnectionError(e);
            });
        }
        catch (error) {
            this.onConnectionError(error);
            return;
        }
    }
    async getContractBalance(address, contractAddress) {
        let contract = new this.web3.eth.Contract(this.abi, contractAddress);
        let contractBalance = await contract.methods.balanceOf(address).call();
        //console.log('contractBalance: ', this.web3.utils.fromWei(contractBalance, "ether"));
        return contractBalance;
    }
    onConnectionError(error) {
        clearInterval(this.sweepTimer);
        let errorMessage = error;
        if (error.code || error.reason)
            errorMessage = `${error.code} ${error.reason}`;
        this.log(`eth node error: ${errorMessage} parityIp: ${this.parityIp}`);
        this.unsubscribe();
        this.firstRun = true;
        setTimeout(async () => await this.subscribe(), 30000);
    }
    unsubscribe() {
        if (this.newBlockHeadersSubscription) {
            try {
                this.newBlockHeadersSubscription.unsubscribe((error, success) => {
                    if (success)
                        this.log('newBlockHeadersSubscription: Successfully unsubscribed');
                    else if (error)
                        this.log('newBlockHeadersSubscription: error on unsubscribe: ' + error);
                });
            }
            catch (error) {
                logger.error(error);
            }
        }
    }
    async newBlockHeaders(blockHeader) {
        if (blockHeader.number) {
            this.blocks.push(blockHeader.number);
            await this.checkForTx();
        }
    }
    log(text) {
        (0, shared_helpers_1.logToFile)('eth.log', text);
    }
    async checkForTx() {
        if (this.blocks.length > 0 && !this.checking && this.blocks[this.blocks.length - 1] > this.latestBlockNumber) {
            this.checking = true;
            let fetchBlock = this.latestBlockNumber + 1;
            this.latestBlockNumber = this.blocks[this.blocks.length - 1];
            for (let i = fetchBlock; i <= this.latestBlockNumber; i++) {
                let block = null;
                let count = 0;
                while ((block = await this.web3.eth.getBlock(i, true)) == null && count < 20) {
                    count++;
                    this.log(`getBlock returned null for ${i}. count: ${count}`);
                    await (0, shared_helpers_1.sleep)(2000);
                }
                if (block) {
                    if (i % 100 == 0) {
                    }
                    this.log(`block ${i}  num transactions: ${block.transactions.length}`);
                    await this.checkBlock(block, this.unprocessedAddresses);
                    if (i == this.latestBlockNumber) {
                        await this.checkMonitoredAddresses();
                    }
                    await this.dataRepository.saveLastProcessedBlock('eth', i);
                }
                else {
                    throw new Error(`getBlock returned null for ${i}. count${count}`);
                }
                //let block = await this.web3.eth.getBlock(i, true);                                
            }
            this.checking = false;
            this.lastBlockTime = new Date().getTime();
            if (this.firstRun) {
                this.firstRun = false;
                //this.sweepTimer = setInterval(async () => await this.sweep() , 30000);
            }
            if (this.blocks.length) {
                setTimeout(async () => { await this.checkForTx(); }, 0);
            }
        }
    }
    async checkMonitoredAddresses() {
        for (let mon of this.monitoredAddresses) {
            if (this.latestBlockNumber > mon.blockNumber) {
                let block = await this.web3.eth.getBlock(mon.blockNumber, true);
                await this.checkBlock(block, mon.addresses);
            }
        }
    }
    async checkBlock(block, addresses) {
        const erc20sChecked = new Set();
        for (let tx of block.transactions) {
            if (tx.to != null) {
                let info = addresses.find(a => a.address.toLowerCase() === tx.to.toLowerCase());
                if (info != null) {
                    await this.publishPaymentEvent(info, tx.value, tx.blockNumber, tx.hash);
                }
                for (let erc20 of this.erc20Tokens) {
                    if (tx.to.toLowerCase() === erc20.contractAddress.toLowerCase() && !erc20sChecked.has(erc20.name)) {
                        this.log(`detected ${erc20.name} contract tx. block:${tx.blockNumber} txHash: ${tx.hash}`);
                        await this.getPastEvents(null, block.number, erc20, addresses);
                        erc20sChecked.add(erc20.name);
                    }
                }
            }
        }
    }
    async getPastEvents(toAddress, block, erc20, addresses) {
        let events = await this.getPastTransferEvents(toAddress, block, erc20);
        for (let event of events) {
            //logger.debug(`${erc20.name} Transfer: block:${event.blockNumber} ${event.returnValues.to} received ${SharedHelpers.fromWei(event.returnValues.value)}. txHash:${event.transactionHash}`);
            let info = addresses.find(a => a.address.toLowerCase() === event.returnValues.to.toLowerCase());
            if (info != null) {
                await this.publishPaymentEvent(info, event.returnValues.value, event.blockNumber, event.transactionHash, erc20.name);
            }
        }
    }
    async getPastTransferEvents(toAddress, block, erc20) {
        let contract = this.getContract(erc20);
        let options = {};
        if (toAddress)
            options.filter = { to: toAddress };
        if (block) {
            options.fromBlock = block;
            options.toBlock = block;
        }
        else {
            options.fromBlock = 0;
            options.fromBlock = 4997759;
            options.toBlock = 'latest';
        }
        let events = await contract.getPastEvents('Transfer', options);
        return events;
    }
    async publishPaymentEvent(info, weiAmount, blockNumber, txHash, erc20TokenName) {
        let confirmations = this.latestBlockNumber - blockNumber + 1;
        let sweepFee;
        let hasRequiredNumberOfConfirmations = confirmations >= this.config.requiredNumberOfConfirmations;
        if (!hasRequiredNumberOfConfirmations) {
            this.addToMonitor(info, blockNumber);
        }
        else {
            this.removeFromMonitor(info, blockNumber);
        }
        let amount = shared_helpers_1.SharedHelpers.convertToLocalAmount(Currency_1.Currency.eth, weiAmount);
        let paymentEvent = new incoming_payment_event_1.IncomingPaymentEvent(info.address, amount, confirmations, txHash);
        if (erc20TokenName) {
            paymentEvent.currency = erc20TokenName;
        }
        if (!erc20TokenName && hasRequiredNumberOfConfirmations)
            paymentEvent.sweepFee = this.getEthTransferFee().dividedBy(shared_helpers_1.SharedHelpers.ethDeciGweiDivisor).toString();
        this.log(`publishPaymentEvent for address:${info.address} erc20TokenName:${erc20TokenName} received: ${shared_helpers_1.SharedHelpers.fromWei(weiAmount)} confirmations:${confirmations} txHash:${txHash}`);
        let pMessage = new PaymentProcessorMessage_1.PaymentProcessorMessage();
        pMessage.incomingPaymentEvent = paymentEvent;
        this.processor.sendMessage(pMessage);
        if (hasRequiredNumberOfConfirmations) {
            let sweepEvent = new sweep_event_1.SweepEvent();
            sweepEvent.incomingPaymentHash = txHash;
            sweepEvent.checkSweep = true;
            sweepEvent.address = info.address;
            sweepEvent.weiAmount = weiAmount;
            if (erc20TokenName)
                sweepEvent.erc20TokenName = erc20TokenName;
            await this.dataRepository.saveSweepEvent(sweepEvent);
        }
    }
    addToMonitor(info, blockNumber) {
        let mon = this.monitoredAddresses.find(m => m.blockNumber == blockNumber);
        if (!mon) {
            mon = new MonitoredAddress(blockNumber);
            this.monitoredAddresses.push(mon);
        }
        if (!mon.addresses.find(a => a.address == info.address))
            mon.addresses.push(info);
    }
    removeFromMonitor(info, blockNumber) {
        let blockMonitorIndex = this.monitoredAddresses.findIndex(m => m.blockNumber == blockNumber);
        if (blockMonitorIndex > -1) {
            let monitor = this.monitoredAddresses[blockMonitorIndex];
            let index = monitor.addresses.findIndex(a => a.address == info.address);
            if (index > -1) {
                monitor.addresses.splice(index, 1);
            }
            if (!monitor.addresses.length)
                this.monitoredAddresses.splice(blockMonitorIndex, 1);
        }
    }
    async monitorAddress(info) {
        if (!this.unprocessedAddresses.find(a => a.address == info.address)) {
            this.unprocessedAddresses.push(info);
        }
    }
    async getAddrBal(address, erc20Token) {
        if (erc20Token == null) {
            let addressBalance = await this.web3.eth.getBalance(address);
            return addressBalance;
        }
        else {
            let contract = this.getContract(erc20Token);
            let contractBalance = await contract.methods.balanceOf(address).call();
            return contractBalance;
        }
    }
    getContract(erc20Token) {
        return new this.web3.eth.Contract(this.abi, erc20Token.contractAddress);
    }
    getEthTransferFee() {
        let gasPrice = new decimal_1.Decimal(this.web3.utils.toWei(this.config.gasPriceGwei + '', 'gwei'));
        return gasPrice.mul(this.gasLimit);
    }
    get gasLimit() {
        return 35000;
    }
    getErc20Token(currency) {
        return this.erc20Tokens.find(c => c.name == currency);
    }
    newTransaction(currency, receivingAddress, balance, userGuid) {
        return this.newTransactionInternal(receivingAddress, balance, this.getErc20Token(currency));
    }
    async newTransactionInternal(toAddress, balance, erc20Token) {
        if (process.env.POKER_DISABLE_ETH) {
            throw new Error(`eth is disabled via POKER_DISABLE_ETH`);
        }
        let wei = new decimal_1.Decimal(shared_helpers_1.SharedHelpers.convertToWei(balance) + '');
        let masterAccBalance = await this.getAddrBal(this.config.masterAccount.public, erc20Token);
        let result = new BlockCypherService_1.TransactionResult();
        if (wei.greaterThan(new decimal_1.Decimal(masterAccBalance))) {
            result.errorMessage = `Master acct has a balance of ${this.web3.utils.fromWei(masterAccBalance + '', 'ether')} however the transfer
             is for ${this.web3.utils.fromWei(wei + '', 'ether')}. Have you transferred from the cold wallet to the hot wallet?`;
            return result;
        }
        let fees = new decimal_1.Decimal('0');
        if (erc20Token == null) {
            fees = this.getEthTransferFee();
            wei = wei.minus(fees);
        }
        let [err, txHash] = await (0, shared_helpers_1.to)(this.sendTx(toAddress, encryption.decrypt(this.config.masterAccount.private), wei.toString(), erc20Token, "OutgoingTx", null));
        if (txHash) {
            result.txHash = txHash;
            result.fees = fees.dividedBy(shared_helpers_1.SharedHelpers.ethDeciGweiDivisor).toString();
            result.sentAmount = parseFloat(shared_helpers_1.SharedHelpers.convertToDeciGwei(wei.toString()));
            result.success = true;
        }
        else if (err) {
            result.errorMessage = err.toString();
        }
        return result;
    }
    async sendTx(toAddress, pKey, wei, erc20Token, type, relatedTxHash) {
        return new Promise(async (resolve, reject) => {
            try {
                let config = this.config;
                let publicKey = util.privateToAddress(pKey).toString('hex');
                let publicKey2 = util.toChecksumAddress(publicKey);
                let privateKey = util.toBuffer(pKey);
                let gasPrice = this.web3.utils.toWei(config.gasPriceGwei + '', 'gwei');
                let date = new Date();
                let gasHex = this.web3.utils.toHex(gasPrice);
                //let nonce = await this.web3.eth.getTransactionCount(publicKey);            
                let [err, nonce] = await (0, shared_helpers_1.to)(this.parityModule.nextNonce(publicKey2));
                if (err)
                    return reject(err);
                let rawTx = {
                    nonce: this.web3.utils.toHex(nonce + ''),
                    gasPrice: gasHex,
                };
                let erc20Name = '';
                if (erc20Token != null) {
                    erc20Name = erc20Token.name;
                    let contract = this.getContract(erc20Token);
                    rawTx.data = contract.methods.transfer(toAddress, wei).encodeABI();
                    rawTx.to = erc20Token.contractAddress;
                    rawTx.value = '0x0';
                    rawTx.gasLimit = this.web3.utils.toHex(config.gasLimit);
                }
                else {
                    rawTx.to = toAddress;
                    rawTx.value = this.web3.utils.toHex(wei);
                    rawTx.gasLimit = this.web3.utils.toHex(this.gasLimit);
                }
                var tx = new Tx(rawTx);
                tx.sign(privateKey);
                var serializedTx = tx.serialize();
                let payload = '0x' + serializedTx.toString('hex');
                let txLog = new tx_log_1.TxLog();
                let txHash = '0x' + tx.hash().toString('hex');
                txLog.currency = Currency_1.Currency.eth;
                txLog.erc20Name = erc20Name;
                txLog.hash = txHash;
                txLog.status = 'queued';
                txLog.type = type;
                txLog.timestamp = date;
                txLog.relatedTxHash = relatedTxHash;
                txLog.rawTx = rawTx;
                txLog.from = publicKey2;
                await this.dataRepository.addTxLog(txLog);
                this.web3.eth.sendSignedTransaction(payload)
                    .on('transactionHash', async (hash) => {
                    this.log(`transactionHash ${hash} for ${type} address: ${publicKey2} erc20:${erc20Name}`);
                    resolve(txHash);
                })
                    .on('receipt', (receipt) => {
                    this.log(`receipt ${receipt.transactionHash} for ${type} address: ${publicKey2} erc20:${erc20Name}`);
                    this.saveTxLogAsComplete(txLog, receipt);
                })
                    .on('error', async (err) => {
                    txLog.status = 'error';
                    txLog.error = err.toString();
                    logger.error(`error on tx. ${type} address: ${publicKey2} erc20:${erc20Name} err:${err}`);
                    this.dataRepository.addTxLog(txLog);
                    reject(err);
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    async runChecks() {
        if (!this.lastBlockTime) {
            return;
        }
        let seconds = (new Date().getTime() - this.lastBlockTime) / 1000;
        let secThreshold = 600;
        if (seconds > secThreshold) {
            let secondsSinceLastNotification = (new Date().getTime() - this.lastBlockWarningTime) / 1000;
            if (secondsSinceLastNotification > 600) {
                this.lastBlockWarningTime = new Date().getTime();
                this.onConnectionError(`warning! last block ${this.latestBlockNumber} has not changed for ${seconds} seconds`);
            }
        }
    }
    async saveTxLogAsComplete(txLog, receipt) {
        if (txLog.erc20Name) {
            let erc20Token = this.erc20Tokens.find(t => t.name == txLog.erc20Name);
            let events = await this.getPastTransferEvents(null, receipt.blockNumber, erc20Token);
            let event = events.find(e => e.transactionHash == txLog.hash);
            if (event != null) {
                txLog.status = 'complete';
            }
            else {
                txLog.status = 'error';
                txLog.error = `Token transfer failed. Was expecting a token transfer in block: ${receipt.blockNumber} with hash: ${txLog.hash}`;
                logger.error(txLog.error);
            }
        }
        else {
            txLog.status = 'complete';
        }
        txLog.receipt = receipt;
        this.dataRepository.addTxLog(txLog);
    }
    async isWaitingOnPriorTransaction() {
        let txLogs = await this.getQueuedTx();
        if (txLogs.length) {
            return txLogs[0].hash;
        }
        return null;
    }
    async getQueuedTx() {
        return this.dataRepository.getTxLogs({ "status": 'queued' });
    }
}
exports.EthBlockService = EthBlockService;
class MonitoredAddress {
    constructor(blockNumber) {
        this.blockNumber = blockNumber;
        this.addresses = [];
    }
}
//# sourceMappingURL=EthBlockService.js.map