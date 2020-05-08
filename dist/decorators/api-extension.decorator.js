"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
const helpers_1 = require("./helpers");
function ApiExtension(extensionKey, extensionProperties) {
    if (!extensionKey.startsWith('x-')) {
        throw new Error('Extension key is not prefixed. Please ensure you prefix it with `x-`.');
    }
    const extensionObject = {
        [extensionKey]: typeof extensionProperties !== 'string'
            ? Object.assign({}, extensionProperties) : extensionProperties
    };
    return helpers_1.createMixedDecorator(constants_1.DECORATORS.API_EXTENSION, extensionObject);
}
exports.ApiExtension = ApiExtension;
