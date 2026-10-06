# 外部调研 + 架构 Review 技术报告

> **研究时点快照。** 下文“当前/推荐/已核验”指文内研究日期，治理时未重新核验外部规则。实现看 [WORKSTATE](../WORKSTATE.md)，导入/发行前重新核实具体来源。


> 日期：2026-10-04。范围：**竞品技术调研 + 开源项目考古 + 架构 Review + 技术选型 + 工程重构**。
> 对象：本仓库（Clickpocalypse II 恢复与现代化工程）。
> 方法：先读当前代码确认真实状态，再对"已经解决过同类问题的成熟项目"取证，抽象设计原则，
> 回到当前代码逐条验证，最后落地可回归的改动。**不预设结论、不为了架构漂亮而重构。**
>
> 本文所有"当前项目"的陈述都能用文中给出的文件路径复看；**刻意不写 `file.js:行号`**，以免与行号棘轮门禁冲突。
> 外部陈述均标注来源与证据等级。未做的事单独列在 §9，不得读成"已完成"。

---

## 0. 证据分级（本文使用）

| 级别 | 含义 | 举例 |
|---|---|---|
| E1 | 成熟开源项目的**实际代码/官方数据仓库** | Factorio 官方 `factorio-data` 仓库、RimWorld Defs XML、KeeperRL ContentFactory |
| E2 | **官方引擎/框架文档**（长期维护） | PixiJS Assets 指南、Tiled 文档、Godot 文档 |
| E3 | 长期维护项目的**工程经验/权威问答** | Shaun Lebron《IsometricBlocks》、StackExchange / Godot 论坛被采纳答案 |
| E4 | 高质量技术文章/博客 | 性能优化文章（MDN / web.dev） |
| E5 | 个人观点 | —— |

判定：**E1/E2 > E3 > E4 > E5**。不同项目方案冲突时，本文不简单取一，而是比较其
**规模 / 内容量 / 性能约束**再判断"为什么产生不同设计"。

---

## 1. 结论摘要（先给答案）

1. **本项目的资源/动画"内容扩展"问题，比任务描述里假定的进展得多。** 任务列出的未来诉求
   （多帧动画、Idle/Walk/Attack/Hurt/Death、多方向、更多角色/怪物、贴图替换、低成本内容生产）
   **已经有一套落地的语义资源系统在支撑**：`rendering/asset-catalog.js`（语义目录）+
   `rendering/frame.js`（独图/图集统一的归一帧）+ `rendering/entity-visual.js`
   （idle/walk/attack/hurt/death/cast/interact × 四/八方向的 clip 状态机）+
   `scripts/import-assets.mjs`（`assets/**/asset.json` → 自动发现帧 → `src/data/assets.generated.js` 清单）。
   **新增一个角色/怪物外观 = 加一个素材包目录 + 一次导入，不改渲染代码。**
2. **真正没被解决的，是"加错会不会静默失效"和"地图显示层的可扩展性"**，本轮把这两条都落地了：
   - **静默失效**：精灵名拼错/跨组写错时运行时只画空白、不报错。→ 新增 `scripts/audit-asset-refs.mjs`
     + lint 不变量第 12 条（对账 **1,283 处名字字面量、49 处可判定组调用**，见 §6.2）。
   - **tile 显示层只有 3 个固定槽**（background/decoration/cachedBackground），加"家具/屋顶/前景"要改字段+改渲染。
     → 泛化为**数据驱动**（`world/tile-visuals.js` 的 `TILE_VISUAL_SLOTS` + 逐 tile 动态层，见 §6.3）。
   - **`map.sceneObjects` 通道已存在但无生产者**（只有初始化成 `[]`）。
     → 补上**场景物件生产者**：主题声明规则 → 生成期确定性物化（`world/scene-objects.js`，见 §6.4）。
3. **不要引入 ECS。** 多份独立来源一致：ECS 只对"大量同质实体 + 每帧批量重算"这一种形状划算；
   本项目是"几十个手写实体 + 每个行为独一无二"的放置类 RPG，上 ECS 是纯开销（§3.5）。
