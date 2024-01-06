"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoteAuthController = void 0;
const express_1 = require("express");
const log4js_1 = require("log4js");
const helpers_1 = require("../helpers");
const logger = (0, log4js_1.getLogger)();
class RemoteAuthController {
    constructor(dataRepository, paymentProcessor) {
        this.dataRepository = dataRepository;
        this.paymentProcessor = paymentProcessor;
        this.router = (0, express_1.Router)();
        this.setupRoutes();
    }
    setupRoutes() {
        this.router.get('/', async (req, res) => {
            let result = {
                url: (0, helpers_1.getAdminEndpoint)(),
                base64Pass: process.env.POKER_ADMIN_BASE64
            };
            res.send(result);
        });
    }
}
exports.RemoteAuthController = RemoteAuthController;
//# sourceMappingURL=RemoteAuthController.js.map