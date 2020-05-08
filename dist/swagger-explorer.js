"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const constants_1 = require("@nestjs/common/constants");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const metadata_scanner_1 = require("@nestjs/core/metadata-scanner");
const lodash_1 = require("lodash");
const pathToRegexp = require("path-to-regexp");
const constants_2 = require("./constants");
const api_exclude_endpoint_explorer_1 = require("./explorers/api-exclude-endpoint.explorer");
const api_extra_models_explorer_1 = require("./explorers/api-extra-models.explorer");
const api_headers_explorer_1 = require("./explorers/api-headers.explorer");
const api_operation_explorer_1 = require("./explorers/api-operation.explorer");
const api_parameters_explorer_1 = require("./explorers/api-parameters.explorer");
const api_response_explorer_1 = require("./explorers/api-response.explorer");
const api_security_explorer_1 = require("./explorers/api-security.explorer");
const api_use_tags_explorer_1 = require("./explorers/api-use-tags.explorer");
const mimetype_content_wrapper_1 = require("./services/mimetype-content-wrapper");
const is_body_parameter_util_1 = require("./utils/is-body-parameter.util");
const merge_and_uniq_util_1 = require("./utils/merge-and-uniq.util");
class SwaggerExplorer {
    constructor(schemaObjectFactory) {
        this.schemaObjectFactory = schemaObjectFactory;
        this.mimetypeContentWrapper = new mimetype_content_wrapper_1.MimetypeContentWrapper();
        this.metadataScanner = new metadata_scanner_1.MetadataScanner();
        this.schemas = [];
        this.schemaRefsStack = [];
    }
    exploreController(wrapper, modulePath, globalPrefix) {
        const { instance, metatype } = wrapper;
        const prototype = Object.getPrototypeOf(instance);
        const documentResolvers = {
            root: [
                this.exploreRoutePathAndMethod,
                api_operation_explorer_1.exploreApiOperationMetadata,
                api_parameters_explorer_1.exploreApiParametersMetadata.bind(null, this.schemas, this.schemaRefsStack)
            ],
            security: [api_security_explorer_1.exploreApiSecurityMetadata],
            tags: [api_use_tags_explorer_1.exploreApiTagsMetadata],
            responses: [api_response_explorer_1.exploreApiResponseMetadata.bind(null, this.schemas)]
        };
        return this.generateDenormalizedDocument(metatype, prototype, instance, documentResolvers, modulePath, globalPrefix);
    }
    getSchemas() {
        return this.schemas;
    }
    generateDenormalizedDocument(metatype, prototype, instance, documentResolvers, modulePath, globalPrefix) {
        let path = this.validateRoutePath(this.reflectControllerPath(metatype));
        if (modulePath) {
            path = this.validateRoutePath(modulePath + path);
        }
        if (globalPrefix) {
            path = shared_utils_1.validatePath(globalPrefix) + path;
        }
        const self = this;
        const globalMetadata = this.exploreGlobalMetadata(metatype);
        const ctrlExtraModels = api_extra_models_explorer_1.exploreGlobalApiExtraModelsMetadata(metatype);
        this.registerExtraModels(ctrlExtraModels);
        const denormalizedPaths = this.metadataScanner.scanFromPrototype(instance, prototype, name => {
            const targetCallback = prototype[name];
            const excludeEndpoint = api_exclude_endpoint_explorer_1.exploreApiExcludeEndpointMetadata(instance, prototype, targetCallback);
            if (excludeEndpoint && excludeEndpoint.disable) {
                return;
            }
            const ctrlExtraModels = api_extra_models_explorer_1.exploreApiExtraModelsMetadata(instance, prototype, targetCallback);
            this.registerExtraModels(ctrlExtraModels);
            const methodMetadata = lodash_1.mapValues(documentResolvers, (explorers) => explorers.reduce((metadata, fn) => {
                const exploredMetadata = fn.call(self, instance, prototype, targetCallback, path);
                if (!exploredMetadata) {
                    return metadata;
                }
                if (!lodash_1.isArray(exploredMetadata)) {
                    return Object.assign(Object.assign({}, metadata), exploredMetadata);
                }
                return lodash_1.isArray(metadata)
                    ? [...metadata, ...exploredMetadata]
                    : exploredMetadata;
            }, {}));
            const mergedMethodMetadata = this.mergeMetadata(globalMetadata, lodash_1.omitBy(methodMetadata, lodash_1.isEmpty));
            return this.migrateOperationSchema(Object.assign(Object.assign({ responses: {} }, globalMetadata), mergedMethodMetadata), prototype, targetCallback);
        });
        return denormalizedPaths;
    }
    exploreGlobalMetadata(metatype) {
        const globalExplorers = [
            api_use_tags_explorer_1.exploreGlobalApiTagsMetadata,
            api_security_explorer_1.exploreGlobalApiSecurityMetadata,
            api_response_explorer_1.exploreGlobalApiResponseMetadata.bind(null, this.schemas),
            api_headers_explorer_1.exploreGlobalApiHeaderMetadata
        ];
        const globalMetadata = globalExplorers
            .map(explorer => explorer.call(explorer, metatype))
            .filter(val => !shared_utils_1.isUndefined(val))
            .reduce((curr, next) => (Object.assign(Object.assign({}, curr), next)), {});
        return globalMetadata;
    }
    exploreRoutePathAndMethod(instance, prototype, method, globalPath) {
        const routePath = Reflect.getMetadata(constants_1.PATH_METADATA, method);
        if (shared_utils_1.isUndefined(routePath)) {
            return undefined;
        }
        const requestMethod = Reflect.getMetadata(constants_1.METHOD_METADATA, method);
        const fullPath = globalPath + this.validateRoutePath(routePath);
        const apiExtension = Reflect.getMetadata(constants_2.DECORATORS.API_EXTENSION, method);
        return Object.assign({ method: common_1.RequestMethod[requestMethod].toLowerCase(), path: fullPath === '' ? '/' : fullPath, operationId: this.getOperationId(instance, method) }, apiExtension);
    }
    getOperationId(instance, method) {
        if (instance.constructor) {
            return `${instance.constructor.name}_${method.name}`;
        }
        return method.name;
    }
    reflectControllerPath(metatype) {
        return Reflect.getMetadata(constants_1.PATH_METADATA, metatype);
    }
    validateRoutePath(path) {
        if (shared_utils_1.isUndefined(path)) {
            return '';
        }
        if (Array.isArray(path)) {
            path = lodash_1.head(path);
        }
        let pathWithParams = '';
        for (const item of pathToRegexp.parse(path)) {
            pathWithParams += shared_utils_1.isString(item) ? item : `${item.prefix}{${item.name}}`;
        }
        return pathWithParams === '/' ? '' : shared_utils_1.validatePath(pathWithParams);
    }
    mergeMetadata(globalMetadata, methodMetadata) {
        if (methodMetadata.root && !methodMetadata.root.parameters) {
            methodMetadata.root.parameters = [];
        }
        return lodash_1.mapValues(methodMetadata, (value, key) => {
            if (!globalMetadata[key]) {
                return value;
            }
            const globalValue = globalMetadata[key];
            if (globalMetadata.depth) {
                return this.deepMergeMetadata(globalValue, value, globalMetadata.depth);
            }
            return this.mergeValues(globalValue, value);
        });
    }
    deepMergeMetadata(globalValue, methodValue, maxDepth, currentDepthLevel = 0) {
        if (currentDepthLevel === maxDepth) {
            return this.mergeValues(globalValue, methodValue);
        }
        return lodash_1.mapValues(methodValue, (value, key) => {
            if (key in globalValue) {
                return this.deepMergeMetadata(globalValue[key], methodValue[key], maxDepth, currentDepthLevel + 1);
            }
            return value;
        });
    }
    mergeValues(globalValue, methodValue) {
        if (!lodash_1.isArray(globalValue)) {
            return Object.assign(Object.assign({}, globalValue), methodValue);
        }
        return [...globalValue, ...methodValue];
    }
    migrateOperationSchema(document, prototype, method) {
        const parametersObject = lodash_1.get(document, 'root.parameters');
        const requestBodyIndex = (parametersObject || []).findIndex(is_body_parameter_util_1.isBodyParameter);
        if (requestBodyIndex < 0) {
            return document;
        }
        const requestBody = parametersObject[requestBodyIndex];
        parametersObject.splice(requestBodyIndex, 1);
        const classConsumes = Reflect.getMetadata(constants_2.DECORATORS.API_CONSUMES, prototype);
        const methodConsumes = Reflect.getMetadata(constants_2.DECORATORS.API_CONSUMES, method);
        let consumes = merge_and_uniq_util_1.mergeAndUniq(classConsumes, methodConsumes);
        consumes = lodash_1.isEmpty(consumes) ? ['application/json'] : consumes;
        const keysToRemove = ['schema', 'in', 'name'];
        document.root.requestBody = Object.assign(Object.assign({}, lodash_1.omit(requestBody, keysToRemove)), this.mimetypeContentWrapper.wrap(consumes, lodash_1.pick(requestBody, 'schema')));
        return document;
    }
    registerExtraModels(extraModels) {
        extraModels.forEach(item => this.schemaObjectFactory.exploreModelSchema(item, this.schemas));
    }
}
exports.SwaggerExplorer = SwaggerExplorer;
