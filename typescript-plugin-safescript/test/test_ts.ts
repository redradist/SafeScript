class MyCl {
    constructor(q: number) {
        console.log(`q is ${q}`);
    }

    someFunc(n: boolean) {
        console.log(`n is ${n}`);
        let lambda = (k: number) => {
            console.log(`k is ${k}`);
        };
        lambda(7);
        // @ts-ignore
        return n + 1;
    }
}

function someFunc(n: boolean) {
    console.log(`n is ${n}`);
    // @ts-ignore
    return n + 1;
}

someFunc(true);
const cl = new MyCl(8);
cl.someFunc(true);
