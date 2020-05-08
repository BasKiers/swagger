"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const constants_1 = require("../services/constants");
function isBuiltInType(type) {
    return lodash_1.isFunction(type) && constants_1.BUILT_IN_TYPES.some(item => item === type);
}
exports.isBuiltInType = isBuiltInType;
