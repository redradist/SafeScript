const str0 = "3124122";
const num0 = 9;
const str1 = "3124122";
const num1 = str1 - num0;
const num2 = 55 + num1;
const num3 = 5 + num0;
const num4 = (num3 + 1) + 8;
let num5 = 3;
num5 += "3";

let num6 = 3n;
num5 += num6;

let str2 = "24256";
let numstr2 = +str2;

++numstr2;

function something(num) {
    if (typeof num !== "number") {
        throw new TypeError();
    }
    return num + 88;
}
something(2);
