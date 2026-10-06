# GLM 5.3 Flash 整夜内容准备结果报告(R52,2026-10-05)

> **历史档案，停止执行和更新。** 下文的“当前/最新/下一步”、数字、权限和命令只适用于原批次；不能用于当前开发或表示本轮验证。当前入口是 [文档索引](../README.md)。


> **R54独立复核：本文保留为R52交付原报告，下述“全部VERIFIED”不作为当前验收承诺。** 已发现并修正9条配方替代组、建筑/工位启动校验、跨种子连续缺货统计和工具失败退出；两张消失原图已从本地ZIP原字节恢复。当前结论、真实反例及接入顺序见 `CONTENT-PREP-ACCEPTANCE.md`。

执行:GLM-5.3-Flash(goal 驱动)。开工 2026-10-05T01:01+08:00,本报告收尾 2026-10-05T02:00+08:00 前后。
开工状态:main @ `2ba7b230d9c4106345c547da2ced2e48cd954e34`,工作树含 R42–R51 既有大量未提交修改(64 个跟踪文件 diff,开工与收尾完全一致)。

**实际有效工作时长约 1 小时,提前于 8 小时计划完成全部 T0–T9 核心任务与部分扩展池;未做的不冒充已做。** 本轮是内容准备(数据/素材/证据),不是游戏功能:新经济 0 字节接入运行时。

## 1. T0–T9 逐项状态

| 任务 | 状态 | 验收要点(证据等级) |
|---|---|---|
| T0 开工快照 | done | HEAD/分支/64文件diff与执行书一致;两份关键哈希匹配;2429 保护文件 SHA256 基线;check:assets EXIT=0、lint EXIT=0(`VERIFIED`) |
| T1 60类物品 | done | items.json 60 项全录(20/12/10/6/8/4);校验 EXIT=0;7 例反向验证全拒;11 项已注册图标/49 项缺图如实区分(`VERIFIED`) |
| T2 配方 | done | recipes.json 53 条(6.1常规24+园圃3+工具包10+武器护具13含5实例升级);4 例配方反向验证(未知ID/2ms/双扣/SCC环)全拒(`VERIFIED`) |
| T3 建筑 | done | 8 栋×3级=24 级;营舍/仓库一级免费;SCC 无解锁死循环;3 例建筑反向验证全拒(`VERIFIED`) |
| T4 素材检查 | done | 855 张 PNG 全量元数据(=854候选+1官方Preview,0不可解码);联系表 10 页 191 格;15 关键候选×3背景×2尺寸检查图;实看 65 种不同候选/约141格(`VERIFIED`) |
| T5 预览页 | done | Edge 真实浏览器:3视口×暗/浅×减少动画,0失败/0控制台错误/0失败请求 EXIT=0;截图10张(`VERIFIED`) |
| T6 收益测量 | done | 103 种子×8趟(100 complete)+20种子×40趟(800趟 complete);全部真实 OpenWorldSession;确定性对照与60ms tick 对照通过;6 种子诊断夹具截图(`VERIFIED`) |
| T7 成本展开 | done | 两个人工算例工具内断言通过;24 级展开 0 错误;synthetic-scenario 重算设计7.3示例一致(`VERIFIED`) |
| T8 缺口与动画包 | done | 60类图标覆盖表(11注册/49缺/1语义不合);5 个动画包候选(2个页面原文核验,2个pending,1个过渡可用);0 下载(`PARTIALLY VERIFIED`——在线候选仅研究) |
| T9 最终验收 | done | 内容校验/语法/五门禁/全回归通过;保护哈希比对(见§6 事故);新文件路径全部在允许范围(`VERIFIED`) |

## 2. 数据交付(content-prep/expedition-v1/,全部 planned-not-wired)

