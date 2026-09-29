# P-1 技能消费映射表（statType → 消费点 → 证据等级）

> U133 彻夜会话交付。来源：`content/skills/*.js`（11 个职业文件，`statType:` 共 328 条定义）、
> `combat/skill-effects.js` `applyStatBonus`（唯一写入侧 switch，36-144 行）、对 `src/engine/modules`
> 全量 grep 的读取点审计（2026-09-28 实测）。
>
> **审计边界（如实）**：本表基于静态 grep + 人工核读。原型后挂载的方法体与动态属性访问
> （`a[fieldName]` 形态）可能漏报；表中"战斗消费点"均经人工核读确认在执行路径上，
> 未用"至少一个读点"自动判定。视图消费点（`views/character.js` 的属性行渲染）**单列且不计入**
> 战斗消费证据。

## 证据等级

- **L3 直接战斗差分**：有差分场景在固定 RNG 下驱动该技能并断言其战斗效果（浮动文字/效果计数/公式输出），带反向验证。
- **L2 消费点探针直读**：harness 只读观察器直读该字段的公式输出（消费函数与战斗决策同源），带反向验证。
- **L1 消费点审计**：人工核读确认真实战斗路径消费（file:line），无专属差分。

## 映射表

| statType | 写入字段（applyStatBonus） | 定义数 | 真实战斗消费点（file:line） | 视图渲染点 | 证据 |
|---|---|---|---|---|---|
| 1 | damageResistance | 9 | `combat/actions.js:587`（伤害计算减伤） | character.js:489 | **L2-field**（skill-ignore-damage-resistance，0→40 探针 + 反向验证） |
| 2 | damage.skillBonusPercent | 33 | `stats.js:15` statValue → 全部伤害公式（近战/远程/法术）+ 存档 DTO 组合值 | character.js | **L2**（U133：skill-improved-damage-statvalue，27→35 探针 + 反向验证） |
| 3 | armor.skillBonusPercent | 33 | 同上（护甲公式）+ DTO | 同上 | **L2**（U133：skill-improved-combat-stat-bonuses，29→37 探针 + 反向验证） |
| 4 | attackRating.skillBonusPercent | 33 | 同上（命中判定公式）+ DTO | 同上 | **L2**（同场景 28→36 探针） |
| 5 | defenceRating.skillBonusPercent | 33 | 同上（闪避判定公式）+ DTO | 同上 | **L2**（同场景 32→41 探针） |
| 6 | maxHealth.skillBonusPercent | 28 | 同上（最大生命）+ DTO；tick.js 生命回复基数 | 同上 | **L2**（同场景 maxHealth 152 探针） |
| 7 | maxSpirit.skillBonusPercent | 15 | 同上（最大法力）+ DTO；施法花费上限 stats.js:51 | 同上 | **L2**（U133：skill-regen-spirit-bonuses，maxSpirit +40% statValue 探针） |
| 8 | healthRegenBonus | 12 | `simulation/tick.js:42`（每 3 回合回复量公式） | character.js:482 | **L2**（同场景 healthRegenBonus 0→2 探针 + 反向验证） |
| 9 | spiritRegenBonus | 16 | `simulation/tick.js:47` | character.js:483 | **L2-field**（skill-priest-spellcost-spiritregen，0→1 探针） |
| 10 | attackCooldownReduction | 26 | `stats.js:39` getAttackCooldown → **`characters/character.js:134` canAttack（每次攻击时机判定）**；character.js:67、runtime/game.js:462 | character.js:481 | **L2**（U133：skill-faster-attacks-cooldown，0→6/12→6 探针 + 反向验证） |
| 11 | healPotency | 1 | `combat/actions.js:94`（治疗法术量公式） | — | **L2**（U133：skill-priest-spell-potencies，0→2 探针 + 反向验证） |
| 12 | buffDamagePotency | 1 | `combat/actions.js:134`（增益法术量） | — | **L2**（同场景 0→2 探针） |
| 13 | buffArmorPotency | 1 | `combat/actions.js:131` | — | **L2**（同场景） |
| 14 | buffAttackRatingPotency | 1 | `combat/actions.js:137` | — | **L2**（同场景） |
| 15 | buffDefenceRatingPotency | 1 | `combat/actions.js:140` | — | **L2**（同场景） |
| 16 | spellCostReduction | 1 | `stats.js:51` getSpellSpiritCost（施法花费与可施性判定，TargetSpell 系行为评分调用） | character.js:490 | **L2-field**（同上场景，0→20 探针，期望由前置链推导） |
| 17 | critChance | 20 | `combat/actions.js:588,603`（暴击掷骰） | character.js:471 | **L3**（既有 combat-critical-hits：暴击浮动文字直接对账 + 反向探针） |
| 18 | extraAttackCount | 8 | `combat/actions.js:424`（多重攻击循环）；character.js:442,456 | character.js:492 | **L3**（既有 skill-combat-effects） |
| 19 | extraAttackChance | 11 | `combat/actions.js:421` | character.js:493 | **L3**（同上） |
| 20 | controlTargetBonus | 6 | `characters/character.js:900`（睡眠目标数 +1） | — | **L2-field**（skill-electromancer-control-chain-rain，0→5 探针 + 反向验证） |
| 21 | chainArcBonus | 3 | `characters/character.js:513`（连锁闪电弧数） | — | **L2-field**（同场景 0→6 探针） |
| 22 | rainAreaBonus | 4 | `characters/character.js:586`（火雨覆盖范围） | — | **L2-field**（电法师 0→2 / 火法师 0→2 双场景探针） |
| 23 | chainCount | 4 | `characters/character.js:881`（跳弹链长度）；stats.js:106 | — | **L3**（既有 skill-combat-effects） |
| 24 | chainChance | 4 | `stats.js:103,56-58`（跳弹掷骰，上限 100 钳制） | — | **L3**（同上） |
| 25 | areaRadiusBonus | 4 | `characters/character.js:677`；`simulation/tick.js:300`（范围伤害半径，注意 +1 固定步进而非 +=值） | — | **L2-field**（skill-pyromancer-area-transform-rain，0→2 探针 + 反向验证） |
| 26 | maxSummonedMinions | 14 | `characters/character.js:741,779`；`ai/behaviors.js:1418,1462`（召唤行为评分与上限门控） | — | **L2**（U133：skill-larger-flock-summon-limit，1→2 探针 + 反向验证） |
| 27 | transformTargetBonus | 3 | `characters/character.js:902`（转变目标数） | — | **L2-field**（同场景 0→5 探针） |
| 28 | swiftStrikeTargetBonus | 2 | `characters/character.js:857`（快速打击链长） | — | **L2-field**（skill-swiftstrike-ricochet-field-probes，0→2 探针 + 反向验证；战斗推进受 R4 空投射武器缺陷限制，如实降格为写入侧证据） |
| 29 | ricochetCountBonus | 3 | `characters/character.js:878`（弹射次数） | — | **L2-field**（同场景 0→3 探针 + 反向验证；同上 R4 边界） |
| 30 | barbarianChickenChance | 1 | `combat/actions.js:172`（召唤鸡群生成小鸡时的类型掷骰，25%） | — | **L3**（U133：skill-chicken-king-barbarian-chance，全员鸡王 231 次施法、"野蛮人小鸡!"两端各 4 次 + 反向验证） |
| 31 | ninjaChickenChance | 1 | `combat/actions.js:176`（同上分支） | — | **L3**（skill-ninja-chance-chicken，活体浮动文字 2 次两端一致 + case 31 反向验证） |
| 32 | rogueChickenChance | 1 | `combat/actions.js:180`（同上分支） | — | **L3**（skill-rogue-chance-chicken，活体浮动文字 2 次两端一致 + case 32 反向验证） |

