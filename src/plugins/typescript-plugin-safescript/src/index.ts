#!/usr/bin/env node
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as process from "node:process";
import { parseArgs } from "node:util";

import ts from "typescript";
import { encode, decode } from "@vivaxy/vlq";

interface SourceMap {
    version: number,
    file: string,
    sourceRoot: string,
    sources: string[],
    names: string[],
    mappings: string
}

interface SourceMapContext {
    line: number,
    lineItems: number,
    character: number,
    fullStart: number,
    origPrevCharacter: number,
    compiledPrevCharacter: number,
    origPrevLine: number,
    generatedNodeIfs: [ts.Node, number][]
}

type FunctionLike = ts.FunctionDeclaration | ts.MethodDeclaration | ts.ConstructorDeclaration | ts.ArrowFunction;

function getTypeName(node: ts.Node, typeChecker: ts.TypeChecker) {
    const type = typeChecker.getTypeAtLocation(node);
    let typeName = typeChecker.typeToString(type, node);

    if (ts.isNumericLiteral(node)) {
        typeName = "number";
    } else if (ts.isStringLiteral(node)) {
        typeName = "string";
    } else if (ts.isBigIntLiteral(node)) {
        typeName = "bigint";
    } else if (!Number.isNaN(Number(typeName))) {
        typeName = "number";
    } else if(typeName[0] == "\"" &&
              typeName[typeName.length - 1] == "\"") {
        typeName = "string";
    }
    return typeName;
}

function isCompoundOperator(operator: string) {
    return ["+=", "-=", "*=", "/=", "%="].includes(operator);
}

function isUnaryOperator(operator: string) {
    return ["+", "-", "~"].includes(operator);
}

function isUpdateOperator(operator: string) {
    return ["++", "--"].includes(operator);
}

function isFunctionLike(node: ts.Node): node is FunctionLike {
    return ts.isFunctionDeclaration(node) ||
           ts.isMethodDeclaration(node) ||
           ts.isConstructorDeclaration(node) ||
           ts.isArrowFunction(node);
}

function operatorToString(kind: ts.SyntaxKind): string {
    switch (kind) {
        case ts.SyntaxKind.PlusPlusToken: return "++";
        case ts.SyntaxKind.MinusMinusToken: return "--";
        case ts.SyntaxKind.PlusToken: return "+";
        case ts.SyntaxKind.MinusToken: return "-";
        case ts.SyntaxKind.TildeToken: return "~";
    }
    return "";
}

function detectModuleType(rootNode: ts.SourceFile): ModuleType | undefined {
    const hasAnyImport = rootNode.statements.find((node) =>
        ts.isImportDeclaration(node) ||
        (ts.isVariableStatement(node) &&
            node.declarationList.declarations.some(
                (decl) =>
                    decl.initializer !== undefined &&
                    ts.isCallExpression(decl.initializer) &&
                    decl.initializer.expression.getText() === 'require'
            )
        )
    );

    if (hasAnyImport) {
        return ts.isImportDeclaration(hasAnyImport) ? 'es' : 'commonjs';
    }
}

function addSafeScriptImport(rootNode: ts.SourceFile, defaultModuleType: ModuleType): ts.SourceFile {
    const safeScriptEsModuleRuntime = "@redradist/module-runtime-safescript";
    const safeScriptModuleRuntimeVar = "module_runtime_safescript";
    const safeScriptCommonJsModuleRuntime = "@redradist/commonjs-runtime-safescript";

    // Check if an import from `safeScriptModuleRuntime` already exists
    const hasImport = rootNode.statements.some((node) =>
        ts.isImportDeclaration(node)
            ? node.moduleSpecifier.getText(rootNode) === `"${safeScriptEsModuleRuntime}"`
            : ts.isVariableStatement(node) &&
            node.declarationList.declarations.some(
                (decl) =>
                    decl.initializer !== undefined &&
                    ts.isCallExpression(decl.initializer) &&
                    decl.initializer.expression.getText() === 'require' &&
                    decl.initializer.arguments[0]?.getText() === `"${safeScriptCommonJsModuleRuntime}"`
            )
    );

    if (hasImport) {
        return rootNode;
    }

    // Create an import declaration with only the module name for side effects
    let importDeclaration: ts.Statement;
    if (defaultModuleType === 'es') {
        // Create an ES module side-effect import
        importDeclaration = ts.factory.createImportDeclaration(
            undefined,
            undefined,
            ts.factory.createStringLiteral(safeScriptEsModuleRuntime),
            undefined
        );
    } else {
        // Create a CommonJS module side-effect require
        importDeclaration = ts.factory.createVariableStatement(
            undefined,
            ts.factory.createVariableDeclarationList(
                [
                    ts.factory.createVariableDeclaration(
                        ts.factory.createIdentifier(safeScriptModuleRuntimeVar),
                        undefined,
                        undefined,
                        ts.factory.createCallExpression(
                            ts.factory.createIdentifier('require'),
                            undefined,
                            [
                                ts.factory.createStringLiteral(safeScriptCommonJsModuleRuntime),
                            ])
                    ),
                ],
                ts.NodeFlags.Const
            )
        );
    }


    // Add the new import at the beginning of the file
    const newStatements = ts.factory.createNodeArray([
        importDeclaration,
        ...rootNode.statements
    ]);

    return ts.factory.updateSourceFile(rootNode as ts.SourceFile, newStatements);
}

