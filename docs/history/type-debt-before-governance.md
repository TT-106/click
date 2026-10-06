# M10 类型债务台账（2026-09-27）

> **历史档案，停止执行和更新。** 下文的“当前/最新/下一步”、数字、权限和命令只适用于原批次；不能用于当前开发或表示本轮验证。当前入口是 [文档索引](../README.md)。


> 规范 §21 要求"先恢复语义，再迁移类型"；本文件如实记录**当前类型化的真实边界**，不把"tsc 0 错误"当作"类型完备"。

## 1. 当前状态（可复核）

| 指标 | 数值 | 复核命令 |
|---|---|---|
| `tsc` 错误 | **0** | `npm run typecheck` |
| `src/engine/modules` 下 `@ts-nocheck` | **0**（79 个模块无整文件豁免；实际加载范围见下一行） | `npm run lint`（不变量 3） |
| tsc 实际加载的引擎模块 | **78 / 79**（R38 经 import 图从 `core/**` + `persistence/**` 传递） | `tsc -p tsconfig.json --listFiles` |
| `@type {any}` 强制转换 | **28**（R39 实测；远征减 7、怪物图鉴减 3） | `npm run lint` 最后的精确转换计数 |
| JSDoc 里的 `unknown`（含 `unknown` 收窄转换） | **144 行**（R39 实测；城堡视图减 5） | `npm run lint` 最后的逐行计数 |
| `@ts-ignore` / `eslint-disable` | **0** | `npm run lint`（不变量 4） |

**分布（前 6 名，R25 实测）**：`views/expedition.js` 7、`simulation/tick.js` 4、`characters/party.js` 3、`views/base.js` 3、`views/monsters.js` 3、`views/party-creation.js` 2；`views/results.js` 已从 9 降到 **1**（仅剩一个数值表达式的 cast）。

## 2. 根因（结构性，不是"没写完"）

1. **原型后挂载**：本项目的类都是 `function X(){}` + `initializeXxx()` 里逐条 `X.prototype.m = function(){}`。tsc 在**函数边界**外看不到这些后挂载成员，于是调用点写成 `(/** @type {any} */ (this)).m()`。`views/base.js` 的 `visible` / `isVisible` / `update` 三处即此类（基类构造器不赋 `visible` 初值，而子类各自设置——**不能**为了类型方便补默认值，那会改变对象形状与 `isVisible()` 返回值）。
2. **AST 恢复期的变量复用**：`var a, b, c` 被复用来承载不同形状的值（如 `simulation/tick.js:319` 的 `ob = /** @type {any} */ (0)` 与 `:328` 的 `(/** @type {any} */ (Wa)).setTargetCharacter(...)`）。这是原版写法，改动它等于重写函数。
3. **跨类型容器**：同一数组在不同时刻装不同类实例（如 `combatQueue`）。

## 3. 本轮已完成

- **`tsconfig.json` 补 `"lib": ["ES2022", "DOM"]`**：这是浏览器项目本就该有的配置（此前无 DOM 类型，`document`/`HTMLElement` 一律不可用，也是大量 `any` 的诱因之一）。补齐后 `tsc` 仍 **0 错误**。
- **`views/results.js` 的 9 处 `@type {any}` → 1 个交叉类型 typedef**：`buildOfflineProgressTable` 的 8 次 `getOfflineProgressCell` 调用改用
  `@typedef {OfflineProgressView & { getOfflineProgressCell: (table: HTMLTableElement, label: string, rowIndex: number) => HTMLTableCellElement }} OfflineProgressViewWithCells`
  ——既去掉 `any`，也让参数/返回值误用能被 tsc 抓到（与 `views/character.js:445` 的 `EquipAllView & { hasImprovement: ... }` 同一手法）。该文件 `@type {any}` 从 9 降到 1（剩下的是 `views/results.js:246` 对 `b.characterStunnedCount - this.stunnedCountBaseline` 的数值表达式 cast）。

## 4. 继续收窄的配方（未做，按需推进）