4. **两处硬编码已消除**：世界/地牢**各 35 行**展开的地图候选窗调用，提为 `rendering/map-window.js` 单一数据源（§6.1）。
5. **重要更正（"先理解代码再对标"的产物）**：经典地图**并非"不能用新美术"**。tile/主题的素材解析走
   `game.terrainSprites` 这个**语义门面**（`AssetCatalog.group()`：先查语义目录别名，再回退原版图集）。
   所以主题/图块写一个新素材的 id、或写素材包声明的 `replace` 目标，就能直接生效。这条在初稿里写错过，
   已按代码更正（详见 §5 行 A）。

---

## 2. 当前项目真实状态核对（先理解，再对标）

任务要求先回答一串"当前如何做"的问题。逐条给**代码事实**：

| 问题 | 代码事实 | 证据位置（路径） |
|---|---|---|
| 地图如何生成/拼接 | 逻辑层是**正交二维网格**；大地图按 16×16 区域（region）与 worldBlock 滚动生成，地牢按种子生成房间图 + 连通走廊 + 楼梯。布局完全由 `hashCoordinates(col,row,level)` 种子决定（同种子同布局） | `world/generation.js`、`world/regions.js`、`world/terrain.js`、`world/rooms.js`、`core/math.js` |
| 45° 倾斜坐标体系 | **不是 45°**，是 dimetric（约 25.7° 轴倾角）。`projectMap(x,y)`：`screenX=370+dx-dy`、`screenY=225+(dx+dy)×13/27-elevation`；基向量 `(27,13)`/`(-27,13)` → 54×26 菱形。旧角色投影每格 Y 用 13.5、旧地图用 13，**历史差异被刻意保留** | `rendering/projection.js`、`core/screen-layout.js` |
| 资源如何加载/裁切 | 双轨：**旧图集**（`SpriteSheet` 按固定方格 `spriteSize` 裁切，`getSprite(name)`）；**新素材包**（`AssetCatalog`，每帧显式 `source.rect` 或整图，尺寸/锚点/offset 逐帧可配） | `rendering/sprites.js`、`rendering/asset-catalog.js`、`rendering/frame.js` |
| 为什么把大量素材合成一张图 | **历史包袱 + 性能**。原版把数百图块打进 `spritesheet/terrain.png`（54px 方格）等图集：减少 `drawImage` 纹理切换、避免数百次独立网络请求（2013 年浏览器游戏的通行做法，与 MDN/web.dev 建议一致，E4）。新系统**不要求**合图，已支持独图 | `runtime/game.js`（`createAssetCatalog` 的 `legacyGroups`）、`assets/README.md` |
| 哪些位置存在硬编码 | ① 经典候选窗 35 行展开 ×2（**§6.1 已消除**）；② tile 恰好 3 个固定显示槽（**§6.3 已数据化**）；③ 地牢主题是 10 张手写名字表（数据，可接受）；④ 投影常量集中在 `core/screen-layout.js`（已是单一来源）；⑤ `hashCoordinates` 等生成常量 | `rendering/map-window.js`、`world/tile-visuals.js`、`content/dungeon-themes.js`、`core/screen-layout.js` |
| 游戏对象与素材如何绑定 | **两种绑定并存**：旧 tile 用"稳定 assetId + 晚解析访问器"（`installTileVisualAccessors`，替换素材后已生成的地图也取新资源）；实体保留**规则身份**（`spriteName`/`getName()`），显示时经 `game.assets.resolve()` 重新解析 | `world/tile-visuals.js`、`rendering/scene.js` |
| 渲染与游戏逻辑是否耦合 | **同在一个 tick 内顺序执行，但用 `renderEnabled` 开关 + try/catch 解耦**：渲染异常只记日志、不影响模拟。显示数据（帧/锚点/动画播放态/场景物件）**不写实体、不进存档、不消耗 RNG** | `simulation/loop.js`、`rendering/frame.js`、`rendering/entity-visual.js`、`world/scene-objects.js` |
| 当前动画系统如何实现 | clip 状态机：`{idle/walk/attack/hurt/death/cast/interact}` × `{N,NE,E,SE,S,SW,W,NW}`；**播放状态放在 WeakMap**，时间轴取"回合 × 15 + 累积量"（暂停自然停帧）；攻击由 `lastAttackTurn` 变化触发一次；缺失状态回退 idle | `rendering/entity-visual.js`、`content/animations.js` |
| 新增角色/怪物/建筑要改多少代码 | **外观**：加素材包 + `replace`/别名，0 行渲染代码。**规则**（新怪物品种/职业/装备）：改对应 `content/*.js` 数据表。**地图装饰**：可加主题规则（§6.4），或用 `addTileVisualLayer`；缺的是地图编辑器 | `assets/README.md`、`content/monsters.js`、`content/classes.js`、`world/scene-objects.js` |
| 主要扩展瓶颈在哪 | ① `sceneObjects` 缺**编辑器/持久化**（生产者已在 §6.4 补上）；② 单脚点 painter 排序处理不了长斜墙跨角色遮挡；③ `game` 单例耦合（仓库自跟踪的债，**非本任务的资源轴**，此处只标注不动）。**注**：经典地图图块/主题**已能**解析语义素材（新美术可直接用），不是瓶颈 | `rendering/scene.js`、`world/scene-objects.js` |

