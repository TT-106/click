# items.json 字段与录入约定说明

版本:schemaVersion 1,`status: "planned-not-wired"`(未接入运行时的设计草案)。
设计来源:`docs/ECONOMY-BASE-DESIGN-V1.md` 第 5 章。60 类 = 原料20 + 加工12 + 消耗10 + 工具6 + 装备8 + 研究收藏4。

## 字段

| 字段 | 约定 |
|---|---|
| `id` | 全表唯一,小写下划线,与设计表 ID 一致 |
| `name` | 中文名,非空 |
| `category` | `raw / processed / consumable / tool / equipment / research` |
| `measure.kind` | `mass`(散装,数量=整数克)/ `count`(件数,数量×单件质量)/ `instance`(永久实例,不按名字合并) |
| `measure.unit` | mass 固定 `g`;count/instance 用设计中的量词(张/根/块/卷/瓶/份/个/把/盏/条) |
| `measure.quantumG` | 默认采集步长(设计4.1):常规矿石/木料 100g;药草/纤维/树脂 10g;水 100g。设计未单列的(wild_food/slime_gel/mana_dust/charcoal 等)记 `null`,保存仍允许整数克,不强制凑步长 |
| `measure.unitMassG` | mass 必须为 `null`(克本身就是数量,不存在"每克再乘1000");count 必须为正整数;instance 为标准质量,可变质量实例(纪念物/战利纪念 100g–2kg)用顶层 `massRangeG: [min,max]` 表示 |
| `phase` | A/B/C,按设计第 13 章分阶段范围;条件启用写在 `notes`(如治疗药剂 B=补给所二级+原野战斗消费者落地) |
| `sources` / `uses` | 来源与用途,直接摘自设计 5.1–5.6 表格,非空 |
| `icon.status` | `registered`=已注册进 `assets/themes/*/asset.json`(11项);`candidate`=有本地候选原图(石料1项，AI生成，未接游戏);`missing`=缺图(48项)。候选必须给项目内 `candidatePath` 且文件确实存在 |
| `designRef` | `ECONOMY-BASE-DESIGN-V1.md#5.x` 锚点 |
| `notes` | 设计原文的限制、替代、边界;不得自行发明数值 |

## 量纲规则(来自设计 4.1/5.3/6.3,录入时严格执行)

- 药剂 250g 已含包装,不另加瓶质量;空水袋 200g 与袋内水分开算。
- 装备栏/背包的同一实例只算一次,不叠加。
- 木板/砖块 2kg/块、布/绳 500g/卷、强韧革 800g/张均为"件数+单件质量",不是散装。
- `rope` 不使用已注册的 `material.rod`(金属棒语义不符)作图标,保留缺口而不是假装就绪。
- 已注册但与本目录无关的图标:`material.gold`、`material.gold-bar`、`material.dragon-feather`、`material.dragon-scale`(经典版遗留,不在 60 类中)。

## phase 判定依据摘要

- A:阶段A交付范围(设计13.A)——木/石/黏土/纤维/食材/水来源、七种旧材料、木板/布/绳/木炭/铜铁锭/口粮/布包、基础工具。
- B:二级设施与中程后勤(13.B)——药草/树脂/园圃线、五金/强韧革/萃取液/银锭、修理包/前哨包/绷带、战斗启用类药剂与武器(配方解锁工位为准,材料依赖另注)。
- C:长远征与角色内容(13.C)——兽骨/甲壳/凝胶/魔力尘、精钢、专注药剂/火把/环境药膏、提灯、战利纪念。
- 判定有歧义处(硬木、煤)按"首个明确消费者的解锁阶段"记,并在 notes 说明理由;如后续设计定案不同,以设计为准改本表。

## 校验与反向验证

`node tools/content-prep/validate.mjs items` 结构校验;`negative` 子命令在内存克隆中注入 7 种坏数据(重复ID/负质量/count缺单件质量/mass带unitMassG/总数错/类别错/图标指向不存在ID),校验器必须全部拒绝。
"结构有效"≠"可正式上线":48项缺图、1项生成候选、条件启用的B/C内容均保留状态。

## R54：配方与建筑的共同语义

- `inputs` / `cost` 是全部必需输入；`anyOf` / `costAnyOf` 是替代组数组。组间全部满足，每组只选其中一个选项。一个铜铁替代写为 `[{options:[{id:"copper_ingot",qty:600},{id:"iron_ingot",qty:600}]}]`，不能写成两组各一项。
- 地图室一级将羽毛6根或纤维300g录为 `costAnyOf`，不再仅用说明文字表达。紧固用铜铁替代范围尚未定案，不自动放开。
- `kind` 若写在输入/输出记录里必须与物品表一致。安全整数保存克数/件数；`quantumG` 是默认采集步长，不是所有配方数量必须整除的单位。
- 水井各级时间由 `well-water-Lx.baseTimeMs` 决定；`productionSpeedRatioFromL1` 仅是相对一级的说明值，禁止再乘一次提速。工坊/炉窑速度仍按对应基础配方除以倍率。
- `inputInstanceId` / `outputInstanceId` 当前字符串是模板绑定标记，未来开工时必须绑定玩家实际旧实例ID，不能把 `old-staff-instance` 当作全服固定实例ID。升级操作不允许额外产出新实例。
- `node --test tools/content-prep/test-content-rules.mjs` 验证互斥替代、量纲、原实例、循环、建筑自举、成本余量、独立种子统计及候选素材路径。