function getSafeBinaryExpression(operator: string,
                                 left: ts.Expression,
                                 right: ts.Expression,
                                 typeChecker: ts.TypeChecker,
                                 nodeFactory: ts.NodeFactory) {
    let safeOperatorName: string | null = null;
    switch (operator) {
        case "+":   safeOperatorName = 'SafeScript.add'; break;
        case "-":   safeOperatorName = 'SafeScript.sub'; break;
        case "*":   safeOperatorName = 'SafeScript.mul'; break;
        case "/":   safeOperatorName = 'SafeScript.div'; break;
        case "%":   safeOperatorName = 'SafeScript.mod'; break;
        case "**":  safeOperatorName = 'SafeScript.exp'; break;
        case "==":  safeOperatorName = 'SafeScript.eq'; break;
        case "!=":  safeOperatorName = 'SafeScript.ne'; break;
        case ">":   safeOperatorName = 'SafeScript.gt'; break;
        case ">=":  safeOperatorName = 'SafeScript.ge'; break;
        case "<":   safeOperatorName = 'SafeScript.lt'; break;
        case "<=":  safeOperatorName = 'SafeScript.le'; break;
        case "&":   safeOperatorName = 'SafeScript.and'; break;
        case "|":   safeOperatorName = 'SafeScript.or'; break;
        case "^":   safeOperatorName = 'SafeScript.xor'; break;
        case ">>":  safeOperatorName = 'SafeScript.rshfit'; break;
        case ">>>": safeOperatorName = 'SafeScript.arshift'; break;
        case "<<":  safeOperatorName = 'SafeScript.lshift'; break;
    }
    if (safeOperatorName) {
        const leftTypeName = getTypeName(left, typeChecker);
        const rightTypeName = getTypeName(right, typeChecker);

        if (leftTypeName === "string" && rightTypeName === "string") {
            return null;
        } else if (["boolean", "number", "bigint", "symbol"].includes(leftTypeName) &&
                   ["boolean", "number", "bigint", "symbol"].includes(rightTypeName)) {
            return null;
        } else {
            return nodeFactory.createCallExpression(
                nodeFactory.createIdentifier(safeOperatorName),
                [],
                [left, right]);
        }
    }
    return null;
}

function getSafeAssignmentExpression(operator: string,
                                     left: ts.Expression,
                                     right: ts.Expression,
                                     typeChecker: ts.TypeChecker,
                                     nodeFactory: ts.NodeFactory) {
    let safeOperatorName: string | null = null;
    switch (operator) {
        case "+=":   safeOperatorName = 'SafeScript.add'; break;
        case "-=":   safeOperatorName = 'SafeScript.sub'; break;
        case "*=":   safeOperatorName = 'SafeScript.mul'; break;
        case "/=":   safeOperatorName = 'SafeScript.div'; break;
        case "%=":   safeOperatorName = 'SafeScript.mod'; break;
    }
    if (safeOperatorName) {
        const leftTypeName = getTypeName(left, typeChecker);
        const rightTypeName = getTypeName(right, typeChecker);

        if (leftTypeName === "string" && rightTypeName === "string") {
            return null;
        } else if (["boolean", "number", "bigint", "symbol"].includes(leftTypeName) &&
                   ["boolean", "number", "bigint", "symbol"].includes(rightTypeName)) {
            return null;
        } else {
            return nodeFactory.createAssignment(
                left,
                nodeFactory.createCallExpression(
                    nodeFactory.createIdentifier(safeOperatorName),
                    [],
                    [left, right]));
        }
    }
    return null;
}

