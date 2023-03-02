class Shape {
  constructor(n, m) {
    this.n = n;
    this.m = m;
  }

  get shape() {
    SafeScript.plus(m);
    return SafeScript.mul(n, m);
  }

}