**一句话**：项目不是"待从零设计"，而是"资源/动画轴已经现代化了大半，剩下的集中在**验证**与
**地图显示层/内容产出的可扩展性**"——本轮把两者都推进了。

---

## 3. 外部调研：已经解决过这些问题的项目

### 3.1 数据驱动内容系统（E1/E2，本任务最重要的一类）

**结论先行**：所有活得久、内容量大的游戏，都把"加内容"做成**加数据**而不是**改代码**。

| 项目 | 机制 | 证据 |
|---|---|---|
| **RimWorld** | 所有内容（Thing/Recipe/Biome/…）是 XML **Def**；用 `ParentName` 继承抽象父 Def、`Abstract` 定义模板、`DefPatches` 做局部改写；C# 类通过 `Class=` 挂到 Def 上 | RimWorld Wiki: Modding Tutorials（E2/E3） |
| **Factorio** | **prototype 系统** + 三阶段数据加载（`data.lua` → `data-updates.lua` → `data-final-fixes.lua`）+ 明确的 **migrations**（原型改名必须写迁移，否则旧存档里实体消失）；官方把全部原型放进 `wube/factorio-data` 仓库版本管理 | Factorio Wiki / Prototype API / factorio-data 仓库（E1/E2） |
| **KeeperRL** | `ContentFactory` 启动时从纯文本配置加载 creatures/items/furniture/technology；支持 `inherit` 继承与 `append` 追加、`Def/End` 宏 | DeepWiki: KeeperRL Content and Data System（E1） |
| **Minecraft（Fabric 生态）** | **静态注册表**（方块/物品，启动冻结）与**动态注册表**（生物群系/附魔/掉落表，world 加载时从 datapack JSON 读取）；配 `Codec` 做编解码校验 | Fabric Dynamic Registry 文档 / Minecraft data-driven registry 文档（E2） |
| **Hytale** | Data Assets（JSON）驱动方块/物品/NPC/世界生成/掉落表 | Hytale modding 文档（E2） |

**为什么这样设计**（跨项目一致）：
- 内容团队不必碰代码、不必重编译；平衡性调整是改数字，不是改逻辑。
- 内容错误在**加载期**暴露（Codec/校验/表驱动核对），而不是玩到一半静默出错。
- 继承/补丁避免 N× 复制（RimWorld 的 `BaseWeapon`→`BaseGun`→具体枪；Factorio 的原型层级）。
- 多阶段加载解决"我的模组想改别的模组的原型，但不能依赖它排最后"（Factorio）。

### 3.2 等距/Y-Sort/遮挡（E3，本项目"长斜墙"痛点的正解）

