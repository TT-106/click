# 状态所有权与存档映射

经典 game 不是存档 DTO，也不是产品显示快照。具体 JSON 声明以 `modules/persistence/save-dto.js`、`createSaveState` 和真实 fixture 为准；读写路径见 [persistence](persistence.md)。

## 经典状态分层

| 状态 | 所有者/作用 | 保存方式 |
|---|---|---|
| game.state | 冒险者、队伍、遭遇、回合/帧、统计/成就/点数等会话数据 | 显式映射至 DTO，不能整体 JSON.stringify game |
| world/dungeons/castles/shops/farms | 地图/注册表和实例状态 | DTO 有相应世界/管理器形态，部分由种子重建 |
| combatQueue/掉落/素材/相机/视图 | 运行过程对象与显示资源 | 不把整个对象树写入存档；独立字段按序列化器处理 |
| initialized/partyCreated/gameWon/worldActive | 生命周期标志 | 按既有 DTO 字段和恢复规则重建 |
| loop.simulationFault | R55 运行故障 | runtime-only，阻断自动保存；不是新经典 JSON 键 |
| engine.snapshot() | UI 需要的队伍/地点/金币/状态 | 临时显示投影，不能用它恢复完整游戏 |
| clean/classic 偏好 | 产品表现选择 | 独立 C2_PRESENTATION_V1，不进经典 DTO |

`runtime/game.js` 创建组合根；`resetRun`、`resetContinuation`、`continueRun`、恢复和 world 初始化分别处理生命周期。队伍/世界/统计可能被整体替换，接口要按实际稳定性绑定引用或实时 getter。属性名使用当前语义名，例如 `world.blockShiftCol`、`castles.nextRequiredMonsterLevel`、`state.adventurePoints.spentPoints`；具体点数字段以 DTO/源码核对，不从旧字母日志推导。

## 经典 DTO 契约

已初始化 SaveData 有30个顶层键，未初始化 SaveDataUninitialized 有4个。SAVE_TOP_LEVEL_KEYS / SAVE_BLANK_TOP_LEVEL_KEYS 与序列化分支/fixture 由 `audit-save-schema.mjs` 对账；新增字段不能用联合类型宽松包含关系掩盖错误。

运行时改名不改存档键。恢复和写出必须同步；例如世界 DTO 的 worldCenterX/worldCenterY/blockShiftCol/blockShiftRow 与当前同名世界字段对应。gameTimestamp 在写出时取当前墙钟，回读用于 lastActiveAt，方向语义不同。

角色/属性组件/法术状态/怪物/点数/地牢/世界已有具名 typedef，统计/城堡/商店仍有弱形态；类型与真实样本边界见 [m10-type-debt](m10-type-debt.md)。

## 原野与准备数据

OpenWorldSession.serialize 保存 generatorVersion/seed、全局位置、发现/到访位图、地点、时钟/暂停、路线与步内进度。可选 expedition 保存资源版本、营地、ownerIds/个人袋、仓库、已采位图、回环路线、阶段及最近归来。

当前 ownerIds 是显示姓名，不是永久角色 ID；资源/生成器不匹配会拒绝载入，没有通用迁移器。已采位图和历史有上限，按种子重建静态地貌不等于动态世界数据库。

准备层 JSON 的 schemaVersion/status 与运行时开放世界版本是不同协议。其 g/count/instance、配方和建筑尚未接线，不能据此解释当前抽象负重或已有玩家存档。桌面磁盘容器另保存版本1的记录集合/窗口偏好，内部保留经典和原野原文。
