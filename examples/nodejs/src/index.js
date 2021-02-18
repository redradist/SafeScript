import safescript from "@redradist/module-runtime-safescript";

let y = 8;
let w = 5;

class SomeClass {
    [Symbol.toPrimitive](hint) {
        if (hint === "number") {
            return 8;
        } else {
            return "sdasfasf";
        }
        // return this;
    }
    toString() {
        return "asaf";
    }
}

try {
    // y += "233";
    y += new SomeClass();
    // y += 233;
} catch (e) {
    console.log(`Exception is ${e}`);
}

let sdas = "124212";
console.log(`sdas is ${new SomeClass()}`);
sdas = +sdas;
++sdas;
console.log(`sdas is ${sdas}`);

console.log(`y is ${y}`);
