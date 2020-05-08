"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_security_decorator_1 = require("./api-security.decorator");
function ApiCookieAuth(name = 'cookie') {
    return api_security_decorator_1.ApiSecurity(name);
}
exports.ApiCookieAuth = ApiCookieAuth;