| 文件 | 内容 | 校验 |
|---|---|---|
| items.json/.csv | 60 类:量纲(mass/count/instance)、采集步长、phase A/B/C、来源用途、图标状态、设计出处 | `node tools/content-prep/validate.mjs items` EXIT=0 |
| recipes.json/.csv | 53 条:整批时间ms、anyOf 替代组5处(铜铁/煤炭/骨甲/药草凝胶/晶石魔力尘)、实例升级5条(输出=原实例)、手作/篝火变体、水井3级/园圃3线(外部来源) | `validate.mjs recipes` EXIT=0 |
| buildings.json + building-levels.csv | 24 级:免费标记、新增成本(非累计)、建造1/2/3分钟、功能解锁、带量纲效率字段、前置链、visual pending | `validate.mjs buildings` EXIT=0 |
| schema-notes.md / recipe-issues.md / unlock-summary.md | 录入规则、5项设计UNRESOLVED、核心解锁链与替代规则 | 人工可读 |
| asset-candidates.json / asset-review.csv / item-icon-coverage.md / animation-pack-candidates.md | 855 张元数据、22 条家族评审、60类图标覆盖、5 动画包候选 | T4/T8 |
| building-cost-analysis.json/.csv + building-cost-report.md + synthetic-scenario.json | 24 级原料展开、工位时间、批余量、5 条设计问题 | `node tools/content-prep/analyze-costs.mjs` EXIT=0(内含算例断言) |

反向验证:`validate.mjs negative` 共 14 例坏数据(物品7/配方4/建筑3)全部被拒绝,EXIT=0。"结构有效"≠"可上线":49 项缺图、phase B/C 条件启用项均如实保留缺口。

## 3. 工具交付(tools/content-prep/,全部可运行,EXIT=0)

`validate.mjs`(结构+反向)、`baseline-hash.mjs`(保护哈希)、`scan-asset-metadata.mjs`(PNG 元数据,零依赖纯 Node)、`make-contact-sheets.py` / `make-bg-checks.py` / `write-asset-review.py`(Pillow)、`analyze-expedition-economy-long.mjs`(20种子×40趟上限+异常捕获,采样语义与原脚本一致,2种子×8趟确定性对比逐物品一致)、`run-economy-batches.sh`(批量串行)、`aggregate-economy.mjs`(100种子汇总)、`analyze-costs.mjs`(成本展开)、`diagnostic-trajectory.mjs` + `render-diagnostics.py`(诊断夹具图)、`preview-acceptance.mjs`(Playwright 验收)、预览页 `index.html/preview.js/preview.css/README.md`。

预览启动:`$env:PORT='4181'; node scripts/serve.mjs` → `http://127.0.0.1:4181/tools/content-prep/index.html`(醒目标注"未接入游戏";四标签;键盘/筛选/脚点参考线/三背景;无游戏接线)。

## 4. 真实经济测量(标签:current-r50-rules / simulation-time / no-user-save)

- **103 种子×8趟**(种子 内容验收-001~003、011~110;100 complete,3 个 `waiting-no-reachable-frontier` 如实记录):归仓负重 P10/P50/P90 = 77/78/80(旧抽象单位);单趟模拟时长 P50 97.7s;800/800 趟归仓原因=weight-threshold。
- 物品缺货:leather 全无种子 47/100、趟零产出 89.9%、最长连续缺货 37 趟;crystal 34 种子全无;iron 4 种子全无、30.1% 趟零产出。
- 返程占比:前4趟 26.7% → 后4趟 29.5%(按种子中位);40 趟长跑 800 趟:前10趟 29.4% → 后30趟 34.0% —— 支持"固定营地+一次性节点拉长返程"(设计§9)。
- 20 种子×40 趟全部 complete;3 种子 60ms 复测:**仓库/件数与 240ms 完全一致**,仅时长差约 2%(量化),未改规则未放容差。
- 最差3种子诊断(截图标注"诊断夹具"):缺木材(5–15/8趟)源于营地可达圈无林区,金属反而正常;**布包替代皮料是必要保障**。
- 限制:新石料/黏土/水/食物来源未实现,采样中不存在;不是公斤经济/实时功耗/一周挂机;`summary-100x8.md`/`worst-seeds-analysis.md` 在 output/glm-r52/measurements/。

## 5. 素材与视觉

