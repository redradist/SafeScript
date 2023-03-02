let t = require("@babel/types");

function getSafeBinaryExpression(node) {
    let safeOperatorName: string | null = null;
    switch (node.operator) {
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
        // @ts-ignore
        return t.callExpression(t.identifier(safeOperatorName), [node.left, node.right]);
    }
    return null;
}

function getSafeAssignmentExpression(node) {
    let safeOperatorName: string | null = null;
    switch (node.operator) {
        case "+=":   safeOperatorName = 'SafeScript.add'; break;
        case "-=":   safeOperatorName = 'SafeScript.sub'; break;
        case "*=":   safeOperatorName = 'SafeScript.mul'; break;
        case "/=":   safeOperatorName = 'SafeScript.div'; break;
        case "%=":   safeOperatorName = 'SafeScript.mod'; break;
    }
    if (safeOperatorName) {
        // @ts-ignore
        return t.assignmentExpression("=", node.left, t.callExpression(t.identifier(safeOperatorName), [node.left, node.right]));
    }
    return null;
}

function getSafeUnaryExpression(node) {
    let safeOperatorName: string | null = null;
    switch (node.operator) {
        case "+":   safeOperatorName = 'SafeScript.plus'; break;
        case "-":   safeOperatorName = 'SafeScript.minus'; break;
        case "~":   safeOperatorName = 'SafeScript.bit_not'; break;
    }
    if (safeOperatorName) {
        // @ts-ignore
        return t.callExpression(t.identifier(safeOperatorName), [node.argument]);
    }
    return null;
}

function getSafeUpdateExpression(node) {
    let safeOperatorName: string | null = null;
    let safeBackOperatorName: string | null = null;
    switch (node.operator) {
        case "++":   safeOperatorName = 'SafeScript.inc'; break;
        case "--":   safeOperatorName = 'SafeScript.dec'; break;
    }
    if (safeOperatorName) {
        if (node.prefix) {
            // @ts-ignore
            return t.parenthesizedExpression(
                t.assignmentExpression("=", node.argument, t.callExpression(t.identifier(safeOperatorName), [node.argument]))
            );
        } else {
            // @ts-ignore
            return t.sequenceExpression([
                t.assignmentExpression("=", node.argument, t.callExpression(t.identifier(safeOperatorName), [node.argument])),
                t.callExpression(t.identifier("SafeScript.suffix"), [])
            ]);
        }
    }
    return null;
}

export default function({ types }) {
    return {
        visitor: {
            BinaryExpression(path) {
                const safeExpression = getSafeBinaryExpression(path.node);
                if (safeExpression) {
                    path.replaceWith(safeExpression);
                }
            },
            AssignmentExpression(path) {
                const safeExpression = getSafeAssignmentExpression(path.node);
                if (safeExpression) {
                    path.replaceWith(safeExpression);
                }
            },
            UnaryExpression(path) {
                const safeExpression = getSafeUnaryExpression(path.node);
                if (safeExpression) {
                    path.replaceWith(safeExpression);
                }
            },
            UpdateExpression(path) {
                const safeExpression = getSafeUpdateExpression(path.node);
                if (safeExpression) {
                    path.replaceWith(safeExpression);
                }
            },
        }
    };
}
