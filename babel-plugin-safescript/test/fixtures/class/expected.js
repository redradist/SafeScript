class Shape {
  constructor(n, m) {
    this.n = n;
    this.m = m;
  }

  get shape() {
    return SafeScript.mul(n, m);
  }

}
