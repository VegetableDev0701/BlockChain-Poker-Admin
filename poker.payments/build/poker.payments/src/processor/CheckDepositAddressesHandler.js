"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckDepositAddressesHandler = void 0;
const PaymentProcessorMessage_1 = require("./PaymentProcessorMessage");
const DepositAddressService_1 = require("../../../poker.engine/src/services/DepositAddressService");
const helpers_1 = require("../helpers");
const log4js_1 = require("log4js");
const AddressInfo_1 = require("../model/AddressInfo");
var logger = (0, log4js_1.getLogger)();
class CheckDepositAddressesHandler {
    constructor(dataRepository, http, accountService) {
        this.dataRepository = dataRepository;
        this.http = http;
        this.accountService = accountService;
        this.typeName = 'checkDepositAddresses';
        this.connectionConfig = (0, helpers_1.getAdminEndpointResult)();
        this.httpOptions = {
            headers: this.connectionConfig.headers,
            json: true,
            timeout: 5000
        };
    }
    async run(message) {
        let result = new PaymentProcessorMessage_1.PaymentProcessorResult();
        let lastAddressInfo = await this.dataRepository.getLastAddressInfo();
        let endpoint = this.connectionConfig.endpoint + '/api/addressInfo';
        if (lastAddressInfo) {
            endpoint += `?id=${lastAddressInfo._id.toString()}`;
        }
        let infos = await this.http.get(endpoint, this.httpOptions)
            .catch((r => {
            logger.info(`checkDepositAddresses failed: ${r}`);
        }));
        if (infos) {
            for (let info of infos) {
                try {
                    await this.importAddressInfo(info);
                }
                catch (error) {
                    logger.error(error);
                }
            }
        }
        return Promise.resolve(result);
    }
    async getUserDepositIndex(guid) {
        let endpoint = this.connectionConfig.endpoint + `/api/user?guid=${guid}`;
        let user = await this.http.get(endpoint, this.httpOptions); //is UserDetailView
        return user.depositIndex;
    }
    async importAddressInfo(info) {
        let existingAddressInfo = await this.dataRepository.getAddressInfoById(info._id);
        if (!existingAddressInfo) {
            let addressInfo = new AddressInfo_1.AddressInfo();
            addressInfo._id = info._id;
            addressInfo.userGuid = info.userGuid;
            addressInfo.screenName = info.screenName;
            addressInfo.currency = info.currency;
            let depositIndex = await this.getUserDepositIndex(info.userGuid);
            let currencyConfig = await this.dataRepository.getCurrencyConfig(info.currency);
            let address = await new DepositAddressService_1.DepositAddressService().getAddress(info.currency, currencyConfig.xpub, depositIndex);
            if (address === info.address) {
                addressInfo.address = address;
                addressInfo.index = depositIndex;
                await this.dataRepository.saveAddress(addressInfo);
                await this.accountService.monitorAddress(addressInfo);
            }
            else {
                logger.warn(`addresses do not match! received ${info} and using xpub:${currencyConfig.xpub} and ${depositIndex} calculated address=${address}`);
            }
        }
    }
}
exports.CheckDepositAddressesHandler = CheckDepositAddressesHandler;
//# sourceMappingURL=CheckDepositAddressesHandler.js.map