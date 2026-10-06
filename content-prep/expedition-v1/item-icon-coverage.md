# T8 图标覆盖表:60 类物品 + 8 栋建筑

依据:items.json 的 icon 字段(逐项)、materials.png 图集(128×128=16 瓦片,全部已注册)、T4 素材检查(asset-candidates.json 全量 855 张、asset-review.csv 22 条评审)。

## 物品图标:11 已注册 / 1 本地候选 / 48 缺失 / 1 语义不合

R54新增石料透明图标候选：`output/imagegen/material-icons/stone-v1.png`，通过内置image_gen生成；提示词及alpha检查在同目录，原始字节保留，未注册进游戏。独立预览可直接看，32/48/64px三背景验收在 `output/glm-r52-review/stone-icon-small-size.png`。其他缺口仍未补齐。

### 已注册(11 项,图标语义正确)

wood→material.wood; copper→material.copper; iron→material.iron; silver→material.silver; crystal→material.crystal; feather→material.feather; leather→material.leather; copper_ingot→material.copper-bar; iron_ingot→material.iron-bar; silver_ingot→material.silver-bar; nails→material.nails

### 语义不合(1 项)

- rope:已注册的 `material.rod` 是金属棒,不是绳索——数据保留缺口(missing),不用错图冒充就绪。

### 已注册但与 60 类无关(经典版遗留,不在目录)

material.gold、material.gold-bar、material.dragon-feather、material.dragon-scale(经典怪物掉落物,新目录未收录)。

### 缺失(48 项,按用途分组)

- 原料(8):clay, fiber, herb, wild_food, water, resin, hardwood, coal
- 原料·战斗掉落(4):beast_bone, chitin, slime_gel, mana_dust
- 加工物(7):plank, brick, charcoal, cloth, treated_leather, herb_extract, steel_ingot
- 消耗品(10):ration, healing_potion, antitoxin, mana_potion, repair_kit, camp_kit, bandage, torch, warming_salve, cooling_salve
- 工具携具(6):axe, pickaxe, gathering_knife, backpack, water_container, lantern
- 武器护具(8):short_sword, dagger, bow, staff, focus, cloth_robe, leather_coat, carapace_armor
- 研究收藏(4):field_notes, blueprint, keepsake, trophy

## 建筑过渡图与正式主题缺口(8 栋)

| 建筑 | 过渡图(现可用,未注册) | 正式主题缺口 |
|---|---|---|
| lodge 营舍 | rubberduck B1(4朝向+雪顶) | 脚点/门位/占地标定;L2/L3 分级外观 |
| warehouse 仓库 | rubberduck B3 开放木棚 | 封闭仓库造型;分级外观 |
| workshop 工坊 | FW-blacksmith(像素风)或 GPT 概念样板 | **风格二选一后成套补齐**;GPT 风全套不存在 |
| smelter 炉窑 | 无(FW-blacksmith 可借用示意) | 专用炉窑造型;炉烟效果层 |
| well 水井 | 2x2 石砌井(2朝向) | 另两朝向;L2/L3 外观 |
| garden 园圃 | 空摊位棚 | 农田/苗床/作物阶段完全缺失 |
| supply 补给所 | 果蔬市场摊 | 建筑型补给所;L2/L3 外观 |
| cartography 地图室 | **无** | 地图桌/图纸类素材完全缺失 |

## 后续定向需求(不批量生成/采购,提交规格)

1. 物品图标:48项仍缺图，石料另有1项待正式注册候选,建议按"二次元手绘+黄铜点缀"或与正式建筑主题同一风格成套制作;基础优先序:石料/黏土/纤维/食材/水(阶段A即用)→ 木板/砖/木炭/布 → 工具 → 药剂。
2. 角色/怪物动画包候选筛选:见 `animation-pack-candidates.md`(3–5 个候选,含四方向/帧数/许可核验)。
3. 建筑正式主题:按 GPT 工坊样板风格做"工坊+井+营舍"三栋小样校准(设计11.3),同视角同脚点再做 L2/L3。