| 来源 | 关键结论 |
|---|---|
| **Shaun Lebron《Drawing isometric boxes in the correct order》** | 2D 等距下"谁在谁前面"只构成**偏序**（partial order），不是全序；两张不重叠的精灵**无法推断**相对顺序。正确做法是建**依赖图（DAG）+ 拓扑排序**；出现环要**断环或裁剪**，或把大物件**切分**。 |
| Aleksandar Prokopec《Isometric Scala Game Engine》 | 同上：全序排序（含二叉搜索树/比较排序）会"凭空乱序"；须逐对比较建依赖图，但可**按邻域剪枝**（只查邻近 7 格），复杂度可控。 |
| TextureMind《How to write an Isometric Engine in pure 2D》 | 只有两盒在屏幕上重叠时才需定序；用计分/拓扑排序解决，O(N²) 但可优化。 |
| Godot 4 `TileMapLayer` Y-Sort（E2/E3 论坛被采纳答案） | 排序看 **Y-Sort Origin**（脚点），不是贴图中心；**同一 z_index 内才排序**；多图层叠加互相遮挡需要各自设置 Y-Sort Origin。 |
| 本项目现状 | 已踩正解前半：`visualDepthPosition` 用**世界脚点**排序、`layer` 只在**相同深度打破平局**、`footprint` 描述多格前沿。缺的是**偏序 + 断环**，仍用单脚点全序——这正是长斜墙会错的根因。 |

### 3.3 资源管线（E2）

| 来源 | 关键结论 |
|---|---|
| **PixiJS Assets（v7/v8）** | 用 **manifest + bundles** 声明式描述加载策略；`loadBundle('level-1')` 整屏加载、`backgroundLoad` 后台预载；支持格式回退 `img.{webp,png}`；官方推荐用 **AssetPack CLI 扫描目录自动生成 manifest**，而不是手写。 |
| Godot import / 资源 UID | 引擎导入期生成 `.import` 元数据；资源有稳定 UID，改名不破坏引用。 |
| Unity Addressables / SpriteAtlas | 分组 / 远程加载 / 平台变体。 |

本项目对照：`assets/**/asset.json`（声明式）+ `scripts/import-assets.mjs`（**扫描目录自动发现帧**，等价于 AssetPack）
+ `assets.generated.js`（生成的 manifest）+ `AssetCatalog` 按 `bundle` 过滤实现"不同主题独立目录、未进入的场景不加载图片"。
**已是同一思想，无需替换。**

### 3.4 瓦片数据层（E2）

- **Godot TileSet**：每个 tile 可挂 **custom data layers**（typed，如 `walkable: bool`、`cost: float`）、
  physics layer、terrain set（自动拼接）；代码用 `local_to_map` + `get_cell_tile_data().get_custom_data("cost")` 读取。
- **Tiled**：tileset 里每个 tile 可带 `properties`（walkable/collides/…）、`animation`（帧列表 + duration）、
  `probability`；对象层用自由形状承载 spawn/trigger/path。

**对本项目的意义**：本项目把"规则"与"显示"分得很清楚（tile 只存显示素材 id，规则走 `floorType`/`tileGrid`），
这是对的；本轮把"tile 的显示层"做成**可扩展数据**（§6.3），并让"地图物件"有了**数据驱动的生产者**（§6.4）。

### 3.5 ECS 的适用边界（E3/E4，多源一致）

| 来源 | 结论 |
|---|---|
| ECS 科普 + Unity 生态分析 | ECS 对"**大量同质实体** + 每帧批量重算"（弹幕、RTS 千人单位、殖民地/工厂模拟、粒子）划算；对"几十个手写实体、行为各不相同"的叙事/解谜/原型是**纯开销**。 |
| 关于层级/调试的两篇 | ECS 的代价：复合原型爆炸、失去调用栈（调试要脑内模拟系统调度）、父子层级需额外组件+拓扑、结构化变更缓冲（ECB）。 |
| 混合现实 | Unity 主流仍是 GameObject/MonoBehaviour，DOTS 只用于特定子系统；UE 用 Actor 模型 + Mass 只做人群/AI。**几乎没有纯 ECS 的出货游戏。** |

**判定：本项目不引入 ECS。** 本项目实体（Character/Monster/Door/TreasureDrop）在几十到几百量级，
行为靠继承/分支（`Character` + 各 `*Behavior`）表达，迁移到 ECS 只会把可读性换掉、不换来性能。

### 3.6 Canvas 2D 性能（E2/E4）

