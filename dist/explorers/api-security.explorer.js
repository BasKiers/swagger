"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
exports.exploreGlobalApiSecurityMetadata = (metatype) => {
    const security = Reflect.getMetadata(constants_1.DECORATORS.API_SECURITY, metatype);
    return security ? { security } : undefined;
};
exports.exploreApiSecurityMetadata = (instance, prototype, method) => {
    return Reflect.getMetadata(constants_1.DECORATORS.API_SECURITY, method);
};
