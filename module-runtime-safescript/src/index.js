function implicitToNumber(obj) {
    let value = obj;
    if (typeof obj === "string") {
        throw new TypeError("can't convert string to number");
    } else if (obj === null) {
        throw new TypeError("can't convert null to number");
    } else if (obj === undefined) {
        throw new TypeError("can't convert undefined to number");
    } else if (["object", "function"].includes(typeof obj)) {
        if (Symbol.toPrimitive in obj) {
            value = obj[Symbol.toPrimitive]("number");
            if (typeof value !== "number") {
                throw new TypeError("can't convert object to number");
            }
        } else {
            value = obj.valueOf();
            if (typeof value !== "number") {
                throw new TypeError("can't convert object to number");
            }
        }
    }
    return value;
}

function implicitToString(obj) {
    let value = obj;
    if (["object", "function"].includes(typeof obj)) {
        if (Symbol.toPrimitive in obj) {
            value = obj[Symbol.toPrimitive]("string");
            if (typeof value !== "number") {
                throw new TypeError("can't convert object to string");
            }
        } else {
            value = obj.toString();
            if (typeof value !== "string") {
                throw new TypeError("can't convert object to string");
            }
        }
    }
    return value;
}

const SafeScript = {};
SafeScript.add = function(left, right) {
    if (typeof left === typeof right &&
        ["boolean", "number", "bigint", "string"].includes(typeof left)) {
        return left + right;
    } else if (typeof left === "string" &&
               ["object", "function"].includes(typeof right)) {
        let right_string = implicitToString(right);
        return left + right_string;
    } else if (["object", "function"].includes(typeof left) &&
        typeof right === "string") {
        let left_string = implicitToString(left);
        return left_string + right;
    } else {
        let left_value = implicitToNumber(left);
        let right_value = implicitToNumber(right);
        return left_value + right_value;
    }
};
SafeScript.sub = function(left, right) {
    let left_value = implicitToNumber(left);
    let right_value = implicitToNumber(right);
    return left_value - right_value;
};
SafeScript.mul = function(left, right) {
    let left_value = implicitToNumber(left);
    let right_value = implicitToNumber(right);
    return left_value * right_value;
};
SafeScript.div = function(left, right) {
    let left_value = implicitToNumber(left);
    let right_value = implicitToNumber(right);
    return left_value / right_value;
};
SafeScript.mod = function(left, right) {
    let left_value = implicitToNumber(left);
    let right_value = implicitToNumber(right);
    return left_value % right_value;
};
SafeScript.exp = function(left, right) {
    let left_value = implicitToNumber(left);
    let right_value = implicitToNumber(right);
    return left_value ** right_value;
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
    let left_value = implicitToNumber(left);
    let right_value = implicitToNumber(right);
    return left_value > right_value;
};
SafeScript.ge = function(left, right) {
    let left_value = implicitToNumber(left);
    let right_value = implicitToNumber(right);
    return left_value >= right_value;
};
SafeScript.lt = function(left, right) {
    let left_value = implicitToNumber(left);
    let right_value = implicitToNumber(right);
    return left_value < right_value;
};
SafeScript.le = function(left, right) {
    let left_value = implicitToNumber(left);
    let right_value = implicitToNumber(right);
    return left_value <= right_value;
};
SafeScript.and = function(left, right) {
    let left_value = implicitToNumber(left);
    let right_value = implicitToNumber(right);
    return left_value & right_value;
};
SafeScript.or = function(left, right) {
    let left_value = implicitToNumber(left);
    let right_value = implicitToNumber(right);
    return left_value | right_value;
};
SafeScript.xor = function(left, right) {
    let left_value = implicitToNumber(left);
    let right_value = implicitToNumber(right);
    return left_value ^ right_value;
};
SafeScript.rshfit = function(left, right) {
    let left_value = implicitToNumber(left);
    let right_value = implicitToNumber(right);
    return left_value >> right_value;
};
SafeScript.arshift = function(left, right) {
    let left_value = implicitToNumber(left);
    let right_value = implicitToNumber(right);
    return left_value >>> right_value;
};
SafeScript.lshift = function(left, right) {
    let left_value = implicitToNumber(left);
    let right_value = implicitToNumber(right);
    return left_value << right_value;
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
