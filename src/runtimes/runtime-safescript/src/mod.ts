function implicitToNumber(obj: any) {
    const obj_type = typeof obj;
    if (["number", "boolean"].includes(obj_type)) {
        return obj;
    } else if (["object", "function"].includes(obj_type)) {
        let value;
        if (Symbol.toPrimitive in obj) {
            value = obj[Symbol.toPrimitive]("number");
            if (typeof value !== "number") {
                throw new TypeError(`can't convert ${obj_type} to number`);
            }
        } else {
            value = obj.valueOf();
            if (typeof value !== "number") {
                throw new TypeError(`can't convert ${obj_type} to number`);
            }
        }
        return value;
    }
    if (obj === null) {
        throw new TypeError("can't convert null to number");
    }
    if (obj === undefined) {
        throw new TypeError("can't convert undefined to number");
    }
    throw new TypeError(`can't convert ${obj_type} to number`);
}

function implicitToString(obj: any) {
    const obj_type = typeof obj;
    if (obj_type === "string") {
        return obj;
    } else if (["object", "function"].includes(obj_type)) {
        let value;
        if (Symbol.toPrimitive in obj) {
            value = obj[Symbol.toPrimitive]("string");
            if (typeof value !== "string") {
                throw new TypeError(`can't convert ${obj_type} to string`);
            }
        } else {
            value = obj.toString();
            if (typeof value !== "string") {
                throw new TypeError(`can't convert ${obj_type} to string`);
            }
        }
        return value;
    }
    if (obj === null) {
        throw new TypeError("can't convert null to number");
    }
    if (obj === undefined) {
        throw new TypeError("can't convert undefined to number");
    }
    throw new TypeError(`can't convert ${obj_type} to number`);
}

function isSafeOperation(left_type: any, right_type: any, types: any) {
    let left_like = false;
    let right_like = false;
    for (const ty of types) {
        if (left_type === ty) {
            left_like = true;
        }
        if (right_type === ty) {
            right_like = true;
        }
        if (left_like && right_like) {
            return true;
        }
    }
}

class SafeScriptSymbols {
    readonly add: symbol = Symbol("add");
    readonly sub: symbol = Symbol("sub");
    readonly mul: symbol = Symbol("mul");
    readonly div: symbol = Symbol("div");
    readonly mod: symbol = Symbol("mod");
    readonly exp: symbol = Symbol("exp");
    readonly eq: symbol = Symbol("eq");
    readonly ne: symbol = Symbol("ne");
    readonly gt: symbol = Symbol("gt");
    readonly ge: symbol = Symbol("ge");
    readonly lt: symbol = Symbol("lt");
    readonly le: symbol = Symbol("le");
    readonly and: symbol = Symbol("and");
    readonly or: symbol = Symbol("or");
    readonly xor: symbol = Symbol("xor");
    readonly rshfit: symbol = Symbol("rshfit");
    readonly arshift: symbol = Symbol("arshift");
    readonly lshift: symbol = Symbol("lshift");
    readonly plus: symbol = Symbol("plus");
    readonly minus: symbol = Symbol("minus");
    readonly bit_not: symbol = Symbol("bit_not");
    readonly inc: symbol = Symbol("inc");
    readonly dec: symbol = Symbol("dec");
    readonly suffix: symbol = Symbol("suffix");
}

function isOnlyLeftHanded(symbol: symbol) {
    return symbol in [
        SafeScript.symbols.rshfit,
        SafeScript.symbols.arshift,
        SafeScript.symbols.lshift,
        SafeScript.symbols.plus,
        SafeScript.symbols.minus,
        SafeScript.symbols.bit_not,
        SafeScript.symbols.inc,
        SafeScript.symbols.dec,
        SafeScript.symbols.suffix,
    ];
}

function applyOperatorOverload(symbol: symbol, left: any, right: any | undefined = undefined) {
    const left_type = typeof left;
    const right_type = typeof right;
    if (left_type === "object" && symbol in left) {
        const right_value = implicitToNumber(right);
        return left[symbol](right_value);
    }
    if (right_type === "object" && symbol in right && !isOnlyLeftHanded(left)) {
        const left_value = implicitToNumber(left);
        return right[symbol](left_value);
    }
}

export class SafeScript {
    static readonly symbols: SafeScriptSymbols = new SafeScriptSymbols();
    
    static add(left: any, right: any) {
        const left_type = typeof left;
        const right_type = typeof right;
        if (left_type === "string" || right_type === "string") {
            let left_string = implicitToString(left);
            let right_string = implicitToString(right);
            return left_string + right_string;
        } else if (isSafeOperation(left_type, right_type, ["number", "boolean", "bigint", "symbol"])) {
            return left + right;
        } else {
            let result = applyOperatorOverload(SafeScript.symbols.add, left, right);
            if (result === undefined) {
                const left_value = implicitToNumber(left);
                const right_value = implicitToNumber(right);
                result = left_value + right_value;
            }
            return result;
        }
    }