function getSafeUnaryExpression(operator: string,
                                node: ts.Expression,
                                typeChecker: ts.TypeChecker,
                                nodeFactory: ts.NodeFactory) {
    let safeOperatorName: string | null = null;
    switch (operator) {
        case "+":   safeOperatorName = 'SafeScript.plus'; break;
        case "-":   safeOperatorName = 'SafeScript.minus'; break;
        case "~":   safeOperatorName = 'SafeScript.bit_not'; break;
    }
    if (safeOperatorName) {
        const typeName = getTypeName(node, typeChecker);

        if (["boolean", "number", "bigint"].includes(typeName)) {
            return null;
        } else {
            return nodeFactory.createCallExpression(
                nodeFactory.createIdentifier(safeOperatorName),
                [],
                [node]);
        }
    }
    return null;
}

function getSafeUpdateExpression(operator: string,
                                 node: ts.Expression,
                                 prefix: boolean,
                                 typeChecker: ts.TypeChecker,
                                 nodeFactory: ts.NodeFactory) {
    let safeOperatorName: string | null = null;
    switch (operator) {
        case "++":   safeOperatorName = 'SafeScript.inc'; break;
        case "--":   safeOperatorName = 'SafeScript.dec'; break;
    }
    if (safeOperatorName) {
        const typeName = getTypeName(node, typeChecker);

        if (["boolean", "number", "bigint"].includes(typeName)) {
            return null;
        } else {
            if (prefix) {
                return nodeFactory.createParenthesizedExpression(
                    nodeFactory.createAssignment(
                        node,
                        nodeFactory.createCallExpression(nodeFactory.createIdentifier(safeOperatorName), [], [node]))
                );
            } else {
                return nodeFactory.createParenthesizedExpression(
                    nodeFactory.createComma(
                        nodeFactory.createAssignment(
                            node,
                            nodeFactory.createCallExpression(nodeFactory.createIdentifier(safeOperatorName), [], [node])),
                        nodeFactory.createCallExpression(nodeFactory.createIdentifier("SafeScript.suffix"), [], [])
                    ));
            }
        }
    }
    return null;
}

function getSafeCheckExpression(node: FunctionLike,
                                typeChecker: ts.TypeChecker,
                                nodeFactory: ts.NodeFactory) {
    const checks: ts.Statement[] = [];
    const selfChecks: [string, string][] = [];
    if (node.body && 'statements' in node.body) {
        let activeSelfCheck = true;
        node.body.statements.filter((value, index, array) => {
            if (activeSelfCheck && ts.isIfStatement(value)) {
                if (ts.isBinaryExpression(value.expression)) {
                    if (value.expression.operatorToken.getText() === "!==") {
                        if (ts.isTypeOfExpression(value.expression.left)) {
                            selfChecks.push([value.expression.left.getText(), value.expression.right.getText()]);
                        } else if (ts.isTypeOfExpression(value.expression.right)) {
                            selfChecks.push([value.expression.right.getText(), value.expression.left.getText()]);
                        }
                    }
                }
            } else {
                activeSelfCheck = false;
            }
        });
    }

    for (const param of node.parameters) {
        const typeName = getTypeName(param, typeChecker);
        if (['number', 'string', 'bigint', 'boolean', 'symbol'].includes(typeName)) {
            const typeCheck: [string, string] = [`typeof ${param.name.getText()}`, `"${typeName}"`];
            let isSelfCheck = false;
            for (const selfCheck of selfChecks) {
                if (selfCheck[0] === typeCheck[0] &&
                    selfCheck[1] === typeCheck[1]) {
                    isSelfCheck = true;
                    break;
                }
            }
            if (!isSelfCheck) {
                checks.push(nodeFactory.createIfStatement(
                    nodeFactory.createStrictInequality(
                        nodeFactory.createTypeOfExpression(
                            nodeFactory.createIdentifier(param.name.getText())
                        ),
                        nodeFactory.createStringLiteral(typeName)
                    ),
                    nodeFactory.createThrowStatement(
                        nodeFactory.createNewExpression(
                            nodeFactory.createIdentifier("TypeError"),
                            undefined,
                            [nodeFactory.createStringLiteral(
                                `${param.name.getText()} is not typeof '${typeName}'`
                            )]
                        )
                    )));
            }
        }
    }
    return checks;
}

class SafeScriptTransformer {
    private isUpdated: boolean;
    private typeChecker?: ts.TypeChecker;
    private errors: number = 0;

