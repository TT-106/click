# 战斗公式（以代码为准）

> 引用规范：形如 `combat/actions.js:84` 的路径相对 `src/engine/modules/`；若某处只写了裸文件名（如 `character.js:677`），以所在小节的模块归属为准——`characters/character.js` 与 `views/character.js` 同名，未逐一消歧。

> 事实来源：`src/engine/modules/**` 当前实现。每条公式给出 `file:line` 与原文 JS 片段。
> 与 `archive/original/c2.js`（46,980 行单文件）的等价性由 **59 场景差分矩阵**（`npm run test:scenarios`）保证，因此本文描述的是**权威行为**，不是设计意图。
> **片段同步状态（2026-09-27）**：内嵌 JS 片段与散文里的标识符已按 `docs/symbol-map.json` 的 1,047 条字段映射**批量同步到当前语义名**（工具 `scripts/fix-doc-identifiers.mjs`），逐字摘录型片段的 `file:line` 也由 `scripts/check-doc-snippets.mjs` 重定位并对齐（61/76 条已同步）。**仍有 15 条是"节选/伪码"型片段**（含 `...` 或跨多处拼接），其行号与片段不逐字对应——这是已知的文档精度缺口，判读时以片段上方的 `file:line` 与当前源码为准。
> 凡看起来像 bug 的地方一律按原样记录并标 `[疑似遗留怪癖]`；本文不提出修正。
> 路径缩写：`actions.js` = `src/engine/modules/combat/actions.js`，`character.js` = `src/engine/modules/characters/character.js`，其余同理。
> 时间模型（帧/回合/离线结算）见 `docs/time-model.md`；道具生成见 `docs/formulas/items.md`（本文多处引用其结论 I-*）。

字段速查 A —— `CharacterStats`（`characters/stats.js:18-39`）中与战斗相关的部分：

| 字段 | 含义（依据消费点反推） | 证据 | 置信度 |
|---|---|---|---|
| `damage` / `armor` / `attackRating` / `defenceRating` / `maxHealth` / `maxSpirit` | 六条 `StatComponent` | `stats.js:33-38`、`actions.js:583-586` | 高 |
| `health` / `spirit` | 当前生命/法力池（非组件） | `stats.js:22`、`actions.js:312` | 高 |
| `baseAttackCooldown` = 12 | 攻击冷却基准（回合） | `stats.js:25`、`stats.js:41` | 高 |
| `attackCooldownReduction` | 冷却减免（回合），技能 `statType 10` | `stats.js:28`、`skill-effects.js:72-74` | 高 |
| `critChance` | **暴击几率 %**（技能 `statType 17`） | `stats.js:22`、`skill-effects.js:93-95`、`actions.js:592` | 高 |
| `damageResistance` | **受伤减免 %**（技能 `statType 1`，"免疫 X% 敌人的伤害"） | `stats.js:28`、`skill-effects.js:39-40`、`actions.js:587,597` | 高 |
| `healPotency` | 治疗强度倍率（`statType 11`） | `skill-effects.js:75-77`、`actions.js:94-97` | 高 |
| `Ps/Rs/Qs/Ss` | 护甲/伤害/攻击等级/防御等级**法术**强化倍率（`statType 13/12/14/15`） | `skill-effects.js:78-89`、`actions.js:129-141` | 高 |
| `spellSpiritCost` | 单次施法基准耗蓝（按 `damageCurve` 随等级算） | `stats.js:22`、`characters.js:183-184` | 高 |
| `spellCostReduction` | 耗蓝减免 %（`statType 16`） | `skill-effects.js:90-92`、`stats.js:52` | 高 |
| `extraAttackCount` / `extraAttackChance` | 分裂目标数上限 / 逐档命中几率（`statType 18/19`） | `stats.js:30-31`、`skill-effects.js:96-101`、`actions.js:420-431` | 高 |
| `chainCount` / `chainChance` | 弹跳次数上限 / 逐跳几率（`statType 23/24`） | `stats.js:29,32`、`skill-effects.js:117-125`、`stats.js:102-114` | 高 |
| `chainArcBonus` / `controlTargetBonus` / `transformTargetBonus` | 连锁跳数、睡眠/定身群体数、转变群体数（`statType 21/20/27`） | `skill-effects.js:102-110`、`character.js:513,900,902` | 高（名字语义由 `character.js:513` 与 `:900` 的用法给出） |
| `rainAreaBonus` | 范围雨类法术半径（格）（`statType 22`） | `skill-effects.js:111-112`、`character.js:586` | 高 |
| `areaRadiusBonus` | 溅射/爆炸半径增量（`statType 25`，**`+= 1` 而非 `+= c`**） | `skill-effects.js:113-116`、`tick.js:297`、`character.js:677` | 高 |
| `swiftStrikeTargetBonus` / `ricochetCountBonus` | 回旋镖跳数 / 弹射跳数（`statType 28/29`） | `skill-effects.js:129-134`、`src/engine/modules/characters/character.js:857,878` | 高 |
| `ku/lu/mu` | 野蛮人/忍者/盗贼小鸡出现几率 %（`statType 30/31/32`，**赋值而非累加**） | `skill-effects.js:135-143`、`actions.js:171-190` | 高 |
| `baseHealthRegenPercent` = 1、`baseSpiritRegenPercent` = 4 | 再生基准 % | `stats.js:23-24`、`tick.js:42,47` | 高 |
| `stunCount`、`damageGiven`、`damageReceived`、`kills`、`minionKills` | 统计量，不回馈战斗 | `stats.js:26`、`actions.js:317-319,334` | 高 |

字段速查 B —— `CombatAction`（`actions.js:26-33`）：

| 字段 | 含义 | 证据 |
|---|---|---|
| `remainingDamage` | **尚未结算的伤害余量**（逐帧随机分次扣除），不是"总伤害" | `actions.js:305-310`、`actions.js:444` |
| `Rd` | "零伤害"旗标，置真则该动作在生成 impact 视觉的前一帧被直接丢弃 | `actions.js:445,456,482`、`actions.js:62-65` |
| `yd` | 是否需要投射物飞行（远程攻击/带弹道的法术） | `actions.js:457,483`、`tick.js:376-392` |
| `chains` / `returns` | 本动作可继续弹跳 / 本动作是"回旋后"段 | `actions.js:74-81`、`actions.js:611-711` |
| `chainCount` / `currentChainStep` | 该链段数上限 / 当前段序号 | `actions.js:471-474`、`actions.js:612-613` |
| `pl` | 回旋镖的落点（回到施法者的位置） | `actions.js:664`、`src/engine/modules/characters/character.js:858-866` |
| `actionDefinition` | 指向 `Spell` 实例；**null 表示这是一次普通攻击** | `actions.js:67-70`、`actions.js:86-114` |
| `impactEffect` / `projectileEffect` | 两个 `VisualEffect`；impact 的动画剩余帧数同时充当"本动作还剩几帧可结算" | `actions.js:84`、`sprites.js:64-93` |

字段速查 C —— 角色类型常量：`ADVENTURER_TYPE = 0`、`MONSTER_TYPE = 2`（`ai/targeting.js:295-296`）。实际出现 6 种：0 冒险者、1 随从、2 普通怪、3 城堡守卫、4 首领、5 卷轴施法者。敌我判定见 C-30。

---

## 1. 时间与冷却：回合、攻击冷却、每次攻击打几下

### C-1 回合推进（战斗所见的时间单位）

`src/engine/modules/simulation/tick.js:27-33`

```js
export function advanceSimulation(a) {
  var b = game.lifecycle;
  b.turnTimeAccumulator += a;
  if (15 <= b.turnTimeAccumulator) {
    game.state.turnNumber++;
    b.turnTimeAccumulator -= 15;
    b.regenTurnCounter++;
```

入参 `a` 是"60Hz 帧当量"（`simulation/loop.js:53` `c = a / this.frameDuration;`，`frameDuration = 1E3 / 60`，`loop.js:24`）。15 个帧当量 = 1 回合 = 250ms（`loop.js:25` `this.turnDuration = 250;`，与离线结算口径一致）。

**所有战斗冷却/持续时间都以 `turnNumber` 计**，与墙钟无关；离线补算按每回合 250ms 记账（`docs/time-model.md` 第 10 条）。

`[疑似遗留怪癖]` `Jo -= 15` 而非 `Jo = 0`：一帧内帧差超过 15 单位时余量结转，所以掉帧后一帧可推进多个回合，`b.Jo` 恒 < 15。

### C-2 攻击冷却（含 `attackCooldownBonus` 的确切作用域）

`src/engine/modules/characters/stats.js:40-42`

```js
export function getAttackCooldown(a, b) {
  return b ? Math.max(4, a.baseAttackCooldown - a.attackCooldownReduction + attackCooldownBonus.currentValue) : Math.max(4, a.baseAttackCooldown - a.attackCooldownReduction);
}
```

`src/engine/modules/characters/character.js:130-138`

```js
export function markAttackTurn(a) {
  a.lastAttackTurn = game.state.turnNumber;
}
export function canAttack(a) {
  return game.state.turnNumber - a.lastAttackTurn >= getAttackCooldown(a.stats, isAdventurerOrMinion(a));
}
export function isAdventurerOrMinion(a) {
  return a.characterType === ADVENTURER_TYPE || 1 === a.characterType || 5 === a.characterType;
}
```

- 基准 `baseAttackCooldown = 12` 回合 = **3.0 秒**（`stats.js:25`）。
- 下限 `Math.max(4, …)` = 4 回合 = **1.0 秒** → **每个角色每秒最多 1 次攻击动作**，无论多少随从/怪物，各自独立计时。
- `attackCooldownBonus.currentValue` **只作用于第二参数为真的三类**（0 冒险者、1 随从、5 卷轴施法者）。怪物(2)/守卫(3)/首领(4) 走 `Math.max(4, 12 - attackCooldownReduction)`，不吃该加成。
- 来源：冒险点升级 `bonusIndex 11`「永久快速攻击」，`levelIncrement: -1`，目录里有 `coolDownTurn1`/`coolDownTurn2` 两条（`progression/upgrades.js:177-181,243-244`；`progression/points.js:372-383`，各 `pointCost: 11E6`）。
- 技能减免：`statType 10` → `attackCooldownReduction += c`（`combat/skill-effects.js:72-74`），野蛮人「快速攻击 I/II/III」各 2（`content/skills/barbarian.js:90-110`）。首领固定 `+3`（`content/guardians.js:340-342`）→ 首领冷却 9 回合。
- 初始上次攻击回合：`character.js:67` `this.au = -3 * getAttackCooldown(this.stats, true);` → 建角即为 `-36`（含 bonus 时随之变化），保证开局第一击不被冷却挡住。

### C-3 一次攻击出手时"打几个目标"（多重攻击不是多次攻击）

`src/engine/modules/combat/actions.js:419-436`

```js
export function performMultiAttack(a, b) {
  var c = a.stats,
    d = c.extraAttackChance / 100,
    f = 0,
    g;
  for (g = 0; g < c.extraAttackCount; g++) {
    if (Math.random() < d) {
      f++;
    } else {
      break;
    }
  }
  if ((c = findTargetsInRange(a, a, 1 + f, b ? a === game.state.scrollCaster ? 100 * RANGED_ATTACK_RANGE : RANGED_ATTACK_RANGE : MELEE_ATTACK_RANGE)) && 0 !== c.length) {
    for (d = 0; d < c.length; d++) {
      createAttackAction(a, c[d], b);
    }
  }
}
```

- 掷点是**连续成功直到首次失败**（`else break`），所以实际额外目标数是几何截断的：期望 ≈ `p/(1-p)` 且被 `extraAttackCount` 封顶。
- `extraAttackCount`/`extraAttackChance` 默认 0 / `DEFAULT_MULTI_ATTACK_CHANCE = 25`（`stats.js:30-31`、`balance.js:120`）。
- 分裂出的是**同一帧内的多个独立 `CombatAction`**，各自重掷命中/暴击/护甲（`createAttackAction` 内部各调一次 `calculateAttackDamage`）。
- 卷轴施法者的射程被写成 `100 * RANGED_ATTACK_RANGE` = **14000 px**，即全房间无衰减。`100` 未在代码内命名，语义为"任意远"，置信度高（同函数另一分支用的是正常 140）。
- 只有 `extraAttackCount > 0` 才走这条路径（`character.js:442-443`、`:456-457`）；否则单体直攻：

`src/engine/modules/characters/character.js:440-467`

