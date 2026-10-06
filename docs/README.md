# 文档索引与维护规则

新开发者先读 [项目 README](../README.md) → [当前状态](WORKSTATE.md) → [开发指南](DEVELOPMENT.md) → [架构](architecture.md)，再按修改的系统选择技术参考。领域用词见 [CONTEXT](../CONTEXT.md)。

## 唯一职责与事实层级

当前状态/实测数字只在 WORKSTATE 更新；操作和兼容约束只在 DEVELOPMENT 维护；经典验收判定只在根 REFACTOR_REPORT 附录 A 修改。其它文档引用这些入口，不复制一份“最新全绿”。

发现冲突时，先区分系统和证据日期，再交叉核对：当前可达代码行为与测试 → 配置/目录/调用路径 → 当前架构边界 → 明确设计决策与目标 → Git演进 → 文档上下文。实现可能有错时记录反例，不用文档合理化缺陷；最新修改时间和日志自报不能单独定案。已决定的设计目标仍可与尚未完成实现有差距。

文档状态只有四类：当前指南、未完整实现的设计、注明日期的研究/测量、停止执行的历史。历史任务书不授予权限，历史数字不表示当前验证。外部许可/平台/法律研究只代表研究时点，发行前另行核实。

## 当前指南与技术参考

| 文档 | 职责 |
|---|---|
| [WORKSTATE](WORKSTATE.md) | 当前工作树、指标、最近检查和接手问题 |
| [DEVELOPMENT](DEVELOPMENT.md) | Windows运行/改动契约/验证选择/维护方法 |
| [architecture](architecture.md) | 经典、原野、桌面、准备层的架构与所有权 |
| [architecture-debt](architecture-debt.md) | 未闭合结构问题、判断依据、重要否决理由 |
| [modernization-status](modernization-status.md) | “完整现代化”的验收口径，避免以指标当完成 |
| [REMAINING-WORK](REMAINING-WORK.md) | 当前工程待办和四条PARTIAL缺口 |
| [m10-type-debt](m10-type-debt.md) | 类型范围、cast口径、DTO接线与剩余弱形态 |
| [BRANCH-WORKFLOW](BRANCH-WORKFLOW.md) | main、Godot worktree隔离与传递约定 |
| [runtime-entrypoints](runtime-entrypoints.md) | 产品/测试/调试入口与排障 |
| [baseline](baseline.md) | 经典行为参照与差分方法/边界 |
| [game-state-schema](game-state-schema.md) | 状态所有者、显示快照与不同保存协议 |
| [persistence](persistence.md) | 经典/原野/桌面写入、阻断、备份与恢复 |
| [time-model](time-model.md)、[rng](rng.md) | 独立时钟、经典双随机源与消费顺序 |
| [rendering](rendering.md) | classic/clean、DPR、投影、缓存及渲染边界 |
| [ASSET-RENDERING-UPGRADE](ASSET-RENDERING-UPGRADE.md) | 资源接口的取舍/几何/播放器限制；教程只在assets README |
| [OPEN-WORLD](OPEN-WORLD.md) | 当前连续原野的生成、探索与存储限制 |
| [DESKTOP-COMPANION](DESKTOP-COMPANION.md) | Windows试用、窗口/托盘/存储与验证 |
| [EXPEDITION-INVENTORY](EXPEDITION-INVENTORY.md) | 当前七材料、背包、返程和归仓 |
| [combat](formulas/combat.md)、[items](formulas/items.md)、[progression](formulas/progression.md) | 经典数值公式与证据；发现文档错误可纠正，不能借此修改规则 |
| [p1-skill-consumption](p1-skill-consumption.md)、[u7-upgrade-usage](u7-upgrade-usage.md) | 技能消费与升级入口覆盖映射 |
| [素材导入](../assets/README.md)、[库存来源](../assets/vendor/README.md) | manifest/图片导入与完整来源许可清单 |
| [CONTENT-PREP-ACCEPTANCE](CONTENT-PREP-ACCEPTANCE.md) | R54准备层纠错结论、验证边界及分片接入方案 |
| [准备数据索引](../content-prep/expedition-v1/README.md)、[预览工具](../tools/content-prep/README.md) | 数据草案/派生表职责与独立工具运行 |

