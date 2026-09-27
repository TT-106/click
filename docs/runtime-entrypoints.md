# 运行时入口对照（原版 ↔ 重构版）

> 本文复述并扩展 `docs/reverse-engineering/facts.md` 第 17-18 条：给出原版全局符号、重构版入口、浏览器 console 调试入口、测试 harness 用法与 npm 脚本表。
> 原版符号本体在 `archive/original/c2.js`（本文不直接考证其内部，仅引用 facts 与 harness 对它们的绑定）；重构版行号均读自当前源码。

## 1. 入口对照表

| 能力 | 原版（archive/original/c2.js 全局） | 重构版（src/engine/...） | 绑定证据 |
| --- | --- | --- | --- |
| 游戏对象 | `window.Game`（=w） | `game` 单例，`src/engine/modules/runtime/game.js:39` 导出 | `tests/engine-harness.js:18,27` |
| 帧循环实例 | `Game.Hr`（GameLoop） | `game.loop`（`game.js:88`） | harness `:19` ↔ `game.js:88` |
| 手动驱动一帧 | `Game.Hr.Hr()` | `game.loop.tick()`（原型定义 `simulation/loop.js:33`） | harness `:19,25` ↔ `:30,36` |
| 完整存档序列化 | `window.lB(game.pg)` | `serializeGame(game.saves)`（`persistence/game-save.js:697`）；产品走 `engine.serialize()`（`adapter.js:147-149`） | harness `:21` ↔ `:32` |
| 单回合步进 | `window.pB(15)` | `advanceSimulation(15)`（`simulation/tick.js:27`） | harness `:23` ↔ `:34` |
| 导入存档 | `game.hE(text)` | `game.importSave(text)`（`game.js:505-509`）；产品走 `engine.importSave()`（`adapter.js:150-152`） | harness `:22` ↔ `:33`；符号映射 `docs/symbol-map.json`（`"hE": "importSave"`） |
| 已初始化标志 | `game.Em` | `game.initialized`（`game.js:136`） | harness `:20` ↔ `:31` |
| 离线进行中标志 | `game.ig === true` | `game.processingOffline === true`（`game.js:141`） | harness `:24` ↔ `:35` |
| 离线时长/已结算 | `game.jf / game.Vj` | `game.offlineDuration / game.offlineProcessed`（`game.js:143-144`） | facts 第 17 条；上限消费 `game.js:471`、`loop.js:43` |
| 产品唯一入口 | 无（全局即 API） | `src/engine/adapter.js` `engine`（快照 + 命令，`adapter.js:18-156`） | facts 第 18 条 |
| 内部接口 | — | `src/engine/internal-api.js` `runtime`（`internal-api.js:10-21`） | facts 第 18 条 |

原版一列以 `tests/engine-harness.js:12-26` 的 `?original` 分支为运行时证据（该分支被 parity/场景脚本实际使用，见 `scripts/test-parity.mjs:13`、`scripts/test-scenarios.mjs:80`）。

## 2. 浏览器 console 可用的调试入口（重构版，`node scripts/dev` 后 F12）

产品运行时没有把引擎挂到 `window`，console 调试统一走动态 import（与 E2E 脚本同款姿势，`scripts/test-browser.mjs:16`）：

```js
// 快照（只读展示模型）
(await import('/src/engine/adapter.js')).engine.snapshot()

// 命令
const e = (await import('/src/engine/adapter.js')).engine;
e.pause();            // 暂停/继续（adapter.js:132）
e.setOption('fps', true);  // 显示帧率（adapter.js:135）
e.showPanel('monstersTabContent'); // 切遗留面板（adapter.js:125）
e.serialize();        // 当前存档 Base64 串（adapter.js:147）

// 深入引擎内部（绕过适配层，调试用，勿在产品代码引用）
const g = (await import('/src/engine/modules/runtime/index.js')).game;
g.state.turnNumber; g.processingOffline; g.offlineDuration;   // facts 第 17 条对应物
g.loop.tick();                                                // 手动驱动一帧
(await import('/src/engine/modules/simulation/tick.js')).advanceSimulation(15); // 单回合步进
(await import('/src/engine/modules/persistence/game-save.js')).serializeGame(g.saves); // 完整存档对象→Base64
(await import('/src/engine/internal-api.js')).runtime.snapshot(); // 存档 JSON 对象（未压缩，internal-api.js:16）
(await import('/src/engine/internal-api.js')).runtime.decode(localStorage.getItem('C2_V1_001')); // 解码本地存档

// 只读事件订阅（引擎埋点：SaveManager Load/Save/Delete、Dungeon、Achievement 等 recordGameEvent 调用点）
(await import('/src/engine/modules/core/math.js')).subscribeGameEvents(e => console.log(e)); // math.js:69-75
```

注意事项：
- `import()` 路径以站点根为准（serve.mjs 以仓库根为站点，`scripts/serve.mjs:6`）；dist 构建同样保留 `src/` 目录（`scripts/build.mjs:17`）。
- 直接调 `advanceSimulation` **不会**触发离线结算（离线由 `loop.tick` 帧差分支驱动，`loop.js:42`；见 facts 第 10 条）。
- 原版入口（`window.Game` 等）只在 `tests/engine-harness.html?original` 页面存在——原脚本只被该 harness 加载（`engine-harness.js:13-17`）。

## 3. 测试 harness 用法

文件：`tests/engine-harness.html`（壳，`:3` 加载 `tests/engine-harness.js`）+ `tests/engine-harness.js`。