```js
      if (2 === a.actionType) {
        if (a.combatTarget && !a.combatTarget.isDead) {
          if (0 < a.stats.extraAttackCount) {
            performMultiAttack(a, false);
          } else {
            var yb = a.combatTarget;
            if (yb) {
              createAttackAction(a, yb, false);
            }
          }
          if (isAdventurerOrMinion(a)) {
            game.state.statisticsRecorder.recordMeleeAttack();
          }
        }
      } else if (a.actionType === MELEE_ACTION_TYPE) {
        if (a.combatTarget && !a.combatTarget.isDead) {
          if (0 < a.stats.extraAttackCount) {
            performMultiAttack(a, true);
          } else {
            var Fb = a.combatTarget;
            if (Fb) {
              createAttackAction(a, Fb, true);
            }
          }
          if (isAdventurerOrMinion(a)) {
            game.state.statisticsRecorder.recordRangedAttack();
          }
        }
```

动作类型常量：`IDLE_ACTION = 0`、`1 = 移动`、`2 = 近战`、`MELEE_ACTION_TYPE = 3`（**实为"远程攻击"动作**）、`CAST_ACTION_TYPE = 4`（`ai/targeting.js:421-423`）。`MELEE_ACTION_TYPE` 这个名字与实际语义相反，是恢复期沿用原符号位置的结果，本文一律按消费点称其为"远程攻击"。

### C-4 目标挑选半径

`src/engine/modules/combat/actions.js:35-50`

```js
export function findTargetsInRange(a, b, c, d) {
  a = getOpponents(a);
  if (0 === a.length) {
    return null;
  }
  var f = b.position.room;
  if (!f) {
    return null;
  }
  var g,
    h = b.position.levelPosition,
    l,
    n = [];
  for (b = 0; b < a.length && (g = a[b], g.isDead || g.position.room !== f || (l = h.distanceTo(g.position.levelPosition), !(l <= d && (n.push(g), n.length >= c)))); b++) {}
  return n;
}
```

- 中心是 `b`（分裂攻击传的是攻击者自己），距离是**平面欧氏距离**（`Vector2.prototype.distanceTo`，`core/math.js:176-180`），单位像素。
- 常数：`MELEE_ATTACK_RANGE = 50`、`RANGED_ATTACK_RANGE = 140`、`RANGED_MIN_DISTANCE = 50`（`content/classes.js:21-23`），瓦片 `game.tileSize = 27`（`runtime/game.js:42`）→ 近战 ≈ 1.85 格、远程 ≈ 5.2 格。
- 收集顺序是 `getOpponents` 的**数组序**，不是距离序；达到 `c` 个即停。所以分裂攻击的受害集合取决于注册顺序。
- **不筛**潜行/瘫痪/转变（由调用方 `getOpponents` 的阵营归类间接影响）。

### C-5 法术冷却

`src/engine/modules/combat/scrolls.js:22-34`

```js
  this.lastCastTurn = game.state.turnNumber - 3 * this.cooldownTurns;
}
export function resetSpellCooldown(a) {
  a.lastCastTurn = game.state.turnNumber - 3 * a.cooldownTurns;
}
export function isSpellReady(a) {
  if (a.lastCastTurn > game.state.turnNumber) {
    resetSpellCooldown(a);
  }
  return game.state.turnNumber - a.lastCastTurn >= a.cooldownTurns;
}
```

- 冷却按回合计，写入点在行为层：`this.un.lastCastTurn = game.state.turnNumber`（`ai/behaviors.js:346`）、`this.Vi.lastCastTurn = game.state.turnNumber`（`ai/behaviors.js:778`）。
- 初值 `-3 * cooldownTurns` 表示"早就绪"。`3` 未命名，只要 ≥1 即等价（因为就绪判定是差值比较），置信度中。
- 冷却表：`content/spells.js` 每条法术的 `cooldownTurns`（10–700）；牧师四条团队增益 700 回合（`spells.js:147,158,169,180`）= 175 秒。
- `[疑似遗留怪癖]` 读档后若 `turnNumber` 变小（回滚），`isSpellReady` 会自我修正；但 `lastCastTurn` 只在**行为层施法成功时**写，`createSpellAction` 因目标已死返回 null 时不写冷却——见 C-36 的"扣蓝不施法"。

### C-6 随从寿命与再生节律（同样按回合计）

`src/engine/modules/simulation/tick.js:33-51,58-78`；节律常量 `CharacterLifecycle`：`zD = 3`（再生每 3 回合一次）、`gD = 2`（地牢/农场）、`TC = 2`（自动卷轴）、`PC = 4`（成就）（`simulation/characters.js:35-44`）。

随从过期：`simulation/tick.js:71` `if (game.state.turnNumber - y > A)`（严格大于，即活 `A + 1` 个回合边界）；`A = lifetimeTurns = a.Oi`（`simulation/characters.js:76`）。

---

## 2. 伤害：攻击 → 护甲 → 最终伤害

### C-7 属性分量如何合成最终值（所有伤害公式的前置）

`src/engine/modules/characters/stats.js:7-17`

```js
export function StatComponent(a) {
  this.owner = a;
  this.skillBonusPercent = this.spellBonusPercent = this.levelValue = this.itemValue = 0;
}
export function addSpellStatBonus(a, b) {
  a.spellBonusPercent += b;
}
export function statValue(a) {
  var b = a.itemValue + a.levelValue;
  return b + floorNumber((a.skillBonusPercent + a.spellBonusPercent) / 100 * b);
}
```

**没有独立的"base"分量。** 底座 = `itemValue + levelValue`（装备求和 + 等级曲线），技能与法术加成**先相加再统一取整**，且百分比只作用于底座（不复合）。取整次数：`statValue` 全程**一次** `floorNumber`，且只截掉加成部分的余数。

`itemValue` 由 `equipItem` 按槽位重算（`character.js:157-179`）；`levelValue` 由 `applyLevelStats` 写（`simulation/characters.js:166-185`）。

### C-8 `floorNumber` 的真实语义（负数会翻向）

`src/engine/modules/core/math.js:66-68`

```js
export function floorNumber(a) {
  return 2147483648 > a ? a | 0 : Math.floor(a);
}
```

`a | 0` 是 **int32 向零截断**，不是向下取整：`floorNumber(-0.5) === 0`（真 `Math.floor` 会给 `-1`）。同时 `a >= 2^31` 时才走真 `Math.floor`。这条差异在下面所有含减法的位置都可能显现。

`randomInt`（`core/math.js:44-46`）：

```js
export function randomInt(a) {
  return 0 >= a ? 0 : floorNumber(Math.random() * a);
}
```

即 `a <= 0` 时返回 **0**（不是负数、不是抛错），并且用的是全局 `Math.random`（与 `SeededRandom` 是两条独立随机流，`docs/rng.md`）。

### C-9 核心伤害式

`src/engine/modules/combat/actions.js:580-598`

```js
export function calculateAttackDamage(a, b) {
  var c = a.stats,
    d = b.stats,
    f = statValue(c.attackRating),
    g = statValue(c.damage),
    h = statValue(d.defenceRating),
    l = statValue(d.armor),
    d = d.damageResistance,
    c = c.critChance;
  if (!b.effects.isDisabled && Math.random() > f / (f + h)) {
    return 0;
  }
  if (0 < c && Math.random() < c / 100) {
    return showFloatingText(game.floatingText, a, "暴击!", "#FFFF00"), g;
  }
  f = floorNumber(l / 2);
  g -= f + randomInt(f);
  return 0 >= g ? 0 : 0 < d ? Math.max(0, g - floorNumber(d / 100 * g)) : g;
}
```

按运算顺序展开（**不可化简，浮点次序有承重**）：

1. **命中掷点**：`!Kd && Math.random() > AR/(AR+DR)` → 0。被瘫痪（`Kd`）的目标跳过掷点，**必定命中**。
2. **暴击掷点**：`0 < lm && Math.random() < lm/100` → 返回**未减护甲的 `statValue(damage)` 原值**。
3. **护甲减免**：`f = floorNumber(armor / 2)`，扣除 `f + randomInt(f)`，即护甲贡献是 `[armor/2, armor]` 区间内的**整型均匀随机**（含端点 `armor/2`，上端为 `armor-1+armor/2` 当 `armor` 为偶数时）。
4. **非正值归零**：`0 >= g ? 0`。
5. **受伤减免**（`damageResistance`， barbarian「伤害免疫」）：`Math.max(0, g - floorNumber(wo/100 * g))`。

要点：
- 整条链上只有 `floorNumber(l/2)`、`floorNumber(d/100*g)` 与 `randomInt` 三处取整，`g -= …` 与 `0 >= g` 都用整数值参与（因为 `g = statValue(damage)` 本身已由 C-7 保证为整数）。
- 返回 0 既包含"闪避"也包含"被护甲吃光"，两者在 C-10 都表现为 `Rd = true`（无任何视觉/飘字）。
- `damageResistance` 取的是**目标**的分量、`critChance` 取的是**攻击者**的分量（`actions.js:587-588` 的 `d = d.wo, c = c.lm`）。

### C-10 命中/零伤害旗标在动作创建时写入

`src/engine/modules/combat/actions.js:441-445`（怪物近战）、`:449-457`（远程）、`:476-483`（冒险者近战）

```js
    c = b.position.levelPosition;
    var f = a.position.levelPosition,
      g = calculateAttackDamage(a, b);
    b = a.equipment ? a.equipment.projectileWeapon : null;
    …
    d.remainingDamage = g;
    d.Rd = 0 === g;
    d.yd = true;
```

`Rd` 的消费点：`actions.js:62-65`

```js
  var c = b.impactEffect;
  if (c && !c.hasSpawned) {
    if (b.Rd) {
      return b.Vn = true;
```

零伤害动作在 impact 视觉生成的前一帧被直接标记删除：**不出图、不飘伤害数字、不施加大法效果**（对 cat 4 法术同样如此，见 C-36）。

### C-11 伤害落地：一次调用只吃掉随机的一部分，逐帧续扣

`src/engine/modules/combat/actions.js:302-325`

```js
export function applyActionDamage(a) {
  var b = a.targetCharacter,
    c = b.stats,
    d = a.remainingDamage;
  if (0 !== d) {
    var f = 1 + randomInt(d - 1);
    if (0 !== f) {
      d = Math.max(0, d - f);
      a.remainingDamage = d;
      c.health -= floorNumber(f);
      if (0 > c.health) {
        c.health = 0;
      }
      d = a.attacker;
      d = 1 === d.characterType ? d.summoner.stats : d.stats;
      d.damageGiven += f;
      d = b.stats;
      d.damageReceived += f;
      if (0 === c.health) {
        resolveCharacterDefeat(a.attacker, b);
      }
    }
  }
}
```

- 本帧扣 `f = 1 + randomInt(remainingDamage - 1)` ∈ `[1, remainingDamage-1]`（`remainingDamage = 1` 时 `randomInt(0) = 0` → `f = 1`）。
- 因此**一次攻击的伤害分多帧陆续到账**（约 `log2(remainingDamage)` 帧），只要 `advanceCombatAction` 的"动画未完"闸门还开着：`actions.js:84` `if ((d = b.impactEffect) && d.bx !== d.oc)`。
- 飘给玩家看的伤害数字是**全额**，且只飘一次：`actions.js:71-73` `showDamageText(b.targetCharacter, b.remainingDamage)`（`rendering/floating-text.js:20-25`，`0 < b` 才显示 `"-" + b`）。
- `damageGiven/damageReceived` 累加的是**本帧实扣值** `f`，逐帧相加正好等于总伤害；但 `damageGiven` 记在"随从则记到召唤者头上"（`1 === attacker.characterType ? summoner.stats`）。
- `floorNumber(f)` 与 `Math.max(0, d-f)` 都是恒等/无害取整（`f` 已是整数），但**保留原样**。
- `[疑似遗留怪癖]` `if (0 !== f)` 恒真（`f >= 1`），是死分支。
- `[疑似遗留怪癖]` `resolveCharacterDefeat` 在**每次分帧扣血后**都判 `0 === c.health`，但只在真正跌到 0 的那一帧成立一次；由于 `health` 已夹到 0，后续帧 `remainingDamage` 也已被扣到 0，不会重复触发。

### C-12 治疗类法术的伤害闸门（同一函数的另一支）

`src/engine/modules/combat/actions.js:90-92`

```js
      if (g) {
        if (d = g.stats, 4 === l || 5 === l || 8 === l || 13 === l || 12 === l) {
          applyActionDamage(b);
```

只有 `spellCategoryId ∈ {4, 5, 8, 12, 13}` 的动作会在动画期间逐帧结算伤害；`cat = 1` 走治疗支（C-33）。**普通攻击（`actionDefinition` 为 null）走 `actions.js:110-113`**：

```js
    } else {
      if (0 < b.remainingDamage) {
        applyActionDamage(b);
      }
    }
```

### C-13 法术伤害式（无命中掷点）

`src/engine/modules/combat/actions.js:599-610`

```js
export function calculateSpellDamage(a, b) {
  var c = a.stats,
    d = statValue(c.damage),
    f = statValue(b.stats.armor),
    c = c.critChance;
  if (0 < c && Math.random() < c / 100) {
    return showFloatingText(game.floatingText, a, "暴击!", "#FFFF00"), d;
  }
  f = floorNumber(f / 2);
  d -= f + randomInt(f);
  return 0 >= d ? 0 : d;
}
```

