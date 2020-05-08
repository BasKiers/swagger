import * as ts from 'typescript';
import { PluginOptions } from '../merge-options';
import { AbstractFileVisitor } from './abstract.visitor';
export declare class ModelClassVisitor extends AbstractFileVisitor {
  visit(
    sourceFile: ts.SourceFile,
    ctx: ts.TransformationContext,
    program: ts.Program,
    options: PluginOptions
  ): ts.SourceFile;
  addMetadataFactory(node: ts.ClassDeclaration): ts.ClassDeclaration;
  inspectPropertyDeclaration(
    compilerNode: ts.PropertyDeclaration,
    typeChecker: ts.TypeChecker,
    options: PluginOptions,
    hostFilename: string,
    sourceFile: ts.SourceFile
  ): void;
  createDecoratorObjectLiteralExpr(
    node: ts.PropertyDeclaration | ts.PropertySignature,
    typeChecker: ts.TypeChecker,
    existingProperties?: ts.NodeArray<ts.PropertyAssignment>,
    options?: PluginOptions,
    hostFilename?: string
  ): ts.ObjectLiteralExpression;
  createTypePropertyAssignment(
    node: ts.PropertyDeclaration | ts.PropertySignature,
    typeChecker: ts.TypeChecker,
    existingProperties: ts.NodeArray<ts.PropertyAssignment>,
    hostFilename: string
  ): ts.PropertyAssignment;
  createEnumPropertyAssignment(
    node: ts.PropertyDeclaration | ts.PropertySignature,
    typeChecker: ts.TypeChecker,
    existingProperties: ts.NodeArray<ts.PropertyAssignment>,
    hostFilename: string
  ): ts.PropertyAssignment | ts.PropertyAssignment[];
  createDefaultPropertyAssignment(
    node: ts.PropertyDeclaration | ts.PropertySignature,
    existingProperties: ts.NodeArray<ts.PropertyAssignment>
  ): ts.PropertyAssignment;
  createValidationPropertyAssignments(
    node: ts.PropertyDeclaration | ts.PropertySignature
  ): ts.PropertyAssignment[];
  addPropertyByValidationDecorator(
    decoratorName: string,
    propertyKey: string,
    decorators: ts.NodeArray<ts.Decorator>,
    assignments: ts.PropertyAssignment[]
  ): void;
  addClassMetadata(
    node: ts.PropertyDeclaration,
    objectLiteral: ts.ObjectLiteralExpression,
    sourceFile: ts.SourceFile
  ): void;
  getClassMetadata(node: ts.ClassDeclaration): any;
}