- 双确定性：LCG(1664525,1013904223) 替换 `Math.random`、`Date.now` 固定 1750000000000（`engine-harness.js:5-9`；即 `tests/scenarios/save-mutations.mjs:6` 的 `HARNESS_FIXED_NOW`）。
- URL 参数 `?original` 切换原版/重构引擎，两端暴露同名 `window.harness`（`:10-37`）。
- API（`:44-56`）：
  - `harness.load(text)`：导入存档（前后各重置一次随机种子，保证相同随机流起点，`:45`）；
  - `harness.snapshot()`：完整可序列化存档状态（原版 `lB` / 重构 `createSaveState`，`:21`/`:32`）；
  - `harness.setTime(ms)`：改虚拟时钟（`:47`）；
  - `harness.advance(turns)`：步进 N 回合后返回快照（`:48`，每回合 `advanceSimulation(15)`/`pB(15)`）；
  - `harness.advanceOffline(maxTicks=2000)`：离线专用——每帧虚拟时钟 +2000ms 并 `loop.tick()`，直到退出离线（`:51-55`；帧差恒 >1s 命中 `loop.js:42` 分支，facts 第 10 条）。
- 初始化：`game.onLoad()` 后最多 200 次 × 20ms 轮询 `ready()`（`engine-harness.js:38-43`；重构侧 ready 即 `game.initialized`，其翻转点在 `loop.js:97` 首次初始化分支）。
- 消费方：`npm run test:parity`（0/1/99/900 回合逐字段 deepEqual，`scripts/test-parity.mjs:25-28`）、`npm run test:scenarios`（9 个变异场景矩阵，`scripts/test-scenarios.mjs:16-71`）、`tests/scenarios/save-mutations.mjs` 的存档变异助手（`withPotions/withScrolls/withGold/withTurns/withElapsed/withOfflineProcessing`，`save-mutations.mjs:21-67`）。

## 4. npm 脚本表（package.json:7-15）

| 脚本 | 实现 | 作用 | 前置条件 |
| --- | --- | --- | --- |
| `dev` / `start` | `node scripts/serve.mjs` | 静态服务器，`http://127.0.0.1:4173`（`PORT` 环境变量可改，`serve.mjs:7`）；`--dist` 时改为伺服 `dist/`（`serve.mjs:6`） | 无 |
| `test` | `node --test "tests/unit/*.test.mjs"` | 纯 Node 单测：RNG 黄金值、存档 codec、格式化（`tests/unit/`） | 无 |
| `test:parity` | `node scripts/test-parity.mjs` | Playwright 双开 harness（`?original` 与重构），载入 `tests/fixtures/original.c2save`，推进 0/1/99/900 回合后两端完整状态 `deepEqual`（`test-parity.mjs:5-28`）；状态落盘 `output/parity/` | `dev` 在跑；本机 Chrome（`channel:'chrome'`，`test-parity.mjs:7`） |
| `test:scenarios` | `node scripts/test-scenarios.mjs` | 62 场景差分矩阵（场景定义在 `test-scenarios.mjs:186-758`）：长跑/后期、离线四态 + 12h 截断 + 后台关闭态、药水、全 6 类卷轴、16 类法术分支、城堡征服→胜利、金币涌入、veteran/prestige/full reset、升级与怪物等级解锁/退休、冒险点消费、成就领取与**成就进度临界值两侧**、自动装备、两条农场购买入口、三种财宝房搜索、四类地面掉落、农场全生命周期、渲染帧与自动落盘；离线场景走 `advanceOffline` 并断言时间戳前移（`:807-824`） | 同上 |
| `test:e2e` | `node scripts/test-browser.mjs` | 产品页黑盒：建队、自动战斗、暂停、五类面板、设置持久化、导入导出与坏档拒绝、刷新恢复、键盘、375/1024px 视口（`test-browser.mjs:14-75`） | 同上 |
| `check` | `node scripts/check.mjs` | 对 `src/scripts/tests` 全部 `.js/.mjs` 跑 `node --check` 语法检查，随后执行 `tests/unit`（`check.mjs:23-35`）；parity/E2E 因需浏览器单独跑（`check.mjs:1` 注释） | 无 |
| `build` | `node scripts/build.mjs` | 校验关键文件存在后整体拷贝到 `dist/`（纯静态 ESM，无转译；`build.mjs:1-19`）；注释明示引入打包器前必须先对 dist 跑 `test:parity` | 无 |

## 5. 快速排障入口

| 症状 | 先看 |
| --- | --- |
| 存档载入失败 | console 中 `loop.js:106-109` 的回滚告警 + `saves.js:47-50` `onLoadError` 消息；原档保留在 `C2_V1_001`，备份在 `C2_V1_001_backup`（`saves.js:21-31`） |
| 离线没结算 | 三道门：`allowOfflineProgress`（`game.js:498`）、间隔 >120000ms（`:500`）、`!gameWon && partyCreated`（`:470`）；后台标签页还需 `allowBackgroundProgress`（`loop.js:42`） |
| 面板/渲染异常 | `loop.js:74-80` 会把渲染异常吞成 console.log——查 console 的 `Caught error` 前缀（E2E 也监听它，`test-browser.mjs:13`） |
| 差分失败 | `output/parity|scenarios/*.json` 两端快照 diff；先确认两端 `harness.load` 后随机流一致（`engine-harness.js:45`） |