    static sub(left: any, right: any) {
        const left_type = typeof left;
        const right_type = typeof right;
        if (isSafeOperation(left_type, right_type, ["number", "boolean", "bigint", "symbol"])) {
            return left - right;
        } else {
            let result = applyOperatorOverload(SafeScript.symbols.sub, left, right);
            if (result === undefined) {
                const left_value = implicitToNumber(left);
                const right_value = implicitToNumber(right);
                result = left_value - right_value;
            }
            return result;
        }
    }

    static mul(left: any, right: any) {
        const left_type = typeof left;
        const right_type = typeof right;
        if (isSafeOperation(left_type, right_type,
            ["number", "boolean", "bigint", "symbol"])) {
            return left * right;
        } else {
            let result = applyOperatorOverload(SafeScript.symbols.mul, left, right);
            if (result === undefined) {
                const left_value = implicitToNumber(left);
                const right_value = implicitToNumber(right);
                result = left_value * right_value;
            }
            return result;
        }
    }

    static div(left: any, right: any) {
        const left_type = typeof left;
        const right_type = typeof right;
        if (isSafeOperation(left_type, right_type,
            ["number", "boolean", "bigint", "symbol"])) {
            return left / right;
        } else {
            let result = applyOperatorOverload(SafeScript.symbols.div, left, right);
            if (result === undefined) {
                const left_value = implicitToNumber(left);
                const right_value = implicitToNumber(right);
                result = left_value / right_value;
            }
            return result;
        }
    }

    static mod(left: any, right: any) {
        const left_type = typeof left;
        const right_type = typeof right;
        if (isSafeOperation(left_type, right_type,
            ["number", "boolean", "bigint", "symbol"])) {
            return left % right;
        } else {
            let result = applyOperatorOverload(SafeScript.symbols.mod, left, right);
            if (result === undefined) {
                const left_value = implicitToNumber(left);
                const right_value = implicitToNumber(right);
                result = left_value % right_value;
            }
            return result;
        }
    }

    static exp(left: any, right: any) {
        const left_type = typeof left;
        const right_type = typeof right;
        if (isSafeOperation(left_type, right_type,
            ["number", "boolean", "bigint", "symbol"])) {
            return left ** right;
        } else {
            let result = applyOperatorOverload(SafeScript.symbols.exp, left, right);
            if (result === undefined) {
                const left_value = implicitToNumber(left);
                const right_value = implicitToNumber(right);
                result = left_value ** right_value;
            }
            return result;
        }
    }

    static eq(left: any, right: any) {
        const left_type = typeof left;
        const right_type = typeof right;
        if (left_type === right_type) {
            return left == right;
        } else if (isSafeOperation(left_type, right_type,
            [null, undefined])) {
            return left == right;
        } else if (isSafeOperation(left_type, right_type,
            ["number", "boolean", "bigint", "symbol"])) {
            return left == right;
        } else {
            let result = applyOperatorOverload(SafeScript.symbols.eq, left, right);
            if (result === undefined) {
                const left_value = implicitToNumber(left);
                const right_value = implicitToNumber(right);
                result = left_value == right_value;
            }
            return result;
        }
    }

    static ne(left: any, right: any) {
        let result = applyOperatorOverload(SafeScript.symbols.ne, left, right);
        if (result === undefined) {
            result = !SafeScript.eq(left, right);
        }
        return result;
    }

    static gt(left: any, right: any) {
        const left_type = typeof left;
        const right_type = typeof right;
        if (isSafeOperation(left_type, right_type,
            ["number", "boolean", "bigint", "symbol"])) {
            return left > right;
        } else {
            let result = applyOperatorOverload(SafeScript.symbols.gt, left, right);
            if (result === undefined) {
                const left_value = implicitToNumber(left);
                const right_value = implicitToNumber(right);
                result = left_value > right_value;
            }
            return result;
        }
    }

    static ge(left: any, right: any) {
        const left_type = typeof left;
        const right_type = typeof right;
        if (isSafeOperation(left_type, right_type,
            ["number", "boolean", "bigint", "symbol"])) {
            return left >= right;
        } else {
            let result = applyOperatorOverload(SafeScript.symbols.ge, left, right);
            if (result === undefined) {
                const left_value = implicitToNumber(left);
                const right_value = implicitToNumber(right);
                result = left_value >= right_value;
            }
            return result;
        }
    }

    static lt(left: any, right: any) {
        const left_type = typeof left;
        const right_type = typeof right;
        if (isSafeOperation(left_type, right_type,
            ["number", "boolean", "bigint", "symbol"])) {
            return left < right;
        } else {
            let result = applyOperatorOverload(SafeScript.symbols.lt, left, right);
            if (result === undefined) {
                const left_value = implicitToNumber(left);
                const right_value = implicitToNumber(right);
                result = left_value < right_value;
            }
            return result;
        }
    }

