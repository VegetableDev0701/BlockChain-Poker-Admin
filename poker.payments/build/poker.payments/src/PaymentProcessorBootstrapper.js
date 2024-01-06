"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentProcessorBootstrapper = void 0;
const web_server_1 = require("./webserver/web-server");
const SecureDataRepository_1 = require("./repository/SecureDataRepository");
const environment_1 = __importDefault(require("./environment"));
const log4js_1 = require("log4js");
const logger = (0, log4js_1.getLogger)();
const log4jsInit_1 = require("../../poker.engine/src/framework/log4jsInit");
const telegram_service_1 = require("../../poker.engine/src/framework/telegram/telegram.service");
const BlockCypherService_1 = require("./services/BlockCypherService");
const AccountService_1 = require("./services/AccountService");
const EthBlockService_1 = require("./services/EthBlockService");
const parity_module_1 = require("./services/parity-module");
const PaymentProcessor_1 = require("./processor/PaymentProcessor");
const Web3 = require('web3');
var bitcore = require('@dashevo/dashcore-lib');
var HDPublicKey = bitcore.HDPublicKey;
const dotenv_1 = __importDefault(require("dotenv"));
const CheckWithdrawlsHandler_1 = require("./processor/CheckWithdrawlsHandler");
const IncomingPaymentEventHandler_1 = require("./processor/IncomingPaymentEventHandler");
const BlockCypherPaymentEventHandler_1 = require("./webserver/handlers/BlockCypherPaymentEventHandler");
const PaymentProcessorMessage_1 = require("./processor/PaymentProcessorMessage");
const ProcessWithdrawlsHandler_1 = require("./processor/ProcessWithdrawlsHandler");
const ManualApprovalRequestHandler_1 = require("./processor/ManualApprovalRequestHandler");
const request_promise_native_1 = __importDefault(require("request-promise-native"));
require("source-map-support/register");
const CancelPaymentRequestHandler_1 = require("./processor/CancelPaymentRequestHandler");
const CheckDepositAddressesHandler_1 = require("./processor/CheckDepositAddressesHandler");
const BtcBlockService_1 = require("./services/BtcBlockService");
const DashCoreBlockService_1 = require("./services/DashCoreBlockService");
class PaymentProcessorBootstrapper {
    async run() {
        const result = dotenv_1.default.config();
        for (let envVar of [
            { key: "POKER_ADMIN_BASE64", value: process.env.POKER_ADMIN_BASE64 },
            { key: "POKER_PARITY_API_IP", value: process.env.POKER_PARITY_API_IP },
            { key: "POKER_K1", value: process.env.POKER_K1 },
            { key: "POKER_TELEGRAM_ADMIN_CHANNEL", value: process.env.POKER_TELEGRAM_ADMIN_CHANNEL },
            { key: "POKER_TELEGRAM_ADMIN_BOT_TOKEN", value: process.env.POKER_TELEGRAM_ADMIN_BOT_TOKEN },
            { key: "POKER_UNLOCK_WALLET", value: process.env.POKER_UNLOCK_WALLET },
            { key: "POKER_BASE_ADDRESS", value: process.env.POKER_BASE_ADDRESS },
        ]) {
            if (!envVar.value) {
                let errMsg = `${envVar.key} not defined!`;
                if (result.error) {
                    errMsg += ` dotEnv error: ${result.error.message}`;
                }
                console.log(errMsg);
                process.exit(1);
            }
        }
        this.setupLogging();
        process.on('uncaughtException', (err) => { logger.error('uncaughtException', err); });
        process.on("unhandledRejection", (reason) => { logger.error('unhandledRejection', reason); });
        logger.info(`app started. version:${environment_1.default.version}. debug:${environment_1.default.debug}`);
        this.processor = new PaymentProcessor_1.PaymentProcessor();
        let dataRepository = new SecureDataRepository_1.SecureDataRepository(process.env.POKER_PAYMENT_SERVER_DB_NAME || 'PokerPaymentServer');
        this.blockCypherService = new BlockCypherService_1.BlockCypherService(dataRepository, null);
        this.ethBlockService = new EthBlockService_1.EthBlockService(dataRepository, Web3, this.processor, new parity_module_1.ParityModule());
        let dashCoreBlockService = new DashCoreBlockService_1.DashCoreBlockService(dataRepository);
        let services = [
            dashCoreBlockService,
            this.ethBlockService,
            new BtcBlockService_1.BtcBlockService(dataRepository, this.blockCypherService),
        ];
        this.accountService = new AccountService_1.AccountService(this.blockCypherService, dataRepository, services);
        await dataRepository.init();
        await this.accountService.init();
        let blockCypherPaymentEventHandler = new BlockCypherPaymentEventHandler_1.BlockCypherPaymentEventHandler(dataRepository, this.accountService, this.blockCypherService, this.processor);
        let webServer = new web_server_1.WebServer(dataRepository, this.processor, this.accountService, blockCypherPaymentEventHandler);
        this.accountService.connectionToGameServer = webServer.connectionToGameServer;
        let telegramService = new telegram_service_1.TelegramService();
        this.processor.addHandler(new CheckWithdrawlsHandler_1.CheckWithdrawlsHandler(dataRepository, request_promise_native_1.default, telegramService));
        this.processor.addHandler(new IncomingPaymentEventHandler_1.IncomingPaymentEventHandler(this.accountService, dataRepository));
        this.processor.addHandler(new ProcessWithdrawlsHandler_1.ProcessWithdrawlsHandler(this.accountService, dataRepository, webServer.connectionToGameServer, request_promise_native_1.default));
        this.processor.addHandler(new ManualApprovalRequestHandler_1.ManualApprovalRequestHandler(this.accountService, dataRepository, webServer.connectionToGameServer));
        this.processor.addHandler(new CancelPaymentRequestHandler_1.CancelPaymentRequestHandler(dataRepository, webServer.connectionToGameServer));
        this.processor.addHandler(new CheckDepositAddressesHandler_1.CheckDepositAddressesHandler(dataRepository, request_promise_native_1.default, this.accountService));
        webServer.init();
        setInterval(this.runChecks.bind(this), 60000);
        //telegramService.sendTelegram(`foo        <anon>        bar`)        
    }
    setupLogging() {
        let configureProdAppenders = (appenders, defaultAppenders) => {
            appenders.telegramAppender = {
                type: '../../poker.engine/src/framework/telegram/telegramAppender'
            };
            defaultAppenders.push('telegramAppender');
        };
        (0, log4jsInit_1.configureLogging)(environment_1.default, configureProdAppenders, __dirname, true);
    }
    runChecks() {
        {
            let message = new PaymentProcessorMessage_1.PaymentProcessorMessage();
            message.processWithdrawls = {};
            this.processor.sendMessage(message);
        }
        try {
            if (!process.env.POKER_DISABLE_ETH) {
                this.ethBlockService.runChecks();
            }
        }
        catch (ex) {
            logger.error(ex);
        }
    }
}
exports.PaymentProcessorBootstrapper = PaymentProcessorBootstrapper;
(async () => {
    let app = new PaymentProcessorBootstrapper();
    await app.run();
})();
//# sourceMappingURL=PaymentProcessorBootstrapper.js.map