    constructor() {
        this.isUpdated = false;
        this.typeChecker = undefined;
    }

    public get hasErrors() {
        return this.errors > 0;
    }

    get updated() {
        return this.isUpdated;
    }

    async transform(srcFile: string, distFile: string, safeScriptModule: ModuleType) {
        this.isUpdated = false;
        this.typeChecker = undefined;

        const filename = srcFile;
        const typesSafeScript = getSafeScriptPath();
        const compileOptions: ts.CompilerOptions = {
            allowJs: true,
            types: [typesSafeScript]
        };
        const program = ts.createProgram([filename], compileOptions);
        let sourceFile = program.getSourceFile(filename);
        this.typeChecker = program.getTypeChecker();

        if (sourceFile) {
            const fileModuleType = detectModuleType(sourceFile);
            sourceFile = addSafeScriptImport(sourceFile, fileModuleType ? fileModuleType : safeScriptModule);
            const transformationResult = ts.transform(
                sourceFile, [this.safeScriptTransformFactory()], compileOptions
            );
            const transformedSourceFile = transformationResult.transformed[0];
            const printer = ts.createPrinter();
            const result = printer.printNode(
                ts.EmitHint.SourceFile,
                transformedSourceFile,
                sourceFile
            );
            const distFileDir = path.dirname(distFile);
            await fs.promises.mkdir(distFileDir, {
                recursive: true
            });
            await createFileAsync(distFile, result);
        }
    }

    async generateSourceMap(file: string, distFile: string) {
        const typesSafeScript = getSafeScriptPath();
        const compileOptions: ts.CompilerOptions = {
            allowJs: true,
            types: [typesSafeScript]
        };
        const relativePath = path.relative(path.dirname(distFile), file);
        const sourceMap: SourceMap = {
            version: 3,
            file: `${path.basename(distFile)}`,
            sourceRoot: "",
            sources: [relativePath],
            names: [],
            mappings: ""
        };

        const origProgram = ts.createProgram([file], compileOptions);
        const origSourceFile = origProgram.getSourceFile(file);

        const distProgram = ts.createProgram([distFile], compileOptions);
        const distSourceFile = distProgram.getSourceFile(distFile);

        if (origSourceFile && distSourceFile) {
            const genContext: SourceMapContext = {
                line: 0,
                lineItems: 0,
                character: 0,
                fullStart: 0,
                origPrevCharacter: 0,
                compiledPrevCharacter: 0,
                origPrevLine: 0,
                generatedNodeIfs: []
            };
            sourceMap.mappings = this.generateMappings(
                genContext, origSourceFile, origSourceFile, distSourceFile
            );
        }

        await createFileAsync(`${distFile}.map`, JSON.stringify(sourceMap));
        if (fileExtension(distFile) !== 'ts') {
            const data = await fs.promises.readFile(distFile, { encoding: 'utf8' });
            const newData = data + "\r\n" + `//# sourceMappingURL=${path.basename(distFile)}.map`;
            await fs.promises.writeFile(distFile, newData, { encoding: 'utf8' });
        }
    }

    getRealIndexMapping(sourceMap: SourceMap) {
        const mappings = [];

        const mappingsLines = sourceMap.mappings.split(';');
        for (const line of mappingsLines) {
            const nums = [];
            if (line.length > 0) {
                const encs = line.split(',');
                for (const enc of encs) {
                    const dec = decode(enc);
                    nums.push(dec);
                }
            }
            mappings.push(nums);
        }
        let prevLine = 0;
        let prevColumn = 0;
        for (const map of mappings) {
            for (const it of map) {
                prevLine += it[2];
                prevColumn += it[3];
                it[2] = prevLine;
                it[3] = prevColumn;
            }
        }
        return mappings;
    }