合计：**32/32 种 statType 均有真实战斗路径消费点（L2/L1 以上）**；其中 **L3 直接战斗差分 8 种**（17/18/19/23/24/30/31/32）、**L2 探针/差分 24 种**（公式探针 2-7/10、字段写入探针 1/8/9/11-16/20/21/22/25/26/27-29，期望值由 fixture/常量/前置链独立推导）。定义总数 328 条（`grep -c "statType:" content/skills/*.js` 合计）。

## U133 新增切片明细

1. **`skill-chicken-king-barbarian-chance`**（主动族，statType 30）：全员改鸡王并注入"召唤鸡群"（4×施法频次，实测两端各 231 次施法——含怪物侧），定向购买 `barbarianChanceChickenKing`（树 4 前置链 9 项，真实 `refresh→canPurchase→purchase` 路径）；两端"野蛮人小鸡!"浮动文字各 **4 次**且相等；几率位写进 `upgrades4`（DTO）+ 完整存档差分兜底。反向验证：删 `applyStatBonus` case 30 赋值 → 立即分叉红，恢复绿。
   - 取证坑（已记录）：原版技能定义形状为 `{c:id, title, e:description, g:statBonusValue, f:statType}`；原版前置字段 `Wp`（c2.js:21560-21566）；单角色 6000 回合仅 2 次施法会因 25%×2 的确定性坏运气假红——扩到全员后消除。
