import safescript from "@redradist/runtime-safescript";

let y = 8;
let w = 5;
try {
    y += "233";
} catch (e) {
    console.log(`y is ${y}`);
}

console.log(`y is ${y}`);
