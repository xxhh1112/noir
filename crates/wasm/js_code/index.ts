// import { compile } from '@noir-lang/noir_wasm'
import { compile } from '../pkg/noir_wasm'

function main() {
    let res = compile("../noir-example-project/src/main.nr")
    console.log(res);
}

main();