与 C-9 的差别：**不查 `defenceRating`、不判 `isDisabled`、不减 `damageResistance`**。用于忍者回旋镖（`cat 12`）的第 0 跳与所有后续跳（`character.js:867`、`actions.js:699`）。

### C-14 地面持续伤害（雨/爆炸留下的 tile effect）

`src/engine/modules/simulation/tick.js:413-430`

```js
      if (rb = gb[db], !rb.isDead && (dc = rb.position.levelPosition, Ka = game.level.pixelToTileColumn(dc.x), Xa = game.level.pixelToTileRow(dc.y), (hb = game.level.getTileAt(Ka, Xa)) && (lb = hb.tileEffect) && lb.hasSpawned)) {
        if (lb.isFinished()) {
          setTileEffect(hb, null);
        } else if (lb.previousFrameIndex !== lb.frameIndex && (sc = hb.remainingEffectDamage, 0 !== sc && (Aa = randomInt(sc + 1), 0 !== Aa))) {
          hb.setRemainingEffectDamage(Math.max(0, sc - Aa));
          var ec = rc = rb.stats;
          ec.health -= floorNumber(Aa);
          if (0 > ec.health) {
            ec.health = 0;
          }
          Mc.damageGiven += Aa;
          rc.damageReceived += Aa;
          showDamageText(rb, Aa);
          if (0 === rc.health) {
            resolveCharacterDefeat(lb.boundCharacter, rb);
          }
        }
      }
```

- 瓦片初值：`rooms.js:17-22` `a.li = b ? randomInt(b.li) : 0;`，其中 `b.li` 是**法术写入时给的效果满伤**：`character.js:614` `Db.li = Ja;` / `:675` `Y.li = oe;`，`Ja = oe = statValue(a.stats.damage)`（`character.js:608,668`）——**不经护甲、不经命中、不经减免**。
- 每帧对站在生效瓦片上的每个敌对者掷 `randomInt(剩余+1)` ∈ `[0, 剩余]`，扣除并写回；0 则本帧无事。
- 归属：`currentDungeon`（记账人）取 `1 === Ga.characterType ? Ga.summoner.stats : Ga.stats`（`tick.js:411`），`Ga` 是队列里**最后一个**动作的攻击者（`tick.js:274-279` 循环泄漏变量）；但致死调用用的是 `lb.ud`（真正的施法者，`character.js:612,674`）。
- `[疑似遗留怪癖]` 这两个归属可能不是同一个人，`damageGiven` 会记到无关角色头上。致死判定与经验归属仍按 `lb.ud`。

### C-15 首领房/怪物房的属性装配（决定 C-9 里两边的数值量级）

`src/engine/modules/combat/encounters.js:69-83`

```js
            if (frailMonstersModifier.currentValue) {
              stats.damage.levelValue = floorNumber(0.7 * monsterType.damage);
              stats.armor.levelValue = floorNumber(0.7 * monsterType.armor);
              stats.attackRating.levelValue = floorNumber(0.7 * monsterType.attackRating);
              stats.defenceRating.levelValue = floorNumber(0.7 * monsterType.defenceRating);
              stats.maxHealth.levelValue = floorNumber(0.7 * monsterType.maxHealth);
              stats.health = floorNumber(floorNumber(0.7 * statValue(stats.maxHealth)));
            } else {
              stats.damage.levelValue = monsterType.damage;
              stats.armor.levelValue = monsterType.armor;
              stats.attackRating.levelValue = monsterType.attackRating;
              stats.defenceRating.levelValue = monsterType.defenceRating;
              stats.maxHealth.levelValue = monsterType.maxHealth;
              stats.health = floorNumber(statValue(stats.maxHealth));
            }
```

`0.7`（脆弱怪物药水 `modifierId 15`）连乘两次到 `health`（先入 `levelValue` 再入当前血），是当前实现的口径，不是笔误。

`src/engine/modules/combat/encounters.js:200-212`

```js
export function advanceMonsterTypeRank(a) {
  if (!(5 <= a.rank)) {
    a.rank++;
    a.rankKillThreshold += MONSTER_RANK_KILL_STEP;
    var b = 10 * (a.level - 1) + a.rank;
    a.maxHealth = scaleByLevel(b, monsterHealthCurve, 1);
    a.experienceReward = scaleByLevel(b, monsterExperienceCurve, 1);
    a.damage = scaleByLevel(b, monsterDamageCurve, 1);
    a.armor = scaleByLevel(b, monsterArmorCurve, 1);
    a.attackRating = scaleByLevel(b, monsterAttackCurve, 1);
    a.defenceRating = scaleByLevel(b, monsterDefenceCurve, 1);
  }
}
```

- 有效等级 `b = 10 * (怪物表等级 - 1) + 阶级`，阶级 1–5，每 `MONSTER_RANK_KILL_STEP = 20` 次击杀升一阶（`encounters.js:192-199`、`balance.js:117`）。
- 通用曲线式：`core/math.js:72-75`

```js
export function scaleByLevel(a, b, c) {
  a = Math.max(0, a - 1);
  return floorNumber(c * (b.base + b.coefficient * Math.pow(a, b.power) * Math.pow(b.growth, a)));
}
```

- 怪物侧参数（`balance.js:45-80`）：

| 曲线 | power | coefficient | growth | base | 实际喂给 |
|---|---|---|---|---|---|
| `monsterDamageCurve` | 1.7 | 1 | 1.0018 | 15 | **`maxHealth`**（`maxHealth`） |
| `monsterHealthCurve` | 1.7 | 1 | 1.0017 | 30 | **`damage`**（`damage`） |
| `monsterSpiritCurve` | 1.7 | 1 | 1.0017 | 25 | **`armor`**（`armor`） |
| `monsterAttackCurve` | 1.7 | 1 | 1.0017 | 30 | `attackRating`（`attackRating`） |
| `monsterDefenceCurve` | 1.7 | 1 | 1.0017 | 25 | `defenceRating`（`defenceRating`） |
| `monsterArmorCurve` | 1.24 | 1 | 1.0002 | 4 | **经验值 `experienceReward`** |

`[疑似遗留怪癖]` 曲线**名字与用途交叉**（"HealthCurve" 喂 damage、"DamageCurve" 喂血量、"ArmorCurve" 喂经验）。赋值关系本身与原版逐字一致（`archive/original/c2.js:9577-9580` 的 `$o←wi`、`No←xi`、`Gp←yi`、`Ep←zi`），已核；但 `monsterHealthCurve`/`monsterAttackCurve` 与 `monsterSpiritCurve`/`monsterDefenceCurve` 两组参数**完全相同**，因此这两个名字谁对应 `farmStartTurn` 谁对应 `Bi` 无法从数值上区分——改名不影响行为，本文只保证"槽位↔参数"的映射正确。定论需要原始未混淆源或按名取用曲线的第二处消费点。
- 1 级 1 阶普通怪实算：`maxHealth 15`、`damage 30`、`armor 25`、`AR 30`、`DR 25`、`xp 4`。

`src/engine/modules/simulation/characters.js:166-185`（冒险者/随从/首领/卷轴施法者的同一装配口）

```js
export function applyLevelStats(a, b, c) {
  var d = scaleByLevel(b, experienceCurve, 1);
  a.experienceToLevelUp = d;
  d = scaleByLevel(b, armorCurve, c.armorMultiplier);
  a.armor.levelValue = d;
  d = scaleByLevel(b, armorCurve, c.attackRatingMultiplier);
  a.attackRating.levelValue = d;
  d = scaleByLevel(b, armorCurve, c.defenceRatingMultiplier);
  a.defenceRating.levelValue = d;
  d = scaleByLevel(b, armorCurve, c.damageMultiplier);
  a.damage.levelValue = d;
  d = scaleByLevel(b, healthCurve, c.maxHealthMultiplier);
  a.maxHealth.levelValue = d;
  c = scaleByLevel(b, spiritCurve, c.maxSpiritMultiplier);
  a.maxSpirit.levelValue = c;
  a.health = floorNumber(statValue(a.maxHealth));
  a.spirit = statValue(a.maxSpirit);
  b = scaleByLevel(b, damageCurve, 1);
  a.spellSpiritCost = b;
}
```

- **四条分量共用 `armorCurve`**（`power 1.8, coefficient 15, growth 1.015, base 15`，`balance.js:39-44`），只靠职业 `statMultipliers` 区分量级（`content/classes.js` 各 `statMultipliers`）。
- `a.spirit = statValue(a.maxSpirit)` **不取整**（`maxSpirit` 已是整数，但与其它血蓝写法不对称）。
- 卷轴施法者 `attackRatingMultiplier: 500`（`content/classes.js:636-643`）——`500` 未在代码内注释。按 C-9 的命中式，`AR/(AR+DR)` 在 AR 被放大 500 倍后 ≈ 1，语义推断为"卷轴永不失手"，置信度中；定论需要该常量在原版 UI/文案里的对应说明。

---

## 3. 命中与"闪避"：有，但不是 AC 加骰而是比值概率

**结论：有命中掷点，且它同时是唯一的"未命中"机制。** 不存在"miss"字样、没有闪避率字段、没有单独的 miss 分支——失手被编码为 `damage === 0`。

### C-16 命中概率

`src/engine/modules/combat/actions.js:589-591`

```js
  if (!b.effects.isDisabled && Math.random() > f / (f + h)) {
    return 0;
  }
```

```
P(命中) = AR / (AR + DR)          （AR = statValue(attacker.attackRating)，DR = statValue(target.defenceRating)）
若目标 effects.Kd 为真 → P(命中) = 1
```

- `AR + DR` 恒 > 0 吗？两者都是 `statValue`，可为 0（`armorCurve` base 15 且等级从 1 起算，实际最小为 15×倍率，不为 0）。若真为 `0/0` → `NaN` → `Math.random() > NaN` 为 **false** → **必定命中**（无除零保护，但当前内容下不可达）。
- 严格大于（`>`）意味着 `Math.random()` 恰等于概率时判命中；`Math.random()` 上界不含 1，所以 P 不会因为端点而偏移。
- **潜行不参与命中式**，它通过法术加成进 `attackRating`：`statusEffectTypeId 11` → `attackRating.spellBonusPercent += potency`（`characters/effects.js:71-74`，潜行 `potencyPercent: 100`，`content/spells.js:196-207`），即**潜行期 AR +100%**。潜行对 AI 的影响是"不被选为目标"（C-31），不是"打不到"。
- 减免来源汇总：`defenceRating`（提升 P 的分母）、`armor`（提升扣血下限）、`armor.spellBonusPercent`（type 5 法术 +`buffArmorPotency` 倍率）、`defenceRating.spellBonusPercent`（type 8 法术 +`buffDefenceRatingPotency` 倍率、type 10 嘲讽也加 DR）。见 C-22/C-7。

### C-17 `calculateSpellDamage` 与所有"纯法术"路径**没有**命中掷点

见 C-13。同样，cat 8 溅射段（C-28）、cat 5 连锁（C-35）、地面伤害（C-14）、治疗（C-33）都不走 C-16 的 DR 项——只有走 `calculateAttackDamage` 的才有命中。

---

## 4. 暴击

### C-18 公式与不对称

来源同一处，近战/远程/部分法术：`combat/actions.js:592-594`

```js
  if (0 < c && Math.random() < c / 100) {
    return showFloatingText(game.floatingText, a, "暴击!", "#FFFF00"), g;
  }
```

法术伤害版：`actions.js:604-606`（同式，返回 `statValue(damage)`）。

```
P(暴击) = lm / 100        （仅当 lm > 0；lm 即 statType 17）
暴击效果 = 返回 statValue(damage)，即"完全无视护甲与 wo"
```

- **倍率不是乘出来的，而是"跳过减甲"**：暴击伤害 = 满额 `damage`，普通伤害 = `damage − [armor/2, armor]`。所以暴击的实际倍率随目标护甲变化，护甲越高暴击收益越大；无上限、无额外系数。
- **暴击飘字挂在攻击者身上**（`showFloatingText(…, a, "暴击!", "#FFFF00")`），不是目标。
- **谁能暴击**：只有 `stats.lm > 0` 的角色。
  - 冒险者：`statType 17` 技能，各职业「暴击几率」条目值 5（如 `content/skills/barbarian.js:202-229` 四条 ×5；游侠 `criticalHitChanceRanger1..4`）。
  - 首领固定 30%：`content/guardians.js:330-333` `WC: [{statBonusValue: 30, statType: 17}, …]`，经 `applyBonusList`（`encounters.js:143` → `skill-effects.js:26-35`）。
  - **普通怪与城堡守卫：怪物不经过 `applyLevelStats`、没有技能树**（`encounters.js:62-83` 只写 `levelValue`），因此普通怪 `critChance` 恒 0 → **普通怪永远不会暴击、也永远不会显示暴击飘字**。这是玩家/首领/守卫（有 `statBonusList` 列表的守卫可以配）与怪物之间的主要不对称。
    - 城堡守卫通过 `applyBonusList(f, a.Nr)`（`simulation/characters.js:127`）获得固定加成，例如 `guardians.js:158+` 的 `Nr: [{statBonusValue: 15, …}]`；具体某条守卫是否含 `statType 17` 需逐条查 `content/guardians.js`。
