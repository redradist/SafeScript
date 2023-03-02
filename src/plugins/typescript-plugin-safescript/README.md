# TypeScript Plugin for SafeScript Runtime

This package intent manipulate AST to enforce type checking at runtime

## How it is different from Babel Plugin for SafeScript Runtime

Consider the following example:
```javascript
const str0 = "3124122";
const num0 = 9;
const str1 = "3124122";
const num1 = str1 - num0;
const num2 = 55 + num1;
const num3 = 5 + num0;
const num4 = (num3 + 1) + 8;
let num5 = 3;
num5 += "3";

let str2 = "24256";
let numstr2 = +str2;

++numstr2;

function something(num) {
    if (typeof num === "number") {
        return num + 88;
    }
    return num + 88;
}
something(2);
```

Babel Plugin will generate the following file:

```javascript
const str0 = "3124122";
const num0 = 9;
const str1 = "3124122";
const num1 = SafeScript.sub(str1, num0);
const num2 = SafeScript.add(55, num1);
const num3 = SafeScript.add(5, num0);
const num4 = SafeScript.add(SafeScript.add(num3, 1), 8);
let num5 = 3;
num5 = SafeScript.add(num5, "3");

let str2 = "24256";
let numstr2 = SafeScript.plus(str2);

(numstr2 = SafeScript.inc(numstr2));

function something(num) {
  if (typeof num === "number") {
    return SafeScript.add(num, 88);
  }
  return SafeScript.add(num, 88);
}
something(2);
```
As you can see Babel Plugin changed each operator, because it do not have
information about types for expressions and variables

Lets check what will generate TypeScript Plugin:
```javascript
const str0 = "3124122";
const num0 = 9;
const str1 = "3124122";
const num1 = SafeScript.sub(str1, num0);
const num2 = 55 + num1;
const num3 = 5 + num0;
const num4 = (num3 + 1) + 8;
let num5 = 3;
num5 = SafeScript.add(num5, "3");

let str2 = "24256";
let numstr2 = SafeScript.plus(str2);

++numstr2;

function something(num) {
    if (typeof num === "number") {
        return num + 88;
    }
    return SafeScript.add(num, 88);
}
something(2);

```

As you can see TypeScript Plugin inserted only 4 checks at runtime instead of 10 for Babel Plugin.
It is because TypeScript Plugin knows type of each expression and variable at any place in code and
it could decide if runtime check is needed
