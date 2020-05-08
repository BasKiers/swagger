"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_security_decorator_1 = require("./api-security.decorator");
function ApiOAuth2(scopes, name = 'oauth2') {
    return api_security_decorator_1.ApiSecurity(name, scopes);
}
exports.ApiOAuth2 = ApiOAuth2;
