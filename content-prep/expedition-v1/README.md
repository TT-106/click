# content-prep/expedition-v1 — 原野经济 V1 数据草案索引

> **状态:`planned-not-wired`(未接线设计草案)。** 本目录是 R52.1 整夜内容准备的数据交付,
> 设计来源 `docs/ECONOMY-BASE-DESIGN-V1.md`(第 4–8 章),**没有任何内容接入游戏运行时**。
> 实际成果与证据等级见 `docs/history/GLM53FLASH-OVERNIGHT-RESULTS.md`;录入约定见 `schema-notes.md`。
> R54独立验收发现替代组、启动依赖和统计口径问题并修正；当前结论与接入顺序以 `docs/CONTENT-PREP-ACCEPTANCE.md` 为准。

## 数据文件(JSON 为主表,CSV 为派生,不手工改 CSV)

| 文件 | 内容 | 校验 |
|---|---|---|
| `items.json` / `items.csv` | 60 类物品(原料20/加工12/消耗10/工具6/装备8/研究收藏4);量纲、采集步长、阶段、来源用途、图标状态 | `node tools/content-prep/validate.mjs items` |
| `recipes.json` / `recipes.csv` | 53 条配方;anyOf 替代组、5 条实例升级、手作/篝火变体、水井/园圃外部来源 | `node tools/content-prep/validate.mjs recipes` |
| `buildings.json` / `building-levels.csv` | 8 栋×3 级;免费标记、新增成本(非累计)、带量纲效率、前置链、visual pending | `node tools/content-prep/validate.mjs buildings` |
| `building-cost-analysis.json` / `.csv` | 24 级原料展开(场景A独立/场景B连建)、工位时间、批余量 | `node tools/content-prep/analyze-costs.mjs` |
| `asset-candidates.json` / `asset-review.csv` | 855 张候选 PNG 元数据 / 22 条家族视觉评审 | `tools/content-prep/scan-asset-metadata.mjs` |
| `synthetic-scenario.json` | 标注 `synthetic-scenario` 的候选演算参数(设计7.3示例),**不是实测** | — |

## 说明文档

- `schema-notes.md` — items 字段约定、量纲规则、phase 判定依据
- `recipe-issues.md` — 配方录入的 5 项设计 UNRESOLVED 与替代/边界记录
- `unlock-summary.md` — 24 级成本总表、核心解锁链、替代规则
- `building-cost-report.md` — 成本展开可读报告(含 5 条 proposal)
- `item-icon-coverage.md` — 60类图标覆盖（11注册/1候选/48缺失）+ 8 栋建筑过渡图缺口
- `animation-pack-candidates.md` — 5 个角色/怪物动画包候选(2 核验/2 pending/1 过渡可用,0 下载)
- `batches/` — 六批物品的原始录入文件(合并进 items.json 的留痕)

## 反向验证

`node tools/content-prep/validate.mjs negative` — 14 例坏数据(物品7/配方4/建筑3)必须全部被拒绝;接线上生产前建议把它改造成运行时数据门禁。

`node --test tools/content-prep/test-content-rules.mjs` — 追加29项实际语义与反例测试。结构校验和启动可达性不是运行时库存事务或生产调度验证。