- `[疑似遗留怪癖]` 暴击判定在命中判定**之后**，因此 `critChance` 不影响是否命中；同时暴击分支的 `return` 用逗号表达式夹带副作用，顺序不可调整（原版同构，`c2.js:21145-21146`）。

---

## 5. 眩晕与状态效果

### C-19 哪些 id 会让人"不能动"

`src/engine/modules/characters/effects.js:17-19`

```js
export function isDisablingEffect(a) {
  return 0 === a.statusEffectTypeId || 1 === a.statusEffectTypeId || 13 === a.statusEffectTypeId || 14 === a.statusEffectTypeId;
}
```

`statusEffectTypeId` → 语义/持续时间（`Qd`，单位回合）表，全在 `combat/skill-effects.js:145-275`：

| id | `cf` 标签 | `Qd`（回合） | 禁用 | 效果位 / 属性作用 |
|---|---|---|---|---|
| 0 | 睡着 | 100 | ✅ | 仅 `Kd`（`effects.js:52-53`） |
| 1 | 定身 | 100 | ✅ | 仅 `Kd` |
| 2 | — | — | — | **表中不存在**（`applySpellEffect` 会 `console.log("Failed to find char effect description: 2")` 并施加 `null`，见 `actions.js:143-146`） |
| 3 | 失明 | 100 | ❌ | **无任何读者**：`effects.js:56-97` 不处理 3，`isDisablingEffect` 不含 3 → 死效果 |
| 4 | 转变 | 100 | ❌ | `isConverted = true`（`effects.js:80-81`）→ 敌我翻转（C-30） |
| 5 | 护甲提高 | 700 | ❌ | `armor.spellBonusPercent += Ok` |
| 6 | 伤害提高 | 700 | ❌ | `damage.spellBonusPercent += Ok` |
| 7 | 攻击等级提高 | 700 | ❌ | `attackRating.spellBonusPercent += Ok` |
| 8 | 防御等级提高 | 700 | ❌ | `defenceRating.spellBonusPercent += Ok` |
| 9 | 迅捷 | 100 | ❌ | 无读者（死效果） |
| 10 | 怪物目标（嘲讽） | 50 | ❌ | `Gn = true` **且** `defenceRating.spellBonusPercent += Ok` |
| 11 | 潜行模式 | 50 | ❌ | `isStealthed = true` **且** `attackRating.spellBonusPercent += Ok` |
| 12 | 暴怒 | 50 | ❌ | `Vs = true` **且** `damage.spellBonusPercent += Ok` |
| 13 | 昏迷（倒地） | 100 | ✅ | `isStunned = true` |
| 14 | Stunned（Blast Stun） | **10** | ✅ | `isStunned = true` |

注意"定身(1)/睡着(0)"会置 `Kd` 但**不**置 `isStunned`；只有 13/14 置 `isStunned`。

### C-20 效果实例构造与 potency 缩放

`src/engine/modules/combat/actions.js:118-153`

```js
export function applySpellEffect(a, b) {
  var c = b.actionDefinition,
    d = c.spellCategoryId;
  if (2 === d || 3 === d) {
    var f = b.attacker,
      d = c.statusEffectTypeId,
      c = c.potencyPercent,
      g = statusEffectDefinitions[d];
    if (g) {
      var f = f.stats,
        h = 1;
      switch (d) {
        case 5:
          h = f.buffArmorPotency;
          break;
        case 6:
          h = f.buffDamagePotency;
          break;
        case 7:
          h = f.buffAttackRatingPotency;
          break;
        case 8:
          h = f.buffDefenceRatingPotency;
      }
      d = new StatusEffect(d, game.state.turnNumber, g.durationTurns, game.animations.getAnimation(g.animationName), g.overlayFrameIndex, g.hasAnimation, 1 > h ? c : c * h);
    } else {
      console.log("Failed to find char effect description: " + d);
      d = null;
    }
    c = b.targetCharacter.effects;
    if (d) {
      c.activeEffects.push(d);
      if (isDisablingEffect(d)) {
        c.isDisabled = true;
      }
    }
```

`potency` 字段的语义：写入 `StatusEffect.Ok`（`effects.js:7-16` 的第 7 参），在 C-22 里成为 `spellBonusPercent` 的**百分点**（例如牧师「提高护甲」`potencyPercent: 10` → `armor +10%`）。倍率 `Ps/Rs/Qs/Ss` 来自祭司「×2」类技能（`content/skills/priest.js:196-214`，`statType 13/12/14/15`，值 2）。

**`1 > h ? c : c * h`**：倍率为 0（未学技能）或 1 时不乘，避免把 0 乘进去；`h` 可为 3（学了两次）→ 30%。

持续时间与构造参数对照：`StatusEffect(类型, 起始回合, Qd=持续, 动画, Od, Pd, Ok)`；`Od/Pd` 在战斗结算里无读者（`effects.js` 只读 `statusEffectTypeId/Qd/jD/bg/Ok`；`Od` 用作动画行索引，`Pd` 未见读者），置信度中。

### C-21 效果的时效与"过期即删"

`src/engine/modules/characters/effects.js:25-53,100-106`

```js
  var n = a.owner.stats,
    p = n.damage,
    s = n.armor,
    u = n.attackRating,
    y = n.defenceRating;
  s.spellBonusPercent = 0;
  p.spellBonusPercent = 0;
  u.spellBonusPercent = 0;
  for (c = y.spellBonusPercent = 0; c < a.of.length; c++) {
    h = f = a.of[c];
    h.bg = d - h.jD >= h.Qd;
```

- 过期判定 `(当前回合 - 施加回合) >= Qd`，每回合由 `updateCharacterEffects` 重算；过期效果在同一个函数尾部 `splice`（`effects.js:100-106`）。
- 每回合**清空并重算**四条 `spellBonusPercent`（同文件 `:43-46`），所以法术增益不叠加同名，只是把所有在效期内同名 `Ok` 相加。
- 驱动点：`simulation/tick.js:79-87`——冒险者与随从（`getAllies()`）传 `true`，怪物/守卫/首领传 `false`。

### C-22 效果位与增益的逐条落地

`src/engine/modules/characters/effects.js:55-98`

```js
      h = f.statusEffectTypeId;
      if (5 === h) {
        addSpellStatBonus(s, f.potencyMultiplier);
      } else {
        if (6 === h && p) {
          addSpellStatBonus(p, f.potencyMultiplier);
        } else {
          if (7 === h) {
            addSpellStatBonus(u, f.potencyMultiplier);
          } else {
            if (8 === h) {
              addSpellStatBonus(y, f.potencyMultiplier);
            } else {
              if (10 === h) {
                a.hasStealthEffect = true;
                addSpellStatBonus(y, f.potencyMultiplier);
              } else {
                if (11 === h) {
                  a.isStealthed = true;
                  addSpellStatBonus(u, f.potencyMultiplier);
                } else {
                  if (12 === h) {
                    a.isEnraged = true;
                    addSpellStatBonus(p, f.potencyMultiplier);
                  } else {
                    if (4 === h) {
                      a.isConverted = true;
                    } else {
                      if (13 === h) {
                        a.isStunned = true;
                      } else {
                        if (14 === h) {
                          a.isStunned = true;
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
```

映射：5→armor、6→damage、7→attackRating、8→defenceRating、10→defenceRating、11→attackRating、12→damage（同函数 `:64-79`）。

`[疑似遗留怪癖]` `if (6 === h && p)` 的 `&& p` 只对 damage 一条做真值判断（`p` 是对象，永远真），其余分支没有——无行为影响，属原样保留。

### C-23 眩晕如何让人停手

`src/engine/modules/simulation/tick.js:788-800`

```js
export function updateCharacterBehaviors(a) {
  var b, c;
  for (b = 0; b < a.length; b++) {
    c = a[b];
    if (!c.isDead) {
      if (c.effects.isDisabled) {
        c.actionType = IDLE_ACTION;
      } else {
        c.updateBehaviors();
      }
    }
  }
}
```

行为评估每回合一次（`tick.js:104-105`）。`Kd` 为真 → 直接 `IDLE_ACTION`，即**不移动、不攻击、不施法**。注意这是在**回合边界**刷新的：本回合中途被眩晕的角色仍会执行已排定的动作。

### C-24 冒险者"死亡" = 倒地 13 号眩晕

`src/engine/modules/combat/actions.js:326-346`

```js
export function resolveCharacterDefeat(a, b) {
  if (b.characterType === ADVENTURER_TYPE) {
    if (!b.effects.isStunned) {
      game.state.statisticsRecorder.recordCharacterStunned();
      b.effects.isStunned = true;
      var c = b.position.levelPosition,
        stunEffect = new StatusEffect(13, game.state.turnNumber, stunEffectDefinition.durationTurns, game.animations.getAnimation(stunEffectDefinition.animationName), stunEffectDefinition.overlayFrameIndex, stunEffectDefinition.hasAnimation, 0);
      c = new VisualEffect(stunEffectDefinition.animationName, c, c, false, 1);
      b.stats.stunCount++;
      var f = b.effects;
      if (stunEffect) {
        f.activeEffects.push(stunEffect);
        if (isDisablingEffect(stunEffect)) {
          f.isDisabled = true;
        }
      }
      c.loopsWhileStunned = true;
      c.boundCharacter = b;
      addVisualEffect(game.effects, c);
      showFloatingText(game.floatingText, b, "昏迷!", "white");
    }
```

- `stunEffectDefinition.Qd = 100`（`skill-effects.js:146-154`）→ **倒地 100 回合**（25 秒），`Ok = 0`。
- `c.uA = true; c.ud = b;`：头顶气泡动画在角色仍 `isStunned` 时无限循环（`rendering/sprites.js:145-151`）。
- **生命不会回一点**：`health` 已在 C-11 被夹到 0 且这里不写回。

### C-25 醒来时的全回复（唯一的全回复口）

`src/engine/modules/characters/effects.js:107-110`

```js
  if (b && l && !a.isStunned) {
    n.health = floorNumber(statValue(n.maxHealth));
    n.spirit = statValue(n.maxSpirit);
  }
```

`l` 是本次重算**之前**的 `isStunned`（`effects.js:29`）。条件：只对有 `b === true` 的一方（冒险者+随从，`tick.js:83`）、上一回合还 `isStunned`、这一回合不再 `isStunned`（即 13/14 号效果**自然到期**）。

- `health` 多套一层 `floorNumber`，`spirit` 不套（`statValue` 已给整数，两者当前等价，但写法不对称，保留原样）。
- `[疑似遗留怪癖]` **房间清空与复活术都不走这条路**：`encounters.js:273-280` 与 `actions.js:287-291` 是把 `isStunned` **就地改 false 并删掉 13 号效果**，于是下一个回合边界 `l` 已经是 false → 不触发全回复 → **被救/清场后角色仍是 0 血**，任何一次挨打都会重新进入 C-24（因为 `!b.effects.isStunned` 此刻成立）。只有"熬满 100 回合自然醒"才满血满蓝站起。

### C-26 Blast Stun（溅射二段眩晕）

`content/spells.js:6-16`

```js
  blastStunSpell = {
    name: "Blast Stun",
    description: "Briefly Stuns Monsters",
    impactEffectName: "Bubbles",
    projectileEffectName: null,
    statusEffectTypeId: 14,
    spellCategoryId: 2,
    applyEffectOnImpact: true,
    potencyPercent: 0,
    cooldownTurns: 15
  };
```

`type 14` → `Qd: 10` 回合（`skill-effects.js:266-274`）→ 2.5 秒，禁用行动、置 `isStunned`。它**不在任何职业的法术表里**（不可学不可施），只作为火球/重锤溅射的第二段动作懒创建（`docs/reverse-engineering/unresolved.md` U4 已用差分取证：3000 回合内两端各 31 次 type=14 施加，数值相同）。

触发条件（`spellCategoryId === 8`，即火球 `content/spells.js:83-92` 与重锤 `:243-252`）见下面 C-28。

---

## 6. 技能 / 法术如何改写战斗

### C-27 两层结构：`Skill` 是属性点，`Spell` 是动作

**技能（Skill）没有独立类。** 技能树里的属性条目是 `CharacterSkillUpgrade`，其 payload 是 `{statType, statBonusValue}` 定义对象（如 `content/skills/barbarian.js:6-12`），落地口：

