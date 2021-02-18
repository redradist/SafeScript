function calcSquare(t) {
  return SafeScript.mul(t, t);
}

let k = 3;
let l = 5;
k = SafeScript.add(k, l);
let u = (1, (k = SafeScript.inc(k), SafeScript.suffix()));
(k = SafeScript.inc(k));
