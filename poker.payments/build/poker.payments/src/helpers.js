"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminEndpointResult = exports.getAdminEndpoint = void 0;
function getAdminEndpoint(protocol = null) {
    if (!protocol) {
        protocol = 'http';
        if (process.env.POKER_BASE_ADDRESS && process.env.POKER_BASE_ADDRESS.includes('https')) {
            protocol = 'https';
        }
    }
    let domain = process.env.POKER_ADMIN_URL || 'localhost:8112';
    let endpoint = `${protocol}://${domain}`;
    return endpoint;
}
exports.getAdminEndpoint = getAdminEndpoint;
function getAdminEndpointResult(protocol = null) {
    let base64Pass = process.env.POKER_ADMIN_BASE64;
    return {
        endpoint: getAdminEndpoint(protocol),
        headers: {
            'Authorization': `Basic ${base64Pass}`
        }
    };
}
exports.getAdminEndpointResult = getAdminEndpointResult;
//# sourceMappingURL=helpers.js.map