`src/engine/modules/combat/skill-effects.js:14-25`

```js
export function applySkillTreeBonuses(a, b) {
  var c = b.upgrades,
    d,
    f;
  for (f = 0; f < c.length; f++) {
    d = c[f];
    if (d.getUpgradeType() === SKILL_UPGRADE_TYPE && d.isOwned()) {
      d = d.getUpgradeDefinition();
      applyStatBonus(a, d.statType, d.statBonusValue);
    }
  }
}
```

`SKILL_UPGRADE_TYPE = 5`（`progression/upgrades.js:257`）。全量重算口是 `recalculateCharacterSkills`（`skill-effects.js:7-13`，先 `resetSkillStatBonuses` 再叠四条树）。

`src/engine/modules/characters/stats.js:61-94`（`resetSkillStatBonuses`）把所有可被技能改写的字段清回常量：`DEFAULT_MULTI_ATTACK_CHANCE = 25`、`DEFAULT_CHAIN_CHANCE = 25`、`DEFAULT_MINION_LIMIT = 1`（`balance.js:120-122`）。

`statType` → 字段的完整开关表见 `skill-effects.js:36-143`，其中战斗相关者：

| statType | 目标 | 语义（文案侧证据） |
|---|---|---|
| 1 | `wo += c` | 免疫 c% 伤害（`skills/barbarian.js:181-201`） |
| 2/3/4/5 | damage/armor/attackRating/defenceRating `.skillBonusPercent += c` | 各 +c% |
| 6/7 | maxHealth/maxSpirit `.skillBonusPercent += c` | 各 +c% |
| 8/9 | `healthRegenBonus` / `spiritRegenBonus` += c | 回复 +c% |
| 10 | `attackCooldownReduction += c` | 冷却 -c 回合 |
| 11–15 | `healPotency` / `buffDamagePotency` / `buffArmorPotency` / `buffAttackRatingPotency` / `buffDefenceRatingPotency` | 治疗/伤害/护甲/攻击/防御 法术强度倍率 |
| 16 | `spellCostReduction += c` | 耗蓝 -c% |
| 17 | `lm += c` | 暴击 +c% |
| 18/19 | `extraAttackCount += c` / `extraAttackChance += c` | 分裂目标数 / 几率 |
| 20/21/27 | `controlTargetBonus` / `chainArcBonus` / `transformTargetBonus` | 睡眠·定身群体数 / 连锁跳数 / 转变群体数 |
| 22 | `Qq += c` | 雨类半径（格） |
| 23/24 | `chainCount += c` / `chainChance += c`（**钳到 100**） | 弹跳数 / 弹跳几率 |
| 25 | `ho += 1`（**忽略 `c`，恒 +1**） | 溅射半径增量 |
| 26 | `maxSummonedMinions += c` | 随从上限 |
| 28/29 | `vt += c` / `nt += c` | 回旋跳数 / 弹射跳数 |
| 30/31/32 | `ku/lu/mu = c`（**赋值，不累加**） | 三种小鸡出现几率 |

`[疑似遗留怪癖]` `statType 25` 无视 `statBonusValue` 恒 `+1`、`30/31/32` 用 `=` 而非 `+=`：均为原样保留；`24` 的钳位写在累加之后（`skill-effects.js:120-124`）。

### C-28 火球/重锤溅射 + Blast Stun（`simulation/tick.js` 的 `spellCategoryId === 8` 支）

半径：`tick.js:297` `Hb = floorNumber((zb.stats.ho + 1) * game.tileSize),` → `ho = 0` 时是 1 格 = 27px，「改进大锤 I/II」每级再 +1 格（`skills/barbarian.js:230-243`）。

目标集合：`tick.js:298` `ac = findTargetsInRange(zb, Ma, 200, Hb);` — 以**主目标 `Ma` 为中心**、上限 200 个、同房间、对手集合（`200` 未命名，语义为"不限个数"）。

```js
                for (var Wa = undefined, ob = /** @type {any} */ (0); ob < ac.length; ob++) {
                  qb = ac[ob];
                  Ab = qb.position;
                  Bb = Ab.levelPosition;
                  if (qb === Ma) {
                    applySeparationForce(Ab, Ha, jb, Hb);
                  } else {
                    Wa = new CombatAction();
                    …
                    pb = Math.max(1, calculateAttackDamage(zb, Ma));
                    Wa.Rd = false;
                    Wa.remainingDamage = pb;
                    enqueueCombatAction(game.combatQueue, Wa);
                  }
```

`src/engine/modules/simulation/tick.js:339-355`

```js
                  var Qa = Sb,
                    nc = qb,
                    sa = nc.position.levelPosition,
                    Tb = new CombatAction();
                  Tb.attacker = vb.attacker;
                  (/** @type {any} */ (Tb)).setTargetCharacter(nc);
                  Tb.hasProjectilePhase = false;
                  Tb.actionDefinition = Qa.blastStunSpellCache;
                  if (!Qa.blastStunSpellCache) {
                    Qa.blastStunSpellCache = new Spell(blastStunSpell);
                  }
                  var qc = Qa.blastStunSpellCache.impactEffectName;
                  if (qc) {
                    var Fc = new VisualEffect(qc, sa, sa, false, 1);
                    Tb.impactEffect = Fc;
                  }
                  enqueueCombatAction(game.combatQueue, Tb);
```

要点：

1. 主目标 `Ma` 只吃**击退**（`applySeparationForce`，`movement.js:45-63`），不吃这轮的溅射伤害动作——它的伤害由原始 cat-8 动作自己带（`character.js:668-670` 用 `statValue(damage)` 直填 `remainingDamage`）。
2. 每个其它目标的溅射伤害是 `Math.max(1, calculateAttackDamage(zb, Ma))` —— **对 `Ma`（主目标）算伤害、对 `heightInTiles` 结算**。所以溅射量取决于主目标的护甲/DR/是否被瘫痪，与实际受害者无关；`Math.max(1, …)` 使溅射**永远不会 0**（`Rd = false` 也写死）。
3. `Qa` 就是 `game.spellCaches`（`tick.js:294`，宿主原名 `game.upgradeRegistry`，因其唯一成员是法术缓存而于 2026-09-27 更名），`blastStunSpellCache` 是其上的**全局唯一缓存 Spell 实例** → 全场共享一个 `Blast Stun` 对象。
4. `[疑似遗留怪癖]` **第一次**触发时 `Tb.actionDefinition` 被赋成当时的 `null`，之后才创建 `blastStunSpellCache`（赋值在前、懒初始化在后，逐字与原版一致，`c2.js:30003-30005`）。第一次火球溅射的眩晕动作因此是空定义，走到 `advanceCombatAction` 的 `else` 支（`actions.js:110-113`）且 `remainingDamage = 0` → 什么也不发生；从第二次起才真的晕。
5. 击退位移：`movement.js:55-61` `multiplyVector(a.Gd, d * (1 - b / d))` → 距主目标越远推力越小；执行在 `tick.js:244-261`，速度 `Da.Jw * a * 3`（随从地牢移速 ×3，`3` 未命名）。

### C-29 随从与召唤（`spellCategoryId` 9 / 10 / 11 / 17）

`actions.js:154-167`

```js
  } else if (10 === d || 9 === d) {
    summonSpellMinion(c, b.attacker, b.impactEffect.targetPosition);
  } else if (11 === d) {
    d = b.attacker;
    g = b.impactEffect.targetPosition;
    h = b.targetCharacter;
    f = game.monsters;
    if (h) {
      h = f.defeatedMonsters.indexOf(h);
      if (-1 < h) {
        f.defeatedMonsters.splice(h, 1);
      }
    }
    summonSpellMinion(c, d, g);
```

cat 11（骷髅军队）先把目标怪从尸体环形缓冲 `game.monsters.Og`（容量 `aE = 50`，`encounters.js:313`）里 splice 掉再召唤。召唤落点 `xi` 是 `VisualEffect` 的"终点坐标"（`sprites.js:64-93`）。cat 17（鸡群/小鸡守卫）用 `ku/lu/mu` 三个几率做模板抽签：`actions.js:171-191`，判据 `0 < g && Math.random() < g / 100`，依次尝试野蛮人/忍者/盗贼小鸡，否则普通小鸡。

随从继承召唤者的技能树（`simulation/characters.js:85-97`）：

```js
  b = d.summoner;
  a = d.classDefinition.statBonusList;
  resetSkillStatBonuses(d.stats);
  applySkillTreeBonuses(d, b.skillTree1);
```

→ 随从的战斗属性 = 随从职业曲线 + **召唤者四棵技能树的全部加成** + 模板 `statBonusList` 固定加成。

### C-30 `spellCategoryId` 分派表（`advanceCombatAction` / `applySpellEffect` 双读）

| cat | 语义 | 伤害来源 | 效果施加时机 |
|---|---|---|---|
| 1 | 治疗/吸取 | — | 逐帧回复（C-33） |
| 2 | 对敌施加状态 | — | `td: true` → 命中瞬间；`td` 未定义也走命中瞬间需 `d.td` 真值 |
| 3 | 对我方施加状态 | — | 同上（施法分派 `character.js:473-507`） |
| 4 | 直接法术伤害 | `calculateAttackDamage`（`actions.js:522`） | 有命中掷点 |
| 5 | 连锁跳伤 | `Math.max(1, calculateAttackDamage(a, ja))` 逐跳（`character.js:539`） | 跳数 `1 + (ar + 1)` |
| 6 | 雨（地面效果） | 首击 `statValue(damage)`（`character.js:608`）+ 瓦片逐帧（C-14） | — |
| 8 | 爆炸/溅射 | 首击 `statValue(damage)`（`character.js:668`）+ 溅射（C-28） | — |
| 9 | 召唤伙伴 | — | — |
| 10 / 11 / 17 | 召唤（普通/骷髅/小鸡） | — | — |
| 12 | 回旋镖 | `calculateSpellDamage`（无命中掷点，`src/engine/modules/characters/character.js:867`、`actions.js:699`） | **`td: false`** → 效果在动作收尾时施加（`actions.js:116`） |
| 13 | 弹射 | `Math.max(1, calculateAttackDamage)`（`actions.js:527`） | 有命中掷点但被 `max(1,…)` 兜住 |
| 14 | 立即拾取全场掉落 | — | `actions.js:192-282` |
| 15 | 探测财宝箱 | — | `actions.js:284-285` → `CombatQueue.prototype.wu`（`actions.js:719-724`） |
| 16 | 复活（解除昏迷） | — | `actions.js:287-291` |

目录中**不存在 cat = 7**；`content/spells.js` 出现的 cat 为 1–6、8–17（`docs/reverse-engineering/unresolved.md` U4 已逐类建场景）。

`td` 标记的确切含义：**"效果在 impact 视觉生成的那一帧施加"**。`actions.js:67-70`

```js
    var d = b.actionDefinition;
    if (d && d.td) {
      applySpellEffect(a, b);
    }
```

与 `actions.js:116`

```js
  return c && c.bl() ? ((c = b.actionDefinition) && (c.td || applySpellEffect(a, b)), b.Vn = true) : false;
```

忍者「快速打击」是全表唯一显式 `td: false`（`content/spells.js:346`），其余 cat2/cat3 均为 `td: true`；cat 14/15/16 与召唤类靠第 116 行的收尾支。

### C-31 施法耗蓝（唯一代价，没有"spirit 点"之外的消耗）

`src/engine/modules/characters/stats.js:43-53`

```js
export function spendSpirit(a, b) {
  if (!freeSpellsModifier.currentValue) {
    a.spirit -= b;
    if (0 > a.spirit) {
      a.spirit = 0;
    }
  }
}
export function getSpellSpiritCost(a) {
  return Math.min(a.spellSpiritCost - (0 < a.spellCostReduction ? floorNumber(a.spellCostReduction / 100 * a.spellSpiritCost) : 0), statValue(a.maxSpirit));
}
```

`spellSpiritCost = scaleByLevel(level, damageCurve, 1)`（`simulation/characters.js:183-184`；`damageCurve` = power 1.6, coefficient 25, growth 1.017, base 22，`balance.js:33-38`）——**耗蓝与伤害共用同一条曲线**。

- 上限 `Math.min(…, statValue(maxSpirit))` 保证满蓝也够付（若 `maxSpirit < 折后价`，则实际花费被压到 `maxSpirit`，永远不可能"付不起"）。
- `freeSpellsModifier`（药水 `modifierId 11`，`combat/potions.js:52-53`）为真时**完全免耗**。
- 行为层的可施法判定用的是**同一式**：`behaviors.js:366-373` 与 `:797-804`（`spirit < getSpellSpiritCost(stats)` → 优先级 0）。
- 施法失败仍扣蓝的路径不存在：`createSpellAction` 在目标死亡/无 `spellToCast` 时**返回 null 且不扣蓝**（`actions.js:494-503`）；但 cat 4 命中掷点失败（`Rd`）时蓝**已经**在 `actions.js:533-534` 扣掉了。

