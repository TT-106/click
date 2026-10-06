# M13 残留项审计（2026-09-26）

> **历史快照（冻结）。** 本文件记录 2026-09-26 的扫描结果，**不随代码更新**。
> 表内数字是**当时值**；括号里的"现值"是 2026-10-03 复核实测，复核命令见末行。
> 引用前请重跑命令取当前值，不要直接搬表里的数字。

范围：`src/`、`scripts/`、`tests/` 的 JS/MJS；只记录当前可复核的事实，不把词法扫描当成行为覆盖。

| 检查项 | 结果 | 处理 |
|---|---|---|
| `TODO`/`FIXME`/`HACK`、`@ts-ignore`、`eslint-disable`（单词边界） | 0 命中 | 没有现成待办标记或整段静态规则豁免。无单词边界的搜索会把 `findRouteToDoor` 错算成 TODO。 |
| `unknown` | `src/` 141 行命中（现值 **144 行**） | 多为 JSDoc 的原型后挂载方法窄转换；这是类型表达尚不完整的证据，不能当作零类型债务。 |
| `any` | 引擎模块 51 行命中（现值 **28 处**） | 有 AST 恢复期的变量复用消歧注解及少数跨类访问；需按所有者逐项收窄，禁止批量替换以免掩盖错映射。 |
| `legacy` | `src/` 5 行命中 | `src/ui/legacy-panels.js` 与 `src/app.js` 的旧 DOM 挂载、控制增强属当前产品桥接；保留外部脚本选择器身份。 |
| `console.log` | 引擎模块 91 行命中 | 主要是从原版恢复的错误/边界诊断，包括 `simulation/loop.js` 吞渲染异常的现有机制。测试同时监听 console 与 pageerror。未经逐条原版对照不改日志行为；日志治理尚未完成。 |
| 注释掉的旧实现 | 用“注释行以 `var/function/class/const/let/prototype` 开头”扫描，0 命中 | 只排除了这一种常见形态，不能证明没有其他注释残片。 |
| 未使用模块 | 77 个引擎模块中 76 个进入当前 `tsconfig.json` 的类型图（现值 **79 个模块、78 个进入**）；`runtime/index.js` 未列入，但 `src/engine/internal-api.js` 实际 import 它 | 这不是死文件；类型入口范围仍可改进。没有据此删除模块。 |
| 重复实现/临时 adapter | `src/engine/adapter.js` 是产品边界；`internal-api.js` 接入引擎，`legacy-panels.js` 挂载原 DOM | 职责不同且仍被调用。相似代码尚未做逐符号语义去重审计，因此不能宣称全库无重复。 |

**现值复核命令**：`npm run lint`（末行给出 `@type {any}` 与 `unknown` 的精确计数）、
`node scripts/audit-architecture.mjs`（模块数）。类型债台账见 `docs/m10-type-debt.md`。

复核命令：`rg -n -i '\b(TODO|FIXME|HACK)\b|@ts-ignore|eslint-disable' src scripts tests -g '*.js' -g '*.mjs'`；`rg -n '\bunknown\b|\bany\b|console\.log' src -g '*.js'`；`npx tsc --listFilesOnly -p tsconfig.json`。检索结果应结合原版行为和 import 路径判断，不凭命中数直接删改。

---

## 复跑（2026-09-27，M12 收官 + P3 之后）

复核命令：`grep -rnE '\b(TODO|FIXME|HACK)\b' src scripts tests`、`grep -rn "@ts-ignore\|eslint-disable" src scripts tests`、`grep -rn '\bunknown\b|\bany\b|\blegacy\b|console\.log' src --include=*.js`、`node scripts/find-unused-modules.mjs`、`node scripts/find-invisible-name-files.mjs`。

