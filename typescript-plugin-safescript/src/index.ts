#!/usr/bin/env node

import * as ts from "typescript";
import * as fs from "fs";
import * as path from "path";
import { encode } from '@vivaxy/vlq';

interface SourceMap {
    version: number,
    file: string,
    sourceRoot: string,
    sources: string[],
    names: string[],
    mappings: string
}

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
        let leftTypeName = getTypeName(left, typeChecker);
        let rightTypeName = getTypeName(right, typeChecker);

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
        let leftTypeName = getTypeName(left, typeChecker);
        let rightTypeName = getTypeName(right, typeChecker);

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
        let typeName = getTypeName(node, typeChecker);

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
    let safeBackOperatorName: string | null = null;
    switch (operator) {
        case "++":   safeOperatorName = 'SafeScript.inc'; break;
        case "--":   safeOperatorName = 'SafeScript.dec'; break;
    }
    if (safeOperatorName) {
        let typeName = getTypeName(node, typeChecker);

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

function getSafeCheckExpression(node: ts.FunctionDeclaration,
                                typeChecker: ts.TypeChecker,
                                nodeFactory: ts.NodeFactory) {
    let checks: ts.Statement[] = [];
    let activeSelfCheck = true;
    let selfChecks: [string, string][] = [];
    node.body?.statements.filter((value, index, array) => {
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
    })
    for (let param of node.parameters) {
        let typeName = getTypeName(param, typeChecker);
        if (['number', 'string', 'bigint', 'boolean'].includes(typeName)) {
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
    private allow_ts?: boolean;

    constructor(allow_ts?: boolean) {
        this.isUpdated = false;
        this.typeChecker = undefined;
        this.allow_ts = allow_ts;
    }

    get updated() {
        return this.isUpdated;
    }

    async transform(src_file: string, dist_file: string) {
        this.isUpdated = false;
        this.typeChecker = undefined;

        const filename = src_file;
        const typesSafeScript = "./src/safescript";
        const compileOptions: ts.CompilerOptions = {
            allowJs: true,
            types: [typesSafeScript]
        };
        const program = ts.createProgram([filename], compileOptions);
        const sourceFile = program.getSourceFile(filename);
        this.typeChecker = program.getTypeChecker();

        if (sourceFile) {
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
            await createFileAsync(dist_file, result);
        }
    }

    async generateSourceMap(file: string, dist_file: string) {
        const typesSafeScript = "./src/safescript";
        const compileOptions: ts.CompilerOptions = {
            allowJs: true,
            types: [typesSafeScript]
        };
        let relativePath = path.relative(path.dirname(dist_file), file);
        console.log(`relativePath is ${relativePath}`);
        const sourceMap: SourceMap = {
            version: 3,
            // @ts-ignore
            file: `${path.basename(dist_file)}`,
            sourceRoot: "",
            sources: [relativePath],
            names: [],
            mappings: ""
        };

        console.log(`file is ${file}`);
        const origProgram = ts.createProgram([file], compileOptions);
        const origSourceFile = origProgram.getSourceFile(file);

        console.log(`dist_file is ${dist_file}`);
        const distProgram = ts.createProgram([dist_file], compileOptions);
        const distSourceFile = distProgram.getSourceFile(dist_file);

        console.log(`origSourceFile is ${origSourceFile}`);
        console.log(`distSourceFile is ${distSourceFile}`);
        if (origSourceFile && distSourceFile) {
            console.log(`if (origSourceFile && distSourceFile)`);
            const genContext = {
                line: 0,
                lineItems: 0,
                character: 0,
                oldMapping: "",
                fullStart: 0,
                origPrevCharacter: 0,
                compiledPrevCharacter: 0,
                origPrevLine: 0
            };
            sourceMap.mappings = this.generateMappings(
                genContext, origSourceFile, origSourceFile, distSourceFile
            );
        }
        console.log(`mappings is ${sourceMap.mappings}`);

        await createFileAsync(`${dist_file}.map`, JSON.stringify(sourceMap));
        const data = await fs.promises.readFile(dist_file, { encoding: 'utf8' });
        const newData = data + "\r\n" + `//# sourceMappingURL=${path.basename(dist_file)}.map`;
        await fs.promises.writeFile(dist_file, newData, { encoding: 'utf8' });
    }

    findSimilarNode(start: number,
                    searchNode: ts.Node,
                    searchFile: ts.SourceFile,
                    similarNode: ts.Node,
                    similarFile: ts.SourceFile) {
        const similarNodeText = similarNode.getText(similarFile);
        if (similarNodeText === "") {
            return undefined;
        }
        const nodeText = searchNode.getText(searchFile);
        if (nodeText !== "" &&
            searchNode.kind === similarNode.kind &&
            searchNode.getStart(searchFile) >= start) {
            return searchNode;
        }

        for (const child of searchNode.getChildren(searchFile)) {
            const foundChild: any = this.findSimilarNode(start, child, searchFile, similarNode, similarFile);
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

    generateMappings(genContext: any, originNode: ts.Node, originFile: ts.SourceFile, compiledFile: ts.SourceFile): string {
        let result = "";

        const originChildren = originNode.getChildren(originFile);
        if (originNode.getText(originFile) === "return") {
            console.log(`originNode.getText(originFile) === "return": ${originChildren.length}`);
        }

        if (originChildren.length > 0) {
            for (let i = 0; i < originChildren.length; ++i) {
                const originChild = originChildren[i];
                result += this.generateMappings(
                    genContext, originChild, originFile, compiledFile
                );
            }
        } else {
            if (!this.isSafeScriptOperator(originNode.getText(originFile))) {
                const foundNode = this.findSimilarNode(genContext.fullStart, compiledFile, compiledFile, originNode, originFile);
                if (foundNode) {
                    const origPos = originFile.getLineAndCharacterOfPosition(originNode.getStart(originFile));
                    const compiledPos = compiledFile.getLineAndCharacterOfPosition(foundNode.getStart(compiledFile));
                    if (compiledPos.line > genContext.line) {
                        result += ";".repeat(compiledPos.line - genContext.line);
                        genContext.line = compiledPos.line;
                        genContext.lineItems = 0;
                        genContext.compiledPrevCharacter = 0;
                        console.log("New Line");
                    }
                    if (genContext.lineItems > 0) {
                        result += ",";
                    }
                    result += encode([compiledPos.character-genContext.compiledPrevCharacter, 0, origPos.line-genContext.origPrevLine, origPos.character-genContext.origPrevCharacter]);
                    genContext.compiledPrevCharacter = compiledPos.character;
                    genContext.origPrevCharacter = origPos.character;
                    genContext.origPrevLine = origPos.line;
                    genContext.lineItems += 1;
                    genContext.fullStart = foundNode.getStart(compiledFile)+1;
                }
            } else {
                console.log(`${originNode.getText(originFile)}`);
            }
        }

        return result;
    }

    private safeScriptTransformFactory() {
        let transformer = this;
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
                    let operator_string = operatorToString(node.operator);
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
                } else if (transformer.allow_ts &&
                           ts.isFunctionDeclaration(node)) {
                    let checks: ts.Statement[] = getSafeCheckExpression(
                        node,
                        transformer.typeChecker,
                        context.factory);
                    if (node.body?.statements && checks.length > 0) {
                        // @ts-ignore
                        node.body?.statements = checks.concat(node.body?.statements);
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

type SafeScriptArguments = {
    src: string,
    dist: string,
    source_map: boolean,
    allow_ts: boolean,
};

function getArguments(): SafeScriptArguments {
    let args = process.argv.slice(2);
    console.log('args: ', args);

    let src_dir = './';
    let dist_dir;
    let source_map = false;
    let allow_ts = false;
    for (let i = 0; i < args.length; ++i) {
        if (args[i] === "-d") {
            if (i + 1 >= args.length) {
                throw new Error(`Missed required path option after '-d'`);
            }
            dist_dir = args[++i];
        } else if (args[i] === "--src-map") {
            if (i + 1 >= args.length) {
                throw new Error(`Missed required boolean option after '--src-map'`);
            }
            source_map = Boolean(args[++i]);
        } else if (args[i] === "--allow-ts") {
            if (i + 1 >= args.length) {
                throw new Error(`Missed required boolean option after '--allow-ts'`);
            }
            allow_ts = Boolean(args[++i]);
        } else {
            src_dir = args[i];
        }
    }
    if (!dist_dir) {
        dist_dir = src_dir;
    }

    src_dir = src_dir.replace(/^(\.\/)/,"");
    if (src_dir[src_dir.length-1] !== '/') {
        src_dir += '/';
    }
    dist_dir = dist_dir.replace(/^(\.\/)/,"");
    if (dist_dir[dist_dir.length-1] !== '/') {
        dist_dir += '/';
    }

    return {
        src: src_dir,
        dist: dist_dir,
        source_map: source_map,
        allow_ts: allow_ts
    };
}

function fileExtension(file_name: string) {
    return file_name.split('.').pop();
}

async function getSourceFiles(src_dir: string): Promise<string[]> {
    let srcFiles: string[] = [];
    let files = await fs.promises.readdir(src_dir);
    for (let file of files) {
        let file_path = path.join(src_dir, file);
        let fileStats = await fs.promises.stat(file_path);
        if (fileStats.isFile()) {
            srcFiles.push(file_path);
        } else if (fileStats.isDirectory()) {
            let subFiles = await getSourceFiles(file_path);
            if (subFiles.length > 0) {
                for (let subfile of subFiles) {
                    srcFiles.push(subfile);
                }
            }
        }
    }
    return srcFiles;
}

async function main() {
    let args = getArguments();
    console.log(`args.src is ${args.src}`);
    console.log(`args.dist is ${args.dist}`);
    const srcFiles = await getSourceFiles(args.src);
    const filteredFiles = srcFiles.filter(file_name => {
        let ext = fileExtension(file_name);
        if (args.allow_ts) {
            return ext === "js" || ext === "ts";
        }
        return ext === "js";
    });
    await fs.promises.stat(args.dist).catch(async reason => {
        await fs.promises.mkdir(args.dist);
    });
    const safeScriptTransformer = new SafeScriptTransformer(args.allow_ts);
    for (let file of filteredFiles) {
        let dist_file = file.replace(args.src, args.dist);
        await safeScriptTransformer.transform(file, dist_file);
        while (safeScriptTransformer.updated) {
            await safeScriptTransformer.transform(dist_file, dist_file);
        }
        if (args.source_map) {
            await safeScriptTransformer.generateSourceMap(file, dist_file);
        }
    }
}

main();