---

## 7. 治疗与回复

### C-33 法术治疗（cat 1）

`src/engine/modules/combat/actions.js:93-108`

```js
        } else if (1 === l && (h = h.potencyPercent, l = statValue(d.maxHealth), d.health < l)) {
          var n = b.attacker.stats.healPotency;
          if (1 < n) {
            h = Math.min(100, h * n);
          }
          f = Math.max(1, floorNumber(h / 100 * l / f));
          h = game.floatingText;
          if (0 < f) {
            showFloatingText(h, g, "+" + f, "#00FF00");
          }
          d.health += floorNumber(f);
          g = statValue(d.maxHealth);
          if (d.health > g) {
            d.health = g;
          }
        }
```

- `f` 在 `actions.js:85` 已取为 `impactEffect.To()`，即**影响动画的总帧数**（`sprites.js:266-268` → `SpriteAnimation.frames.length`，`sprites.js:39`）。治疗量被**摊到每一帧**：动画期内 `advanceCombatAction` 每帧执行一次本段。
- 单帧量 `max(1, floor(potency% / 100 × maxHealth / 帧数))`。牧师「治疗」`potencyPercent: 35`（`content/spells.js:117-126`）+ "Red Crosses" 动画 **8 帧**（`content/animations.js:66-71` 与 `:132` 的 `frameCount = 7`，行列展开为 0..7 共 8 帧）→ 名义总量 ≈ 35% maxHealth，`Ts = 2` 时 `min(100, 35×2) = 70%`。
- `[疑似遗留怪癖]` 帧数为 1 的动画、或 `maxHealth` 很小时，`Math.max(1, …)` 与"每帧一次"相乘会**超出名义百分比**（8 帧时 `floor` 向下、`max(1)` 兜底，净效果偏保守；帧数 < 目标所需治疗份数时反而放大）。`healPotency` 只在 `1 < n` 时参与，且先 `Math.min(100, …)` 再摊帧。
- `[疑似遗留怪癖]` `d.health += floorNumber(f)` 里 `f` 已是整数，二次取整无害。
- **`b.attacker.stats.Ts`**：治疗的强度倍率取的是**施法者**的属性，即使 `targetCharacter` 是自己。LifeDrain（cat 1）由 `LifeDrainBehavior` 选**最残血的友方**（`behaviors.js:932-946`），阈值 `0.9 < c ? null : b` → 全员血量比例 > 0.9 时不施法。

### C-34 回合再生

`src/engine/modules/simulation/tick.js:38-50`

```js
      for (c = 0; c < d.length; c++) {
        var f = d[c].stats,
          g = statValue(f.maxHealth);
        if (f.health < g) {
          var h = Math.max(1, floorNumber(g * (f.baseHealthRegenPercent + f.healthRegenBonus + healthRegenerationBonus.currentValue) / 100));
          f.health = Math.min(g, f.health + h);
        }
        var l = statValue(f.maxSpirit);
        if (f.spirit < l) {
          var n = Math.max(1, floorNumber(l * (f.baseSpiritRegenPercent + f.spiritRegenBonus + spiritRegenerationBonus.currentValue) / 100));
          f.spirit = Math.min(l, f.spirit + n);
        }
      }
```

- 节律：每 `zD = 3` 回合一次（`tick.js:33-34`、`characters.js:37`）→ 3×250ms = **每 0.75 秒回复一跳**。
- 基准：`baseHealthRegenPercent = 1`、`baseSpiritRegenPercent = 4`（`stats.js:23-24`）→ 默认每跳回 1% 最大生命、4% 最大法力。
- 加项：技能 `statType 8/9` → `healthRegenBonus/spiritRegenBonus`；冒险点升级 `bonusIndex 12/13`（各 `+1%`/级，`upgrades.js:245-248`、`balance.js:182-191`）。
- `Math.max(1, …)` → 任何角色每跳至少回 1 点，**包括 0 血倒地的冒险者**。倒地者因此会自行爬出 0 血状态，但仍 `Kd` 直到 13 号效果过期。
- **只有友方回血**：`d = getAllies()`（`tick.js:37`）。怪物/守卫/首领**完全没有再生**——`frailMonsters/docileMonsters` 之外没有任何怪物回血口。

### C-35 其他回复口

- **醒来全回复**：C-25（仅自然到期）。
- **药水不治疗**：20 种药水定义全部是全局修饰器开关（`combat/potions.js:118-238` + `getPotionModifier` `:30-75`），没有一条直接改 `health`；持续时间 `800 + potionDurationBonus.currentValue` 回合（`simulation/tick.js:112,121`）。
- **战斗中没有"撤退治疗"/ resting**：`RETREAT_HEALTH_RATIO = 0.4`、`RETREAT_SPIRIT_RATIO = 0.3`（`balance.js:124-125`）只用于过门前的撤退判定（`character.js:295`），不产生治疗。

---

## 8. 目标选择

### C-30 敌我集合（阵营翻转的唯一开关）

`src/engine/modules/combat/encounters.js:175-182`

```js
export function getOpponents(a) {
  var b = game.allies;
  return a.effects.isConverted ? isHostile(a) ? getMonsters() : b.allies : isHostile(a) ? b.allies : getMonsters();
}
export function getFriendlyTargets(a) {
  var b = game.allies;
  return isHostile(a) ? getMonsters() : b.allies;
}
```

`isHostile`：`character.js:139-141` `return a.characterType === MONSTER_TYPE || 3 === a.characterType || 4 === a.characterType;`

真值表（`isConverted` 为 `statusEffectTypeId 4` 的产物，`effects.js:80-81`）：

| 未转变 | 对手 | 友方 |
|---|---|---|
| 冒险者/随从/卷轴人（0,1,5） | `getMonsters()`（2,3,4） | `game.allies.Pf` |
| 怪物/守卫/首领（2,3,4） | `game.allies.Pf` | `getMonsters()` |

| 已转变（id 4） | 对手 | 友方 |
|---|---|---|
| 怪物/守卫/首领 | `getMonsters()`（**同阵营互殴**） | `getMonsters()` |
| 冒险者/随从 | `game.allies.Pf`（**打自己队**） | `game.allies.Pf` |

`game.allies.Pf` 由 `AllyRegistry.reset` 建队时填入全部冒险者（`encounters.js:283-293`），随从在 `spawnMinion` 末尾 `game.minions.Tt(d)` 追加（`characters.js:98` → `encounters.js:294-296`）。`getMonsters()` 返回 `game.monsters.Pi`，`MonsterRegistry.ol` 删除时同时 push 进尸体表 `Og`（`encounters.js:307-317`）。

### C-31 最近可见对手 / 最近对手（潜行、倒地、转变的过滤差异）

`src/engine/modules/ai/targeting.js:29-51`

```js
export function findNearestOpponent(a) {
  var b = getOpponents(a);
  if (0 === b.length) {
    return null;
  }
  var c = a.position.room;
  if (!c) {
    return null;
  }
  …
  for (f = 0; f < b.length; f++) {
    if (!(d = b[f], a === d || d.isDead || d.position.room != c || (l = d.effects, l.isStealthed || d.characterType === ADVENTURER_TYPE && l.Kd || (l = g.Ud(d.position.levelPosition), !(0 > n || l < n))))) {
      h = d;
      n = l;
    }
  }
  return h;
```

`src/engine/modules/ai/targeting.js:68`（`findNearestVisibleOpponent` 的判定行）

```js
    if (!(d = c[f], a === d || d.isDead || d.position.room != b || (l = d.effects, l.isStealthed || l.Kd || l.isConverted || (l = g.Ud(d.position.levelPosition), !(0 > n || l < n))))) {
```

| 函数 | 排除潜行 | 排除倒地(`Kd`) | 排除转变 | 距离度量 |
|---|---|---|---|---|
| `findNearestOpponent`（怪物用） | ✅ | **仅当目标是冒险者** | ❌ | `Ud` = 距离平方 |
| `findNearestVisibleOpponent`（玩家 AI 用） | ✅ | ✅ | ✅ | 距离平方 |
| `findChainTarget`（弹跳，`:79-120`） | ✅ | ✅ | ✅ | 距离平方（对**友方**表搜索） |
| `castScroll` 首轮（`scrolls.js:124`） | ✅ | ✅ | ✅ | 距离平方，另排除最近 4 个已打过的目标（`eq.yl`，`scrolls.js:143-148`） |

- `[疑似遗留怪癖]` **倒地的随从**（`characterType === 1`）不在 `findNearestOpponent` 的排除之列，怪物会持续攻击一个 0 血、已 `Kd` 的随从——每次都会走 `resolveCharacterDefeat → lifecycle.Lp` 把它彻底移除（`actions.js:347-348`）。
- `findNearbyOpponent`（`:121-124`）是怪物接敌门：`!b || 100 < 距离` → null。**`100` 未命名**，≈ 3.7 格，置信度中（与 `MELEE_ATTACK_RANGE 50` 不同源，是"是否值得走过来"的判定）。

### C-32 嘲讽处理

`src/engine/modules/ai/targeting.js:249-276`

```js
export function respondToTaunt(a, b) {
  if (docileMonstersModifier.currentValue) {
    return false;
  }
  var c = b.combatTarget;
  if (c && c.isDead) {
    c = null;
    b.setCombatTarget(null);
  }
  if (c && c.effects.isStunned) {
    c = null;
    b.setCombatTarget(null);
  }
  if (c && c.effects.isStealthed) {
    c = null;
    b.setCombatTarget(null);
  }
  if (c && c.effects.hasStealthEffect) {
    return attackTauntingTarget(a, b), true;
  }
  for (var d = getOpponents(b), f, g = b.position.levelPosition, h, l = null, n = -1, c = /** @type {any} */ (0); c < d.length; c++) {
    if (f = d[c], b !== f && (h = f.effects, h.hasStealthEffect && !h.isDisabled && (h = g.squaredDistanceTo(f.position.levelPosition), 0 > n || h < n))) {
      l = f;
      n = h;
    }
  }
  return (c = l) || (c = findNearbyOpponent(b)) ? (b.setCombatTarget(c), attackTauntingTarget(a, b), true) : false;
}
```

怪物唯一的行为就是 `AttackBehavior`（`encounters.js:67` `monster.behaviors = new AttackBehavior(room, MELEE_ATTACK_RANGE);`），其 `updateBehaviors`（`targeting.js:425-433`）是：

```js
  AttackBehavior.prototype.updateBehaviors = function (a) {
    if (!respondToTaunt(this, a) && (a.position.movementTargetCleared || a.actionType === IDLE_ACTION)) {
      var b = (this.Al.tileRow + 1) * game.tileSize,
        c = (this.Al.heightInTiles - 1) * game.tileSize;
      setVector(a.position.moveTargetPoint, (this.Al.tileColumn + 1) * game.tileSize + randomInt((this.Al.widthInTiles - 1) * game.tileSize), b + randomInt(c));
      a.actionType = 1;
      a.position.movementTargetCleared = false;
    }
  };
```

要点：

1. **优先级**：当前目标仍活着且带 `Gn`（嘲讽）→ 继续打它（不清）。当前目标死了 / `isStunned` / `isStealthed` → 清空目标。
2. 随后：找**最近的带 `Gn` 且未 `Kd` 的对手**（无视 100px 接敌门），否则退回 `findNearbyOpponent`（100px 内、非潜行、非倒地冒险者、非排除转变）。
3. `docileMonstersModifier`（药水 `modifierId 13`「驯养怪物」）**只关掉仇恨与接敌**——`respondToTaunt` 直接返回 false，怪物转为房内随机游走，但已经排定的动作不被撤销。
4. 嘲讽的 `Gn` 位由 `statusEffectTypeId 10` 置（`effects.js:68-70`），同时给被嘲讽者 `defenceRating.spellBonusPercent += 50`（`spells.js:183-194` 的 `potencyPercent: 50`）。
5. 出手与追击：`attackTauntingTarget`（`targeting.js:277-293`）用 `a.actionRange`（= `MELEE_ATTACK_RANGE` 50）判距，够近则 `canAttack` → `markAttackTurn` → `actionType = 2`；否则 `choosePointNearTarget`（`:128-141`，目标 ±`halfTileSize`(13) 内随机点，再 `clampPointToRoom(..., 0)`）→ `actionType = 1`。
6. `[疑似遗留怪癖]` 第 2 步的循环只找 `Gn`，但 `findNearbyOpponent` 的返回值赋给的是 `c` 而不是 `l`，最后 `(c = l) || (c = findNearbyOpponent(b))` 里的短路赋值语义与原版逐字一致（`c2.js` 同结构）——不影响结果，只是变量复用。

### C-33 玩家侧行为优先级如何被选出（唯一仲裁口）

`src/engine/modules/ai/behaviors.js:285-303`

