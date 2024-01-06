"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepositAddressesController = void 0;
const express_1 = require("express");
class DepositAddressesController {
    constructor(dataRepository) {
        this.dataRepository = dataRepository;
        this.router = (0, express_1.Router)();
        this.setupRoutes();
    }
    setupRoutes() {
        this.router.get('/', async (req, res) => {
            let currenyConfig = await this.dataRepository.getCurrencyConfig(req.query.currency);
            let addresses = await this.dataRepository.getAddressesByCurrency(req.query.currency);
            res.send({ addresses: addresses, xpub: currenyConfig.xpub });
        });
    }
}
exports.DepositAddressesController = DepositAddressesController;
//# sourceMappingURL=deposit-addresses.controller.js.map