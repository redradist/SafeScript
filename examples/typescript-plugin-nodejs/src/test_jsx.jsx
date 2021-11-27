import safescript from "@redradist/module-runtime-safescript";

let start = new Date()
let simulateTime = 1000

setTimeout(function (argument) {
    let n = 0;
    for (let i = 0; i < 3000000000; ++i) {
        n += 1;
    }

    console.log(`n is ${n}`);
    let end = new Date() - start;
    console.info('Execution time: %dms', end);
}, simulateTime);


const element = <h1>Hello, world!</h1>;
