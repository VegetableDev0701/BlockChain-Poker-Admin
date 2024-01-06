"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramService = void 0;
const http = require("request-promise-native");
const log4js_1 = require("log4js");
const shared_helpers_1 = require("../../shared-helpers");
var logger = (0, log4js_1.getLogger)();
class TelegramService {
    async sendTelegram(text, chatId) {
        //how to get the chat id
        //https://stackoverflow.com/questions/33858927/how-to-obtain-the-chat-id-of-a-private-telegram-channel
        //https://api.telegram.org/bot**YourBOTToken**/getUpdates
        chatId = chatId || process.env.POKER_TELEGRAM_ADMIN_CHANNEL;
        let body = {
            "chat_id": chatId,
            "text": text,
            "disable_web_page_preview": true,
            "parse_mode": "HTML"
        };
        let token = process.env.POKER_TELEGRAM_ADMIN_BOT_TOKEN; //get the BOT TOKEN from bot father
        let url = `https://api.telegram.org/bot${token}/sendMessage`;
        let sent = true;
        await http.post({ uri: url, body: body, json: true })
            .catch((e) => {
            console.error(e);
            (0, shared_helpers_1.logToFile)('application.log', `TelegramService! ${e}`);
            sent = false;
        });
        return sent;
    }
}
exports.TelegramService = TelegramService;
//# sourceMappingURL=telegram.service.js.map