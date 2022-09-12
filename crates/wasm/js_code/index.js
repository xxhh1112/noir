"use strict";
exports.__esModule = true;
// import { compile } from '@noir-lang/noir_wasm'
var noir_wasm_1 = require("../pkg/noir_wasm");
function main() {
    var res = (0, noir_wasm_1.compile)("../noir-example-project/src/main.nr");
    console.log(res);
}
main();
