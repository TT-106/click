# 持久化与恢复

经典、原野和桌面容器是三个明确边界；它们没有统一存档文件。字段形态见 [game-state-schema](game-state-schema.md)，具体经典数值/时间参照 [time-model](time-model.md)。

## 经典记录

| 项目 | 当前契约 |
|---|---|
| 主键/备份 | C2_V1_001 / C2_V1_001_backup |
| 编码 | 显式 SaveData → JSON → 固定 LZ-string 1.3.3 Base64；反向解码恢复 |
| 自动保存 | 300秒（runtime/game.js 的 autoSaveInterval=3E5），暂停可保存，离线/模拟故障跳过 |
| 时间戳 | 写当前墙钟，恢复到 lastActiveAt；不是最后一个已结算回合时间 |
| 输入/解压上限 | 编码文本2MiB，解压 JSON 8MiB，Worker超时5秒 |
| 已初始化/空白档 | 30 / 4顶层键，schema审计精确双向对账 |

`services/saves.js` 启动先交 Worker inspect；失败置 blocked 并保留原文。引擎恢复失败时 loop 回退至初始化空白档并通知保存服务阻断，避免临时状态覆盖坏档。普通 write 在内容变化前备份上一记录；失败明确提示导出。

导入先验证，事务期间阻止引擎内部落盘；失败恢复此前状态/暂停，成功写入新记录并留备份。reset 与 restore 也由服务编排，不直接让 UI 调内部序列化对象。真实历史兼容只有一个 fixture，多版本样本仍缺。

## 原野记录

主键 C2_OPEN_WORLD_V1，备份 C2_OPEN_WORLD_V1_backup，最近一次恢复/坏档重开前原文 C2_OPEN_WORLD_V1_before_recovery。generatorVersion=1，资源子记录带自身版本；旧村 C2_FOREST_VILLAGE_V1 和经典主键独立保留。旧原野记录没有 expedition 时在当前位置建立营地，不迁移经典库存。

controller 约每1.5秒及阶段/归仓变化、暂停/离开时保存；内容变化前保留上一原文。失败保留提示，载入无效记录置 saveBlocked，临时探索可继续但不自动覆盖；checkpoint 会拒绝主动保存。重新生成世界将正常随身物归仓，但在保存阻断状态下不继承损坏库存。

原野工具栏已有“恢复备份”：玩家先确认可能回退最近收获，`restoreBackup()` 完整校验备份后先留档当前原文，再写回恢复后的记录，保留好备份。坏档重开同样单独留档，不把坏主键顶进好备份；取消、校验失败或留档/写回失败均不切换会话。桌面恢复/重开等待 `flush()` 确认磁盘写入，失败回滚内存主记录，仍保留备份。操作期间冻结原野模拟并拒绝重复操作；`checkpoint()` 在存储拒写时抛错，不能冒充保存成功。原野保存阻断会显示“临时探索 · 未保存”，桌面小窗可通过“恢复记录”展开管理界面。

单个 localStorage 键操作不构成多键原子事务；保留键只保存最近一次被替换记录，不是无限历史。普通备份在后续内容变化时仍会轮换，原野网页导出/导入与多版本迁移尚未实现。

恢复验证版本、坐标/可走性、队伍相邻、路线连续、位图包含、数量/容量/阶段/归来记录。显示名作ownerIds使改名按离队处理，旧袋归仓；稳定身份/迁移仍待做。资源或生成器版本不匹配直接拒绝，不是通用升级迁移。

记录包括区块历史位图，不保存全世界图片/对象。每份历史8192区块、地点10000条及约一百万格坐标校验范围；浏览器配额仍限制实际长期容量。开放世界导出/导入 UI、动态分块数据库尚未完成。

## 桌面容器

主进程通过 electron-store 保存 `%APPDATA%\ClickpocalypseCompanion\adventure.json` 与 adventure.json.bak，窗口偏好另存 window-settings.json。网页 localStorage 与桌面记录独立；经典Base64/原野JSON仍按原协议保留，桌面只是另一个宿主存储实现。

desktop-storage 是同步内存读写/异步合并提交桥；磁盘通常500ms后提交，返程/暂停/收起/退出等要求检查点确认。磁盘提交失败不显示主动保存成功，退出等待提交。保存键白名单现已纳入原野备份和恢复前留档；这些文本同样计入容器总量12MiB、单条经典仍限2MiB。没有原野网页/桌面的统一迁移入口。

验证命令：经典 codec/schema/单测/parity/E2E，原野 `test:village`/`test:expedition` 与 save-safety 单测，桌面 `test:desktop`/`test:expedition:desktop`；不同协议分别验收，原版差分不覆盖原野事务或磁盘写入。
