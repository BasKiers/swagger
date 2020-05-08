"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const ts = require("typescript");
const decorators_1 = require("../../decorators");
const plugin_constants_1 = require("../plugin-constants");
const ast_utils_1 = require("../utils/ast-utils");
const plugin_utils_1 = require("../utils/plugin-utils");
const abstract_visitor_1 = require("./abstract.visitor");
const metadataHostMap = new Map();
class ModelClassVisitor extends abstract_visitor_1.AbstractFileVisitor {
    visit(sourceFile, ctx, program, options) {
        const typeChecker = program.getTypeChecker();
        sourceFile = this.updateImports(sourceFile);
        const visitNode = (node) => {
            if (ts.isClassDeclaration(node)) {
                node = ts.visitEachChild(node, visitNode, ctx);
                return this.addMetadataFactory(node);
            }
            else if (ts.isPropertyDeclaration(node)) {
                const decorators = node.decorators;
                const hidePropertyDecorator = plugin_utils_1.getDecoratorOrUndefinedByNames([decorators_1.ApiHideProperty.name], decorators);
                if (hidePropertyDecorator) {
                    return node;
                }
                const isPropertyStatic = (node.modifiers || []).some(modifier => modifier.kind === ts.SyntaxKind.StaticKeyword);
                if (isPropertyStatic) {
                    return node;
                }
                try {
                    this.inspectPropertyDeclaration(node, typeChecker, options, sourceFile.fileName, sourceFile);
                }
                catch (err) {
                    return node;
                }
                return node;
            }
            return ts.visitEachChild(node, visitNode, ctx);
        };
        return ts.visitNode(sourceFile, visitNode);
    }
    addMetadataFactory(node) {
        const classMetadata = this.getClassMetadata(node);
        if (!classMetadata) {
            return node;
        }
        const classMutableNode = ts.getMutableClone(node);
        const returnValue = ts.createObjectLiteral(Object.keys(classMetadata).map(key => ts.createPropertyAssignment(ts.createIdentifier(key), classMetadata[key])));
        const method = ts.createMethod(undefined, [ts.createModifier(ts.SyntaxKind.StaticKeyword)], undefined, ts.createIdentifier(plugin_constants_1.METADATA_FACTORY_NAME), undefined, undefined, [], undefined, ts.createBlock([ts.createReturn(returnValue)], true));
        classMutableNode.members = ts.createNodeArray([
            ...classMutableNode.members,
            method
        ]);
        return classMutableNode;
    }
    inspectPropertyDeclaration(compilerNode, typeChecker, options, hostFilename, sourceFile) {
        const objectLiteralExpr = this.createDecoratorObjectLiteralExpr(compilerNode, typeChecker, ts.createNodeArray(), options, hostFilename);
        this.addClassMetadata(compilerNode, objectLiteralExpr, sourceFile);
    }
    createDecoratorObjectLiteralExpr(node, typeChecker, existingProperties = ts.createNodeArray(), options = {}, hostFilename = '') {
        const isRequired = !node.questionToken;
        let properties = [
            ...existingProperties,
            !plugin_utils_1.hasPropertyKey('required', existingProperties) &&
                ts.createPropertyAssignment('required', ts.createLiteral(isRequired)),
            this.createTypePropertyAssignment(node, typeChecker, existingProperties, hostFilename),
            this.createDefaultPropertyAssignment(node, existingProperties),
            this.createEnumPropertyAssignment(node, typeChecker, existingProperties, hostFilename)
        ];
        if (options.classValidatorShim) {
            properties = properties.concat(this.createValidationPropertyAssignments(node));
        }
        const objectLiteral = ts.createObjectLiteral(lodash_1.compact(lodash_1.flatten(properties)));
        return objectLiteral;
    }
    createTypePropertyAssignment(node, typeChecker, existingProperties, hostFilename) {
        const key = 'type';
        if (plugin_utils_1.hasPropertyKey(key, existingProperties)) {
            return undefined;
        }
        const type = typeChecker.getTypeAtLocation(node);
        if (!type) {
            return undefined;
        }
        if (node.type && ts.isTypeLiteralNode(node.type)) {
            const propertyAssignments = Array.from(node.type.members || []).map(member => {
                const literalExpr = this.createDecoratorObjectLiteralExpr(member, typeChecker, existingProperties, {}, hostFilename);
                return ts.createPropertyAssignment(ts.createIdentifier(member.name.getText()), literalExpr);
            });
            return ts.createPropertyAssignment(key, ts.createArrowFunction(undefined, undefined, [], undefined, undefined, ts.createParen(ts.createObjectLiteral(propertyAssignments))));
        }
        let typeReference = plugin_utils_1.getTypeReferenceAsString(type, typeChecker);
        if (!typeReference) {
            return undefined;
        }
        typeReference = plugin_utils_1.replaceImportPath(typeReference, hostFilename);
        return ts.createPropertyAssignment(key, ts.createArrowFunction(undefined, undefined, [], undefined, undefined, ts.createIdentifier(typeReference)));
    }
    createEnumPropertyAssignment(node, typeChecker, existingProperties, hostFilename) {
        const key = 'enum';
        if (plugin_utils_1.hasPropertyKey(key, existingProperties)) {
            return undefined;
        }
        let type = typeChecker.getTypeAtLocation(node);
        if (!type) {
            return undefined;
        }
        if (plugin_utils_1.isAutoGeneratedTypeUnion(type)) {
            const types = type.types;
            type = types[types.length - 1];
        }
        const typeIsArrayTuple = plugin_utils_1.extractTypeArgumentIfArray(type);
        if (!typeIsArrayTuple) {
            return undefined;
        }
        let isArrayType = typeIsArrayTuple.isArray;
        type = typeIsArrayTuple.type;
        const isEnumMember = type.symbol && type.symbol.flags === ts.SymbolFlags.EnumMember;
        if (!ast_utils_1.isEnum(type) || isEnumMember) {
            if (!isEnumMember) {
                type = plugin_utils_1.isAutoGeneratedEnumUnion(type, typeChecker);
            }
            if (!type) {
                return undefined;
            }
            const typeIsArrayTuple = plugin_utils_1.extractTypeArgumentIfArray(type);
            if (!typeIsArrayTuple) {
                return undefined;
            }
            isArrayType = typeIsArrayTuple.isArray;
            type = typeIsArrayTuple.type;
        }
        const enumRef = plugin_utils_1.replaceImportPath(ast_utils_1.getText(type, typeChecker), hostFilename);
        const enumProperty = ts.createPropertyAssignment(key, ts.createIdentifier(enumRef));
        if (isArrayType) {
            const isArrayKey = 'isArray';
            const isArrayProperty = ts.createPropertyAssignment(isArrayKey, ts.createIdentifier('true'));
            return [enumProperty, isArrayProperty];
        }
        return enumProperty;
    }
    createDefaultPropertyAssignment(node, existingProperties) {
        const key = 'default';
        if (plugin_utils_1.hasPropertyKey(key, existingProperties)) {
            return undefined;
        }
        let initializer = node.initializer;
        if (!initializer) {
            return undefined;
        }
        if (ts.isAsExpression(initializer)) {
            initializer = initializer.expression;
        }
        return ts.createPropertyAssignment(key, ts.getMutableClone(initializer));
    }
    createValidationPropertyAssignments(node) {
        const assignments = [];
        const decorators = node.decorators;
        this.addPropertyByValidationDecorator('Min', 'minimum', decorators, assignments);
        this.addPropertyByValidationDecorator('Max', 'maximum', decorators, assignments);
        this.addPropertyByValidationDecorator('MinLength', 'minLength', decorators, assignments);
        this.addPropertyByValidationDecorator('MaxLength', 'maxLength', decorators, assignments);
        return assignments;
    }
    addPropertyByValidationDecorator(decoratorName, propertyKey, decorators, assignments) {
        const decoratorRef = plugin_utils_1.getDecoratorOrUndefinedByNames([decoratorName], decorators);
        if (!decoratorRef) {
            return;
        }
        const argument = lodash_1.head(ast_utils_1.getDecoratorArguments(decoratorRef));
        if (argument) {
            assignments.push(ts.createPropertyAssignment(propertyKey, ts.getMutableClone(argument)));
        }
    }
    addClassMetadata(node, objectLiteral, sourceFile) {
        const hostClass = node.parent;
        const className = hostClass.name && hostClass.name.getText();
        if (!className) {
            return;
        }
        const existingMetadata = metadataHostMap.get(className) || {};
        const propertyName = node.name && node.name.getText(sourceFile);
        if (!propertyName ||
            (node.name && node.name.kind === ts.SyntaxKind.ComputedPropertyName)) {
            return;
        }
        metadataHostMap.set(className, Object.assign(Object.assign({}, existingMetadata), { [propertyName]: objectLiteral }));
    }
    getClassMetadata(node) {
        if (!node.name) {
            return;
        }
        return metadataHostMap.get(node.name.getText());
    }
}
exports.ModelClassVisitor = ModelClassVisitor;