- **离屏预渲染**静态/重复图元，每帧只 `drawImage` 一次离屏画布（MDN、web.dev 均列为首要建议）。
- **按更新频率分层画布**（背景/游戏/UI），脏区重绘。
- **整数坐标**（避免亚像素抗锯齿开销）；**不要在 drawImage 里缩放**（预缩放并缓存）；避免频繁 `globalCompositeOperation`/阴影/文字。
- **对象池**复用（子弹/特效）。

本项目对照：`clean` 路径已在做"固定重采样 + 整数物理像素 + 地形缓存（WeakMap）"；**对象池**在战斗动作队列
（`combat/actions.js`）已有先例。可复用的是"把特效/掉落也池化"——目前无性能压力证据，**不做**（§8）。

---

## 4. 抽象出的设计原则（每条都对应"已被验证"）

| 编号 | 原则 | 验证来源 |
|---|---|---|
| **P1** | 加内容 = 加数据，不改代码 | RimWorld / Factorio / KeeperRL / Minecraft / Hytale |
| **P2** | 内容错误必须在**加载/构建期**失败（fail loud），不能静默 | Minecraft Codec、Godot TileSet 类型化 custom data、本项目 `validateAssetDefinition` / `validateSceneObjectRule` |
| **P3** | 用继承/模板 + 补丁消除 N× 复制 | RimWorld ParentName/DefPatches、Factorio 原型层级 |
| **P4** | 资源用**生成的 manifest + bundle 分组 + 懒加载**，绝不手维护路径 | PixiJS Assets + AssetPack |
| **P5** | 深度排序用**脚点 + 同层才排序**，不用贴图中心/高度 | Godot Y-Sort |
| **P6** | 2D 等距遮挡只是**偏序**：要么切分大物件，要么依赖图 + 断环/裁剪 | Shaun Lebron、Prokopec、TextureMind |
| **P7** | ECS 只对特定形状划算；本项目**不适用** | 多源一致（§3.5） |
| **P8** | 静态内容离屏缓存、整数坐标、按频率分层、对象池 | MDN / web.dev |
| **P9** | 多阶段加载允许"后加载者覆盖先加载者"，避免依赖排序 hack | Factorio data 三阶段 |
| **P10** | tile/物件同时承载**显示数据**与**规则数据**（分层，类型化） | Godot custom data layers、Tiled properties |

---

## 5. 外部经验 → 当前问题映射（不是资料汇总，是"该不该迁"）

| 当前问题 | 同类项目怎么做 | 为什么这样 | 适合我们吗 | 迁移方式 |
|---|---|---|---|---|
| **A. 经典地图图块/主题解析资源** | Godot：TileSet 引用纹理源；Tiled：tileset 是数据 | 内容与代码分离（P1） | **已支持**（反向核对：tile 走 `AssetCatalog.group()` 语义门面，先查别名再回退图集） | 无需迁移；主题/图块可直接写新素材 id 或 `replace` 目标 |
| **B. tile 显示层只有 3 个固定槽** | Godot 多层 TileMapLayer / 每 tile 多数据层 | 层数由内容决定，不该由字段数决定（P1/P10） | 适合 | **已落地**：`TILE_VISUAL_SLOTS` 单一数据来源 + 逐 tile 动态层（§6.3） |
| **C. `sceneObjects` 无生产者** | Tiled 对象层 + Godot 场景节点：编辑器产出物件 | 作者化内容需要产出通道（P1） | 适合 | **已落地**：主题规则 → 确定性物化（§6.4）；编辑器仍是下一步 |
| **D. 长斜墙跨角色遮挡错误** | 切分大物件 / 依赖图 + 断环（P6） | 2D 等距本无全序 | **暂不适合**（当前地图复杂度不需要） | 先"拆成独立显示段"，真需要再上偏序（§8） |
| **E. 加内容时拼错资源名静默失效** | Codec/校验在加载期报错（P2） | 静默 = 最贵的 bug | **适合，已落地** | `audit-asset-refs` + lint 第 12 条（§6.2） |
| **F. 新主题要写一堆名字表** | Factorio/RimWorld 用原型继承 + 补丁 | 消除重复（P3） | 部分适合 | 主题表可加"基于 baseTheme 的补丁"；**当前 10 个主题规模不痛，暂不做**（§8） |
| **G. 大量实体渲染性能** | 离屏缓存/对象池/分层（P8） | 减少每帧状态变更 | 目前无压力证据 | 不动（§8） |
| **H. `game` 单例耦合、SCC 大环** | ——（恢复期遗留，非内容问题） | —— | 仓库自跟踪，**非本任务轴** | 不动，尊重既有路线 |