    mergeSourceMaps(oldSourceMap: SourceMap, newSourceMap: SourceMap): SourceMap {
        const mergedSourceMap: SourceMap = {
            version: 3,
            file: "",
            sourceRoot: "",
            sources: [],
            names: [],
            mappings: ""
        };
        mergedSourceMap.file = oldSourceMap.file;
        mergedSourceMap.sourceRoot = oldSourceMap.sourceRoot;
        mergedSourceMap.sources = oldSourceMap.sources;
        mergedSourceMap.names = newSourceMap.names;

        const oldMappings = this.getRealIndexMapping(oldSourceMap);
        const newMappings = this.getRealIndexMapping(newSourceMap);

        for (const newLine of newMappings) {
            const toRemove = [];
            for (const column of newLine) {
                const origLine = column[2];
                const origColumn = column[3];

                const oldMap = oldMappings[origLine];
                let mapColumn;
                for (const oldColumn of oldMap) {
                    if (oldColumn[3] <= origColumn) {
                        mapColumn = oldColumn;
                    }
                }
                if (!mapColumn) {
                    toRemove.push(column);
                } else {
                    column[2] = mapColumn[2];
                    column[3] = mapColumn[3];
                }
            }
            for (const remove of toRemove) {
                const idx = newLine.indexOf(remove);
                if (idx > -1) {
                    newLine.splice(idx, 1);
                }
            }
        }

        let newStrMapping = "";
        let prevLine = 0;
        let prevColumn = 0;
        let idx = 0;
        for (const line of newMappings) {
            if (line.length !== 0) {
                let colIdx = 0;
                for (const column of line) {
                    newStrMapping += encode([
                        column[0],
                        0,
                        column[2]-prevLine,
                        column[3]-prevColumn]);
                    prevLine = column[2];
                    prevColumn = column[3];
                    colIdx += 1;
                    if (colIdx < line.length) {
                        newStrMapping += ",";
                    }
                }
            }
            idx += 1;
            if (idx < newMappings.length) {
                newStrMapping += ";";
            }
        }

        mergedSourceMap.mappings = newStrMapping;

        return mergedSourceMap;
    }

    async compileTs(srcFile: string, distFile: string, src: string, dist: string, sourceMap: boolean) {
        const typesSafeScript = getSafeScriptPath();
        let compileOptions: ts.CompilerOptions;
        const configFileName = ts.findConfigFile(
            getCurrentRelativePath(),
            ts.sys.fileExists,
            "tsconfig.json"
        );
        if (configFileName) {
            const configFile = ts.readConfigFile(configFileName, ts.sys.readFile);
            compileOptions = ts.parseJsonConfigFileContent(
                configFile.config,
                ts.sys,
                getCurrentRelativePath()
            ).options;
            if (compileOptions.types) {
                compileOptions.types.push(typesSafeScript);
            } else {
                compileOptions.types = [typesSafeScript];
            }
        } else {
            compileOptions = {
                allowJs: true,
                types: [typesSafeScript]
            };
        }
        compileOptions.rootDir = src;
        compileOptions.outDir = dist;
        compileOptions.sourceMap = sourceMap;

        const origProgram = ts.createProgram([srcFile], compileOptions);
        let hasErrors = false;
        const diagnostics = ts.getPreEmitDiagnostics(origProgram);
        for (const diagnostic of diagnostics) {
            if (diagnostic.category === ts.DiagnosticCategory.Error) {
                this.errors += 1;
                hasErrors = true;
            }
            let prefix: string;
            let log: (message?: any, ...optionalParams: any[]) => void;
            let color: string;
            switch (diagnostic.category) {
                case ts.DiagnosticCategory.Warning: {
                    prefix = "warning";
                    log = console.warn;
                    color = "\x1b[33m";
                    break;
                }
                case ts.DiagnosticCategory.Error: {
                    prefix = "error";
                    log = console.error;
                    color = "\x1b[31m";
                    break;
                }
                case ts.DiagnosticCategory.Suggestion: {
                    prefix = "info";
                    log = console.info;
                    color = "\x1b[34m";
                    break;
                }
                case ts.DiagnosticCategory.Message: {
                    prefix = "msg";
                    log = console.log;
                    color = "\x1b[32m";
                    break;
                }
            }

            const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            if (diagnostic.file && diagnostic.start) {
                const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
                    diagnostic.start
                );
                console.log(`${diagnostic.file.fileName}:${line + 1}:${character + 1} - ${color}${prefix} \x1b[37mTS${diagnostic.code}: \x1b[30m${message}`);
            } else {
                log(`${prefix} TS${diagnostic.code}: ${message}`);
            }
        }
        if (hasErrors) {
            return;
        }

        compileOptions.rootDir = dist;
        const distProgram = ts.createProgram([distFile], compileOptions);
        distProgram.emit();
        const dist_js_file = distFile.replace(new RegExp('ts$'), 'js');
        const distFile_map = distFile + ".map";
        const dist_js_file_map = dist_js_file + ".map";

        const distFile_sourceMap = await fs.promises.readFile(distFile_map);
        const dist_sourceMap: SourceMap = JSON.parse(distFile_sourceMap.toString());

