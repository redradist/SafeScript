function implicitToNumber(obj) {
    let obj_type = typeof obj;
    if (["boolean", "number"].includes(obj_type)) {
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
    let obj_type = typeof obj;
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

const SafeScript = {};
SafeScript.add = function(left, right) {
    let left_type = typeof left;
    let right_type = typeof right;
    if (left_type === right_type && left_type === "bigint") {
        return left + right;
    } else if (left_type === "string" || right_type === "string") {
        let left_string = implicitToString(left);
        let right_string = implicitToString(right);
        return left_string + right_string;
    } else {
        let left_value = implicitToNumber(left);
        let right_value = implicitToNumber(right);
        return left_value + right_value;
    }
};
SafeScript.sub = function(left, right) {
    let left_type = typeof left;
    let right_type = typeof right;
    if (left_type === right_type && left_type === "bigint") {
        return left - right;
    } else {
        let left_value = implicitToNumber(left);
        let right_value = implicitToNumber(right);
        return left_value - right_value;
    }
};
SafeScript.mul = function(left, right) {
    let left_type = typeof left;
    let right_type = typeof right;
    if (left_type === right_type && left_type === "bigint") {
        return left * right;
    } else {
        let left_value = implicitToNumber(left);
        let right_value = implicitToNumber(right);
        return left_value * right_value;
    }
};
SafeScript.div = function(left, right) {
    let left_type = typeof left;
    let right_type = typeof right;
    if (left_type === right_type && left_type === "bigint") {
        return left / right;
    } else {
        let left_value = implicitToNumber(left);
        let right_value = implicitToNumber(right);
        return left_value / right_value;
    }
};
SafeScript.mod = function(left, right) {
    let left_type = typeof left;
    let right_type = typeof right;
    if (left_type === right_type && left_type === "bigint") {
        return left % right;
    } else {
        let left_value = implicitToNumber(left);
        let right_value = implicitToNumber(right);
        return left_value % right_value;
    }
};
SafeScript.exp = function(left, right) {
    let left_type = typeof left;
    let right_type = typeof right;
    if (left_type === right_type && left_type === "bigint") {
        return left ** right;
    } else {
        let left_value = implicitToNumber(left);
        let right_value = implicitToNumber(right);
        return left_value ** right_value;
    }
};
SafeScript.eq = function(left, right) {
    if (typeof left === typeof right) {
        return left == right;
    } else if ([null, undefined].includes(typeof left) &&
               [null, undefined].includes(typeof right)) {
        return left == right;
    } else if (["boolean", "number", "bigint"].includes(typeof left) &&
               ["boolean", "number", "bigint"].includes(typeof right)) {
        return left == right;
    } else {
        let left_value = implicitToNumber(left);
        let right_value = implicitToNumber(right);
        return left_value == right_value;
    }
};
SafeScript.ne = function(left, right) {
    return !SafeScript.eq(left, right);
};
SafeScript.gt = function(left, right) {
    let left_type = typeof left;
    let right_type = typeof right;
    if (["boolean", "number", "bigint"].includes(left_type) &&
        ["boolean", "number", "bigint"].includes(right_type)) {
        return left > right;
    } else {
        let left_value = implicitToNumber(left);
        let right_value = implicitToNumber(right);
        return left_value > right_value;
    }
};
SafeScript.ge = function(left, right) {
    let left_type = typeof left;
    let right_type = typeof right;
    if (["boolean", "number", "bigint"].includes(left_type) &&
        ["boolean", "number", "bigint"].includes(right_type)) {
        return left >= right;
    } else {
        let left_value = implicitToNumber(left);
        let right_value = implicitToNumber(right);
        return left_value >= right_value;
    }
};
SafeScript.lt = function(left, right) {
    let left_type = typeof left;
    let right_type = typeof right;
    if (["boolean", "number", "bigint"].includes(left_type) &&
        ["boolean", "number", "bigint"].includes(right_type)) {
        return left < right;
    } else {
        let left_value = implicitToNumber(left);
        let right_value = implicitToNumber(right);
        return left_value < right_value;
    }
};
SafeScript.le = function(left, right) {
    let left_type = typeof left;
    let right_type = typeof right;
    if (["boolean", "number", "bigint"].includes(left_type) &&
        ["boolean", "number", "bigint"].includes(right_type)) {
        return left < right;
    } else {
        let left_value = implicitToNumber(left);
        let right_value = implicitToNumber(right);
        return left_value < right_value;
    }
};
SafeScript.and = function(left, right) {
    let left_type = typeof left;
    let right_type = typeof right;
    if (left_type === right_type && left_type === "bigint") {
        return left & right;
    } else {
        let left_value = implicitToNumber(left);
        let right_value = implicitToNumber(right);
        return left_value & right_value;
    }
};
SafeScript.or = function(left, right) {
    let left_type = typeof left;
    let right_type = typeof right;
    if (left_type === right_type && left_type === "bigint") {
        return left | right;
    } else {
        let left_value = implicitToNumber(left);
        let right_value = implicitToNumber(right);
        return left_value | right_value;
    }
};
SafeScript.xor = function(left, right) {
    let left_type = typeof left;
    let right_type = typeof right;
    if (left_type === right_type && left_type === "bigint") {
        return left ^ right;
    } else {
        let left_value = implicitToNumber(left);
        let right_value = implicitToNumber(right);
        return left_value ^ right_value;
    }
};
SafeScript.rshfit = function(left, right) {
    let left_type = typeof left;
    let right_type = typeof right;
    if (left_type === right_type && left_type === "bigint") {
        return left >> right;
    } else {
        let left_value = implicitToNumber(left);
        let right_value = implicitToNumber(right);
        return left_value >> right_value;
    }
};
SafeScript.arshift = function(left, right) {
    let left_type = typeof left;
    let right_type = typeof right;
    if (left_type === right_type && left_type === "bigint") {
        return left >>> right;
    } else {
        let left_value = implicitToNumber(left);
        let right_value = implicitToNumber(right);
        return left_value >>> right_value;
    }
};
SafeScript.lshift = function(left, right) {
    let left_type = typeof left;
    let right_type = typeof right;
    if (left_type === right_type && left_type === "bigint") {
        return left << right;
    } else {
        let left_value = implicitToNumber(left);
        let right_value = implicitToNumber(right);
        return left_value << right_value;
    }
};
SafeScript.plus = function (val) {
    let val_type = typeof val;
    let val_num;
    if (val_type === "string") {
        val_num = Number(val);
    } else {
        val_num = implicitToNumber(val);
    }
    if (typeof val_num !== "number") {
        throw new TypeError(`can't convert ${val_type} to number`);
    }
    return val_num;
};
SafeScript.minus = function (val) {
    let val_type = typeof val;
    let val_num = implicitToNumber(val);
    if (typeof val_num !== "number") {
        throw new TypeError(`can't convert ${val_type} to number`);
    }
    return (-val_num);
};
SafeScript.bit_not = function (val) {
    let val_type = typeof val;
    let val_num = implicitToNumber(val);
    if (typeof val_num !== "number") {
        throw new TypeError(`can't convert ${val_type} to number`);
    }
    return (~val_num);
};
let suffix_value;
SafeScript.inc = function (val) {
    let val_type = typeof val;
    let val_num = implicitToNumber(val);
    if (typeof val_num !== "number") {
        throw new TypeError(`can't convert ${val_type} to number`);
    }
    suffix_value = val_num;
    return val_num + 1;
};
SafeScript.dec = function (val) {
    let val_type = typeof val;
    let val_num = implicitToNumber(val);
    if (typeof val_num !== "number") {
        throw new TypeError(`can't convert ${val_type} to number`);
    }
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
