class InvalidUnaryOperation {
    constructor(op, operand) {
        this.op = op;
        this.operand = operand;
    }
    toString() {
        return `InvalidUnaryOperation: ${this.op} on typeof ${typeof this.operand}`;
    }
}

class InvalidBinaryOperation {
    constructor(op, left, right) {
        this.op = op;
        this.left = left;
        this.right = right;
    }
    toString() {
        return `InvalidBinaryOperation: typeof ${typeof this.left} ${this.op} typeof ${typeof this.right}`;
    }
}

const SafeScript = {};
SafeScript.add = function(left, right) {
    if (typeof left === typeof right &&
        ["boolean", "number", "string"].includes(typeof left)) {
        return left + right;
    } else if (typeof left !== typeof right &&
        ["boolean", "number"].includes(typeof left) &&
        ["boolean", "number"].includes(typeof right)) {
        return left + right;
    }
    throw new InvalidBinaryOperation("+", left, right);
};
SafeScript.sub = function(left, right) {
    if (["boolean", "number"].includes(typeof left) &&
        ["boolean", "number"].includes(typeof right)) {
        return left - right;
    }
    throw new InvalidBinaryOperation("-", left, right);
};
SafeScript.mul = function(left, right) {
    if (["boolean", "number"].includes(typeof left) &&
        ["boolean", "number"].includes(typeof right)) {
        return left * right;
    }
    throw new InvalidBinaryOperation("*", left, right);
};
SafeScript.div = function(left, right) {
    if (["boolean", "number"].includes(typeof left) &&
        ["boolean", "number"].includes(typeof right)) {
        return left / right;
    }
    throw new InvalidBinaryOperation("/", left, right);
};
SafeScript.mod = function(left, right) {
    if (["boolean", "number"].includes(typeof left) &&
        ["boolean", "number"].includes(typeof right)) {
        return left % right;
    }
    throw new InvalidBinaryOperation("%", left, right);
};
SafeScript.exp = function(left, right) {
    if (["boolean", "number"].includes(typeof left) &&
        ["boolean", "number"].includes(typeof right)) {
        return left ** right;
    }
    throw new InvalidBinaryOperation("**", left, right);
};
SafeScript.eq = function(left, right) {
    if (typeof left === typeof right) {
        return left == right;
    } else if (["boolean", "number"].includes(typeof left) &&
               ["boolean", "number"].includes(typeof right)) {
        return left == right;
    }
    throw new InvalidBinaryOperation("==", left, right);
};
SafeScript.ne = function(left, right) {
    if (typeof left === typeof right) {
        return left != right;
    } else if (["boolean", "number"].includes(typeof left) &&
               ["boolean", "number"].includes(typeof right)) {
        return left != right;
    }
    throw new InvalidBinaryOperation("!=", left, right);
};
SafeScript.gt = function(left, right) {
    if (["boolean", "number", "bigint"].includes(typeof left) &&
        ["boolean", "number", "bigint"].includes(typeof right)) {
        return left > right;
    }
    throw new InvalidBinaryOperation(">", left, right);
};
SafeScript.ge = function(left, right) {
    if (["boolean", "number", "bigint"].includes(typeof left) &&
        ["boolean", "number", "bigint"].includes(typeof right)) {
        return left >= right;
    }
    throw new InvalidBinaryOperation(">=", left, right);
};
SafeScript.lt = function(left, right) {
    if (["boolean", "number", "bigint"].includes(typeof left) &&
        ["boolean", "number", "bigint"].includes(typeof right)) {
        return left < right;
    }
    throw new InvalidBinaryOperation("<", left, right);
};
SafeScript.le = function(left, right) {
    if (["boolean", "number", "bigint"].includes(typeof left) &&
        ["boolean", "number", "bigint"].includes(typeof right)) {
        return left <= right;
    }
    throw new InvalidBinaryOperation("<=", left, right);
};
SafeScript.and = function(left, right) {
    if (["boolean", "number"].includes(typeof left) &&
        ["boolean", "number"].includes(typeof right)) {
        return left & right;
    }
    throw new InvalidBinaryOperation("&", left, right);
};
SafeScript.or = function(left, right) {
    if (["boolean", "number"].includes(typeof left) &&
        ["boolean", "number"].includes(typeof right)) {
        return left | right;
    }
    throw new InvalidBinaryOperation("|", left, right);
};
SafeScript.xor = function(left, right) {
    if (["boolean", "number"].includes(typeof left) &&
        ["boolean", "number"].includes(typeof right)) {
        return left ^ right;
    }
    throw new InvalidBinaryOperation("^", left, right);
};
SafeScript.rshfit = function(left, right) {
    if (["boolean", "number"].includes(typeof left) &&
        ["boolean", "number"].includes(typeof right)) {
        return left >> right;
    }
    throw new InvalidBinaryOperation(">>", left, right);
};
SafeScript.arshift = function(left, right) {
    if (["boolean", "number"].includes(typeof left) &&
        ["boolean", "number"].includes(typeof right)) {
        return left >>> right;
    }
    throw new InvalidBinaryOperation(">>>", left, right);
};
SafeScript.lshift = function(left, right) {
    if (["boolean", "number"].includes(typeof left) &&
        ["boolean", "number"].includes(typeof right)) {
        return left << right;
    }
    throw new InvalidBinaryOperation("<<", left, right);
};
Object.freeze(SafeScript);

const globalObject = (1, eval)('this');
globalObject.SafeScript = SafeScript;

export default SafeScript;
