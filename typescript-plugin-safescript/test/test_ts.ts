class MyCl {

}

function someFunc(n: boolean) {
    console.log(`n is ${n}`);
    // @ts-ignore
    return n + 1;
}

someFunc(true);
