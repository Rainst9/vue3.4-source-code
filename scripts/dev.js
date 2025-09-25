// 这个文件负责打包，打包 packages 目录下的模块，最终打包成 js 文件

// node dev.js 模块名 -f 打包的格式 === argv.slice(2)

import minimist from "minimist";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import esbuild from "esbuild";

const argvs = minimist(process.argv.slice(2));
const __filename = fileURLToPath(import.meta.url); // 当前文件的绝对路径，import.meta.url （file:// 协议） -> /users
const __dirname = dirname(__filename); // 当前文件的目录
const require = createRequire(import.meta.url);
const target = argvs._[0] || "reactivity"; // 模块名
const format = argvs.f || "iife"; // 打包的格式
const pkg = require(resolve(__dirname, `../packages/${target}/package.json`));

// 根据命令行的参数，来打包对应的模块
// 入口文件
const entry = resolve(__dirname, `../packages/${target}/src/index.ts`);

console.log(argvs, import.meta.url, __filename, __dirname);

// 根据需要进行打包
esbuild.context({
  entryPoints: [entry], // 入口文件
  outfile: resolve(
    __dirname,
    `../packages/${target}/dist/${target}.${format}.js`
  ), // 输出文件
  bundle: true, // 将所有依赖包打包成一个文件
  platform: "browser", // 平台
  format, // 格式
  sourcemap: true, // 生成 sourcemap，调试方便
  globalName: pkg.buildOptions.name, // 全局变量名，全局变量名在浏览器中是全局变量
}).then(context => {
    console.log('开始打包')
    context.watch()
})
