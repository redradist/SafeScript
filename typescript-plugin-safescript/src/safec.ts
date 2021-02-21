import * as ts from "typescript";
import * as fs from "fs";
import * as path from "path";

function getTypeName(node: ts.Expression, typeChecker: ts.TypeChecker) {
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
        case "+=":  {
            console.log("+=");
            break;
        }
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

class SafeScriptTransformer {
    private isUpdated: boolean;
    private typeChecker?: ts.TypeChecker;

    constructor() {
        this.isUpdated = false;
        this.typeChecker = undefined;
    }

    get updated() {
        return this.isUpdated;
    }

    async transform(src_file: string, dist_file: string) {
        this.isUpdated = false;
        this.typeChecker = undefined;

        const filename = src_file;
        const program = ts.createProgram([filename], {
            allowJs: true
        });
        const sourceFile = program.getSourceFile(filename);
        this.typeChecker = program.getTypeChecker();

        if (sourceFile) {
            const transformationResult = ts.transform(
                sourceFile, [this.safeScriptTransformFactory()],
                {
                    preserveWhitespace: true
                }
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
                        console.log("isCompoundOperator");
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
    dist: string
};

function getArguments(): SafeScriptArguments {
    let args = process.argv.slice(2);
    console.log('args: ', args);

    let src_dir = args[0];
    let dist_dir;
    if (args[1] === "-d") {
        dist_dir = args[2];
    } else {
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
        dist: dist_dir
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
        return ext === "js";
    });
    const safeScriptTransformer = new SafeScriptTransformer();
    for (let file of filteredFiles) {
        console.log(`file is ${file}`);
        let dist_file = file.replace(args.src, args.dist);
        console.log(`dist_file is ${dist_file}`);
        await safeScriptTransformer.transform(file, dist_file);
        while (safeScriptTransformer.updated) {
            await safeScriptTransformer.transform(dist_file, dist_file);
        }
    }
}

main();