        const dist_js_file_sourceMap = await fs.promises.readFile(dist_js_file_map);
        const dist_js_sourceMap: SourceMap = JSON.parse(dist_js_file_sourceMap.toString());

        const newSourceMap = this.mergeSourceMaps(dist_sourceMap, dist_js_sourceMap);
        await createFileAsync(dist_js_file_map, JSON.stringify(newSourceMap));
    }

    findSimilarNode(genContext: SourceMapContext,
                    searchNode: ts.Node,
                    searchFile: ts.SourceFile,
                    similarNode: ts.Node,
                    similarFile: ts.SourceFile,
                    removeIfs: number = 0) {
        if (ts.isJSDocCommentContainingNode(similarNode)) {
            return undefined;
        }
        if (similarNode.getText(similarFile) === "") {
            return undefined;
        }
        if (searchNode.getText(searchFile) !== "" &&
            searchNode.kind === similarNode.kind &&
            searchNode.getStart(searchFile) >= genContext.fullStart) {
            return searchNode;
        }

        if (isFunctionLike(searchNode)) {
            for (const nodeIfs of genContext.generatedNodeIfs) {
                if (nodeIfs[0] === searchNode) {
                    removeIfs = nodeIfs[1];
                }
            }
        }

        const origChildren = searchNode.getChildren(searchFile);
        const filteredChildren = origChildren.filter(value => {
            if (removeIfs > 0 && ts.isIfStatement(value)) {
                removeIfs -= 1;
                return false;
            }
            return true;
        });
        for (const child of filteredChildren) {
            const foundChild: any = this.findSimilarNode(genContext, child, searchFile, similarNode, similarFile, removeIfs);
            if (foundChild) {
                return foundChild;
            }
        }
    }

    isSafeScriptOperator(token: string): boolean {
        return [ "+", "-", "*", "/", "%", "**", "==", "!=",
                 ">", ">=", "<", "<=", "&", "|", "^", ">>",
                 ">>>", "<<", "+=", "-=", "*=", "/=", "%=",
                 "+", "-", "~", "++", "--"].includes(token);
    }

    generateMappings(genContext: SourceMapContext, originNode: ts.Node, originFile: ts.SourceFile, compiledFile: ts.SourceFile): string {
        let result = "";

        if (originNode.getText(originFile) === "") {
            return result;
        }
        if (ts.isJSDocCommentContainingNode(originNode)) {
            return result;
        }

        const originChildren = originNode.getChildren(originFile);
        if (isFunctionLike(originNode) ||
            (originChildren.length === 0 &&
             !this.isSafeScriptOperator(originNode.getText(originFile)))) {
            const foundNode = this.findSimilarNode(genContext, compiledFile, compiledFile, originNode, originFile);
            if (foundNode) {
                const origPos = originFile.getLineAndCharacterOfPosition(originNode.getStart(originFile));
                const compiledPos = compiledFile.getLineAndCharacterOfPosition(foundNode.getStart(compiledFile));
                if (compiledPos.line > genContext.line) {
                    result += ";".repeat(compiledPos.line - genContext.line);
                    genContext.line = compiledPos.line;
                    genContext.lineItems = 0;
                    genContext.compiledPrevCharacter = 0;
                }
                if (genContext.lineItems > 0) {
                    result += ",";
                }
                result += encode([compiledPos.character-genContext.compiledPrevCharacter, 0, origPos.line-genContext.origPrevLine, origPos.character-genContext.origPrevCharacter]);
                genContext.compiledPrevCharacter = compiledPos.character;
                genContext.origPrevCharacter = origPos.character;
                genContext.origPrevLine = origPos.line;
                genContext.lineItems += 1;
                const foundNodeStart = foundNode.getStart(compiledFile);
                if (isFunctionLike(foundNode)) {
                    genContext.fullStart = foundNodeStart;
                } else {
                    genContext.fullStart = foundNodeStart+1;
                }

                if (isFunctionLike(originNode) &&
                    isFunctionLike(foundNode) &&
                    originNode.kind === foundNode.kind) {
                    let originIfs = 0;
                    if (originNode.body && 'statements' in originNode.body) {
                        for (const statement of originNode.body.statements) {
                            if (ts.isIfStatement(statement)) {
                                originIfs += 1;
                            }
                        }
                    }
                    if (foundNode.body && 'statements' in foundNode.body) {
                        let compiledIfs = 0;
                        for (const statement of foundNode.body.statements) {
                            if (ts.isIfStatement(statement)) {
                                compiledIfs += 1;
                            }
                        }
                        const reduceIfs = compiledIfs - originIfs;
                        if (reduceIfs > 0) {
                            genContext.generatedNodeIfs.push([foundNode, reduceIfs]);
                        }
                    }
                }
            }
        }
        if (originChildren.length > 0) {
            for (let i = 0; i < originChildren.length; ++i) {
                const originChild = originChildren[i];
                result += this.generateMappings(
                    genContext, originChild, originFile, compiledFile
                );
            }
        }

        return result;
    }

    private safeScriptTransformFactory() {
        const transformer = this;
        return (context: ts.TransformationContext) =>
               (rootNode: ts.Node) => {
            function visit(node: ts.Node): ts.Node {
                node = ts.visitEachChild(node, visit, context);

                if (!transformer.typeChecker) {
                    return node;
                }
                if (ts.isBinaryExpression(node)) {
                    if (isCompoundOperator(node.operatorToken.getText())) {
                        const safeAssignmentExpression = getSafeAssignmentExpression(
                            node.operatorToken.getText(),
                            node.left,
                            node.right,
                            transformer.typeChecker,
                            context.factory);

                        if (safeAssignmentExpression) {
                            transformer.isUpdated = true;
                            return safeAssignmentExpression;
                        }
                    } else {
                        const safeBinaryExpression = getSafeBinaryExpression(
                            node.operatorToken.getText(),
                            node.left,
                            node.right,
                            transformer.typeChecker,
                            context.factory);

                        if (safeBinaryExpression) {
                            transformer.isUpdated = true;
                            return safeBinaryExpression;
                        }
                    }
                } else if (ts.isPrefixUnaryExpression(node) ||
                           ts.isPostfixUnaryExpression(node)) {
                    const operator_string = operatorToString(node.operator);
                    if (isUnaryOperator(operator_string)) {
                        const safeUnaryExpression = getSafeUnaryExpression(
                            operator_string,
                            node.operand,
                            transformer.typeChecker,
                            context.factory);

                        if (safeUnaryExpression) {
                            transformer.isUpdated = true;
                            return safeUnaryExpression;
                        }
                    } else if (isUpdateOperator(operator_string)) {
                        const safeUpdateExpression = getSafeUpdateExpression(
                            operator_string,
                            node.operand,
                            ts.isPrefixUnaryExpression(node),
                            transformer.typeChecker,
                            context.factory);

                        if (safeUpdateExpression) {
                            transformer.isUpdated = true;
                            return safeUpdateExpression;
                        }
                    }
                } else if (isFunctionLike(node)) {
                    const checks: ts.Statement[] = getSafeCheckExpression(
                        node,
                        transformer.typeChecker,
                        context.factory);
                    if (node.body && checks.length > 0) {
                        if (!('statements' in node.body)) {
                            const expr = node.body;
                            // @ts-ignore
                            node.body = context.factory.createBlock(checks.concat(expr), true)
                        } else {
                            // @ts-ignore
                            node.body.statements = checks.concat(node.body.statements);
                        }
                    }
                }

                return node;
            }

            return ts.visitNode(rootNode, visit);
        };
    }
}