---

## 6. 本轮落地的改动（附验证）

### 6.1 地图候选窗去硬编码（`rendering/map-window.js`）

**问题**：`rendering/scene.js` 的 `GameCanvasView.update` 在**世界/地牢两个分支各展开 35 行**
`draw{World,Dungeon}TileRow(renderer, rowCursor++, centerTileColumn±a, centerTileColumn±b)`，
两处必须同步改；窗口形状（非对称手调菱形）藏在 70 行调用里，无法一眼看懂、无法单测。

**改动**：提取为 `rendering/map-window.js`——`MAP_WINDOW_ROWS`（35 个 `[startOffset, endOffset]`）
+ `MAP_WINDOW_FIRST_ROW_OFFSET = -18` + `drawClassicTileWindow(renderer, map, worldActive, drawRow)`
按同参同序发出 35 次调用。两处分支各收缩为 2 行。**净减约 70 行、新增 1 个模块。**

**为什么不公式化成"对称菱形"**：实测窗口**不对称**（左缘在第 16→20 行之间从 −16 跳到 −14、右缘在 19–21 行保持 +16）。
公式化会改变绘制调用序列 → 改变 classic 逐像素 oracle。故**保持为数据**。

**验证**：
- `tests/unit/map-window.test.mjs`（4 条）——金标准：`MAP_WINDOW_ROWS` 必须**逐行等价**于重构前展开序列，
  且 `drawClassicTileWindow` 在首行/第 16 行/第 21 行/末行**参数完全一致**。
- 结构对账门禁：把删除/插入行**逐条授权**（`artifacts/structure-allowlist.json`，键为抹平骨架 + 计数上限，理由写明）。
- **浏览器像素门禁实跑通过**：`test:scenarios` **91/91**（含 `rendered-scene*` 逐像素 FNV-1a 指纹相同）、
  `test:parity` 0/1/99/900 回合全等、`test:presentation`、`test:map-motion` 全绿 → **像素零变化**。

### 6.2 素材引用完整性审计（`scripts/audit-asset-refs.mjs` + lint 不变量 12）

**问题**：给游戏加内容时最贵的错误是**静默失效**——精灵名拼错、把地形名写进怪物目录，
`getSprite` 返回 `undefined`，运行时不报错、只画空白，60 秒游玩都不一定看得见。

**改动**：新增零依赖审计，把"代码引用的名字"与"真实存在的名字"对账：
1. 图集名（`src/data/{terrain,monsters,items}-atlas.js`，1183/939/714）+ 素材包清单（`assets.generated.js`）建索引；
2. 扫描 `src/**/*.js` 的所有"精灵名形态"字符串字面量，必须可解析；
3. **组感知**：`X.getSprite("名")` 的 X 若可判定组（`terrainSprites`/`monsterSprites`/`itemSprites`），名字必须属于该组；
4. 素材包 `replace`/`id`/`alias` 自洽。
接入 `npm run lint`（第 12 条不变量）与 `npm run gate:sweep`，并加 `npm run audit:asset-refs`。

**验证**（双向反向验证，均**先红后绿**）：
- 正常：**1,283 处名字字面量、49 处可判定组调用**，exit 0；
- 注入拼错名 `L2_WallBrickNS_TYPO.PNG` → exit 1，指名具体文件与行；
- 把 `CoinsGoldSmall.PNG` 交给 `terrainSprites`（跨组）→ exit 1，报"该名存在但不在 terrain 组（存在于 items）"；
- 两处还原后转绿（用 `git diff` 确认字节还原）。

### 6.3 tile 显示层数据驱动（`world/tile-visuals.js` + `rendering/scene.js`）