| 检查项 | 本次结果 | 处理 |
|---|---|---|
| `TODO`/`FIXME`/`HACK` | **0 命中**（src + scripts + tests） | 无待办标记。 |
| `@ts-ignore` / `eslint-disable` | **0 命中** | 无静态规则豁免。 |
| `unknown` | 141 行 | 与上次持平；仍是 JSDoc 原型后挂载方法的窄转换，属类型表达尚不完整。 |
| `any` | 51 行（其中 `@type {any}` 强制转换 50 处） | 与上次持平；集中在 `views/results.js`(9)/`views/expedition.js`(7)/`simulation/tick.js`(4)。需按属主逐项收窄，禁止批量替换。 |
| `legacy` | 5 行 | 全是 `src/ui/legacy-panels.js` 与 `src/app.js` 的产品桥接，保留（外部脚本依赖其 DOM 选择器身份）。 |
| `console.log` | 91 行 | 与上次持平；为从原版恢复的错误/边界诊断（含 `simulation/loop.js` 吞渲染异常的机制）。未经逐条原版对照不改日志行为。 |
| 注释掉的旧实现 | 引擎模块内以 `//` 开头的行仅 **3 行**，且都是"为什么"型架构注释（`core/math.js:87`、`runtime/index.js:76`、`runtime/storage-port.js:1`） | 无注释残片。 |
| **文件名隐形字符** | **发现并清除 38 个**（`X.js\uF00D`，99B，仅含一行 `@ts-nocheck` 注释，已被 git 跟踪） | 见下节。这是本次复跑的最大收获。 |
| 未使用模块 | `src/` 共 93 个 `.js`；无任何 import 指向的只有 3 个：`src/app.js`（入口，由 `index.html` 加载）、`src/services/save-worker.js`（由 `new Worker` 字符串加载）、`src/engine/modules/persistence/save-dto.js`（**纯 JSDoc typedef 的 schema 文件**，无运行时导出，被 `docs/formulas/items.md` 引用） | 三者均非死文件。`save-dto.js` 目前未接入任何 `@type` 标注——**是"可加载但未生效"的类型资产**，登记为 M10 后续可加固项（不删除）。 |
| 重复实现/临时 adapter | `adapter.js`（产品边界）/`internal-api.js`（引擎接入）/`legacy-panels.js`（原 DOM 挂载）职责不同且均在调用链上 | 未做逐符号语义去重审计，故不宣称"全库无重复"。 |

### 38 个"隐形文件名"垃圾文件（本次清除）

- 形态：`X.js` 与 `X.js\uF00D` 成对存在（尾随 U+F00D，零宽不可见），后者一律 **99 字节**、内容仅一行 `// @ts-nocheck -- M10 渐进类型化：本文件 JSDoc 覆盖后摘除（见 docs/WORKSTATE.md）`，且**已被 git 跟踪**（`git ls-files` 显示为 `"…\357\200\215"`）。
- 根因：历史脚本想给 `X.js` 加 `@ts-nocheck`，却把内容写进了带尾随隐形字符的**新文件**，随后被 commit。真实模块从未带 `@ts-nocheck`。
- 为什么长期没被发现：`check.mjs` 的 `/\.(js|mjs)$/`、`analyze-fields.mjs` 的 `endsWith('.js')`、`find -name "*.js"`、人工 `ls` **全部**看不见它们（名字以 U+F00D 结尾）。这同时解释了早期审计"38 个垃圾文件"与后续复核"实测为 0"的矛盾——两次用的匹配口径不同，后者是错的。
- 工具与安全断言：`scripts/find-invisible-name-files.mjs`（盘点，匹配 U+0000–U+001F / U+007F–U+009F / U+200B–U+200F / U+202A–U+202E / U+2060–U+206F / U+FEFF / U+E000–U+F8FF）；`scripts/remove-invisible-name-files.mjs` 删除前逐条断言"≤200B + 内容含 `@ts-nocheck` + 存在同名正常文件"，任一不符即整批中止，且用 `fs.unlinkSync`（不把隐形路径交给 git CLI）。
- 验证：删除后六门禁全绿、`analyze-fields` 仍为 0、`typecheck` 仍 0 错误。

