# M10 类型债务台账（2026-09-27）

> 规范 §21 要求"先恢复语义，再迁移类型"；本文件如实记录**当前类型化的真实边界**，不把"tsc 0 错误"当作"类型完备"。

## 1. 当前状态（可复核）

| 指标 | 数值 | 复核命令 |
|---|---|---|
| `tsc` 错误 | **0** | `npm run typecheck` |
| `src/engine/modules` 下 `@ts-nocheck` | **0**（77 个模块全部参与检查） | `npm run lint`（不变量 3） |
| tsc 实际加载的引擎模块 | **76 / 77**（经 import 图从 `core/**` + `persistence/**` 传递） | `tsc -p tsconfig.json --listFiles` |
| `@type {any}` 强制转换 | **43** | `grep -ro "@type {any}" src/ \| wc -l` |
| JSDoc 里的 `unknown`（含 `unknown` 收窄转换） | 141 行 | `grep -rn "\bunknown\b" src/ --include=*.js \| wc -l` |
| `@ts-ignore` / `eslint-disable` | **0** | `npm run lint`（不变量 4） |

**分布（`@type {any}` 前 6 名）**：`views/expedition.js` 7、`simulation/tick.js` 4、`views/party-creation.js` 3、`views/monsters.js` 3、`views/base.js` 3、`characters/party.js` 3。

## 2. 根因（结构性，不是"没写完"）

1. **原型后挂载**：本项目的类都是 `function X(){}` + `initializeXxx()` 里逐条 `X.prototype.m = function(){}`。tsc 在**函数边界**外看不到这些后挂载成员，于是调用点写成 `(/** @type {any} */ (this)).m()`。`views/base.js` 的 `visible` / `isVisible` / `update` 三处即此类（基类构造器不赋 `visible` 初值，而子类各自设置——**不能**为了类型方便补默认值，那会改变对象形状与 `isVisible()` 返回值）。
2. **AST 恢复期的变量复用**：`var a, b, c` 被复用来承载不同形状的值（如 `simulation/tick.js:319` 的 `ob = /** @type {any} */ (0)` 与 `:328` 的 `(/** @type {any} */ (Wa)).setTargetCharacter(...)`）。这是原版写法，改动它等于重写函数。
3. **跨类型容器**：同一数组在不同时刻装不同类实例（如 `combatQueue`）。

## 3. 本轮已完成

- **`tsconfig.json` 补 `"lib": ["ES2022", "DOM"]`**：这是浏览器项目本就该有的配置（此前无 DOM 类型，`document`/`HTMLElement` 一律不可用，也是大量 `any` 的诱因之一）。补齐后 `tsc` 仍 **0 错误**。
- **`views/results.js` 的 9 处 `@type {any}` → 1 个交叉类型 typedef**：`buildOfflineProgressTable` 的 8 次 `getOfflineProgressCell` 调用改用
  `@typedef {OfflineProgressView & { getOfflineProgressCell: (table: HTMLTableElement, label: string, rowIndex: number) => HTMLTableCellElement }} OfflineProgressViewWithCells`
  ——既去掉 `any`，也让参数/返回值误用能被 tsc 抓到（与 `views/character.js:424` 的 `EquipAllView & { Wt: ... }` 同一手法）。该文件 `@type {any}` 归零。

## 4. 继续收窄的配方（未做，按需推进）

1. **优先做"一个 typedef 消掉多处 cast"** 的文件（收益/风险比最高）：`views/expedition.js` 的 4 处 `createDomElements()` 可用一个 `& { createDomElements: () => void }` 消掉；`views/monsters.js`、`views/party-creation.js` 同理。
2. **表达式型 cast**（如 `tick.js:452` 的三元）需要先把被复用的变量按分支拆成不同类型，属"重写函数"，风险高。
3. **不要**为了消 cast 引入运行时行为变化（补默认字段、改原型链）——规范 §39 的优先级是「行为正确 > 存档兼容 > 可测试 > 可维护 > 类型安全」，类型收窄不得倒过来驱动行为改动。
4. 任何一步都必须以 `npm run typecheck` + 六门禁全绿收尾；`views/` 的改动还必须有 E2E 与 `rendered-scene` 指纹保护。

## 5. 结论（如实）

- **VERIFIED**：`tsc` 0 错误；77/77 模块无整文件豁免；无 `@ts-ignore`/`eslint-disable`。
- **PARTIALLY VERIFIED**：类型**完备性**——仍有 43 处 `any` 与 141 行 `unknown` 收窄，集中在"原型后挂载 + 变量复用"两类结构性问题。
- **UNRESOLVED**：`persistence/save-dto.js` 是**未被任何 `@type` 引用的类型资产**（119 行纯 JSDoc typedef，无运行时导出）。它目前只作为"存档 DTO schema 的文档化来源"（被 `docs/formulas/items.md:286` 引用），把 `game-save.js` 的序列化/恢复函数接上去可获得真正的 DTO 形状校验——这是 M10 后续最值得做的一步，但会触碰存档路径，必须在差分矩阵保护下逐函数推进。
