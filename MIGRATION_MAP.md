# MIGRATION_MAP — 从 c2.js 到 src/engine 的迁移映射

> 原始单体：`archive/original/c2.js`（46,980 行，sha256 `b9dd4f56…`，见 `archive/migration/recovery-manifest.json`）。
> 恢复方式：**AST 级机械转换**（非重写）——sprite atlas 抽取、LZ codec 复用为 vendor、ES module 化、初始化序列化为 `initialize*()` 函数、`window.Game` 私有化、持久化注入（30s 自动保存）。
> 符号级映射：`docs/symbol-map.json`（1,231 符号）；字段级日志：`docs/reverse-engineering/semantic-map.md`。

## 模块划分（74 个初始化单元 → src/engine/modules/*）

原版按初始化单元切分为 74 个模块（symbol-map.json `modules` 节，含各模块的 `initName`/bindings/lines）。按目录分层：

| 层 | 模块 | 原版职责 |
|---|---|---|
| core | bootstrap-data, math | 资源表（sprite atlas 索引）、MT19937 RNG、格式化、向量、SimplexNoise |
| content | balance, classes, monsters, skills/*(10 职业), spells, equipment, guardians, minions, potion/scroll 表, dungeon-themes, animations | 全部静态数值与定义（数值、顺序、索引未动） |
| characters | character, stats, party, movement, effects, minions | Character/装备/队伍/移动/状态效果 |
| combat | encounters, actions, skill-effects, potions, scrolls | 遭遇、普攻/技能动作、药水卷轴 |
| loot | items, item-names, inventory, treasure | 物品生成/命名/背包/宝箱 |
| world | generation, dungeons, regions, rooms, pathfinding, terrain, initialization, travel-costs | 地牢生成、世界地图、区域/城堡/农场 |
| progression | points, achievements, statistics, upgrades | 冒险点、成就、统计、升级 |
| persistence | game-save, entities | 存档编解码与实体序列化 |
| simulation | loop, tick, characters | 帧循环、回合推进、行为队列 |
| rendering | scene, sprites, floating-text | Canvas 渲染、动画 |
| views | navigation, expedition, character, monsters, dungeons, castles, achievements, information, results, party-creation, base, dom, upgrade-details, resources | DOM 面板（原 DOM 契约保留，见 archive/migration/legacy-dom.html） |
| runtime | game, index, storage-port | 组合根：game 单例、初始化顺序、存储端口 |

## 外部契约映射（原版全局 → 现代 API）

| 原版（c2.js 全局） | 现代 | 用途 |
|---|---|---|
| `window.Game` | `src/engine/modules/runtime/game.js` 的 `game`（模块私有） | 组合根单例 |
| `window.lB(game.pg)` | `createSaveState(game.saves)` / `runtime.serialize()` | 序列化 |
| `window.pB(15)` | `advanceSimulation(15)` | 回合步进 |
| `game.hE(text)` | `game.importSave(text)` | 导入存档 |
| 产品层访问 | `src/engine/adapter.js`（命令校验 + 只读快照） | UI 唯一入口 |

UI 壳（`src/app.js`、`src/ui/*`）为新增层，通过 `adapter.js` 访问引擎；原 DOM 面板结构由 `archive/migration/legacy-dom.html` 恢复并经 `load-panels.js` 挂载，外部自动化（`archive/original/c2c.user.js`）依赖的 DOM 契约保持不变。

## 行为保持证据链

1. `tests/unit/rng.test.mjs` — RNG 位级差分（Babel 提取原版 `ga` 对照）。
2. `tests/unit/save-codec.test.mjs` — 存档编码契约。
3. `scripts/test-parity.mjs` — 同存档 + 固定 RNG/时钟，原版 vs 重构 0/1/99/900 回合全状态相等。
4. `scripts/test-scenarios.mjs` — 9 场景差分（离线 1h/8h、药水、卷轴、金币、后期、9000 回合）。
5. `scripts/test-browser.mjs` — 真实浏览器 E2E。

## 已知未迁移/未验证区域（如实记录）

- 运行时字段仍有约 1,200 处单字母访问（`artifacts/obfuscated-fields.json`），已取证待重命名的映射见 semantic-map.md；剩余部分需按所有者甄别（同一字母被压缩器复用）。
- prestige/victory 全流程、部分法术分支、大型城堡战未进入差分场景（待扩展 fixtures）。
- 类型体系（JSDoc/TS）未开始（M10）。
