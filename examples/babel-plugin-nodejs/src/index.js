import safescript from "@redradist/module-runtime-safescript";

var start = new Date()
var simulateTime = 1000

setTimeout(function (argument) {
    let n = 0;
    for (let i = 0; i < 3000000000; ++i) {
        n += 1;
    }

    console.log(`n is ${n}`);
    var end = new Date() - start;
    console.info('Execution time: %dms', end);
}, simulateTime);

// class SomeClass {
//     [Symbol.toPrimitive](hint) {
//         if (hint === "number") {
//             return 8;
//         } else {
//             return "sdasfasf";
//         }
//         // return this;
//     }
//     toString() {
//         return "asaf";
//     }
// }
//
// try {
//     // y += "233";
//     y += new SomeClass();
//     // y += 233;
// } catch (e) {
//     console.log(`Exception is ${e}`);
// }
//
// let sdas = "124212";
// console.log(`sdas is ${new SomeClass()}`);
// sdas = +sdas;
// ++sdas;
// console.log(`sdas is ${sdas}`);
//
// console.log(`y is ${y}`);
