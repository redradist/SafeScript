import * as ts from "typescript";
import * as fs from "fs";
import * as path from "path";



// function recursivelyPrintVariableDeclarations(
//     node: ts.Node, sourceFile: ts.SourceFile
// ) {
//     if (node.kind === ts.SyntaxKind.VariableDeclaration)  {
//         const nodeText = node.getText(sourceFile);
//         const type = typeChecker.getTypeAtLocation(node);
//         const typeName = typeChecker.typeToString(type, node);
//
//         console.log(nodeText);
//         console.log(`(${typeName})`);
//     }
//     if (ts.isBinaryExpression(node)) {
//         console.log(`ts.isBinaryExpression: ${node.operatorToken.getText()}`);
//         {
//             if (ts.isNumericLiteral(node.left)) {
//                 console.log(`node.left: NumericLiteral`);
//             }
//             console.log(`node.left: ${node.left.kind.toString()}`);
//             const type = typeChecker.getTypeAtLocation(node.left);
//             const typeName = typeChecker.typeToString(type, node.left);
//             console.log(`node.left: ${typeName}`);
//         }
//         {
//             if (ts.isNumericLiteral(node.right)) {
//                 console.log(`node.right: NumericLiteral`);
//             }
//             const type = typeChecker.getTypeAtLocation(node.right);
//             const typeName = typeChecker.typeToString(type, node.right);
//             console.log(`node.right: ${typeName}`);
//         }
//     }
//
//     node.forEachChild(child =>
//         recursivelyPrintVariableDeclarations(child, sourceFile)
//     );
// }
//
// if (sourceFile) {
//     recursivelyPrintVariableDeclarations(sourceFile, sourceFile);
// }

// const filename = "test.js";
// const code = `const test: number = 1 + 2;`;
//
// const sourceFile = ts.createSourceFile(
//     filename, code, ts.ScriptTarget.Latest
// );

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
            console.log("if (sourceFile)");

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
            console.log(`result is ${result}`);
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
                    console.log(`ts.isBinaryExpression: ${node.operatorToken.getText()}`);
                    const leftType = transformer.typeChecker.getTypeAtLocation(node.left);
                    let leftTypeName = transformer.typeChecker.typeToString(leftType, node.left);
                    const rightType = transformer.typeChecker.getTypeAtLocation(node.right);
                    let rightTypeName = transformer.typeChecker.typeToString(rightType, node.right);

                    {
                        if (ts.isNumericLiteral(node.left)) {
                            console.log(`node.left: NumericLiteral ${leftTypeName}`);
                            leftTypeName = "number";
                        } else {
                            console.log(`node.left: ${ts.isLiteralTypeNode(node.left)}`);
                            console.log(`node.left: ${leftTypeName}`);
                            if (!Number.isNaN(Number(leftTypeName))) {
                                leftTypeName = "number";
                            } else if(leftTypeName[0] == "\"" &&
                                leftTypeName[leftTypeName.length - 1] == "\"") {
                                leftTypeName = "string";
                            }
                        }
                    }
                    {
                        if (ts.isNumericLiteral(node.right)) {
                            console.log(`node.right: NumericLiteral ${rightTypeName}`);
                            rightTypeName = "number";
                        } else {
                            console.log(`node.right: ${rightTypeName}`);
                            if (!Number.isNaN(Number(rightTypeName))) {
                                rightTypeName = "number";
                            } else if(rightTypeName[0] == "\"" &&
                                rightTypeName[rightTypeName.length - 1] == "\"") {
                                rightTypeName = "string";
                            }
                        }
                    }

                    // if (leftTypeName === "string" && rightTypeName === "number") {
                    //     return context.factory.createCallExpression(
                    //         context.factory.createIdentifier("SafeScript.add"),
                    //         [],
                    //         [node.left, node.right]);
                    // }

                    if (leftTypeName === "string" && rightTypeName === "string") {
                    } else if (!(["boolean", "number"].includes(leftTypeName) &&
                        ["boolean", "number"].includes(rightTypeName))) {
                        transformer.isUpdated = true;
                        return context.factory.createCallExpression(context.factory.createIdentifier("SafeScript.add"), [], [node.left, node.right]);
                    }
                }
                if (ts.isCallExpression(node)) {
                    console.log(`isCallExpression`);
                }

                return node;
            }

            return ts.visitNode(rootNode, visit);
        };
    }
}

