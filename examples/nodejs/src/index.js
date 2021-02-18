import safescript from "@redradist/module-runtime-safescript";

let y = 8;
let w = 5;
try {
    y += "233";
    // y += 233;
} catch (e) {
    console.log(`Exception is ${e}`);
}

console.log(`y is ${y}`);