**问题**：旧 tile 恰好三个**固定字段**（background/decoration/cachedBackground）——世界 tile 用两个、
地牢 tile 用三个。这三个字段"叫什么、什么顺序、走哪个绘制通道"散落三处：`rooms.js`/`terrain.js` 的访问器安装、
`scene.js` 两个 `draw*TileRow` 里各抄一遍的三段绘制代码。加第四层要同时改三处。

**改动**：把"有哪些层、什么顺序、什么通道"提为**单一数据来源**
- `WORLD_TILE_VISUAL_SLOTS`/`DUNGEON_TILE_VISUAL_SLOTS`：每层 `{entity, idField, mode}`，
  `mode ∈ {ground, scenery, sceneryRaised}` 对应现有三条绘制调用；
- 访问器安装与渲染共用同一张表：`scene.js` 的 `drawTileVisuals` 按表顺序分派，`draw*TileRow` 各收缩为 1 行；
- **逐 tile 动态层** `tile.visualLayers = [{assetId, mode}]` + `addTileVisualLayer()`：追加在固定层之后，
  用于摆放家具/屋顶/前景。显示数据，**不进存档**；默认无该字段 → 对既有地图零影响。

**验证**：`tests/unit/tile-visual-layers.test.mjs`（5 条：层的顺序/通道是数据、空层跳过、动态层追加、
未知通道拒绝、访问器晚解析语义与旧实现一致）；浏览器像素门禁 `test:scenarios` 91/91、`test:presentation`、
`test:map-motion` 全绿 → 绘制调用序列与像素**零变化**。

### 6.4 场景物件生产者（`world/scene-objects.js` + `world/generation.js`）

**问题**：`rendering/scene.js` 的 `drawSceneObjects` 早就支持
`{visualId, position, footprint, elevation, layer}` 且**经语义资源目录解析** visualId（新美术可直接用），
但**没有任何生产者**写入 `map.sceneObjects`——这条通道一直是空的，无法"配置化摆放装饰"。

**改动**：补上数据驱动的生产者：
- **规则形态**：`{ visualId, pattern, layer?, chance?, offset?, elevation?, footprint?, onlyEncounterType? }`，
  `pattern ∈ {corners, perimeter, center, scatter}`；`validateSceneObjectRule` fail loud（P2）；
- **确定性物化**：`materializeSceneObjects({rooms, rules, seed})` → `{visualId, position, layer, footprint, elevation}[]`；
- **不消耗 RNG**：`scatter` 用**独立的 FNV-1a 散列**（`hashToUnit`）而非 `Math.random`/`SeededRandom`，
  因此**不改变原版随机流**；（实测过：复用 `core/math.js` 的 `hashCoordinates` 会因值域过小让 scatter 全命中，故独立实现。）
- **生成期接线**：`generateDungeonLevel` 在主题套用后调 `installThemeSceneObjects(level, theme, level.levelSeed)`；
  主题未声明 `sceneObjects` ⇒ 空操作 ⇒ **对既有地图零影响**。
- **落地示例**（可直接照抄到主题）：
  ```js
  // content/dungeon-themes.js 的某个主题里加：
  sceneObjects: [
    { visualId: 'village.hay',  pattern: 'corners',   layer: 'scenery' },
    { visualId: 'village.corn', pattern: 'scatter',   chance: 0.35 }
  ]
  ```

**收益**：地图装饰 = 加素材包 + 写主题规则，不改生成器/渲染代码（原则 P1）；
且天然走语义资源目录，新美术可直接用；拼错的名字会被 §6.2 的审计在构建期抓出。

**验证**：
- `tests/unit/scene-objects.test.mjs`（7 条：规则校验 fail loud、pattern 取格数量、
  无规则⇒空、位置按格×27、**确定性**（同种子同结果 / 不同种子会变）、`onlyEncounterType` 过滤、生成期接线与替换语义）；
- **回归**：`test:parity` **0/1/99/900 回合全等**（证明未动原版随机流）、`test:scenarios` **91/91**
  （含逐像素指纹）、`test:presentation`、`test:map-motion` 全绿 → 默认空规则下**零变化**。

---

## 7. 剩余工作与下一步（按证据排序）

