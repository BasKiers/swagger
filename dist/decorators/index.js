"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./api-basic.decorator"));
__export(require("./api-bearer.decorator"));
__export(require("./api-body.decorator"));
__export(require("./api-consumes.decorator"));
__export(require("./api-cookie.decorator"));
__export(require("./api-exclude-endpoint.decorator"));
__export(require("./api-extra-models.decorator"));
__export(require("./api-header.decorator"));
__export(require("./api-hide-property.decorator"));
__export(require("./api-oauth2.decorator"));
__export(require("./api-operation.decorator"));
__export(require("./api-param.decorator"));
__export(require("./api-produces.decorator"));
var api_property_decorator_1 = require("./api-property.decorator");
exports.ApiProperty = api_property_decorator_1.ApiProperty;
exports.ApiPropertyOptional = api_property_decorator_1.ApiPropertyOptional;
exports.ApiResponseProperty = api_property_decorator_1.ApiResponseProperty;
__export(require("./api-query.decorator"));
__export(require("./api-response.decorator"));
__export(require("./api-security.decorator"));
__export(require("./api-use-tags.decorator"));
__export(require("./api-extension.decorator"));