    static le(left: any, right: any) {
        const left_type = typeof left;
        const right_type = typeof right;
        if (isSafeOperation(left_type, right_type,
            ["number", "boolean", "bigint", "symbol"])) {
            return left <= right;
        } else {
            let result = applyOperatorOverload(SafeScript.symbols.le, left, right);
            if (result === undefined) {
                const left_value = implicitToNumber(left);
                const right_value = implicitToNumber(right);
                result = left_value <= right_value;
            }
            return result;
        }
    }

    static and(left: any, right: any) {
        const left_type = typeof left;
        const right_type = typeof right;
        if (isSafeOperation(left_type, right_type,
            ["number", "boolean", "bigint", "symbol"])) {
            return left & right;
        } else {
            let result = applyOperatorOverload(SafeScript.symbols.and, left, right);
            if (result === undefined) {
                const left_value = implicitToNumber(left);
                const right_value = implicitToNumber(right);
                result = left_value & right_value;
            }
            return result;
        }
    }

    static or(left: any, right: any) {
        const left_type = typeof left;
        const right_type = typeof right;
        if (isSafeOperation(left_type, right_type,
            ["number", "boolean", "bigint", "symbol"])) {
            return left | right;
        } else {
            let result = applyOperatorOverload(SafeScript.symbols.or, left, right);
            if (result === undefined) {
                const left_value = implicitToNumber(left);
                const right_value = implicitToNumber(right);
                result = left_value | right_value;
            }
            return result;
        }
    }

    static xor(left: any, right: any) {
        const left_type = typeof left;
        const right_type = typeof right;
        if (isSafeOperation(left_type, right_type,
            ["number", "boolean", "bigint", "symbol"])) {
            return left ^ right;
        } else {
            let result = applyOperatorOverload(SafeScript.symbols.xor, left, right);
            if (result === undefined) {
                const left_value = implicitToNumber(left);
                const right_value = implicitToNumber(right);
                result = left_value ^ right_value;
            }
            return result;
        }
    }

    static rshfit(left: any, right: any) {
        const left_type = typeof left;
        const right_type = typeof right;
        if (isSafeOperation(left_type, right_type,
            ["number", "boolean", "bigint", "symbol"])) {
            return left >> right;
        } else {
            let result = applyOperatorOverload(SafeScript.symbols.rshfit, left, right);
            if (result === undefined) {
                const left_value = implicitToNumber(left);
                const right_value = implicitToNumber(right);
                result = left_value >> right_value;
            }
            return result;
        }
    }

    static arshift(left: any, right: any) {
        const left_type = typeof left;
        const right_type = typeof right;
        if (isSafeOperation(left_type, right_type,
            ["number", "boolean", "bigint", "symbol"])) {
            return left >>> right;
        } else {
            let result = applyOperatorOverload(SafeScript.symbols.arshift, left, right);
            if (result === undefined) {
                const left_value = implicitToNumber(left);
                const right_value = implicitToNumber(right);
                result = left_value >>> right_value;
            }
            return result;
        }
    }

    static lshift(left: any, right: any) {
        const left_type = typeof left;
        const right_type = typeof right;
        if (isSafeOperation(left_type, right_type,
            ["number", "boolean", "bigint", "symbol"])) {
            return left << right;
        } else {
            let result = applyOperatorOverload(SafeScript.symbols.lshift, left, right);
            if (result === undefined) {
                const left_value = implicitToNumber(left);
                const right_value = implicitToNumber(right);
                result = left_value << right_value;
            }
            return result;
        }
    }

    static plus(val: any) {
        const val_type = typeof val;
        let val_num;
        if (val_type !== "string") {
            val_num = implicitToNumber(val);
        } else {
            val_num = applyOperatorOverload(SafeScript.symbols.plus, val);
            if (val_num === undefined) {
                val_num = Number(val);
            }
        }
        return val_num;
    }

    static minus(val: any) {
        let result = applyOperatorOverload(SafeScript.symbols.minus, val);
        if (result === undefined) {
            const val_num = implicitToNumber(val);
            result = (-val_num);
        }
        return result;
    }

    static bit_not(val: any) {
        let result = applyOperatorOverload(SafeScript.symbols.bit_not, val);
        if (result === undefined) {
            const val_num = implicitToNumber(val);
            result = (~val_num);
        }
        return result;
    }

    static suffix_value: any;
    static inc(val: any) {
        let result = applyOperatorOverload(SafeScript.symbols.inc, val);
        if (result === undefined) {
            result = implicitToNumber(val);
        }
        this.suffix_value = result;
        return result + 1;
    }

    static dec(val: any) {
        let result = applyOperatorOverload(SafeScript.symbols.dec, val);
        if (result === undefined) {
            result = implicitToNumber(val);
        }
        this.suffix_value = result;
        return result - 1;
    }

    static suffix() {
        return this.suffix_value;
    }
}

Object.freeze(SafeScript);

// @ts-ignore
const globalObject = (1, eval)('this');
globalObject.SafeScript = SafeScript;
