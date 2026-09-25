# WORKSTATE — Clickpocalypse II 语义恢复与现代化工程

> 本文件是长程自治任务的**唯一续跑入口**。上下文压缩或中断后，先读本文件 + `git log --oneline`，再继续。
> 最后更新：2026-09-26（第 2 次会话，中后期）

## 1. 项目概况

- 原始遗产：`archive/original/c2.js`（46,980 行混淆单体，sha256 见 `archive/migration/recovery-manifest.json`）。
- `src/engine/`：经 AST 工具从 c2.js **机械恢复**的模块化引擎（非重写），74 模块；`src/app.js`+`src/ui/` 为新 UI 壳。
- 语义事实库：`docs/reverse-engineering/facts.md`（20 条已验证事实）+ `semantic-map.md`（重命名日志）+ `docs/symbol-map.json`（1,231 符号）。

## 2. 里程碑状态

| Milestone | 状态 |
|---|---|
| M0-M3 | ✅ 基线/静态图/运行时恢复/行为 harness 全部完成且实测通过 |
| M4 High-Confidence Rename | 🟡 符号 99.8% 已命名；**字段重命名已完成 30+ 个字段身份**（动画帧表、Achievement 组、Upgrade.canPurchase、视图 upgrade、Vector2 x/y、Character.position、CharacterPosition.levelPosition/room、Item.slot/characteristic、tb slot/statType（含 guardians/minions）、怪物 name、WorldMap worldBlocks/blockOrigin*/tileGrid、spriteName、getSprite 方法族、tabState、数值组 currentValue/levelIncrement/activeValue/baseValue/purchasedLevels/perLevelIncrement）|
| M5-M9 | ✅ 结构完成（见 MIGRATION_MAP.md） |
| M10 Type Hardening | ❌ 未开始 |
| M11 Performance | ✅ 基线完成（docs/performance-baseline.md）：重构/原版比值 1.0-1.1x；优化未开始（也无必要——模拟占回合预算 0.03%） |
| M12 Legacy Reduction | 🟡 技能/法术/状态效果/视图高频字段已清（e/f/g/X/V/W/c 组落地）；剩余长尾字段约 1,300 处访问（Y/Z/aa/ca 等，需新取证） |
| M13 Final Regression | 🟡 回归体系全绿；prestige/victory/部分法术分支无差分场景 |

## 3. 可运行状态与命令（全部实测通过 @ commit 4665924+）

```bash
npm run dev              # http://127.0.0.1:4173（静态服务，测试前置）
npm test                 # 单测 9 项：RNG 差分(提取原版 ga 对照 6 种子×100k)、codec 契约、格式化表
npm run test:parity      # 原版 vs 重构：同存档+固定 RNG/时钟，0/1/99/900 回合全状态相等
npm run test:scenarios   # 9 场景差分矩阵：long-run-9000 / offline-1h-8h-disabled(含收益断言) / 药水×2 / 卷轴 / 金币 / 后期
npm run test:e2e         # 浏览器 E2E：建队/暂停/面板/设置/导入导出/非法存档/刷新/三视口
npm run check            # 语法检查(104 文件) + 单测
npm run perf             # 性能基线测量（重构 vs 原版）
```

## 4. 本会话关键发现（防重复踩坑）

1. **RNG 是 JS 浮点变体 MT19937**（seed 5489 首值 1859732469 ≠ C 标准 3499211612）——禁止替换"更标准"实现。
2. **存档 4,477 个键全为语义化命名，无单字母键**——运行时字段重命名安全，但 game-save.js/entities.js 的映射行必须成对同步。
3. **离线结算由帧循环驱动**（每帧≤200 回合；分支条件 `1E3 < 帧差`）——harness 用 `advanceOffline()`（每帧+2000ms）。
4. **数据字面量键分布在多个 content 文件**（classes/guardians/minions/monsters/skills/*）——重命名数据键必须全库 grep；漏改会在后期内容触发崩溃（guardians 教训，facts.md 第 13/20 条）。
5. **Windows Git-Bash**：`grep -rl | xargs sed` 会因反斜杠路径失败；复合 sed `'s/a/b; s/c/d'` 静默无效——必须逐表达式或 find 循环。
6. 场景矩阵曾抓住 parity-900 抓不到的真实回归（guardians 崩溃）——**每个重命名批次必须跑全部三套测试**。

## 5. Git

- 每个可验证切片一个 commit（本次会话约 20 个）；baseline tag `baseline/original-runnable`。
- 当前工作树干净，三套测试全绿。

## 6. 下一步（按优先级）

1. **重命名波次 3**：技能/法术定义表字段（`c`→settingId/skillId/spellId 已有 HIGH 证据，含存档映射同步 game-save.js:953/543-551、entities.js:138-156）；`e/f/g/h` 等技能字段需**新取证**（派 Explore 智能体，产出格式同上批）。
2. ~~交付物收尾~~ ✅ 已完成（REFACTOR_REPORT.md、PERFORMANCE_REPORT.md、COMPATIBILITY_REPORT.md、MIGRATION_MAP.md）。
3. ~~扩展差分场景：prestige/victory~~ ✅ 12 场景矩阵已含 veteran-run/prestige-restart/full-reset；剩余：胜利瞬间触发（城堡征服）、法术分支。
4. 类型体系（M10）：JSDoc 先行，core/ 与 persistence/ 优先。
5. symbol-map.json 元数据刷新（本次 30+ 字段映射写入）。

## 7. 禁止回退的文件

`archive/original/**`、`tests/fixtures/original.c2save`、`docs/symbol-map.json`、`docs/reverse-engineering/**`、`src/vendor/lz-string-1.3.3.js`、`output/perf/perf-baseline.json`（基线数据）。

## 8. 智能体产出验收状态

- 取证×3（字段语义）：✅ 已验证并落地/记录（27 字段身份全 HIGH）。
- 文档×3（architecture/runtime-entrypoints、game-state-schema/persistence、rng/time-model/baseline）：✅ 已提交；architecture.md 的 file:line 引用经智能体脚本核验；game-state 智能体发现 facts.md"29 键"笔误已修正为 30 键。
