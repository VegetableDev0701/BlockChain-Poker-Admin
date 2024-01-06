"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebServer = void 0;
const express_1 = __importDefault(require("express"));
var cors = require('cors');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator'); // https://npmjs.org/package/express-validator
const deposit_addresses_controller_1 = require("./deposit-addresses.controller");
const SocketConnection_1 = require("./SocketConnection");
const log4js_1 = require("log4js");
const dash_tx_controller_1 = require("./dash-tx.controller");
const currency_config_controller_1 = require("./currency-config.controller");
const SendCurrencyConfigHandler_1 = require("./handlers/SendCurrencyConfigHandler");
const GetPaymentsRequestHandler_1 = require("./handlers/GetPaymentsRequestHandler");
const payments_controller_1 = require("./payments.controller");
const DashCoreBlockService_1 = require("../services/DashCoreBlockService");
const RemoteAuthController_1 = require("./RemoteAuthController");
const logger = (0, log4js_1.getLogger)();
class WebServer {
    constructor(dataRepository, processor, accountService, blockCypherPaymentEventHandler) {
        this.dataRepository = dataRepository;
        this.processor = processor;
        this.accountService = accountService;
        this.blockCypherPaymentEventHandler = blockCypherPaymentEventHandler;
        let getPaymentsRequestHandler = new GetPaymentsRequestHandler_1.GetPaymentsRequestHandler(dataRepository, null);
        this.connectionToGameServer = new SocketConnection_1.SocketConnection(processor, this.onConnectionToGameServerOpened.bind(this), blockCypherPaymentEventHandler, getPaymentsRequestHandler);
        getPaymentsRequestHandler.connectionToGameServer = this.connectionToGameServer;
        this.sendCurrencyConfigHandler = new SendCurrencyConfigHandler_1.SendCurrencyConfigHandler(dataRepository, this.connectionToGameServer);
    }
    init() {
        const app = (0, express_1.default)();
        app.use(cors({ origin: '*' }));
        app.use(bodyParser.json());
        app.use(expressValidator()); // Form validation - This line must be immediately after bodyParser
        const port = 8113;
        app.use('/deposit-addresses', new deposit_addresses_controller_1.DepositAddressesController(this.dataRepository).router);
        app.use('/dashd-tx-callback', new dash_tx_controller_1.DashTxController(this.dataRepository, this.processor, new DashCoreBlockService_1.DashCoreBlockService(this.dataRepository)).router);
        app.use('/currency-config', new currency_config_controller_1.CurrencyConfigController(this.dataRepository, this.sendCurrencyConfigHandler, this.accountService).router);
        app.use('/payments', new payments_controller_1.PaymentsController(this.dataRepository, this.processor).router);
        app.use('/remoteAuth', new RemoteAuthController_1.RemoteAuthController(this.dataRepository, this.processor).router);
        app.listen(port, () => {
            logger.info(`Payment Server listening on http://0.0.0.0:${port}/`);
        });
        this.connectionToGameServer.init();
    }
    onConnectionToGameServerOpened() {
        this.sendCurrencyConfigHandler.run();
        this.processor.sendCheckWithdrawls();
        this.processor.sendCheckDepositAddresses();
    }
}
exports.WebServer = WebServer;
//# sourceMappingURL=web-server.js.map