本轮把三件证据充分、可验证的事都落地了，**没有需要"先补像素验证才能动"的悬空卡**。下一步候选：

| 候选 | 价值 | 前置条件 |
|---|---|---|
| **场景物件的地图编辑器 / 显式关卡数据** | 让作者化地图（如林中旧村）与经典地图共用一套物件数据 | 先定出编辑产出格式（可与探索场景的物件模型统一） |
| **长斜墙跨角色遮挡**：先"拆成独立显示段"，再评估偏序 | 修掉已知的遮挡错误 | 需要能稳定复现该情形的画布指纹场景 |
| **主题表"基于 baseTheme 的补丁"** | 减少主题重复 | 主题数量增长到会痛时再做（现在 10 个，不痛） |
| **探索场景物件模型与 `sceneObjects` 统一** | 一套格式两处用，降低二次开发成本 | 需要探索场景的回归保护（R44 授权范围内） |

---

## 8. 明确"现在不要做"（避免过度设计）

| 不做 | 理由 |
|---|---|
| **引入 ECS** | 项目实体数量与行为形状不匹配 ECS 的收益模型（§3.5）。会以可读性换不存在的性能收益。 |
| **依赖图 + 断环的偏序遮挡** | 当前地图复杂度不需要；先"把长墙拆成独立显示段"就能覆盖（P6 的轻量解）。 |
| **主题表加"继承/补丁"语法** | 10 个主题、每主题约 20 个名字，规模不痛；引入补丁语法是给未来的自己加一层要维护的元语言。 |
| **离屏画布分层 / 特效对象池** | `clean` 已有地形缓存与整数像素；没有性能回归证据前不上（P8 只在有瓶颈时用）。 |
| **把 `game` 单例/SCC 大环大改** | 仓库有独立的现代化路线与门禁在跟踪；**不是本任务的资源/地图/内容轴**，混做会扩大风险。 |
| **给 tile 加通用"行为数据层"** | 本项目规则与显示已分离（`floorType`/`tileGrid` 管规则，显示槽管画）；再加一层通用数据是重复。 |
| **为 `sceneObjects` 造一套位置 DSL 引擎** | 只保留 `corners/perimeter/center/scatter` 四种取格；更复杂的摆放应交给编辑器产出的显式数据，而不是往引擎里塞规则语言。 |

---

## 9. 验证边界与未完成（诚实声明）

- **本轮实跑通过**（Chromium 经国内镜像 `cdn.npmmirror.com` 装好后，全部为真实退出码）：
  - `npm run lint`（12 条不变量：混淆名 / 隐形文件 / `@ts-nocheck` / 待办标记 / 文档引用 / 存档键 /
    法术覆盖 / 成就表 / 存档 schema / 文档计数 / **结构对账** / **素材引用审计**）
  - `npm run typecheck`、`node scripts/check.mjs`（**102 单测**）、`npm run build`、`node scripts/audit-asset-refs.mjs`
  - `test:parity`（0/1/99/900 回合完整存档全等）、`test:scenarios`（**91/91**，含逐像素指纹）、
    `test:presentation`、`test:map-motion`（4 档 DPR × 8 帧移动，屏幕像素路径残差 0）
- **仍未跑 / 未覆盖**：`test:soak`（8h/24h）、`test:e2e`、`perf`、跨浏览器、真机低端设备帧时间。
  这些是**本轮范围外**，不得读作通过。
- **未实现**：§7 的下一步候选（地图编辑器 / 显式关卡数据、长斜墙显示段、主题补丁、探索场景物件模型统一）。
- **未改动**：玩法数值、RNG 算法与调用顺序、回合/离线节奏、存档 JSON 键与编码、原版素材文件、DOM 契约。
- **文档数字同步**：本轮累计新增 1 个审计脚本 + 3 个引擎模块（`rendering/map-window.js`、
  `world/scene-objects.js`、及 `world/tile-visuals.js` 的显示层改造）+ 3 个单测文件后，
  `check-doc-counts` 要求的口径（语法检查文件数 **187**、单测 **102**、lint 不变量 **12**）
  已同步到 `REFACTOR_REPORT.md` 与 `docs/REMAINING-WORK.md`。
