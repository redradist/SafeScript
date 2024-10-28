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

export class SafeScript {

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
            const left_value = implicitToNumber(left);
            const right_value = implicitToNumber(right);
            return left_value + right_value;
        }
    }

    static sub(left: any, right: any) {
        const left_type = typeof left;
        const right_type = typeof right;
        if (isSafeOperation(left_type, right_type, ["number", "boolean", "bigint", "symbol"])) {
            return left - right;
        } else {
            const left_value = implicitToNumber(left);
            const right_value = implicitToNumber(right);
            return left_value - right_value;
        }
    }

    static mul(left: any, right: any) {
        const left_type = typeof left;
        const right_type = typeof right;
        if (isSafeOperation(left_type, right_type,
            ["number", "boolean", "bigint", "symbol"])) {
            return left * right;
        } else {
            const left_value = implicitToNumber(left);
            const right_value = implicitToNumber(right);
            return left_value * right_value;
        }
    }

    static div(left: any, right: any) {
        const left_type = typeof left;
        const right_type = typeof right;
        if (isSafeOperation(left_type, right_type,
            ["number", "boolean", "bigint", "symbol"])) {
            return left / right;
        } else {
            const left_value = implicitToNumber(left);
            const right_value = implicitToNumber(right);
            return left_value / right_value;
        }
    }

    static mod(left: any, right: any) {
        const left_type = typeof left;
        const right_type = typeof right;
        if (isSafeOperation(left_type, right_type,
            ["number", "boolean", "bigint", "symbol"])) {
            return left % right;
        } else {
            const left_value = implicitToNumber(left);
            const right_value = implicitToNumber(right);
            return left_value % right_value;
        }
    }

    static exp(left: any, right: any) {
        const left_type = typeof left;
        const right_type = typeof right;
        if (isSafeOperation(left_type, right_type,
            ["number", "boolean", "bigint", "symbol"])) {
            return left ** right;
        } else {
            const left_value = implicitToNumber(left);
            const right_value = implicitToNumber(right);
            return left_value ** right_value;
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
            const left_value = implicitToNumber(left);
            const right_value = implicitToNumber(right);
            return left_value == right_value;
        }
    }

    static ne(left: any, right: any) {
        return !SafeScript.eq(left, right);
    }

    static gt(left: any, right: any) {
        const left_type = typeof left;
        const right_type = typeof right;
        if (isSafeOperation(left_type, right_type,
            ["number", "boolean", "bigint", "symbol"])) {
            return left > right;
        } else {
            const left_value = implicitToNumber(left);
            const right_value = implicitToNumber(right);
            return left_value > right_value;
        }
    }

    static ge(left: any, right: any) {
        const left_type = typeof left;
        const right_type = typeof right;
        if (isSafeOperation(left_type, right_type,
            ["number", "boolean", "bigint", "symbol"])) {
            return left >= right;
        } else {
            const left_value = implicitToNumber(left);
            const right_value = implicitToNumber(right);
            return left_value >= right_value;
        }
    }

    static lt(left: any, right: any) {
        const left_type = typeof left;
        const right_type = typeof right;
        if (isSafeOperation(left_type, right_type,
            ["number", "boolean", "bigint", "symbol"])) {
            return left < right;
        } else {
            const left_value = implicitToNumber(left);
            const right_value = implicitToNumber(right);
            return left_value < right_value;
        }
    }

    static le(left: any, right: any) {
        const left_type = typeof left;
        const right_type = typeof right;
        if (isSafeOperation(left_type, right_type,
            ["number", "boolean", "bigint", "symbol"])) {
            return left <= right;
        } else {
            const left_value = implicitToNumber(left);
            const right_value = implicitToNumber(right);
            return left_value <= right_value;
        }
    }

    static and(left: any, right: any) {
        const left_type = typeof left;
        const right_type = typeof right;
        if (isSafeOperation(left_type, right_type,
            ["number", "boolean", "bigint", "symbol"])) {
            return left & right;
        } else {
            const left_value = implicitToNumber(left);
            const right_value = implicitToNumber(right);
            return left_value & right_value;
        }
    }

    static or(left: any, right: any) {
        const left_type = typeof left;
        const right_type = typeof right;
        if (isSafeOperation(left_type, right_type,
            ["number", "boolean", "bigint", "symbol"])) {
            return left | right;
        } else {
            const left_value = implicitToNumber(left);
            const right_value = implicitToNumber(right);
            return left_value | right_value;
        }
    }

    static xor(left: any, right: any) {
        const left_type = typeof left;
        const right_type = typeof right;
        if (isSafeOperation(left_type, right_type,
            ["number", "boolean", "bigint", "symbol"])) {
            return left ^ right;
        } else {
            const left_value = implicitToNumber(left);
            const right_value = implicitToNumber(right);
            return left_value ^ right_value;
        }
    }

    static rshfit(left: any, right: any) {
        const left_type = typeof left;
        const right_type = typeof right;
        if (isSafeOperation(left_type, right_type,
            ["number", "boolean", "bigint", "symbol"])) {
            return left >> right;
        } else {
            const left_value = implicitToNumber(left);
            const right_value = implicitToNumber(right);
            return left_value >> right_value;
        }
    }

    static arshift(left: any, right: any) {
        const left_type = typeof left;
        const right_type = typeof right;
        if (isSafeOperation(left_type, right_type,
            ["number", "boolean", "bigint", "symbol"])) {
            return left >>> right;
        } else {
            const left_value = implicitToNumber(left);
            const right_value = implicitToNumber(right);
            return left_value >>> right_value;
        }
    }

    static lshift(left: any, right: any) {
        const left_type = typeof left;
        const right_type = typeof right;
        if (isSafeOperation(left_type, right_type,
            ["number", "boolean", "bigint", "symbol"])) {
            return left << right;
        } else {
            const left_value = implicitToNumber(left);
            const right_value = implicitToNumber(right);
            return left_value << right_value;
        }
    }

    static plus(val: any) {
        const val_type = typeof val;
        let val_num;
        if (val_type !== "string") {
            val_num = implicitToNumber(val);
        } else {
            val_num = Number(val);
        }
        return val_num;
    }

    static minus(val: any) {
        const val_type = typeof val;
        const val_num = implicitToNumber(val);
        return (-val_num);
    }

    static bit_not(val: any) {
        const val_type = typeof val;
        const val_num = implicitToNumber(val);
        return (~val_num);
    }

    static suffix_value: any;
    static inc(val: any) {
        const val_num = implicitToNumber(val);
        this.suffix_value = val_num;
        return val_num + 1;
    }

    static dec(val: any) {
        const val_num = implicitToNumber(val);
        this.suffix_value = val_num;
        return val_num - 1;
    }

    static suffix() {
        return this.suffix_value;
    }

}

Object.freeze(SafeScript);

// @ts-ignore
const globalObject = (1, eval)('this');
globalObject.SafeScript = SafeScript;