- 全量自动:855 张(854 候选+1 Preview)SHA256/尺寸/alpha/双重包围框,0 不可解码;855=建筑144+道具709+feudalwars2。
- 目视:10 页联系表 191 格 + 三背景检查 15 张;**65 种不同候选**(3建筑+41小道具+18个2x2道具+2 feudalwars+1 GPT概念)加冬季/光照/分辨率变体,约 141 格观察。
- 关键事实:建筑 8 文件=4朝向+4雪顶(季节内嵌文件序号);2x2 道具含手推车(4向)/水井(2向)/果蔬摊(4向);逻辑格与画布分离(128x64 名义的 PNG 实为 768²);三种风格互斥(rubberduck 写实 / feudalwars 像素 / GPT 二次元),不能拼成同一正式主题。
- 质量问题:无白边、无坏透明;B2-00 朝向门不可见;64x32 放大发糊;feudalwars 底部散件须计入占地;全部候选未标定脚点/占地/门位/遮挡层(alpha 包围框只是线索)。
- 缺口:园圃农田、地图室、专用炉窑、L2/L3 分级外观、屋顶分层/室内图全部缺失(详见 `asset-gaps.md`)。

## 6. 保护区域比对与事故

- 2429 个保护文件开工/收尾 SHA256 比对:**2427 个字节级一致**;跟踪文件 diff 保持开工时的 64 个,未新增跟踪文件修改(本轮文档改动在已修改集合内)。
- 新增未跟踪文件全部位于允许范围(content-prep/、tools/content-prep/、output/);无批量删除、未 commit/push/reset。
- **事故(UNRESOLVED)**:两个未跟踪 vendor 原图在本会话期间从磁盘消失,原因未查明——`assets/vendor/rubberduck-grassland/grassland_2x2.png`(基线 SHA256 `D63A3730…A52D9`)、`assets/vendor/rubberduck-isometric-plants/palm.png`(基线 SHA256 `BBC4305B…0B782`)。两目录 git 未跟踪无法恢复;src/scripts/tests/asset.json **零引用**,五项门禁与全部回归在消失后仍通过;基线已留存哈希便于将来从备份/原站恢复时字节比对。本会话所有工具对该目录只读,已排查测试删除路径(tests 中的 rm 均作用于各自 tmpdir)。

## 7. 本轮明确**没有**实施的内容

新经济生产接线、升级/解锁运行时、公斤负重迁移、旧档迁移、角色/怪物动画引入、建筑/物品图标注册、前哨与货运、战斗、桌面打包、Godot、任何 src/ 修改、任何 git 写操作。数据全部停在 `planned-not-wired`。

## 8. 给下一位工程师的三件事

1. **按阶段A切片接线**:用 items/recipes/buildings.json 实现质量计量+迁移→石/黏土/纤维/食材/水来源→工坊/炉窑/水井→布包与口粮真实消费(设计§13A);`validate.mjs` 可改造为运行时数据门禁。
2. **先解决三个 UNRESOLVED**:铁锭"紧固部分"替代范围;兽骨工具柄适用配方清单;两个消失 vendor 文件从备份/原站恢复(基线哈希可比对字节)。
3. **素材主题决策**:GPT 二次元 vs rubberduck 写实二选一,按"工坊+井+营舍"三栋小样校准(设计§11.3),同时补 49 项物品图标(优先石/黏土/纤维/食材/水);可直接复用 60 类图标覆盖表与三背景检查流程。

可直接复用:content-prep/expedition-v1/ 全部 JSON/CSV/MD;tools/content-prep/ 全部工具;output/glm-r52/ 全部证据(检查点、日志、退出码、截图、测量)。

## 9. 扩展池执行记录

- 真实种子扩到 103(目标100)✓;长趟扩到 20种子×40趟(目标20×40)✓;最差种子可达性报告 ✓(6种子诊断图+分析)。
- 视觉候选观察总数约141格(超过60下限,未达120种不同候选——如实报告:65种不同候选+变体)。
- 未做:Mermaid 关系图、预览页200%缩放检查、美术规格文档(时间提前完成核心后的取舍,未凑数)。

## 10. 证据等级汇总

- `VERIFIED`:T0–T7、T9 全部;T4 全量自动部分与实看部分;T6 全部统计。
- `PARTIALLY VERIFIED`:T8 动画包候选(2/5 页面原文核验,其余仅搜索摘要);视觉覆盖 65/120 种。
- `UNRESOLVED`:消失的两个 vendor 文件原因;铁锭紧固替代范围;兽骨柄适用清单;提灯持续时间等设计留白;在线素材未实际下载核验许可原文。