// function safeScriptTransformFactory(context: ts.TransformationContext) {
//     return (rootNode: ts.Node) => {
//         function visit(node: ts.Node): ts.Node {
//             node = ts.visitEachChild(node, visit, context);
//
//             if (ts.isBinaryExpression(node)) {
//                 console.log(`ts.isBinaryExpression: ${node.operatorToken.getText()}`);
//                 const leftType = typeChecker.getTypeAtLocation(node.left);
//                 let leftTypeName = typeChecker.typeToString(leftType, node.left);
//                 const rightType = typeChecker.getTypeAtLocation(node.right);
//                 let rightTypeName = typeChecker.typeToString(rightType, node.right);
//
//                 {
//                     if (ts.isNumericLiteral(node.left)) {
//                         console.log(`node.left: NumericLiteral ${leftTypeName}`);
//                         leftTypeName = "number";
//                     } else {
//                         console.log(`node.left: ${ts.isLiteralTypeNode(node.left)}`);
//                         console.log(`node.left: ${leftTypeName}`);
//                         if (!Number.isNaN(Number(leftTypeName))) {
//                             leftTypeName = "number";
//                         } else if(leftTypeName[0] == "\"" &&
//                             leftTypeName[leftTypeName.length - 1] == "\"") {
//                             leftTypeName = "string";
//                         }
//                     }
//                 }
//                 {
//                     if (ts.isNumericLiteral(node.right)) {
//                         console.log(`node.right: NumericLiteral ${rightTypeName}`);
//                         rightTypeName = "number";
//                     } else {
//                         console.log(`node.right: ${rightTypeName}`);
//                         if (!Number.isNaN(Number(rightTypeName))) {
//                             rightTypeName = "number";
//                         } else if(rightTypeName[0] == "\"" &&
//                             rightTypeName[rightTypeName.length - 1] == "\"") {
//                             rightTypeName = "string";
//                         }
//                     }
//                 }
//
//                 // if (leftTypeName === "string" && rightTypeName === "number") {
//                 //     return context.factory.createCallExpression(
//                 //         context.factory.createIdentifier("SafeScript.add"),
//                 //         [],
//                 //         [node.left, node.right]);
//                 // }
//
//                 if (leftTypeName === "string" && rightTypeName === "string") {
//                 } else if (!(["boolean", "number"].includes(leftTypeName) &&
//                     ["boolean", "number"].includes(rightTypeName))) {
//                     return context.factory.createCallExpression(context.factory.createIdentifier("SafeScript.add"), [], [node.left, node.right]);
//                 }
//             }
//             if (ts.isCallExpression(node)) {
//                 console.log(`isCallExpression`);
//             }
//
//             return node;
//         }
//
//         return ts.visitNode(rootNode, visit);
//     };
// }

function createFileAsync(file_name: string, text: string): Promise<any> {
    return fs.promises.writeFile(file_name, text,  {
        encoding: 'utf8'
    });
}

// const filename = "src/test.js";
// const program = ts.createProgram([filename], {
//     allowJs: true
// });
// const sourceFile = program.getSourceFile(filename);
// const typeChecker = program.getTypeChecker();
//
// if (sourceFile) {
//     console.log("if (sourceFile)");
//
//     const transformationResult = ts.transform(
//         sourceFile, [safeScriptTransformFactory],
//         {
//             preserveWhitespace: true
//         }
//     );
//     const transformedSourceFile = transformationResult.transformed[0];
//     const printer = ts.createPrinter();
//     const result = printer.printNode(
//         ts.EmitHint.SourceFile,
//         transformedSourceFile,
//         sourceFile
//     );
//     createFile("dist/test.js", result);
// }

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

async function run() {
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

run();
