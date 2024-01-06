"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrencyConfigController = void 0;
const express_1 = require("express");
const currency_config_1 = require("../model/currency-config");
class CurrencyConfigController {
    constructor(dataRepository, sendCurrencyConfigHandler, accountService) {
        this.dataRepository = dataRepository;
        this.sendCurrencyConfigHandler = sendCurrencyConfigHandler;
        this.accountService = accountService;
        this.router = (0, express_1.Router)();
        this.setupRoutes();
    }
    adjustConfig(config) {
        if (config.masterAccount != null) {
            config.masterAccountPublic = config.masterAccount.public;
        }
    }
    setupRoutes() {
        this.router.get('/', async (req, res) => {
            let configs = await this.dataRepository.getCurrencyConfigs();
            for (let config of configs) {
                this.adjustConfig(config);
            }
            res.send(configs);
        });
        this.router.post('/', async (req, res) => {
            let config = req.body;
            config.name = config.name.toLowerCase();
            config.requiredNumberOfConfirmations = parseInt(config.requiredNumberOfConfirmations);
            if (req.body._id) {
                let configs = await this.dataRepository.getCurrencyConfigs();
                let existingConfig = configs.find(n => n.name == req.body.name);
                Object.assign(existingConfig, req.body);
                config = existingConfig;
            }
            if (config.masterAccountPublic) {
                if (config.masterAccount != null) {
                    if (!config.masterAccount.private) {
                        config.masterAccount.public = config.masterAccountPublic;
                    }
                }
                else {
                    config.masterAccount = new currency_config_1.AddressSmall();
                    config.masterAccount.public = config.masterAccountPublic;
                }
                delete config.masterAccountPublic;
            }
            await this.dataRepository.saveCurrencyConfig(config);
            config = await this.dataRepository.getCurrencyConfig(config.name);
            this.adjustConfig(config);
            res.send(config);
            this.accountService.loadCurrencyConfigs();
            this.sendCurrencyConfigHandler.run();
        });
    }
}
exports.CurrencyConfigController = CurrencyConfigController;
//# sourceMappingURL=currency-config.controller.js.map