2. **`skill-faster-attacks-cooldown`**（被动族，statType 10）：购买 `fasterAttacksFighter3`（连带前置链 7 项）后，只读探针直读 `getAttackCooldown`（与 canAttack 同一函数）：reduction 0→6、有效冷却 12→6，两端一致。反向验证：公式删去缩减项 → "refactored 应为 6 实际 12"红，恢复绿。
3. **`skill-larger-flock-summon-limit`**（被动族，statType 26）：鸡王默认召唤上限 1（DEFAULT_MINION_LIMIT），购买 largerFlockChickenKing1 后 1→2，两端一致；消费点 behaviors.js:1418,1462。反向验证：删 case 26 → "应为 2 实际 1"红，恢复绿。
4. **`skill-improved-combat-stat-bonuses`**（被动族，statType 3/4/5）：三条前置链分别购买 improvedArmor/AttackRating/DefenseRatingFighter3（各 +10%×3），statValue 探针 armor 29→37、attackRating 28→36、defenceRating 32→41，两端一致。反向验证：删 case 3 → 红，恢复绿。

3. **`skill-improved-damage-statvalue`**（增益族，statType 2/6 代表行）：树 1 链式购买
   improvedDamageFighter3 连带 dmg×3(+30%)/hp×2(+40%)，只读探针直读 statValue 组合值：
   damage 27→35、maxHealth→152，期望值由 fixture 分量独立推导（statValueOf，非抄实现）；
   反向验证：删 applyStatBonus case 2 → 红，恢复绿。

## 剩余缺口（保持 P-1 PARTIAL 的精确理由）

- **L1 ×0**：32/32 全部达到 L2 及以上。P-1 维持 PARTIAL 的剩余口径：24 种为探针/差分级
  （7 种公式探针 2-7/10 + 17 种字段写入探针 1/8/9/11-16/20/21/22/25/27-29，均非战斗效果活体差分），
  8 种 L3 构成最强证据层。
- **活体量级对账的否决记录（U133 第二段）**：statType 11（healPotency）的活体量级对账需要把治疗
  浮动文字归因到具体目标（量 = floor(min(100, potencyPercent×healPotency)/100 × 目标 maxHealth / 帧数)，
  actions.js:91-101）——目标 maxHealth 与动画帧数均为引擎运行时内部量，浮动文字本身不含施法者/目标
  标识，不动引擎就无法构造无歧义的量级断言 → **以证据否决**，该族最强可得证据保持为
  字段写入探针（heal 0→2，case 11 反向验证）+ 公式引用。statType 12-15（增益法术量）同理：
  量 = potencyPercent × buffPotency（actions.js:131-140），目标为施法者自身的状态效果量，
  归因障碍相同。statType 16 的"施法次数对账"由公式输出探针（22→18）替代：base 按角色等级派生
  （simulation/characters.js:184），次数对账需跨场景基线（RNG 流不可比），已否决。
- **buff-potency 活体场景否决（U133 收官）**：曾尝试在矩阵后段逐帧观察
  `statusEffectTypeId=5`（护甲提高）的 `potencyMultiplier`，但固定 9000 回合窗口内
  该类效果出现 **0 次**。矩阵位置会改变此前场景消耗后的运行状态与施法采样，
  因而这个窗口不能稳定证明 statType 13 的效果量；按位置敏感场景否决条款移除该场景及
  专属观察器，最终矩阵保持 **87 条**。保留 `skill-priest-spell-potencies` 的
  `buffArmorPotency` 0→2 字段探针及 `combat/actions.js:131` 公式消费点证据，
  **不把 0 次效果解释为技能失效，也不将该项升级为 L3**。
- statType 3/4/5/7/16/20/21/22/25/27/28/29/31/32 的探针均已就绪（readSkillFields 一次直读全部剩余字段）。
- 审计边界：动态属性访问与原型后挂载漏报风险已声明；`applyStatBonus` 是唯一写入侧（switch 全覆盖 32 类），
  未发现第三写入点（grep `skill-effects.js` 排除后无其他赋值源）。