1. **优先做"一个 typedef 消掉多处 cast"** 的文件（收益/风险比最高）：`views/expedition.js` 的 4 处 `createDomElements()` 可用一个 `& { createDomElements: () => void }` 消掉；`views/monsters.js`、`views/party-creation.js` 同理。
2. **表达式型 cast**（如 `tick.js:452` 的三元）需要先把被复用的变量按分支拆成不同类型，属"重写函数"，风险高。
3. **不要**为了消 cast 引入运行时行为变化（补默认字段、改原型链）——规范 §39 的优先级是「行为正确 > 存档兼容 > 可测试 > 可维护 > 类型安全」，类型收窄不得倒过来驱动行为改动。
4. 任何一步都必须以 `npm run typecheck` + 六门禁全绿收尾；`views/` 的改动还必须有 E2E 与 `rendered-scene` 指纹保护。

## 5. 结论（如实）

- **VERIFIED**：`tsc` 0 错误；79/79 模块无整文件豁免，tsc 实际加载 78 个；无 `@ts-ignore`/`eslint-disable`。
- **PARTIALLY VERIFIED**：类型**完备性**——仍有 28 处 `any` 与 144 行 `unknown` 收窄，集中在"原型后挂载 + 变量复用"两类结构性问题。
- **UNRESOLVED（2026-09-27 更新：已部分解决）**：`persistence/save-dto.js` 曾是**未被任何 `@type` 引用的类型资产**。
  **U131 已接入两处**：`createSaveState` 的 `@returns {SaveData|SaveDataUninitialized}` 与 `restoreGameState` 里
  `JSON.parse` 结果的 `@type {SaveData}`——写错/读错顶层键现在由 `tsc` 报出（反向验证过：TS2322 / TS2551）。
  前置的只读比对由 `scripts/audit-save-schema.mjs`（已入 lint 不变量 9）承担：声明 / 真实 fixture /
  序列化器已初始化分支各 30 键且键序一致，未初始化分支 4 键。
  **彻夜会话（U132）追加**：① `dungeonManagerState` 已写成具名 typedef（`SaveDungeonManagerState` 3 键 +
  `SaveDungeonState` 10 键，字段逐一对照 fixture 实测），挂进 `SaveData`，审计新增两条嵌套 spot-check
  （typedef↔fixture 双向）；反向验证：序列化器临时改名 `clearedTurnX` → tsc TS2322 红。
  ② 实测堵上空白档假绿：审计原先只查"空白分支 ⊆ 30 键声明"，给空白分支加一个声明内也有的键时
  **旧审计与 tsc 联合类型都不红**——已改为与 `SAVE_BLANK_TOP_LEVEL_KEYS` 双向逐键相等（破坏红/恢复绿）。
  **U134 追加（2026-09-28）**：③ `monsterTypes` 三层 typedef（`SaveMonsterTypesState`/`SaveMonsterTypeState`/
  `SaveMonsterTypeEntry`）+ 审计 3 条嵌套 spot-check + 恢复/序列化两侧接线
  （`restoreMonsterType` 参数标注；两个序列化器 `@returns`；`restoreMonsterTypes` 顶层读取行内 cast）。
  负向验证 ×3：恢复侧 `a.killsTypo` → TS2339 红；写出侧 `nameTypo:` → TS2353 红；typedef 加伪字段 → 审计 exit 1。
  **实测发现（记入台账）**：JS 文件里 JSDoc 参数标注**不被赋值收窄覆盖**（参数标注后 `a = <any>` 再读
  `a.length` 仍报 TS2339——声明类型恒胜），故被复用参数不能靠参数标注+any 赋值收窄，只能读取点 cast。
  **R38 追加（2026-10-03）**：`SaveWorld`（4 键）、`SaveCharacterStats`（14 键）、
  `SaveStatComponent`（4 键，六种组件逐一核对原版 fixture）与 `SaveSpellState`（spellName）接入嵌套形态。
  角色/组件写出侧与组件回读侧受类型约束；技能购买标记收紧为布尔字典。读错键、写错键、虚构世界键、
  遗漏顶层声明的四次反向实验均失败，逐字节恢复后通过；日志在 `output/refactor-r38/`。
  原版 fixture 的法术数组为空，因此审计明确报告这一类型缺少 fixture 样本，不冒充历史样本验证。
  审计按完整 typedef 名精确切块，修复 SaveData 与 SaveDataUninitialized 前缀混淆，并新增顶层遗漏检查。
  **仍未做**：其余嵌套形态（`statistics`、`castleManager`、`shopManager` 等）在 `SaveData` 里
  仍标成 `{Object}`，没有形状约束；照同一套路（typedef + fixture 核对 + 审计 spot-check）做是纯增量工作。
  红线不变：**不得通过 `any`、宽泛断言或更改存档键让 tsc 变绿**。
