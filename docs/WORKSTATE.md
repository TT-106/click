# WORKSTATE — Clickpocalypse II 语义恢复与现代化工程

> 本文件是长程自治任务的**唯一续跑入口**。上下文压缩或中断后，先读本文件 + `git log`，再继续。
> 最后更新：2026-09-26（第 2 次会话开始时）

## 1. 项目概况

- 原始遗产：`archive/original/c2.js`（46,980 行高度混淆的单体浏览器游戏，sha256 见 `archive/migration/recovery-manifest.json`）。
- 现状：`src/engine/`（约 5.3 万行）是**经 AST 工具从 c2.js 机械恢复出的模块化引擎**（非重写），外部套有新的中文 UI 壳 `src/app.js` + `src/ui/`。
- 恢复声明：`archive/migration/recovery-manifest.json`（sprite atlas 抽取、LZ codec 复用、ES module 化、持久化注入、30s 自动保存、`window.Game` 私有化）。

## 2. 当前里程碑状态

| Milestone | 状态 |
|---|---|
| M0 Original Baseline | ✅ 原版保留于 archive/original，可通过 tests/engine-harness.html?original 运行 |
| M1 Static Map | ✅ docs/symbol-map.json：1,231 符号中 1,228 已重命名；74 模块 + 依赖图 |
| M2 Core Runtime | ✅ bootstrap/GameState/主循环/时间/RNG/存档均已在 src/engine 恢复并有模块边界 |
| M3 Behavioral Harness | ✅ 差分 harness + parity 测试 + E2E 冒烟均已存在且**实测通过** |
| M4 High-Confidence Rename | 🟡 99.8% 符号已命名；**202 个字段仍为混淆名**（fields 节 renamed:0） |
| M5 Foundation Extraction | ✅ RNG(core/math.js SeededRandom)、codec(save-codec.js + vendor lz-string 1.3.3)、clock、静态数据已独立 |
| M6-M9 Domain/Presentation | ✅（结构上）modules/{characters,combat,loot,world,progression,rendering,views,simulation} |
| M10 Type Hardening | ❌ 未开始（纯 JS，无 JSDoc 类型体系、无 typecheck） |
| M11 Performance | ❌ 无 baseline、无测量 |
| M12 Legacy Reduction | 🟡 src 内无 c2.js 残留；adapter 中仍引用混淆字段（ae.Dd、uj、ze、dg、ym） |
| M13 Final Regression | ❌ 未开始 |

## 3. 可运行状态与命令

```bash
npm run dev            # scripts/serve.mjs → http://127.0.0.1:4173（静态服务，无构建步骤）
node scripts/test-parity.mjs   # 差分：原版 vs 重构，固定 LCG(seed 123456789)+固定 Date.now，推进 0/1/99/900 回合比完整存档
node scripts/test-browser.mjs  # E2E：建队/暂停/面板/设置/导出导入/非法存档/刷新/三视口
```

- 测试前置：`npm run dev` 需先在另一终端运行（或 `TEST_URL` 指向已启动实例）；需要 Chrome（playwright channel:'chrome'）。
- Node 版本要求 ≥22（当前 v22.19.0 满足）。
- **2026-09-26 实测**：parity 4 项全过；browser E2E 全过。

## 4. Git 状态

- 仓库于本次会话初始化；首个 commit = 当前全部现状，tag `baseline/original-runnable`。
- 每完成一个可验证切片即 commit（信息格式：`re:`/`refactor:`/`test:`/`perf:`/`docs:` 前缀 + 真实变化）。

## 5. 已确认的关键语义（快照，详见 docs/symbol-map.json）

- `window.Game` → 私有 `game`（runtime/game.js），入口经 `src/engine/adapter.js`。
- 存档键在原版就是语义化字符串（`gameInitialized`、`dungeonManagerState`…29 个顶层键），压缩为 LZ-string 1.3.3 Base64 → localStorage `C2_V1_001`（backup 键 `C2_V1_001_backup`）。
- 原版 RNG：`ga` → `SeededRandom`（core/math.js）；测试 harness 用 LCG(1664525,1013904223) 替换 Math.random 实现双端确定性。
- 存档 fixture：`tests/fixtures/original.c2save`（2026-09-25 采集，含进行中冒险）。

## 6. 已知风险/未解点

- 202 个混淆字段未重命名（高优先：adapter.js 引用的 `state.ae.Dd`（冒险点数）、`dungeons.uj/ze/dg`、`encounter.ym`）。**字段重命名不得改变 JSON 序列化键**——存档写入用的是另一套语义键（见 game-save.js），需先确认混淆字段与存档键的映射边界。
- `package.json` 存在坏脚本：`build`/`check` 指向不存在文件；`test` glob 无匹配。→ 本次会话已列入待办。
- docs/ 缺大部分规范要求的文档（architecture、game-state-schema、persistence、rng、time-model、baseline、formulas、reverse-engineering/facts）。
- 尚无离线收益(offline processing)专项差分场景、无药水/卷轴激活专项场景、无更长时间推进(>900 回合)场景。
- `.playwright-cli/original.c2save` 与 `tests/fixtures/original.c2save` 是同一存档的两份拷贝（疑似）。

## 7. 下一步（按优先级）

1. 修 package.json（删/补 build、check、recover、test）+ 建立首批单测（codec 往返、RNG 确定性、存档往返）。
2. 字段重命名波次 1：先核对 fields 映射表 → 在不改存档键的前提下重命名运行时字段 → parity 回归。
3. 扩展差分场景：1500/5000 回合、多 fixture、药水/卷轴/离线注入。
4. 补 docs 体系（architecture/game-state-schema/persistence/rng/time-model/baseline）。
5. 性能基线（frame time、save/load 耗时、长跑内存）。

## 8. 禁止回退的文件

- `archive/original/**`（唯一原版样本，行为参照基准）
- `tests/fixtures/original.c2save`（差分基准存档）
- `docs/symbol-map.json`（语义事实库）
- `src/vendor/lz-string-1.3.3.js`（存档兼容契约）
