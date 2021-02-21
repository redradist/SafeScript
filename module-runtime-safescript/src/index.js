function implicitToNumber(obj) {
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
function implicitToString(obj) {
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
function isSafeOperation(left_type, right_type, types) {
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
const SafeScript = {};
SafeScript.add = function(left, right) {
    const left_type = typeof left;
    const right_type = typeof right;
    if (left_type === "string" || right_type === "string") {
        let left_string = implicitToString(left);
        let right_string = implicitToString(right);
        return left_string + right_string;
    } else if (isSafeOperation(left_type, right_type,
        ["number", "boolean", "bigint", "symbol"])) {
        return left + right;
    } else {
        const left_value = implicitToNumber(left);
        const right_value = implicitToNumber(right);
        return left_value + right_value;
    }
};
SafeScript.sub = function(left, right) {
    const left_type = typeof left;
    const right_type = typeof right;
    if (isSafeOperation(left_type, right_type,
        ["number", "boolean", "bigint", "symbol"])) {
        return left - right;
    } else {
        const left_value = implicitToNumber(left);
        const right_value = implicitToNumber(right);
        return left_value - right_value;
    }
};
SafeScript.mul = function(left, right) {
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
};
SafeScript.div = function(left, right) {
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
};
SafeScript.mod = function(left, right) {
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
};
SafeScript.exp = function(left, right) {
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
};
SafeScript.eq = function(left, right) {
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
};
SafeScript.ne = function(left, right) {
    return !SafeScript.eq(left, right);
};
SafeScript.gt = function(left, right) {
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
};
SafeScript.ge = function(left, right) {
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
};
SafeScript.lt = function(left, right) {
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
};
SafeScript.le = function(left, right) {
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
};
SafeScript.and = function(left, right) {
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
};
SafeScript.or = function(left, right) {
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
};
SafeScript.xor = function(left, right) {
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
};
SafeScript.rshfit = function(left, right) {
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
};
SafeScript.arshift = function(left, right) {
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
};
SafeScript.lshift = function(left, right) {
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
};
SafeScript.plus = function (val) {
    const val_type = typeof val;
    let val_num;
    if (val_type !== "string") {
        val_num = implicitToNumber(val);
    } else {
        val_num = Number(val);
    }
    return val_num;
};
SafeScript.minus = function (val) {
    const val_type = typeof val;
    const val_num = implicitToNumber(val);
    return (-val_num);
};
SafeScript.bit_not = function (val) {
    const val_type = typeof val;
    const val_num = implicitToNumber(val);
    return (~val_num);
};
let suffix_value;
SafeScript.inc = function (val) {
    const val_num = implicitToNumber(val);
    suffix_value = val_num;
    return val_num + 1;
};
SafeScript.dec = function (val) {
    const val_num = implicitToNumber(val);
    suffix_value = val_num;
    return val_num - 1;
};
SafeScript.suffix = function () {
    return suffix_value;
};
Object.freeze(SafeScript);

const globalObject = (1, eval)('this');
globalObject.SafeScript = SafeScript;

export default SafeScript;