function createFileAsync(file_name: string, text: string): Promise<any> {
    return fs.promises.writeFile(file_name, text,  {
        encoding: 'utf8'
    });
}

type ModuleType = 'es' | 'commonjs';

type SafeScriptArguments = {
    src: string,
    dist: string,
    sourceMap: boolean,
    allowTs: boolean,
    allowAngular: boolean,
    module: ModuleType,
};

function getArguments(): SafeScriptArguments {
    const args = process.argv.slice(2);
    const options = {
        'src': {
            type: 'string',
            short: 's',
        },
        'dest': {
            type: 'string',
            short: 'd',
        },
        'src-map': {
            type: 'boolean',
            default: false,
        },
        'allow-ts': {
            type: 'boolean',
            default: true,
        },
        'allow-angular': {
            type: 'boolean',
            default: false,
        },
        'module': {
            type: 'string',
            default: 'es',
        },
    };
    // @ts-ignore
    const { values, positionals } = parseArgs({ args, options });

    let src_dir = values.src as string;
    let dist_dir = values.dest as string;
    console.assert(typeof values['src-map'] === 'boolean', "sourceMap must be a boolean");
    console.assert(typeof values['allow-ts'] === 'boolean', "allowTs must be a boolean");
    console.assert(typeof values['allow-angular'] === 'boolean', "allowAngular must be a boolean");

    const sourceMap = values['src-map'] as boolean;
    const allow_ts = values['allow-ts'] as boolean;
    const allow_angular = values['allow-angular'] as boolean;
    const safescript_module = values['module'] as string;
    console.assert(safescript_module in ['es', 'commonjs'], "module must be on of ['es', 'commonjs']");

    if (!dist_dir) {
        dist_dir = src_dir;
    }

    if (os.platform() == 'win32') {
        src_dir = src_dir.replace('\\', '/');
        dist_dir = dist_dir.replace('\\', '/');
    }

    src_dir = src_dir.replace(/^(\.\/)/,"");
    if (src_dir[src_dir.length-1] !== '/') {
        src_dir += '/';
    }
    dist_dir = dist_dir.replace(/^(\.\/)/,"");
    if (dist_dir[dist_dir.length-1] !== '/') {
        dist_dir += '/';
    }

    if (os.platform() == 'win32') {
        src_dir = src_dir.replace('/', '\\');
        dist_dir = dist_dir.replace('/', '\\');
    }

    return {
        src: path.resolve(src_dir),
        dist: path.resolve(dist_dir),
        sourceMap: sourceMap,
        allowTs: allow_ts,
        allowAngular: allow_angular,
        module: safescript_module as ModuleType,
    };
}

