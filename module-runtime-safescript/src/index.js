function convertToNumber(obj) {
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

function convertToString(obj) {
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
        let right_string = convertToString(right);
        return left + right_string;
    } else if (["object", "function"].includes(typeof left) &&
        typeof right === "string") {
        let left_string = convertToString(left);
        return left_string + right;
    } else {
        let left_value = convertToNumber(left);
        let right_value = convertToNumber(right);
        return left_value + right_value;
    }
};
SafeScript.sub = function(left, right) {
    let left_value = convertToNumber(left);
    let right_value = convertToNumber(right);
    return left_value - right_value;
};
SafeScript.mul = function(left, right) {
    let left_value = convertToNumber(left);
    let right_value = convertToNumber(right);
    return left_value * right_value;
};
SafeScript.div = function(left, right) {
    let left_value = convertToNumber(left);
    let right_value = convertToNumber(right);
    return left_value / right_value;
};
SafeScript.mod = function(left, right) {
    let left_value = convertToNumber(left);
    let right_value = convertToNumber(right);
    return left_value % right_value;
};
SafeScript.exp = function(left, right) {
    let left_value = convertToNumber(left);
    let right_value = convertToNumber(right);
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
        let left_value = convertToNumber(left);
        let right_value = convertToNumber(right);
        return left_value == right_value;
    }
};
SafeScript.ne = function(left, right) {
    return !SafeScript.eq(left, right);
};
SafeScript.gt = function(left, right) {
    let left_value = convertToNumber(left);
    let right_value = convertToNumber(right);
    return left_value > right_value;
};
SafeScript.ge = function(left, right) {
    let left_value = convertToNumber(left);
    let right_value = convertToNumber(right);
    return left_value >= right_value;
};
SafeScript.lt = function(left, right) {
    let left_value = convertToNumber(left);
    let right_value = convertToNumber(right);
    return left_value < right_value;
};
SafeScript.le = function(left, right) {
    let left_value = convertToNumber(left);
    let right_value = convertToNumber(right);
    return left_value <= right_value;
};
SafeScript.and = function(left, right) {
    let left_value = convertToNumber(left);
    let right_value = convertToNumber(right);
    return left_value & right_value;
};
SafeScript.or = function(left, right) {
    let left_value = convertToNumber(left);
    let right_value = convertToNumber(right);
    return left_value | right_value;
};
SafeScript.xor = function(left, right) {
    let left_value = convertToNumber(left);
    let right_value = convertToNumber(right);
    return left_value ^ right_value;
};
SafeScript.rshfit = function(left, right) {
    let left_value = convertToNumber(left);
    let right_value = convertToNumber(right);
    return left_value >> right_value;
};
SafeScript.arshift = function(left, right) {
    let left_value = convertToNumber(left);
    let right_value = convertToNumber(right);
    return left_value >>> right_value;
};
SafeScript.lshift = function(left, right) {
    let left_value = convertToNumber(left);
    let right_value = convertToNumber(right);
    return left_value << right_value;
};
Object.freeze(SafeScript);

const globalObject = (1, eval)('this');
globalObject.SafeScript = SafeScript;

export default SafeScript;