```js
  BehaviorQueue.prototype.updateDungeonMode = function (a) {
    a.actionType = IDLE_ACTION;
    a.targetGoldDrop = null;
    a.combatTarget = null;
    a.targetItemDrop = null;
    a.targetTreasureChest = null;
    a.spellToCast = null;
    a.targetScrollDrop = null;
    a.targetPotionDrop = null;
    var b,
      c = 0,
      d,
      f = null,
      g;
    for (b = 0; b < this.behaviorList.length && !(d = this.behaviorList[b], d.getPriority() > c && (g = d.getBehaviorScore(a), g > c && (c = g, f = d), 100 <= c)); b++) {}
    if (f) {
      f.execute(a);
    }
  };
```

- 每回合（`tick.js:104`）先把动作与所有拾取/施法目标**清空**，然后按 `this.fo`（职业定义的固定顺序，`content/classes.js:* createBehaviors`）**顺序扫描**。
- 两道门：`getPriority() > c`（该行为的名义上限必须**严格大于**当前已得分）→ 才付代价调用 `getBehaviorScore(a)`（实际算分，含随机数与目标搜索）；`g > c` 才接管。
- `100 <= c` 提前跳出（满分即停）。
- **同分先声明者胜**（严格 `>`），所以列表顺序就是优先级。
- 关键名义权重（`priorityWeight` 实参，全部来自 `classes.js` 行为列表）：`FollowLeaderBehavior = 100`、`StunnedBehavior = 99`、拾取类 98/75/70、远程攻击 95、主要法术 95/94/90/85、近战 90/85/65、`ExploreDungeon/Idle = 10/1`、`WaitBehavior.eo = 2`。

动态分数（`getBehaviorScore` 返回值，旧符号 `getBehaviorScore`）：

| 行为 | 分数式 | 位置 |
|---|---|---|
| `FollowLeaderBehavior`（逃） | `(1 - health/maxHealth) × 100`，仅当 `health/maxHealth ≤ 0.8` **且**有怪锁着自己且距离 ≤ `RANGED_MIN_DISTANCE`(50) | `behaviors.js:435-454` |
| `RangedAttackBehavior`（风筝） | 有可见目标且 `距离 > RANGED_ATTACK_RANGE` → 0；`co > 2` → 0 并重置；否则 95/90 | `:537-540` |
| `MeleeAttackBehavior` | 有目标即满分 `priorityWeight`（不区分远近，远了转为移动） | `:566-576` |
| `OpportunisticAttackBehavior`（盗贼小鸡） | 自己潜行 → 近战(2/50)，否则远程(3/140) | `:659-673` |
| `GuardRangedBehavior` | 自己潜行 → 0，否则转调内层 `RangedAttackBehavior` | `:756-758` |
| `HealBehavior` | `min(P, 5/对手数 × P)`（对手越多越不值得奶，P=95/90） | `:822-825` |
| `LifeDrainBehavior` | `(1 - 最低血量比) × P` | `:922-925` |
| `SpecialAttackBehavior`（随从） | 召唤者与目标距离 ≤ 160 才出手 | `:1533-1553` |
| `CooldownBehavior`（随从归位） | 与召唤者距离 ≥ 160 才走回去，权重 100（压过其一切行为） | `:1500-1507` |
| `StunnedBehavior` | `eo = 99`，只在"靠门或靠楼梯"时才生效（否则让位） | `:1571-1585` |
| `ExploreDungeonBehavior` 及其全体子类（`behaviors.js:361-376`） | 无房 / 法术未就绪 / **蓝不够 `getSpellSpiritCost`** → 0 | `:361-376` |

`[疑似遗留怪癖]` `StunnedBehavior`（权重 99，仅次于逃跑）的 `getBehaviorScore` 条件与名字相反：它只在角色**已经站在门边或楼梯边**时才返回非 0，且 `execute` 做的事是"把移动点夹在房内并 `actionType = 1`"。语义推断为"晕头转向时不要卡在门口"，置信度低——`StunnedBehavior` 与 `effects.Kd` 之间没有任何交叉引用，`Kd` 为真的角色在 `tick.js:793` 已被强制 `IDLE_ACTION`，根本不会走到行为仲裁，所以这 99 分在实战中只在"刚醒但还在门口"这类边角出现。要定论需原版文案或按名取用的第二处证据。

### C-34 施法者选目标（cat 分派）

| cat | 目标式 | 位置 |
|---|---|---|
| 3（团队增益） | `getFriendlyTargets(a)` 全员，**不做同房间过滤** | `character.js:484-503` |
| 5（连锁） | 逐跳 `nearestFriendly(ja) within RANGED_ATTACK_RANGE`，排除已跳过的最近 4 个；**先取非潜行/非倒地/非转变者，取不到就退回这些"坏"者**（`bb = Bb ? Bb : qb`） | `character.js:543-569` |
| 6（雨） | 主目标 + 以 `Qq + 1` 为半径的瓦片方块，每格 `0.5 > Math.random()` 才放效果 | `character.js:586-637` |
| 8（爆炸） | 主目标 + `ho + 1` 圈内瓦片（分三层 `applyAreaTileEffect` 手写展开） | `character.js:677-728` |
| 2 且 type ∈ {0,1,4}（群体禁用） | 以主目标为锚，同房间、`RANGED_ATTACK_RANGE` 内、**未带同类型效果**者，抽 `mr+1` / `Ft+1` 个 | `src/engine/modules/characters/character.js:888-952` |
| 16（复活） | 第一个 `effects.isStunned` 的冒险者 | `behaviors.js:965-975` |
| 其它（1/2/4/9/10/11/12/13/14/15/17） | `a.combatTarget`（由行为层 `selectScrollTarget` / `findNearestVisibleOpponent` 预先填好） | `actions.js:494-503` |

群体禁用那一步对首领的免疫是硬编码的：`src/engine/modules/characters/character.js:963`

```js
                    if (Wd = Ud[xe], 4 !== Wd.characterType || 1 !== te && 0 !== te) {
```

→ **首领免疫 type 1（定身）与 type 0（睡眠）**，飘"免疫!"（`:981`）；**转变(4)对首领有效**，且普通怪（type 2）两者都不免疫。

### C-35 弹跳链（chain）的目标选择与"可以弹回上一个"

`src/engine/modules/combat/actions.js:611-618`

```js
export function createChainAction(a) {
  var b = a.getChainCount(),
    c = a.chainCount;
  if (b >= c) {
    return null;
  }
  var d = findChainTarget(a.targetCharacter);
  if (!d) {
```

`findChainTarget`（`targeting.js:79-120`）在**上一跳目标的友方表**里找最近可见者——上一跳目标是怪物，其"友方"就是怪物列表，所以链在敌方内部传递。

`[疑似遗留怪癖]` `findChainTarget` 只排除传入的那个目标本身（`a === d`），**不排除更早的跳板** → A→B→A 合法。同函数在无同房间候选时退化为"从友方表随机抽，最多重抽 6 次，且抽到无房间的直接置 null 后返回"（`targeting.js:107-119`）。

跳数与几率（`stats.js:102-114`）：

```js
  CharacterStats.prototype.Ir = function () {
    var a = this.chainChance / 100,
      b = 0,
      c;
    for (c = 0; c < this.chainCount; c++) {
      if (Math.random() < a) {
        b++;
      } else {
        break;
      }
    }
    return b;
```

连续成功直到首次失败，与 C-3 的分裂攻击同一模式。`Ir()` 这个名字在 `CharacterStats` 上是"掷跳数"、在 `CombatAction` 上是"读 `currentChainStep`"（`actions.js:716-718`）——**同名双语义**，差分上承重，禁止合并。

链只在**远程攻击**上触发（`actions.js:470-474`）；近战分支不写 `chains`。回旋镖（cat 12）的返回段用的是另一套：`chainCount = vt + 1`（`src/engine/modules/characters/character.js:857`）、`Math.max(1, …)` 的弹射则是 `nt + 1`（`src/engine/modules/characters/character.js:878`），并且 `returns` 支在最后一跳把目标设回施法者（`actions.js:655`）。

`1 + (a.stats.ar + 1)`（`character.js:513`）＝连锁跳数 `ar + 2`——多出的 `1 +` 使 `ar = 0`（未学技能）时也有 2 跳。`[疑似遗留怪癖]` 看着像 off-by-one，但原版同式，保留。

---

## 9. 死亡、倒地与遭遇结束

### C-36 死亡分派（按 `characterType` 四支）

`src/engine/modules/combat/actions.js:326-415`（完整函数见 C-24 起段）

| 死者类型 | 处理 | 掉落 | 位置 |
|---|---|---|---|
| 0 冒险者 | **不死**：置 `isStunned` + 推 type 13 效果 + `stunCount++` | 无 | `actions.js:327-346` |
| 1 随从 | `game.lifecycle.Lp(b)` → 从 `summonedMinions`/`companion` 摘除、`isDead = true`、`game.minions.Lp` | 无 | `actions.js:347-348`、`characters.js:257-272` |
| 4 首领 | 固定爆发掉落 + `isDead` + 换尸体的贴图 + 清遭遇 + `recordGameEvent("Boss Defeated", …)` | 金 `10+randomInt(10)`、物 `7+randomInt(8)`、卷轴 `2+randomInt(5)`、药水 `0+randomInt(2)`（受容量钳制） | `actions.js:349-411` |
| 2 怪 / 3 守卫 / 5 卷轴施法者 | `game.lifecycle.ol(a, b)` → 概率门掉落 | 各按 `globalUpgradeDefinitions` 几率 | `actions.js:412-414`、`characters.js:273-337` |

- 首领支的**双倍药水**只对金/物两个计数 `*= 2`（`actions.js:376-378,385-387`），卷轴与药水不受影响。
- 掉落散布范围：`tickCharacterTurn(坐标, 左+tile, 右-tile)` → **±3 格内随机再夹回房间内**（`simulation/characters.js:236-245`）。
  `[命名警示]` `tickCharacterTurn` 与"回合"无关，是恢复期的误名；原版符号 `vw`（`c2.js:29816-29823`）逐字相同。改名不影响行为，但引用它写公式时不要按名字理解。
- 击杀记账在两支里重复实现且**不完全一致**：`actions.js:353-366`（首领）与 `characters.js:278-292`（普通）都有 `kills++`、`addKills(doubleKillsModifier)`、`addExperience(monsterType.No × doubleExperienceModifier)`、`recordMonsterTypeKill`；但 `f.stats.$k()`（随从的 minionKills）只在 `characters.js:287` 有，首领支缺（`actions.js:360-362` 只调了 `statisticsRecorder.$k()`）。
- `[疑似遗留怪癖]` 首领支最后无条件调用 `game.state.encounter.ol()` 与 `recordGameEvent("Boss Defeated", "等级:" + b.stats.characterLevel)`，即使 `isAdventurerOrMinion(d)` 为假（例：怪物溅射误杀首领）也照记不误。
- `[疑似遗留怪癖]` 随从死亡走 `lifecycle.Lp`，**不掉任何东西、不给经验、不计 `kills`**（该逻辑在 `resolveCharacterDefeat` 的 type 1 分支里被完全跳过）。

### C-37 遭遇何时结束（唯一判据）

`src/engine/modules/combat/encounters.js:266-282`

```js
  EncounterState.prototype.ol = function () {
    if (1 > getMonsters().length) {
      this.ym = true;
      game.state.statisticsRecorder.recordRoomCleared();
      clearScrollTargets();
      awardAdventurePoints(POINT_EVENT_ENCOUNTER);
      var a, b;
      for (a = 0; a < game.state.adventurers.length; a++) {
        b = game.state.adventurers[a].effects;
        if (b.isStunned) {
          b.isStunned = false;
          removeStunEffects(b);
        }
      }
    }
  };
```

- **判据 = 怪物注册表 `Pi` 长度为 0**（含首领、守卫）。随从/冒险者全倒不会结束遭遇。
- `ym = true` 是"该房未开过怪"标记，`populateEncounter` 的唯一闸门（`encounters.js:43`）。
- `removeStunEffects` 只删 `statusEffectTypeId === 13`（`effects.js:112-122`），**不删 14**；也不清 `Kd`——`Kd` 要等下一个回合边界由 `updateCharacterEffects` 重算，因此**清场当回合内倒地者仍不能动**。
- 结合 C-25：清场/复活术把 `isStunned` 直接改 false，导致下一次 `updateCharacterEffects` 的 `l` 已是 false → **不给全回复**，角色以 0 血状态回到可行动集合，直到 C-34 的每 3 回合 +1% 回复把他抬出 0 血。

### C-38 遭遇如何开始（房间类型决定对手构成）

`src/engine/modules/combat/encounters.js:41-58`