function fileExtension(file_name: string) {
    return file_name.split('.').pop();
}

async function getSourceFiles(src_dir: string): Promise<string[]> {
    const srcFiles: string[] = [];
    const files = await fs.promises.readdir(src_dir);
    for (const file of files) {
        const file_path = path.join(src_dir, file);
        const fileStats = await fs.promises.stat(file_path);
        if (fileStats.isFile()) {
            srcFiles.push(file_path);
        } else if (fileStats.isDirectory()) {
            const subFiles = await getSourceFiles(file_path);
            if (subFiles.length > 0) {
                for (const subfile of subFiles) {
                    srcFiles.push(subfile);
                }
            }
        }
    }
    return srcFiles;
}

function getCurrentRelativePath() {
    if (os.platform() == 'win32') {
        return ".\\";
    } else {
        return "./";
    }
}

function getSafeScriptPath() {
    if (os.platform() == 'win32') {
        return `${__dirname}\\safescript`;
    } else {
        return `${__dirname}/safescript`;
    }
}

async function main() {
    const args = getArguments();
    console.log(`args.src is ${args.src}`);
    console.log(`args.dist is ${args.dist}`);
    console.log(`args.sourceMap is ${args.sourceMap}`);
    console.log(`args.allow_ts is ${args.allowTs}`);
    console.log(`args.allow_angular is ${args.allowAngular}`);
    console.log(`args.module is ${args.module}`);
    const srcFiles = await getSourceFiles(args.src);
    const filterPredicate = (file_name: string) => {
        const ext = fileExtension(file_name);
        if (args.allowTs) {
            return ext === "js" || ext === "jsx" || ext === "ts" || ext === "tsx";
        }
        return ext === "js" || ext === "jsx";
    };
    const filteredFiles = srcFiles.filter(filterPredicate);
    const copyFiles = srcFiles.filter(file_name => !filterPredicate(file_name));
    await fs.promises.stat(args.dist).catch(async reason => {
        await fs.promises.mkdir(args.dist);
    });
    const safeScriptTransformer = new SafeScriptTransformer();
    for (const file of filteredFiles) {
        const distFile = file.replace(args.src, args.dist);
        await safeScriptTransformer.transform(file, distFile, args.module);
        while (safeScriptTransformer.updated) {
            await safeScriptTransformer.transform(distFile, distFile, args.module);
        }
        if (args.sourceMap) {
            await safeScriptTransformer.generateSourceMap(file, distFile);
        }
        if (fileExtension(distFile) === "ts" && !args.allowAngular) {
            await safeScriptTransformer.compileTs(file, distFile, args.src, args.dist, args.sourceMap);
        }
    }
    for (const file of copyFiles) {
        const distFile = file.replace(args.src, args.dist);
        const distFile_dir = path.dirname(distFile);
        await fs.promises.mkdir(distFile_dir, {
            recursive: true
        });
        await fs.promises.copyFile(file, distFile);
    }
    if (safeScriptTransformer.hasErrors) {
        console.log(`Process exiting with code '1'.`);
        process.exit(1);
    }
}

main();
