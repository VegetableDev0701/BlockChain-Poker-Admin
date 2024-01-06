"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketConnection = void 0;
const WebSocket = require("ws");
const log4js_1 = require("log4js");
const ping_1 = require("../../../poker.engine/src/admin/model/incoming/ping");
const pong_1 = require("../../../poker.engine/src/admin/model/outgoing/pong");
const PaymentProcessorMessage_1 = require("../processor/PaymentProcessorMessage");
const CheckPaymentsTrigger_1 = require("../../../poker.engine/src/admin/model/outgoing/CheckPaymentsTrigger");
const DepositAddressTrigger_1 = require("../../../poker.engine/src/admin/model/outgoing/DepositAddressTrigger");
const BlockCypherPaymentEvent_1 = require("../../../poker.engine/src/admin/model/outgoing/BlockCypherPaymentEvent");
const GetPaymentsRequest_1 = require("../../../poker.engine/src/admin/model/outgoing/GetPaymentsRequest");
const logger = (0, log4js_1.getLogger)();
const helpers_1 = require("../helpers");
const shared_helpers_1 = require("../../../poker.engine/src/shared-helpers");
class SocketConnection {
    constructor(processor, onOpen, blockCypherPaymentEventHandler, getPaymentsRequestHandler) {
        this.processor = processor;
        this.onOpen = onOpen;
        this.blockCypherPaymentEventHandler = blockCypherPaymentEventHandler;
        this.getPaymentsRequestHandler = getPaymentsRequestHandler;
    }
    init() {
        this.connect();
    }
    connect() {
        this.gotPong = true;
        let protocol = 'ws';
        if (process.env.POKER_BASE_ADDRESS && process.env.POKER_BASE_ADDRESS.includes('https')) {
            protocol = 'wss';
        }
        let connectionConfig = (0, helpers_1.getAdminEndpointResult)(protocol);
        let endpoint = connectionConfig.endpoint + '/api/ws';
        logger.info(`endpoint ${endpoint}`);
        this.socket = new WebSocket(endpoint, {
            headers: connectionConfig.headers
        });
        this.socket.on('open', async () => {
            this.startPingTimer();
            this.onOpen();
        });
        this.socket.on('message', (m) => {
            (0, shared_helpers_1.logToFile)('incoming.log', m);
            let message;
            try {
                let message = JSON.parse(m);
                logger.info(`payment processor received: ${message.type}`);
                this.handleMessage(message.type, message.data);
            }
            catch (e) {
                logger.error(e);
            }
        });
        this.socket.on('close', () => { this.onClose(); });
        this.socket.on('error', (e) => {
            logger.info(`SocketConnection: error ${e}`);
        });
    }
    send(message) {
        if (this.socket != null && this.socket.readyState == WebSocket.OPEN) {
            let data = JSON.stringify({ type: message.constructor.name, data: message });
            (0, shared_helpers_1.logToFile)('outgoing.log', data);
            this.socket.send(data);
        }
    }
    handleMessage(type, message) {
        if (type === pong_1.Pong.name) {
            this.gotPong = true;
        }
        else if (type === DepositAddressTrigger_1.DepositAddressTrigger.name) {
            let ppMessage = new PaymentProcessorMessage_1.PaymentProcessorMessage();
            ppMessage.checkDepositAddresses = message;
            this.processor.sendMessage(ppMessage);
        }
        else if (type === CheckPaymentsTrigger_1.CheckPaymentsTrigger.name) {
            this.processor.sendCheckWithdrawls();
        }
        else if (type === BlockCypherPaymentEvent_1.BlockCypherPaymentEvent.name) {
            this.blockCypherPaymentEventHandler.run(message);
        }
        else if (type === GetPaymentsRequest_1.GetPaymentsRequest.name) {
            this.getPaymentsRequestHandler.run(message);
        }
    }
    onClose() {
        logger.info("SocketConnection: close");
        clearInterval(this.timer);
        this.socket = undefined;
        this.timer = setTimeout(() => {
            logger.info('reconnecting...');
            this.connect();
        }, 20000);
    }
    startPingTimer() {
        this.timer = setInterval(() => {
            if (this.socket) {
                if (!this.gotPong) {
                    logger.info(`terminating socket did not receive pong`);
                    this.socket.terminate();
                }
                else {
                    this.gotPong = false;
                    this.send(new ping_1.Ping());
                }
            }
        }, 30000);
    }
}
exports.SocketConnection = SocketConnection;
//# sourceMappingURL=SocketConnection.js.map