```js
export function populateEncounter(a) {
  var b = game.monsterNames;
  if (game.state.encounter.noMonstersLeft) {
    var c = a.encounterType;
    if (0 === c) {
      if (bossEncounterModifier.currentValue && 0.2 > Math.random()) {
        spawnDungeonBoss(b, a);
      } else {
        var minMonsters = globalUpgradeDefinitions.minMonsters.currentValue,
          maxMonsters = Math.max(globalUpgradeDefinitions.maxMonsters.currentValue, minMonsters),
          monsterCount = minMonsters + randomInt(maxMonsters - minMonsters);
        monsterCount += extraMonstersModifier.currentValue;
        if (0 < monsterCount) {
          var catalog = game.monsterCatalog,
            monsterLevel = catalog.minUnlockedLevel + randomInt(1 + catalog.maxUnlockedLevel - catalog.minUnlockedLevel),
            monsterTypes = getMonsterTypesForLevel(catalog, monsterLevel),
            monsterType = monsterTypes[randomInt(monsterTypes.length)],
            encounterName = b.nameGenerator.generateName(monsterType.pluralName) + " (等级." + monsterType.level + ")";
```

- 房间类别字段 `DungeonRoom.Yp`（`world/rooms.js:29`）：0 地牢普通房、1 城堡房、2 首领房、3 财宝房（由 `treasureRoomModifier` 药水在 `revealRoom` 时以 `0.25 > Math.random()` 概率改写 0→3，`rooms.js:53-59`）。
- 怪物数：`minMonsters + randomInt(max(8,0) − minMonsters)`，再加 `extraMonstersModifier`（更多怪物药水 +10）。默认 `min = 0, max = 8` → **0 只时整段跳过、不 beginEncounter**（`encounters.js:53`）。
- 怪物等级：`catalog.hd + randomInt(1 + catalog.maxUnlockedLevel - catalog.hd)`，再 `getMonsterTypesForLevel` 取该等级的 20 个随机怪种并按 `a.HE` 排序后抽一个（`encounters.js:54-57,225-248`）；**同名单次生成后缓存**，所以一个等级的怪物名册是固定的。
- 首领房/城堡房额外必带一批守卫：`spawnCastleGuardians(g, b)`（`encounters.js:149`），`spawnCastleGuardians` 以 50% 概率决定"混合种类"还是"清一色"（`encounters.js:152-168`）。首领等级 = **队伍最高等级**（`getPartyMaxLevel`，`encounters.js:114`）；守卫等级 = **已解锁怪物最高等级**（`encounters.js:154`）。
- 触发时机：开门时。`character.js:315-319`

```js
                    if (!Q.$d.Xi) {
                      populateEncounter(Q.$d);
                      revealRoom(Q.$d);
                      spawnRoomTreasure(Q.$d);
                    }
```

`[疑似遗留怪癖]` `getMonsterTypesForLevel` 在 `monsterLevel > maxUnlockedLevel + 1` 或 `< hd` 时只 `console.log` 不修正（`encounters.js:226-231`）。

---

## 10. 疑为原版缺陷 / suspected legacy quirks

以下条目**一律按原样保留**，差分两端一致；本文不提出修正。标注 `[迁移缺陷？]` 的几条是我在 `src` 与 `archive/original/c2.js` 之间找出的**行为差异**，不属于"原版怪癖"，需要单独立项验证——但也不得由文档作者擅自改代码。

| # | 位置 | 现象 | 与原版对比 |
|---|---|---|---|
| 1 | `combat/actions.js:557-559` | `getProjectileAnimation(a, b)` 首行 `if (3 === a.sw())` **无空值保护**；`createAttackAction` 在远程支传入 `a.equipment.Ey`（`actions.js:452`），无投射武器槽的角色该字段是 `null`（`movement.js:11`）→ `TypeError: Cannot read properties of null (reading 'sw')`，异常从 `advanceSimulation` 直穿帧循环（`simulation/loop.js` 的 try/catch 只包 `view.render()`，`loop.js:74-80`） | 原版同式同点抛错：`Aw (c2.js:21119) ← yw (21061)`。已由差分场景实测两端**同点、同消息**（`docs/reverse-engineering/unresolved.md` U4，cat 12/14/15 场景早期） |
| 2 | `simulation/tick.js:346-349` | 溅射眩晕动作的 `actionDefinition` 在懒初始化**之前**就被赋值为 `null` → **全场第一次**火球/重锤溅射不产生任何眩晕 | 逐字相同（`c2.js:30003-30005`），原版行为 |
| 3 | `simulation/tick.js:334` | 溅射伤害 `Math.max(1, calculateAttackDamage(zb, Ma))` 用**主目标**算、给**其它目标**扣，护甲/DR/`damageResistance` 全部错位 | 逐字相同（`c2.js:29994`），原版行为 |
| 4 | `characters/effects.js:107-110` vs `encounters.js:273-280`、`actions.js:287-291` | 清场与复活把 `isStunned` 就地改 false，绕开了唯一的全回复分支 → 被救者停在 0 血 | 原版同结构（`c2.js:9444-9445`、`20950`），原版行为 |
| 5 | `characters/effects.js:18` 与 `skill-effects.js:155-264` | `statusEffectDefinitions` **没有 key `2`**；`isDisablingEffect` 也不认 2。若将来有法术配 `statusEffectTypeId: 2`，`applySpellEffect` 会打日志并施加 `null`（`actions.js:143-146`） | 当前内容无引用（已 grep 全库） |
| 6 | `characters/effects.js:56-97` | `statusEffectTypeId` **3（失明）与 9（迅捷）** 定义了但在战斗中无任何读者；两者在 `content/spells.js` 里也没有对应法术 | 死数据，原版同样无读者 |
| 7 | `content/spells.js` 多处 `bo: true` | `unusedSpellFlag` 字段**全库无读者**（`Spell` 构造器只复制 `name/spellCategoryId/impact/projectile/statusEffectTypeId/potencyPercent/cooldownTurns/td`，`scrolls.js:15-25`）→ 写-only | 原版亦无读取（`c2.js` 内 `\bbo\b` 仅出现在数据字面量） |
| 8 | `characters/stats.js:54-60` | `updateScrollAccuracy` 先 `a.chainChance = 100` 再 `if (100 < a.chainChance) a.chainChance = 100` —— 钳位写在赋值之后，恒不生效；且它无条件作用于 `game.state.scrollCaster`，与升级所属角色无关 | 原版同式（`c2.js` 对应 `xq.prototype` 分支），原版行为 |
| 9 | `combat/actions.js:307-308` | `var f = 1 + randomInt(d - 1); if (0 !== f)` —— `f >= 1` 恒真，死分支 | 原版同式（`c2.js:20963`），原版行为 |
| 10 | `combat/actions.js:589` | 命中概率无除零保护：`AR + DR === 0` → `0/0 = NaN` → 比较为 false → **必定命中**。当前内容（`armorCurve` base 15）不可达 | 原版同式（`c2.js:21144`） |
| 11 | `characters/character.js:513` | 连锁跳数写作 `1 + (a.stats.ar + 1)`，即未学技能也有 2 跳（疑 off-by-one） | 原版同式，原版行为 |
| 12 | `combat/scrolls.js:22-34` + `combat/actions.js:533-534` | cat 4 法术命中掷点失败（`Rd`）时，**蓝已在 `createSpellAction` 内扣掉**，动作被 `advanceCombatAction:63` 静默丢弃：无视觉、无飘字、无效果，玩家只看到蓝变少 | 原版同流程 |
| 13 | `ai/behaviors.js:1571-1585` | `StunnedBehavior`（权重 99）与 `effects.Kd` 无任何交叉引用；`Kd` 为真的角色在 `tick.js:793` 已被强制 `IDLE_ACTION`，永远进不到这个行为。名字与触发条件（"站在门/楼梯边"）也对不上 | 原版同结构；**语义置信度低** |
| 14 | `simulation/tick.js:411` vs `:427` | 地面伤害的 `damageGiven` 记在**队列最后一个动作的攻击者**（`Ga` 为循环泄漏变量）名下，而致死 `resolveCharacterDefeat` 用的是 `lb.ud`（真实施法者）→ 两个归属可能不同人 | 原版同结构 |
| 15 | `combat/encounters.js:200-212` | 六条怪物曲线**名称与用途交叉**（见 C-15），且 `monsterHealthCurve`/`monsterAttackCurve` 与 `monsterSpiritCurve`/`monsterDefenceCurve` 两对参数完全相同，无法从数值反推命名是否互换。赋值关系已对 `c2.js:9577-9580` 核实 | 赋值关系正确；**名字归属置信度低** |
| 16 | `content/classes.js:639` | 卷轴施法者 `attackRatingMultiplier: 500` 未命名，按 C-9 推断为"卷轴不失手" | 原版同值；**语义置信度中** |
| 17 | `simulation/characters.js:236` | `tickCharacterTurn` 是**位置抖动**函数（±3 格内取随机点并夹到房间内），与"回合"无关；名字会误导读者 | 原版符号 `vw`（`c2.js:29816`），实现逐字一致；纯命名问题 |
| 18 | **`combat/actions.js:452-467` 的 `So()`/`itemEffect` 支为死代码** | `Equipment.prototype.So()` 返回 `this.fz`，而 `effectItem` 只在 `movement.js:202` 的 `if (1 === a.statType)` 下赋值，`Item` 上没有 `statType` 字段（只有 `characteristic`，`items.js:70`）→ `So()` 恒 `null` → `if (h)`（`:459`）与近战支 `if (b && (f = b.ms))`（`:484`）永不进入 → 元素特效武器**永远拿不到自己的弹道与命中标签**，远程投射物一律 `"Red Arrow"`、impact 一律 `"Red Splat"` | 原版同样读 `a.statType`（不存在）→ 同样死支。**原版行为，非迁移引入**。已在 `docs/formulas/items.md` 记为怪癖 #4；`"Ninja Star"` 支不受影响（走 `projectileWeapon` 而非 `effectItem`） |
| 19 | `[迁移缺陷？]` `combat/scrolls.js:43` vs `:262-330` | `Scroll` 构造器读 `a.spellDefinition`，而 `scrollDefinitions` 数据表的键仍是 `spellDefinition`（`scrolls.js:266,274,286,298,310,322`）→ `a.spellDefinition` 恒 `undefined` → **`scrollSpell` 对所有 6 种卷轴恒为 `null`** → `castScroll` 的 `if (a.mB)`（`:152-157`）永远走 `else`，即卷轴**从不施法**，一律退化为卷轴施法者的远程攻击 | 原版为 `this.mB = a.xa ? new li(a.xa) : null`（`c2.js:12892`），**读的是存在的 `spellDefinition`**；6 条卷轴里 5 条有法术定义。**极可能是重命名漏改数据字面量**，与 `docs/reverse-engineering/facts.md` 第 20 条记录的同类事故同型 |
| 20 | `[迁移缺陷？]` 承接 #19 | 该支路进一步把 `actionType = MELEE_ACTION_TYPE`（远程）交给卷轴施法者，而它没有投射武器槽（`slotStatBonusList` 只有 `"230".."235"`，`classes.js:617-635`）→ `Ey === null` → **必抛本表 #1 的 TypeError**。原版只有 `arrowScroll`（`xa: null`）会掉进这条 | 未由差分覆盖：`docs/reverse-engineering/unresolved.md` U7 明记 `castScroll()` 至今未被驱动（`scrolls-stocked` 场景只比库存） |

#19/#20 的定论方式：给 harness 加一条驱动 `castScroll()` 的场景（要求房内已有可打目标，`getOpponents` 非空），两端各自断言 `statistics.spellsCast` 是否增长、以及是否抛出 `reading 'sw'`。当前矩阵两端都不会抛（因为两端都不会走到），所以这条**无法由现有 34 场景证伪**。

---

## 附：一次普通攻击的完整随机数消耗顺序（差分承重）

以"冒险者远程攻击一个未瘫痪目标、`extraAttackCount = 0`、`chainCount = 0`"为例，`Math.random()` 的消耗次序：

1. `calculateAttackDamage` 命中判定 —— `Math.random()`（1 次，仅当目标 `!Kd`）
2. `calculateAttackDamage` 暴击判定 —— `Math.random()`（仅当 `lm > 0`）
3. `randomInt(floor(armor/2))` 护甲抖动 —— `Math.random()`（仅当未暴击）
4. `createAttackAction` 内 `stats.Ir()` 掷弹跳 —— `Math.random()` × `chainCount`（≥1 次，`chainCount = 0` 时仍进循环 0 次，不消耗）
5. 若 `chainCount > 0` 且掷出 ≥1，`findChainTarget` 可能 `randomInt(d.length)`（≤6 次）
6. 之后每帧 `applyActionDamage` 的 `randomInt(remainingDamage - 1)` —— 每次 `Math.random()`，直到 `remainingDamage` 归 0

`docs/rng.md` 已确认 `randomInt` 走全局 `Math.random`、与 `SeededRandom` 两条流互不相干；任何一步增删都会让 34 场景矩阵立刻分叉。
