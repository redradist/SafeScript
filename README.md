<a href="https://www.buymeacoffee.com/redradist" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>

# SafeScript

This package intent is to make "safe" JavaScript runtime by checking types at runtime and disallowing most of implicit coercion

## How to use this "safe" JavaScript runtime

In Node project add in `package.json`:
```json
  "main": "dist/index.js",
  "scripts": {
    "prepare": "safec ./src -d ./dist --src-map true --allow-ts",
    "start": "npm run prepare && node ./dist/index.js"
  },
  "devDependencies": {
    "typescript-plugin-safescript": "^0.5.3"
  },
  "dependencies": {
    "@redradist/module-runtime-safescript": "^0.4.1"
  }
```

Then in your main script before any code import `@redradist/module-runtime-safescript` runtime:
```javascript
import "@redradist/module-runtime-safescript";

let y = 8;

...

y += "233"; // Possible error behaviour

...
```

The `dist/index.js` will look like:
```javascript
import "@redradist/module-runtime-safescript";

let y = 8;

...

y = SafeScript.add(y, "233"); // SafeScript will throw TypeError exception

...
```

Now you can go in your code and fix the issue:
```javascript
import "@redradist/module-runtime-safescript";

let y = 8;

...

y += Number("233"); // Now it is "safe" behaviour

...
```

Using this `SafeScript` runtime fills like `Python` on V8 ;)

## Philosophy

The Philosophy of `SafeScript`:
1) Allow subset of "safe" operations in `JavaScript` and `TypeScript`
2) Do not introduce a new valid behaviour in runtime, in such way it is easier just to remove `SafeScript` runtime at anytime