## 设计与研究

| 文档 | 状态/用途 |
|---|---|
| [GAME-PRODUCT-TODO](GAME-PRODUCT-TODO.md) | 已确认目标、实现差距、建议和待定规则；工程进度指向WORKSTATE |
| [ECONOMY-BASE-DESIGN-V1](ECONOMY-BASE-DESIGN-V1.md) | 未接线的计量/生产/基地设计；JSON为该草案的结构化录入，不是运行时 |
| [商业发行规划](COMMERCIAL-RELEASE-PLAN-2026-10-05.md) | 免费测试到原创收费的阶段计划；原状态段为编写时点，尚未执行全部阶段 |
| [架构研究](research/ARCHITECTURE-RESEARCH.md) | 2026-10-04外部方案与当轮落地记录 |
| [建筑研究](research/BUILDING-ASSET-RESEARCH.md) | 2026-10-05来源/候选与基地模式研究 |
| [素材来源经验](research/ASSET-SOURCE-EXPERIENCE.md) | 站点核验时点/等级与缺口查找方法；不是当前采购建议或许可证替代品 |
| [发行研究](research/COMMERCIAL-RELEASE-RESEARCH-2026-10-05.md) | 2026-10-05外部权利/平台/发行条件，发布前重新核验 |

## 保留证据与历史

- 根目录 [REFACTOR_REPORT](../REFACTOR_REPORT.md)：恢复总结及当前经典验收矩阵；正文逐批明确区分历史。
- [COMPATIBILITY_REPORT](../COMPATIBILITY_REPORT.md)：经典兼容证据分级与限制；[MIGRATION_MAP](../MIGRATION_MAP.md)：原版到现模块映射。
- [PERFORMANCE_REPORT](../PERFORMANCE_REPORT.md)、[CPU样本](performance-baseline.md)、[帧时间样本](performance-after.md)：冻结的2026-09-26/27样本，不表示当前性能。
- [耗尽审计](m13-exhaustion-audit.md)：冻结的2026-09-26残留项扫描与2026-10-03补注，不当当前类型台账。
- [逆向证据索引](reverse-engineering/README.md)：facts、semantic-map、unresolved保留原证据，当前接口从源码核对；symbol-map.json是机器映射，不能重置。
- [ADR0001](adr/0001-retain-original-as-test-oracle.md)：保留原版参照；原生专属ADR在Godot分支。
- [历史索引](history/README.md)：逐轮日志、旧架构、旧待办、已执行任务书与被R54纠正的GLM原报告。
- [整理报告](DOCUMENTATION-REPORT.md)、[逐文件清单](DOCUMENTATION-INVENTORY.md)：本次治理结果与每份文档处置。

`.workbuddy/memory/` 是本地代理记忆，`output/` 是忽略的日志/截图/构建证据，不作版本化项目规则；没有替用户修改这些记忆。原版README和vendor许可证作为来源档案保持原字节。

## 维护与验证

改当前功能时同步对应指南和WORKSTATE；改未实现设计时保留未接线状态，JSON/CSV派生和校验按准备层约定执行。当前技术引用优先使用完整路径+符号；需要逐字摘录时保留可检查的片段引用，不自动批量改数值或猜符号。

文档检查命令见DEVELOPMENT。check-doc-counts只覆盖固定11份技术/报告文件，doc-mappings只核对两个文件且“名字存在”不证明语义正确；anchors是启发式、有历史基线，退出0不表示全部引用正确；refs仅核路径/越界，不核含义。本轮另做全量本地链接、引用和字节保护核对，没有放宽这些门禁。
