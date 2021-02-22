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
