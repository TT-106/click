# M13 残留项审计（2026-09-26）

范围：`src/`、`scripts/`、`tests/` 的 JS/MJS；只记录当前可复核的事实，不把词法扫描当成行为覆盖。

| 检查项 | 结果 | 处理 |
|---|---|---|
| `TODO`/`FIXME`/`HACK`、`@ts-ignore`、`eslint-disable`（单词边界） | 0 命中 | 没有现成待办标记或整段静态规则豁免。无单词边界的搜索会把 `findRouteToDoor` 错算成 TODO。 |
| `unknown` | `src/` 141 行命中 | 多为 JSDoc 的原型后挂载方法窄转换；这是类型表达尚不完整的证据，不能当作零类型债务。 |
| `any` | 引擎模块 51 行命中 | 有 AST 恢复期的变量复用消歧注解及少数跨类访问；需按所有者逐项收窄，禁止批量替换以免掩盖错映射。 |
| `legacy` | `src/` 5 行命中 | `src/ui/legacy-panels.js` 与 `src/app.js` 的旧 DOM 挂载、控制增强属当前产品桥接；保留外部脚本选择器身份。 |
| `console.log` | 引擎模块 91 行命中 | 主要是从原版恢复的错误/边界诊断，包括 `simulation/loop.js` 吞渲染异常的现有机制。测试同时监听 console 与 pageerror。未经逐条原版对照不改日志行为；日志治理尚未完成。 |
| 注释掉的旧实现 | 用“注释行以 `var/function/class/const/let/prototype` 开头”扫描，0 命中 | 只排除了这一种常见形态，不能证明没有其他注释残片。 |
| 未使用模块 | 77 个引擎模块中 76 个进入当前 `tsconfig.json` 的类型图；`runtime/index.js` 未列入，但 `src/engine/internal-api.js` 实际 import 它 | 这不是死文件；类型入口范围仍可改进。没有据此删除模块。 |
| 重复实现/临时 adapter | `src/engine/adapter.js` 是产品边界；`internal-api.js` 接入引擎，`legacy-panels.js` 挂载原 DOM | 职责不同且仍被调用。相似代码尚未做逐符号语义去重审计，因此不能宣称全库无重复。 |

复核命令：`rg -n -i '\b(TODO|FIXME|HACK)\b|@ts-ignore|eslint-disable' src scripts tests -g '*.js' -g '*.mjs'`；`rg -n '\bunknown\b|\bany\b|console\.log' src -g '*.js'`；`npx tsc --listFilesOnly -p tsconfig.json`。检索结果应结合原版行为和 import 路径判断，不凭命中数直接删改。
