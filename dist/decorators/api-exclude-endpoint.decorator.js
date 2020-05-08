"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
const helpers_1 = require("./helpers");
function ApiExcludeEndpoint(disable = true) {
    return helpers_1.createMethodDecorator(constants_1.DECORATORS.API_EXCLUDE_ENDPOINT, {
        disable
    });
}
exports.ApiExcludeEndpoint = ApiExcludeEndpoint;
