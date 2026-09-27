# 成长曲线与推进公式（以代码为准）

> 引用规范：形如 `combat/actions.js:84` 的路径相对 `src/engine/modules/`；若某处只写了裸文件名（如 `character.js:677`），以所在小节的模块归属为准——`characters/character.js` 与 `views/character.js` 同名，未逐一消歧。

> 事实来源：`src/engine/modules/**` 当前实现。每条公式给出 `file:line` 与原文 JS 片段。
> 与 `archive/original/c2.js` 的等价性由 **60 场景差分矩阵**（`npm run test:scenarios`）保证，因此本文描述的是**权威行为**。
> **片段同步状态（2026-09-27）**：内嵌片段与散文里的标识符已按 `docs/symbol-map.json` 的字段映射批量同步到当前语义名（`scripts/fix-doc-identifiers.mjs`）；节选/伪码型片段的行号不逐字对应（见 `scripts/check-doc-snippets.mjs` 的残留清单），判读时以片段上方的 `file:line` 为准。
> 凡看起来像 bug 的地方一律按原样记录并标 `[疑似遗留怪癖]`；本文不提出修正。
> **引用体例**：JS 片段为源码原文，但为控制篇幅做了两种压缩——(a) `…` 表示省略的行；(b) 少数多行嵌套被并为单行（token 序列不变）。凡 token 序列与源码不一致之处均为笔误，欢迎按 `file:line` 复核后修正。

---

## 0. 唯一的曲线求值器

`src/engine/modules/core/math.js:72-80`

```js
export function scaleByLevel(a, b, c) {
  a = Math.max(0, a - 1);
  return floorNumber(c * (b.base + b.coefficient * Math.pow(a, b.power) * Math.pow(b.growth, a)));
}
export function randomizeScaledValue(a, b, c) {
  a = scaleByLevel(a, b, c);
  b = 1.1 - 0.2 * Math.random();
  return floorNumber(a * b);
}
```

```
scaleByLevel(x, curve, mult) = floor( mult · (curve.base + curve.coefficient · (x−1)^curve.power · curve.growth^(x−1)) )
```

三条全局性质（后文所有曲线公式都隐含）：

1. **先 `x−1` 再求幂**：`x ≤ 1` 一律被 `Math.max(0, …)` 钳到 0，此时结果 = `floor(mult · base)`。
2. **单次向下取整**：`floorNumber` 在 `< 2^31` 时用 `a | 0`（向零截断），否则 `Math.floor`（`core/math.js:66-68`）。
3. **无上限**：不存在任何"最高等级/最高价"钳制；钳制由调用方的 `maxValue`/`if` 完成。
4. `randomizeScaledValue` 的 ±10% 抖动只被道具与怪物掉落使用；**所有价格/经验曲线都不抖动**。

### 0.1 曲线常量全集

`src/engine/modules/content/balance.js:15-116`（同文件 `:81-92` 为道具两条曲线，见 `docs/formulas/items.md`）

| 曲线 | power | coefficient | growth | base | 用途 |
|---|---|---|---|---|---|
| `experienceCurve` | 2.1 | 500 | 1.005 | 100 | 升到下一级所需 XP |
| `healthCurve` | 1.5 | 15 | 1.017 | 85 | `maxHealth.levelValue` |
| `spiritCurve` | 1.5 | 15 | 1.017 | 85 | `maxSpirit.levelValue` |
| `damageCurve` | 1.6 | 25 | 1.017 | 22 | `spellSpiritCost` |
| `armorCurve` | 1.8 | 15 | 1.015 | 15 | `armor / attackRating / defenceRating / damage` 四条 `levelValue` |
| `monsterHealthCurve` | 1.7 | 1 | 1.0017 | 30 | → `damage` → 怪物 `damage.levelValue` |
| `monsterSpiritCurve` | 1.7 | 1 | 1.0017 | 25 | → `armor` → 怪物 `armor.levelValue` |
| `monsterAttackCurve` | 1.7 | 1 | 1.0017 | 30 | → `attackRating` → 怪物 `attackRating.levelValue` |
| `monsterDefenceCurve` | 1.7 | 1 | 1.0017 | 25 | → `defenceRating` → 怪物 `defenceRating.levelValue` |
| `monsterDamageCurve` | 1.7 | 1 | 1.0018 | 15 | → `maxHealth` → 怪物 `maxHealth.levelValue` |
| `monsterArmorCurve` | 1.24 | 1 | 1.0002 | 4 | → `experienceReward` = 每杀经验 |
| `itemStatCurve` / `itemGoldCurve` | 1.8 | 15 | 1.015 | 15 | 道具属性/金价 |
| `dungeonPriceCurve` | 1.7 | 120 | 1.018 | 100 | 地牢农场价 |
| `monsterUnlockPriceCurve` | 1.02 | 100 | 1.01 | 100 | 怪物等级解锁/退休价 |
| `scrollPriceCurve` | 1.4 | 250 | 1.018 | 100 | 卷轴解锁/升级价 |
| `globalUpgradePriceCurve` | 1.02 | 50 | 1.01 | 100 | 全局升级价（杀戮支付） |

`monster*Curve` 的名字与它最终喂给哪个属性**是错位的**（`damage ← monsterHealthCurve`、`maxHealth ← monsterDamageCurve`），见 §7。曲线字段名含义未在代码内命名，上表"用途"列由赋值点反推，置信度高。

---

## 1. XP → 等级

### P-1 需求 XP 的求值点

`src/engine/modules/simulation/characters.js:166-185`

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

第二处求值点（读档）：`src/engine/modules/persistence/game-save.js:510-514`

```js
Sa.characterLevel = bd ? bd : 1;
var sl = scaleByLevel(Sa.characterLevel, experienceCurve, 1);
Sa.experienceToLevelUp = sl;
var Kh = scaleByLevel(Sa.characterLevel, damageCurve, 1);
Sa.spellSpiritCost = Kh;
```

`experienceToLevelUp` 字段名未语义化。含义 = **"从当前等级晋升一级所需的 XP"**，证据：`LevelUpUpgrade.purchase` 以 `stats.Am` 为价格扣除队伍 XP（`progression/upgrades.js:537-544`），UI 亦按 `"… XP"` 显示（`views/upgrade-details.js:410`）。置信度高。

**代入 `b = 当前等级`**（不是 `等级+1`），配合 §0 的 `x−1` 位移：

```
XP(当前等级 L 升到 L+1) = floor( 100 + 500·(L−1)^2.1·1.005^(L−1) )
```

| L | 1 | 2 | 3 | 5 | 10 | 25 | 50 | 100 |
|---|---|---|---|---|---|---|---|---|
| 需要 XP | 100 | 602 | 2265 | 9474 | 52868 | 446165 | 2262236 | 12712982 |

（整表为按 §0 求值器实算，非引用外部资料。）

- **钳制**：仅 §0 的 `Math.max(0, L−1)` 下钳；**无上限钳制**，全库不存在最高等级常量（`characterLevel` 的全部赋值点：`characters/stats.js:20`、`combat/encounters.js:66,127`、`persistence/game-save.js:510`、`progression/upgrades.js:549,554,567`、`simulation/characters.js:78,111,151`、`views/party-creation.js:60`）。

### P-2 升级不是自动的：升级由购买驱动

XP 侧只做累加，**不检查阈值**：

`src/engine/modules/characters/party.js:53-56`

```js
export function addExperience(a) {
  var b = game.state.party;
  b.experiencePoints += a;
}
```

`experienceToLevelUp`/`experiencePoints` 的唯一比较者是 `LevelUpUpgrade`：

`src/engine/modules/progression/upgrades.js:593-610`（判定）与 `:532-574`（执行）

```js
this.requiredExperience = a.stats.experienceToLevelUp;
this.canPurchase = game.state.party.experiencePoints >= this.requiredExperience;
```

```js
if (!(game.state.party.experiencePoints < c)) {
  var f = game.state.party;
  f.experiencePoints -= c;
  if (0 > f.experiencePoints) {
    f.experiencePoints = 0;
  }
  c = b.characterLevel + 1;
  applyLevelStats(b, c, a.classDefinition.statMultipliers);
  a.skillPoints++;
  a.hasUnspentSkills = hasUnspentSkills(a);
  b.characterLevel = c;
```

结论性证据（两向）：

- **支持"购买驱动"**：`characterLevel + 1` 只出现在 `LevelUpUpgrade.purchase`；XP 到达阈值不产生任何副作用；升级按钮本身就是一个 Upgrade（`characterLevelUpgrades = [new LevelUpUpgrade(0)…(4)]`，`content/balance.js:486`），最多 5 名队员各一行。
- **反证（无自动升级路径）**：`addExperience` 的两个调用点仅调 `addExperience`，不做等级检查（`simulation/characters.js:290`、`combat/actions.js:364`）。
- **旁证**：差分夹具的中局存档里"冒险者 `characterLevel` 恒为 1、`skillPoints` 恒为 0"，因为矩阵从不点升级按钮（`docs/reverse-engineering/unresolved.md` U7）。

升级的连带结算（`progression/upgrades.js:550-568`）：

```js
if ((b = a.summonedMinions) && 0 < b.length) { ... g.stats.characterLevel = h; applyLevelStats(...) }
refreshPartyLevels();
b = getPartyMinLevel();
// 队伍最低等级变化 → 卷轴施法者跟随重定级
if (d !== b) {
  d = game.state.scrollCaster; ...
  applyLevelStats(b, f, d.classDefinition.statMultipliers);
  b.characterLevel = f;
}
awardAdventurePoints(22);
```

- 每升 1 级 `skillPoints++`；技能/法术升级各花 1 点（`progression/upgrades.js:790-807`、`:862-886`，`getCost()` 恒为 1）。
- 队伍等级口径：`getPartyMaxLevel`/`getPartyMinLevel` 缓存于 `party.xs/zs`，负值表示脏（`characters/party.js:68-108`）。首领等级取 `getPartyMaxLevel`（`combat/encounters.js:114`），城堡守卫取 `monsterCatalog.maxUnlockedLevel`（`combat/encounters.js:154`）。
- `[疑似遗留怪癖]` `applyLevelStats` 会把 `health/spirit` 直接**设为满值**（`:181-182`），所以升级瞬间回满血；`LevelUpUpgrade` 里被升级者的 `applyLevelStats` 在 `characterLevel` 自增**之前**调用（`:546` 早于 `:549`），但因传参 `c` 已是新等级，结果正确 —— 顺序仅为可读性问题。
- `[疑似遗留怪癖]` 四条 `armor/attackRating/defenceRating/damage` 的 `levelValue` 全部来自 `armorCurve`，`damageCurve` 只喂 `spellSpiritCost`（`simulation/characters.js:169-184`）。数值按原样记录。

### P-3 XP 的来源

`src/engine/modules/simulation/characters.js:289-290` 与 `combat/actions.js:363-364`

```js
addExperience(f.experienceReward * doubleExperienceModifier.currentValue);
```

`experienceReward` = 该怪物种类的"每杀经验"，来自 `monsterArmorCurve`，随"怪物等级 + 阶位"缩放（§7）。`doubleExperienceModifier` 由"双倍经验"药水激活（1 → 2，`content/balance.js:203-207`）。

---

## 2. 冒险点（Adventure Points）

### 2.1 事件池与字段

`src/engine/modules/progression/points.js:78-94`（示例两条）

```js
killPointEvent = {
  pointEventTypeId: 1,
  currentPointReward: 1,
  basePointReward: 1,
  achievementPointBonus: 1,
  fullEventLabel: "杀死一个怪物",
  shortEventLabel: "杀死怪物"
};
```

三个数值字段的分工：

| 字段 | 角色 | 谁写 |
|---|---|---|
| `basePointReward` | 初值常量，仅在 `resetAdventurePoints` 时回填 | `progression/points.js:15` |
| `currentPointReward` | 实际发放值 = base + 所有已应用成就的加成 | `progression/points.js:15,51` |
| `achievementPointBonus` | 每条成就为该事件提供的加成量（只被读取一次以快照进成就对象） | 唯一读者 `progression/achievements.js:18` |

**21 条事件定义**（`pointEventDefinitions`，`progression/points.js:268`），ID 覆盖 1–19、21、22 —— **ID 20 不存在**，`pointEventsById[20]` 为 undefined（`awardAdventurePoints` 会打 `"error: point settings not found: 20"`，`progression/points.js:44`）。

| ID | 基础点 | 文案 | ID | 基础点 | 文案 |
|---|---|---|---|---|---|
| 1 | 1 | 杀死怪物 | 12 | 1 | 找到道具 |
| 2 | 1 | 打开一扇门 | 13 | 5 | 找到罕见道具 |
| 3 | 5 | 胜一场遭遇战 | 14 | 25 | 找到稀有道具 |
| 4 | 100 | 清空一个关卡 | 15 | 200 | 找到历史道具 |
| 5 | 300 | 清理一个地牢 | 16 | 2000 | 找到远古道具 |
| 6 | 50 | 搜索一个财宝箱 | 17 | 1 | 卖出一件道具 |
| 7 | 50 | 搜索一个武器架 | 18 | 15 | 召唤一个宠物 |
| 8 | 50 | 搜索一个书架 | 19 | 2000 | 征服一座城堡 |
| 9 | 1 | 找到黄金 | 21 | 10 | 装备一件道具 |
| 10 | 2 | 找到一个卷轴 | 22 | 400 | 角色升一级 |
| 11 | 15 | 找到一瓶药剂 | | | |

`[疑似遗留怪癖]` 两条变量的名字与其 `fullEventLabel` 互换：`bookcasePointEvent`(id 7) 的文案是"搜索一个武器架"、`weaponRackPointEvent`(id 8) 的文案是"搜索一个书架"（`progression/points.js:134-149`）。**纯命名问题，数值无影响**（id 7 与 `recordWeaponRackLooted` 同批发放、id 8 与 `recordBookcaseLooted` 同批发放，`characters/character.js:1133-1140`）。同样 `spellPointEvent`(id 2) 的文案是"打开一扇门"，实际也只在开门时发放（`characters/character.js:314`）。

### 2.2 发放

`src/engine/modules/progression/points.js:26-46`

```js
export function awardAdventurePoints(a) {
  var b = game.state.adventurePoints,
    c = pointEventsById[a];
  if (c) {
    c = c.currentPointReward;
    b.availablePoints += c;
    var d = b.pointsByEventType[a];
    if (!d) {
      d = 0;
    }
    var f = b.countsByEventType[a];
    if (!f) {
      f = 0;
    }
    f++;
    b.pointsByEventType[a] = d + c;
    b.countsByEventType[a] = f;
  } else {
    console.log("error: point settings not found: " + a);
  }
}
```

`game.state.adventurePoints` 三个 map 的语义（由 `persistence/game-save.js:563-609`、`:960-992` 的读写对反推，置信度高）：

- `adventurePoints.availablePoints` = 可用点数（`spentAdventurePoints` 之外的余额）
- `adventurePoints.pointsByEventType[type]` = 该事件累计产点
- `adventurePoints.countsByEventType[type]` = 该事件**发生次数**
- `adventurePoints.spentPoints` = 已花费点数
- `adventurePoints.pointUpgrades` = 23 条点升级（`pointUpgradeDefinitions`）

`[关键行为]` 发放是**追溯生效**的：`awardAdventurePoints` 只加当前 `currentPointReward`，但任何成就应用会调用 `recalculateAdventurePoints` 用 `次数 × 新单价` **重建**每池点数（§2.3）。因此先杀 100 万怪、后领"杀怪 +1 点"的成就会立即回补 100 万点。

事件 → 发点调用点全集（21 类，实测 grep）：

| 事件 | 调用点 |
|---|---|
| 1 杀怪 | `simulation/characters.js:331`（`CharacterLifecycle.ol`） |
| 2 开门 | `characters/character.js:314` |
| 3 遭遇胜利 | `combat/encounters.js:272` |
| 4 清层 | `world/dungeons.js:217` |
| 5 征地牢 | `world/dungeons.js:226` |
| 6/7/8 开箱/架/柜 | `characters/character.js:1131,1135,1139` |
| 9 拾金 | `characters/character.js:1007`、`combat/actions.js:206` |
| 10 拾卷轴 | `characters/character.js:1016`、`combat/actions.js:265` |
| 11 拾药剂 | `characters/character.js:1025`、`combat/actions.js:280` |
| 12 拾道具 | `characters/character.js:1035`、`combat/actions.js:234` |
| 13–16 稀有度 1–4 追加 | `characters/character.js:1036-1049`、`combat/actions.js:235-249`（按 `item.uf()` 分档，**与事件 12 叠加发放**） |
| 17 卖出 | `characters/character.js:1200` |
| 18 召唤 | `simulation/characters.js:100` |
| 19 征城堡 | `characters/party.js:257` |
| 21 装备 | `characters/character.js:1227-1229`（仅 `characterType === ADVENTURER_TYPE`） |
| 22 升级 | `progression/upgrades.js:569` |

### 2.3 重建函数（21 池全量重算）

`src/engine/modules/progression/points.js:47-73`

```js
export function increasePointEventReward(a, b) {
  var c = game.state.adventurePoints,
    d = pointEventsById[a];
  if (d) {
    d.currentPointReward += b;
    recalculateAdventurePoints(c);
  } else {
    console.log("error: point settings not found: " + a);
  }
}
export function recalculateAdventurePoints(a) {
  var b, c, d, f;
  for (b = a.availablePoints = 0; b < pointEventDefinitions.length; b++) {
    f = pointEventDefinitions[b].pointEventTypeId;
    c = pointEventDefinitions[b].currentPointReward;
    if (!(d = a.countsByEventType[f])) {
      d = 0;
    }
    c *= d;
    a.pointsByEventType[f] = c;
    a.availablePoints += c;
  }
  a.availablePoints -= a.spentPoints;
  if (0 > a.availablePoints) {
    a.availablePoints = 0;
  }
}
```

```
对 21 条定义逐条： Qi[id] = currentPointReward[id] · pj[id]
Dd = clamp( Σ Qi[id] − An , 0 , +∞ )
```

- 遍历的是 `pointEventDefinitions`（**数组顺序**，21 项），不是 `pointEventsById` 的键序；两者结果集相同，但 `pointsByEventType` 的键写入顺序按此数组。
- `spentPoints`（已花费）在重建后被减回并钳非负 —— 因此"次数 × 单价"必须始终 ≥ 已花费，否则出现"花费被部分抹掉"的表现；代码不阻止该情况，只钳 `Dd ≥ 0`。
- 该函数是**唯一**让 `currentPointReward` 变化影响历史事件的路径。

### 2.4 重置

`src/engine/modules/progression/points.js:6-25`

```js
a.availablePoints = 0; a.spentPoints = 0; a.pointsByEventType = {}; a.countsByEventType = {};
for (b = 0; b < pointEventDefinitions.length; b++) {
  c = pointEventDefinitions[b];
  c.currentPointReward = c.basePointReward;   // 丢弃全部成就加成
  a.pointsByEventType[c.pointEventTypeId] = 0;
  a.countsByEventType[c.pointEventTypeId] = 0;
}
for (b = 0; b < a.pointUpgrades.length; b++) { a.pointUpgrades[b].og(); }   // 点升级全部退回
```

`[关键]` 加成被丢掉的补偿路径是**读档回放**：`persistence/game-save.js:635-656` 在恢复完 `obtained/applied` 后，对每条"已取得且已应用"的成就重放 `increasePointEventReward(wc.pointEventTypeId, wc.Vt)`。因此 `currentPointReward` 不进存档，靠回放重建（另见 `docs/reverse-engineering/unresolved.md` 第八批 `Fb→currentPointReward` 条目）。

### 2.5 点升级的购买与效果

`src/engine/modules/progression/upgrades.js:1209-1236`

```js
  AdventurePointUpgrade.prototype.purchase = function () {
    if (!(this.purchased || this.definition.pointCost > game.state.adventurePoints.availablePoints)) {
      var a = this.definition.pointCost,
        b = game.state.adventurePoints;
      b.spentPoints += a;
      b.availablePoints -= a;
      if (0 > b.availablePoints) {
        b.availablePoints = 0;
      }
      this.purchased = true;
      this.canPurchase = false;
      applyPointUpgrade(this);
      markUpgradeChanged(this);
      recordGameEvent("Points Upgrade", this.definition.title);
    }
  };
  AdventurePointUpgrade.prototype.getCost = function () {
    return this.definition.pointCost;
  };
  AdventurePointUpgrade.prototype.getDescription = function () {
    return this.definition.descriptionText;
  };
  AdventurePointUpgrade.prototype.refreshAvailabilityState = function () {
    this.canPurchase = !this.purchased && this.definition.pointCost <= game.state.adventurePoints.availablePoints;
    var a = this.cachedCanPurchase !== this.canPurchase;
    this.cachedCanPurchase = this.canPurchase;
    return a;
  };
```

`applyPointUpgrade` / `getPointUpgradeModifier`（`progression/upgrades.js:217-252`）：

```js
export function applyPointUpgrade(a) {
  a = getPointUpgradeModifier(a);
  a.currentValue += a.levelIncrement;
}
```

`progression/upgrades.js:217-252` 的 `getPointUpgradeModifier` 把 `bonusIndex`（1–13，无 0/14）映射到 `content/balance.js:127-191` 的 13 个加成对象，`levelIncrement` 即其唯一"每级步长"：

| bonusIndex | 对象 | levelIncrement | 消费点 |
|---|---|---|---|
| 1 | `scrollCapacityBonus` | +10 | `combat/scrolls.js:56`（上限 `30+bonus`） |
| 2 | `walkingSpeedBonus` | +0.1 | `characters/character.js:194`（世界移动） |
| 3 | `potionCapacityBonus` | +1 | `combat/potions.js:113`（`6+bonus`） |
| 4 | `partyCapacityBonus` | +1 | `views/party-creation.js:109`（`4+bonus`，最多 5） |
| 5 | `dungeonCostBonus` | **−0.1** | `progression/upgrades.js:932,974`（农场价乘子） |
| 6 | `itemCostBonus` | **−0.1** | `progression/upgrades.js:652,730`（怪物等级价乘子） |
| 7 | `potionDurationBonus` | +120 回合 | `simulation/tick.js:112`（`800+bonus`） |
| 8 | `potionPowerBonus` | +20 | `simulation/tick.js:179`（`(100+bonus)·farmKillsModifier`） |
| 9 | `offlineTimeBonus` | +7.2e6 ms | `runtime/game.js:471`（离线上限） |
| 10 | `equipmentQualityBonus` | +0.01 | `characters/character.js:1195`（卖价 `0.1+bonus`） |
| 11 | `attackCooldownBonus` | **−1** | `characters/stats.js:40-42`（`max(4, base−red+bonus)`） |
| 12 | `healthRegenerationBonus` | +1 | `simulation/tick.js:42`（回复百分比） |
| 13 | `spiritRegenerationBonus` | +1 | `simulation/tick.js:47` |

`[命名告警]` `equipmentQualityBonus` 实际是**卖价加成**、`itemCostBonus` 实际是**怪物等级折扣**，名字与用途不符（依据上表消费点，置信度高）。
23 条点升级、单价 5e5–1.3e7、多数成对出现（`progression/points.js:269-407`）。`og()` 会把对应乘子退回 `defaultValue`（`progression/upgrades.js:1186-1191`）。

---

## 3. 升级成本曲线（精确取整）

### P-4 全局升级（用"杀戮"支付）

`src/engine/modules/progression/upgrades.js:131-137`

```js
export function recalculateGlobalUpgrade(a) {
  a.definition.cost = scaleByLevel(a.definition.baseCost + a.definition.purchasedLevels * a.definition.costPerLevel, globalUpgradePriceCurve, 1);
  a.definition.currentValue = a.definition.baseValue + a.definition.purchasedLevels * a.definition.perLevelIncrement;
  if (a.definition.currentValue > a.definition.maxValue) {
    a.definition.currentValue = a.definition.maxValue;
  }
}
```

```
成本(rd，杀戮) = floor( 100 + 50 · (ah + 11·levels − 1)^1.02 · 1.01^(ah + 11·levels − 1) )
效果值 = clamp( baseValue + levels · perLevelIncrement , ≤ maxValue )   // 只有上钳，无下钳
```

`rd/ah/Pg` 三个键未语义化；由 `progression/upgrades.js:377-378`（`rd` 作为 `spendKills` 额）、`:386-388`（`getCost()` 返回 `rd`）与 `ah/Pg` 进入价格下标反推，置信度高。`Pg` 对所有 11 条全局升级都等于 11（`content/balance.js:298-441`），即"每买一级，价格档位 +11"。

实算（`globalUpgradePriceCurve`）：

| 档位 `ah + 11·levels` | 40（`itemDropChance` 首级） | 51 | 62 | 300（`minGoldPerDrop` 首级） | 311 |
|---|---|---|---|---|---|
| 杀戮成本 | 3193 | 4546 | 6175 | 328380 | 380101 |

购买：`progression/upgrades.js:376-385` —— `spendKills(definition.rd)` → `purchasedLevels++` → 重算。`Cd()`（`:392-406`）在 `currentValue >= maxValue` 时永久下架。
"即将可买"（灰显但仍展示）判定：`progression/upgrades.js:407-414`

```js
a = this.definition.rd - a;              // a = rd − 现有杀戮
return 400 >= a || a <= 0.3 * this.definition.rd;
```

### P-5 地牢农场价（金币）

`src/engine/modules/characters/character.js:1161`（首次发现时定价）

```js
ye.farmCost = scaleByLevel(game.dungeons.Mk + 1, dungeonPriceCurve, 1);
```

`src/engine/modules/progression/upgrades.js:931-933`

```js
  PurchaseDungeonUpgrade.prototype.getCost = function () {
    return this.dungeon ? floorNumber(this.dungeon.farmCost * dungeonCostBonus.currentValue) : 0;
  };
```

```
farmCost(第 (Mk+1) 个被发现的地牢) = floor( 100 + 120 · Mk^1.7 · 1.018^Mk )
实付 = floor( farmCost · dungeonCostBonus )        // 两次向下取整
```

`Mk` = 已发现地牢计数（`discoverDungeon` 递增，`world/dungeons.js:97-102`），存档键 `dungeonCostLevel`（`persistence/game-save.js:755`）。
`[疑似遗留怪癖]` `Mk` 在"继续下一周目"时被重置为**农场数量**而非 0：`runtime/game.js:448-450`。
门：`canFarmDungeon`（已发现 ∧ 已征服 ∧ 非农场 ∧ 所属城堡已征服，`world/dungeons.js:31-33`）；金币比较与"即将可买"（差额 <120）在 `progression/upgrades.js:940-949`。

### P-6 怪物等级解锁 / 退休价（杀戮）

`src/engine/modules/progression/upgrades.js:657-674`（解锁）

```js
this.qe = c;                                                 // = monsterCatalog.maxUnlockedLevel + 1
this.cachedUnlockCost = scaleByLevel(this.qe, monsterUnlockPriceCurve, 1);
```
```js
UnlockMonsterLevelUpgrade.prototype.getCost = function () {
  return floorNumber(this.cachedUnlockCost * itemCostBonus.currentValue);
};
```
```
解锁到等级 L 的实付 = floor( floor(100 + 100·(L−1)^1.02·1.01^(L−1)) · itemCostBonus )
```

L=2 → 201，L=5 → 527，L=10 → 1128，L=20 → 2534（`floorNumber` 前的 `scaleByLevel` 值）。

三重门槛（`progression/upgrades.js:666-671`）：

```js
if (c = game.state.party.kills >= (…).getCost()) {
  if (c = getPartyMinLevel() >= this.qe) {
    c = game.monsterCatalog;
    c = 1 + c.maxUnlockedLevel - c.minUnlockedLevel < VISIBLE_MONSTER_LEVELS;
  }
}
```

即"杀戮够 + **队伍最低等级** ≥ 目标怪物等级 + 已解锁窗口未满 5 级"。`VISIBLE_MONSTER_LEVELS = 5`（`content/balance.js:443`）：含义未在代码内命名，推断为"同时可遇到的怪物等级带宽上限（滑动窗口）"，依据是它只与 `1 + maxUnlockedLevel − minUnlockedLevel` 比较；置信中。

退休（`progression/upgrades.js:735-751`）用**同一条曲线**，但下标是退休线 `minUnlockedLevel` 本身：`Cs = scaleByLevel(Yd, monsterUnlockPriceCurve, 1)`（`Yd` 为 `game.monsterCatalog.minUnlockedLevel` 的快照），`实付 = floor(Cs · itemCostBonus)`，门为 `Yd < getPartyMinLevel() && Yd < maxUnlockedLevel − 1`。退休后 `minUnlockedLevel++` 且 `delete en[Yd]`（`:713-718`）——等级组缓存被丢弃，下次进该等级重新随机生成 20 个怪类（`combat/encounters.js:225-248`）。

### P-7 卷轴解锁 / 升级价（金币）

`src/engine/modules/combat/scrolls.js:61-63`

```js
export function getScrollUpgradeCost(a) {
  return scaleByLevel(a.locked ? a.baseCapacity : a.baseCapacity + (a.upgradeCount + 1) * a.capacityIncrement, scrollPriceCurve, 1);
}
```

```
价 = floor( 100 + 250 · (idx − 1)^1.4 · 1.018^(idx − 1) ),
idx = 未解锁 ? sg : sg + (upgradeCount + 1)·Yi          // Yi = 4（全部 6 条）
```

`[关键结构]` 同一个 `idx` **既当价格档位又当等级门槛**（`progression/upgrades.js:1096-1107`）：

```js
d = a.locked ? a.sg : a.sg + (a.upgradeCount + 1) * a.Yi;
if (a.locked) {
  this.canPurchase = c >= d && game.state.party.gold >= a.upgradeCost;
  …
} else {
  this.canPurchase = a.upgradeCount < a.Qh && c >= d && game.state.party.gold >= a.upgradeCost;
```

`c` = `scrollCaster.stats.characterLevel`（= 队伍最低等级，§P-2）。`sg` 为"解锁等级"、`Qh` 为"最大升级次数"（含义由 `getScrollLabel` 的 `II…VIII` 上限 `:64-85` 与 `upgradeCount < Qh` 反推，置信高）。实算档位价：`idx 0 → 100`、`3 → 783`、`6 → 2701`、`9 → 5399`、`12 → 8832`、`15 → 13011`。
购买执行：`progression/upgrades.js:1067-1095`（`spendGold(rn)` → 解锁或 `upgradeCount++` → 重算 `rn/rg/lx`）。
`[疑似遗留怪癖]` `scaleByLevel(0, …)` 走 `Math.max(0, −1) = 0` → `shockScroll`（`sg:0`）的"解锁价"与"1 级升级价"同为 100，且开局已被视为解锁（`combat/scrolls.js:209` `ts(0 < sg, 0)`，`a=false` 才解锁）。

### P-8 成就领取

无成本；`ClaimAchievementUpgrade.purchase` 只调 `applyAchievementReward`（§4.2）。

---

## 4. 成就

### 4.1 达成判定（每 4 回合扫描一次）

`src/engine/modules/simulation/tick.js:214-236`

```js
b.achievementCheckTurnCounter++;
if (b.achievementCheckTurnCounter >= b.achievementCheckIntervalTurns) {
  b.achievementCheckTurnCounter = 0;
  var T = game.state.achievements, …
  for (X = T.ik.length - 1; 0 <= X; X--) {
    var qa = Ca = T.ik[X];
    if (!qa.We) {
      qa.We = qa.isVictoryAchievement ? hasVictoryAchievement(qa) : getAchievementProgress(qa) >= qa.requiredCount;
    }
    if (qa.We) {
      T.ik.splice(X, 1);
      T.Ze.push(Ca);
    }
  }
  for (X = T.Ze.length - 1; 0 <= X; X--) {
    Ca = T.Ze[X];
    if (Ca.Of) { T.Ze.splice(X, 1); }
  }
}
```

周期常量：`CharacterLifecycle.PC = 4`（`runtime/game.js:40`）。三条列表：`jj` 全量 328 条、`ik` 未达成、`Ze` 已达成未领取（30 条为胜利成就，`isVictoryAchievement`）。

**进度取数**（`progression/achievements.js:65-115`，除 case 16 外全部读**累计统计**）：

```js
export function getAchievementProgress(a) {
  var b = game.state.lifetimeStatistics;
  switch (a.requirementType) {
    case 1:
      return b.directKills;
    …
    case 16:
      return getPartyMaxLevel(game.state.party);
    …
    case 28:
      return b.minionKills;
  }
}
```

`[疑似遗留怪癖]` `case 16`（"等级提升"）读实时队伍最高等级而非累计统计 → 该成就在重生/继续后进度可回退；且函数对未知 `requirementType` 无 `default`，返回 `undefined`，`undefined >= requiredCount` 为 false（当前 1–28 全覆盖，不可达）。
`getAchievementProgress` 无 `default` 分支（`:65-115`）。

**胜利成就**（`progression/achievements.js:48-64`）读 `game.state.victoryStatistics`：

```js
switch (a.requirementType) {
  case 23:
    return 1 === a.requiredCount ? 0 < b.partySize1Victories : 2 === a.requiredCount ? 0 < b.partySize2Victories : 3 === a.requiredCount ? 0 < b.partySize3Victories : false;
  case 24:
    return 0 < b.singleClassVictories;
  case 25:
    return 0 < getClassVictories(b, a.characterClass);
  case 26:
    return b.maxContinuationVictories >= a.requiredCount;
  case 27:
    return 0 < getSoloClassVictories(b, a.characterClass);
  default:
    return false;
}
```

字段语义（由 `characters/party.js:269-321` 的写入点确定，置信高）：`hn/jn/kn` = 1/2/3 人队胜利次数；`singleClassVictories` = 4 人同职业胜利次数；`qo[class]` = 该职业参与胜利次数；`lq[class]` = 该职业单人胜利次数；`maxContinuationVictories` = 历史最长的"连续不重生胜利链"；`currentContinuationVictories` = 上一条链长度；`currentContinueCount` = 当前链长度。

### 4.2 奖励应用

`src/engine/modules/progression/achievements.js:34-47`

```js
export function applyAchievementReward(a) {
  if (!a.We || a.Of) {
    console.log("not applying achievement bonus. …");
  } else {
    increasePointEventReward(a.pointEventTypeId, a.Vt);
    a.Of = true;
    var b = game.state.achievements, c = b.Ze.indexOf(a);
    if (-1 < c) { b.Ze.splice(c, 1); }
```

```
单条成就奖励 = 该 pointEventTypeId 的单价 += achievementPointBonus（快照进 a.Vt，achievements.js:18）
```

`[关键]` 加成**不是一次性点数**，而是永久提高该事件单价，并经 §2.3 的重建对该事件的**历史发生次数追溯生效**。`pointEventTypeId` 与成就的 `requirementType` 完全无关（例：`monsterKills1000` 要求 `directKills ≥ 1000`，但加成给事件 21"装备道具"，`progression/achievements.js:195-200`）。文案见 `getAchievementRewardLabel`（`"+Vt 成就点每" + fullEventLabel`，`:22-27`）。

### 4.3 重置与持久化

`resetAchievements`（`progression/achievements.js:176-186`）把每条 `We/Of` 置 false 并清空 `ik/Ze`（`jj` 保留）。存档只写 `{achievementId, obtained, applied}` 三键 × 328 条（`entities`/`game-save.js:993-1005`），加成靠 §2.4 的回放重建。

---

## 5. 统计计数器

### 5.1 三块结构

`src/engine/modules/runtime/game.js:181-190`

```js
      runStatistics: new RunStatistics(),
      lifetimeStatistics: new LifetimeStatistics(),
      statisticsRecorder: new StatisticsRecorder(),
      victoryStatistics: new function () {
        this.singleClassVictories = this.currentContinuationVictories = this.maxContinuationVictories = this.partySize3Victories = this.partySize2Victories = this.partySize1Victories = 0;
        this.classVictories = {};
        this.soloClassVictories = {};
        this.currentContinueCount = 0;
      }(),
      victoryCount: 0
```

- **本周目** `runStatistics`：30 个计数字段，一次声明清零（`progression/statistics.js:5-7`），`resetRunStatistics()` 同式清零（`:27-29`）。
- **累计** `lifetimeStatistics`：**原型链复用 RunStatistics**，只覆写清零函数为"记日志、什么都不清"：

`progression/statistics.js:127-130`

```js
  LifetimeStatistics.prototype = new RunStatistics();
  LifetimeStatistics.prototype.resetRunStatistics = function () {
    console.log("Reset invoked on total statistics. Not resetting anything.");
  };
```

- **双写门面** `StatisticsRecorder`：每个记录方法同时写两块（`:131-234`），`bindStatistics()` 把 `statisticsRecorder` 指向本周目对象（`:20-25`）。
  `[注意]` 两个方法名仍为混淆态：`recordLevelCleared` = `levelsCleared++`（`:39-41`、`:143-146`）、`$k` = `minionKills++`（`:69-71`、`:175-178`）。`recordItemsSold(a)`/`recordGoldFrom*(a)` 带参数（批量累加），其余都是 `++`。
- **成就取数只读累计块**（§4.1），因此 `recordLevelCleared`（levelsCleared）与 `playedMillis` 之外的本周目计数不直接参与成就。

### 5.2 事件 → 计数器 → 代码点

| 计数器（存档键即字段名） | 递增函数 | 调用点 |
|---|---|---|
| `turnCount` | `recordTurn` | `simulation/tick.js:88` |
| `doorsOpened` | `recordDoorOpened` | `characters/character.js:313` |
| `roomsCleared` | `recordRoomCleared` | `combat/encounters.js:270` |
| `levelsCleared` | `recordLevelCleared` | `world/dungeons.js:214` |
| `dungeonsCleared` | `recordDungeonCleared` | `world/dungeons.js:225` |
| `castlesConquered` | `recordCastleConquered` | `characters/party.js:254` |
| `farmsPurchased` | `recordFarmPurchased` | `simulation/tick.js:816` |
| `totalGoldFromMonsters` | `recordGoldFromMonsters(额)` | `characters/character.js:1003`、`combat/actions.js:203` |
| `totalGoldFromItems` | `recordGoldFromItems(额)` | `progression/upgrades.js:1257` |
| `farmedKills` | `recordFarmHarvest(量)` / `setFarmedKills` | `progression/upgrades.js:1023` / `:1025` |
| `directKills` | `recordDirectKill` | `simulation/characters.js:281`、`combat/actions.js:356` |
| `scrollKills` | `recordScrollKill` | `simulation/characters.js:283-284`、`combat/actions.js:357-359` |
| `minionKills` | `$k` / `setMinionKills` | `simulation/characters.js:286-288`、`combat/actions.js:361` |
| `minionsSummoned` | `recordMinionSummoned` | `simulation/characters.js:99` |
| `characterStunnedCount` | `recordCharacterStunned` | `combat/actions.js:329` |
| `meleeAttackCount` | `recordMeleeAttack` | `characters/character.js:450-452`（分支为 `2 === actionType`） |
| `rangedAttackCount` | `recordRangedAttack` | `characters/character.js:464-466`（分支为 `actionType === MELEE_ACTION_TYPE`，常量值为 3） |
| `spellCastCount` | `recordSpellCast` | `characters/character.js:991-993`（仅 `isAdventurerOrMinion`） |
| `potionsUsed` | `recordPotionUsed` | `combat/potions.js:246` |
| `scrollsUsed` | `recordScrollUsed` | `combat/scrolls.js:161` |
| `playedMillis` | `recordPlayedMilliseconds(增量)` | `simulation/loop.js:46`（离线：+250/回合）、`:94`（在线：+帧差） |
| `itemsSold` | `recordItemsSold(批量数)` | `characters/character.js:1204` |
| `itemsFound` + `uncommon/rare/historic/ancientItemsFound` | `recordItemFound(item)` | `characters/character.js:1034`、`combat/actions.js:232`；分档见 `progression/statistics.js:102-117` |
| `treasureChestsLooted` / `weaponRacksLooted` / `bookcasesLooted` | 三个 `record…Looted` | `characters/character.js:1130/1134/1138`（按宝箱 `Mf` 1/2/3 分派） |

`[疑似遗留怪癖]` `MELEE_ACTION_TYPE = 3`（`ai/targeting.js:422`）却走 `recordRangedAttack`，`actionType === 2` 走 `recordMeleeAttack`（`characters/character.js:440,454`）。存档键语义以键名为准，已在 `docs/reverse-engineering/unresolved.md` 第 5 条记为"误名、落地时勿顺手纠正"。

### 5.3 回读侧的两处特殊映射

`src/engine/modules/persistence/entities.js:283-319`

```js
ia = a.weaponRacksLooted,
    ea = a.weaponsRacksLooted;          // 旧档重复键
…
if (!u) { u = game.dungeons.dg.length; }        // farmsPurchased 缺失时用"当前农场数"补齐
b.playedMillis = c ? Math.max(0, d ? d : f) : Math.max(0, f ? f : 0);   // c=lifetime → 优先 totalPlayedMillis
…
b.bookcasesLooted = a ? a : 0;
c = Math.max(ia ? ia : 0, ea ? ea : 0);
b.weaponRacksLooted = c;
```

- `[疑似遗留怪癖]` `farmsPurchased` 为 0 时会被替换成"现存农场数量"（同一数字，但"拥有 0 个农场"与"从未买过农场"无法区分）。
- `[疑似遗留怪癖]` `weaponRacksLooted` 与 `bookcasesLooted` 的回读**不对称**：武器架取两个历史键的最大值，书架只取一个；`weaponsRacksLooted` 已不在写出侧（`persistence/entities.js:219-252`）。

### 5.4 胜利块

`src/engine/modules/characters/party.js:269-321`（最后一座城堡被征服时，即全部城堡征服）

```js
if (0 === c) {
  game.state.victoryCount++;
  game.gameWon = true;
  game.finishOfflineProgress();
  saveProgress(game.saves);
  game.view.onGameWon();
  a = game.state.victoryStatistics;
  b = game.state.adventurers.length;
  if (4 > b) {
    if (1 === b) {
      a.partySize1Victories += 1;
      …
      a.soloClassVictories[c] = d + 1;          // d = 该职业原有单人胜利数
  …
  for (c = 0; c < b; c++) {
    d = game.state.adventurers[c].characterClass;
    if (!(f = a.classVictories[d])) {
      f = 0;
    }
    a.classVictories[d] = f + 1;
  }
  c = a.currentContinueCount;
  if (0 < c) {
    if (c > a.maxContinuationVictories) {
      a.maxContinuationVictories = c;
    }
    a.currentContinuationVictories = c;
  }
  if (4 <= b) {
    d = true;
    f = game.state.adventurers[0].characterClass;
    for (c = 1; c < b; c++) {
      if (f != game.state.adventurers[c].characterClass) {
        d = false;
        break;
      }
    }
    if (d) {
      a.singleClassVictories += 1;
    }
  }
```

- 计数写入瞬间**先于** `currentContinueCount` 自增（`nm++` 在玩家点"继续"时执行，`views/results.js:61`），所以 `maxContinuationVictories` 记的是"上一次链的长度"。
- `[疑似遗留怪癖]` `currentContinueCount` 从未在胜利瞬间被写入，因此首胜（`nm = 0`）完全不参与 `Xm/mm`；`requirementType 26`（"延续胜利"/"不进行重生"）只能由"继续"路径累积。

---

## 6. 重生 / 继续 / 重置：什么被保留

**决策点是 `resetRun` 的形参 `a`**（同一函数承担两种语义）：

`src/engine/modules/runtime/game.js:351-418`（节选）

```js
resetRun: function (a) {
  game.state.turnNumber = 0;
  resetEncounter();
  game.state.party = new PartyState();
  game.state.adventurers.length = 0;
  game.state.leader = null;
  game.state.scrollCaster = null;
  game.partyCreated = false;
  game.gameWon = false;
  if (a) {
    game.state.runStatistics = new RunStatistics();
    game.state.lifetimeStatistics = new LifetimeStatistics();
    bindStatistics();
    var b = game.state.victoryStatistics;
    b.partySize1Victories = 0; b.partySize2Victories = 0; b.partySize3Victories = 0; b.maxContinuationVictories = 0; b.currentContinuationVictories = 0; b.singleClassVictories = 0;
    b.classVictories = {}; b.soloClassVictories = {}; b.currentContinueCount = 0;
    resetAdventurePoints();
    resetAchievements();
  }
  game.state.runStatistics.resetRunStatistics();
  …
  clearItemDrops();
  b = game.inventories; if (0 < b.Fj.length) { b.Fj.length = 0; }
  resetScrollInventory(); resetPotionInventory(); clearScrollTargets();
  resetDungeons(); resetCastles(); resetFarms(); resetShops();
  clearCombatQueue(); clearVisualEffects();
  for (b = 0; b < upgradeCollections.length; b++) { resetUpgradeCollection(upgradeCollections[b]); }
  …（四名冒险者的四条技能树 resetUpgradeCollection）
  b = game.monsterCatalog;
  b.minUnlockedLevel = 1;
  b.maxUnlockedLevel = 1;
  b.monsterTypesByLevelCache = {};
  if (a) { game.state.victoryCount = 0; }
}
```

三个入口（`runtime/game.js:513-526`）：

```js
restartRun: function () {
  game.state.victoryStatistics.currentContinueCount = 0;
  game.state.victoryStatistics.currentContinuationVictories = 0;
  game.resetRun(false);           // ← 重生（文案"重生 - 以1级的队伍重新开始游戏"）
  deleteStoredSave();
  saveProgress(game.saves);
  game.view.resetTabs();
},
resetGame: function () {
  game.resetRun(true);            // ← 彻底清档
  …
}
```

第四个入口：`restoreGameState` 载入前先 `game.resetRun(true)` 再逐字段回填（`persistence/game-save.js:45`），所以"读档"= 全清 + 重建。

| 状态 | 重生 `restartRun`（`a=false`） | 继续 `resetContinuation` | 彻底重置 `resetGame`（`a=true`） |
|---|---|---|---|
| `victoryCount` | **保留**（背包 +1/胜、职业解锁、技能点加成的来源） | 保留 | 归 0 |
| 冒险点 `Dd/An/Qi/pj` + 23 条点升级 | **保留** | 保留 | 全部重置（§2.4） |
| 成就 `We/Of`（328 条） | **保留** | 保留 | 全部重置 |
| `lifetimeStatistics` | **保留** | 保留 | 换对象清零 |
| `runStatistics` | 清零（不换对象，`runtime/game.js:377`） | 清零 | 换对象 + 清零 |
| `victoryStatistics`（含 `maxContinuationVictories` 链） | **保留**，仅 `nm/mm` 被 `restartRun` 归 0 | 保留，且 `nm++` | 全字段清零 |
| 冒险者 / 等级 / 技能点 / 装备 / 背包 items | 清空（`adventurers.length = 0`） | **保留** | 清空 |
| 全局升级 `purchasedLevels`（11 条） | 归 0（`resetUpgradeCollection`→`og()`，`progression/upgrades.js:62-69,360-363`） | **保留**（`resetContinuation` 不碰 `upgradeCollections`） | 归 0 |
| 卷轴库存（解锁/升级次数/充能） | 重建为初值（`resetScrollInventory`） | **保留** | 重建 |
| 药剂库存 | 清空 | 清空 | 清空 |
| 怪物目录 `minUnlockedLevel / maxUnlockedLevel / en` | 归 1 / 清空 | **保留**（`resetContinuation` 不碰 catalog） | 归 1 / 清空 |
| 地牢/城堡/农场/商店 | 全部 `reset*`；`Mk`、`Sd` 归 0 | 全部 `reset*`，但 `Mk ← 农场数`、`castles.Uj` 保留（`runtime/game.js:448-453`） | 全部 reset |
| 世界 / 当前层 / 掉落物 / 战斗队列 | 重建 | 重建 | 重建 |
| `turnNumber` | 归 0 | 归 0 | 归 0 |

`victoryCount` 在 `src/engine/modules` 内的读取点共 5 处（`loot/inventory.js:9`、`views/party-creation.js:61,127,350`、`views/results.js:30`、另 `views/information.js:168` 展示），其中三处构成实际加成：

```js
// loot/inventory.js:9 —— 背包容量
this.vp = BASE_INVENTORY_CAPACITY + Math.min(MAX_PRESTIGE_INVENTORY_BONUS, game.state.victoryCount);   // 20 + min(10, 胜场)
// views/party-creation.js:61-65 —— 新队伍每人技能点
l = Math.min(40, game.state.victoryCount); if (0 < l) { p.skillPoints = l; … }
// views/party-creation.js:127 —— 职业解锁 requiredVictories
```

`[疑似遗留怪癖]` 背包容量在 `Inventory` **构造时**快照，之后 `victoryCount` 变化不回填旧实例；而"继续"路径根本不重建 `Inventory`。三处加成的上限互不一致（10 / 40 / 无上限）。

## 7. 怪物侧成长（等级 × 阶位）

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

`src/engine/modules/combat/encounters.js:192-199`

```js
export function recordMonsterTypeKill(a) {
  a.killCount++;
  a.rankProgressKills++;
  if (a.rankProgressKills >= a.rankKillThreshold && 5 > a.rank) {
    a.rankProgressKills -= a.rankKillThreshold;
    advanceMonsterTypeRank(a);
  }
}
```

- 曲线输入 `b = 10·(怪物等级 − 1) + 阶位`，阶位 `Sj ∈ [1,5]`，`MONSTER_RANK_KILL_STEP = 20`（`content/balance.js:117`）。`Sj` 与 `ek` 同步增长（构造即 `advanceMonsterTypeRank`：`Sj 0→1`、`ek 0→20`，`combat/encounters.js:189-190`），故**处于阶位 `Sj` 时升下一阶还需 `20·Sj` 次**（20 → 40 → 60 → 80 → 100，累进而非固定步长），`rankProgressKills` 是"自上次升阶以来"的余数计数器（升阶时 `ml -= ek` 保留余数）。`Sj = 5` 后不再推进但 `ml/xq` 继续累加。`killCount` = 该怪类历史总杀（存档字段 `kills`，`persistence/entities.js:189-195`）。
- `experienceReward`（`monsterArmorCurve`，power 1.24 / growth 1.0002）是**每杀经验**（§P-3），其增长明显慢于战斗属性曲线。含义未在代码内命名，由唯一读者 `addExperience(….No × doubleExperienceModifier.currentValue)`（`simulation/characters.js:290` 变量名 `f.No`、`combat/actions.js:364` 变量名 `d.No`）反推，置信高。
- 曲线→属性映射错位（`combat/encounters.js:76-83`）：`damage ← Gp(monsterHealthCurve)`、`armor ← Ep(monsterSpiritCurve)`、`attackRating ← Fp(monsterAttackCurve)`、`defenceRating ← Hp(monsterDefenceCurve)`、`maxHealth ← $o(monsterDamageCurve)`。`[疑似遗留怪癖]` 伤害与生命取了对方名字的曲线；数值按原样记录。
- 脆弱怪物药水把 5 条 levelValue 统一乘 0.7（`combat/encounters.js:69-75`）。
- 遭遇规模：`minMonsters + randomInt(max(min, maxMonsters) − minMonsters) + extraMonstersModifier`（`combat/encounters.js:49-52`，首领房另有 `maxMonsters.baseValue` 作下限，`combat/encounters.js:145-148`）。
- 怪物等级取自滑动窗口：`catalog.minUnlockedLevel + randomInt(1 + catalog.maxUnlockedLevel − catalog.minUnlockedLevel)`（`combat/encounters.js:55`）。

---

## 8. 离线收益

### 8.1 时长来源与上限

`src/engine/modules/runtime/game.js:498-503`（读档末尾）

```js
if (game.options.allowOfflineProgress && game.lastActiveAt) {
  game.offlineDuration = Date.now() - game.lastActiveAt;
  if (12E4 < game.offlineDuration) {
    game.beginOfflineProgress();
  }
}
```

`lastActiveAt` 来自存档的 `gameTimestamp`（写入时是**序列化时刻**，`persistence/game-save.js:51-52` 与 `:704` 附近）。

`runtime/game.js:469-475`

```js
    beginOfflineProgress: function () {
      if (!game.gameWon && game.partyCreated) {
        game.offlineDuration = Math.min(game.offlineDuration, 432E5 + offlineTimeBonus.currentValue);
        game.processingOffline = true;
        game.offlineProcessed = 0;
      }
    },
```

```
待结算时长 = clamp(Date.now() − lastActiveAt, 需 > 120000ms, ≤ 43200000 + offlineTimeBonus)
offlineTimeBonus ∈ {0, 7.2e6, 1.44e7}                       // 两条点升级各 +2h
=> 上限 12h / 14h / 16h
```

### 8.2 时长 → 回合

`src/engine/modules/simulation/loop.js:20-31, 42-51`

```js
this.frameDuration = 1E3 / 60;
this.turnDuration = 250;
```
```js
if (1E3 < a && game.options.allowBackgroundProgress && (game.processingOffline || (…), game.offlineDuration += a), game.processingOffline) {
  for (c = 0; 200 > c && game.offlineProcessed < game.offlineDuration && !game.gameWon && game.processingOffline;) {
    advanceSimulation(15);
    game.offlineProcessed += this.turnDuration;
    game.state.statisticsRecorder.recordPlayedMilliseconds(this.turnDuration);
    c++;
  }
  if (game.offlineProcessed >= game.offlineDuration) {
    game.finishOfflineProgress();
  }
}
```

```
回合数 = floor(offlineDuration / 250)          // 12h → 172800 回合；16h → 230400
每帧最多推进 200 个离线回合
```

一次 `advanceSimulation(15)` **恰为 1 回合**，因为累加器与门槛同值（`simulation/tick.js:27-33`）：

```js
b.turnTimeAccumulator += a;
if (15 <= b.turnTimeAccumulator) {
  game.state.turnNumber++;
  b.turnTimeAccumulator -= 15;
```

（在线分支是 `advanceSimulation(帧差 / frameDuration)`，`simulation/loop.js:53-56`；15 个模拟单位 ≈ 15 × 16.67ms ≈ 250ms，与 `turnDuration` 一致。）

### 8.3 回合 → 各子系统

`advanceSimulation` 内的回合分频（`simulation/tick.js`），周期来自 `CharacterLifecycle` 构造（`runtime/game.js:36-43`）：

| 每 N 回合 | N | 做的事 | 代码 |
|---|---|---|---|
| 1 | 1 | `recordTurn`、双方效果推进、掉落物 `claimedBy` 重置（地牢内）、行为推进 | `simulation/tick.js:82-105` |
| 2 | `gD=2` | 地牢重生计时（1500 回合）、农场周期（1200 回合 → `Sd += (100+potionPowerBonus)·farmKillsModifier`） | `simulation/tick.js:143-213` |
| 2 | `TC=2` | `autoScrolls` 药水自动施卷轴 | `simulation/tick.js:130-142` |
| 3 | `zD=3` | 生命/法力回复：`max(1, floor(max · (base% + bonus% )/100))` | `simulation/tick.js:34-51` |
| 3 | — | 药剂时长延长药水的 `activationTurn++` | `simulation/tick.js:106-120` |
| 4 | `PC=4` | 成就扫描（§4.1） | `simulation/tick.js:214-236` |

因此离线的经济效果与在线同速：杀怪 → `addKills/addExperience/掉落/awardAdventurePoints(1)`；卖装/装备不在离线发生（无玩家点击）。

### 8.4 三条边界事实

1. `[疑似遗留怪癖]` **12h 上限只在读档路径生效**。后台标签页路径直接 `game.offlineDuration += a`（`simulation/loop.js:42`），不经 `beginOfflineProgress`，因此长挂页可超过上限；上限要等下次读档才被 `Math.min` 应用。
2. 离线期间**不刷新升级可购状态**（`simulation/tick.js:515` 的 `if (!game.processingOffline)` 包住整段 `refreshUpgradeCollection`），也不自动存档（`simulation/loop.js:87-92`）；两者都在结算完成后的第一个正常帧补齐。
3. 离线结算途中若触发胜利（`game.gameWon`），循环即刻退出，且 `PartyState.iw()` 会主动 `finishOfflineProgress()`（`characters/party.js:272`）；`playedMillis` 只按已结算的 `250ms/回合` 累加（`simulation/loop.js:46`），不会被 `simulation/loop.js:94` 二次累加（该行的 `!processingOffline` 保护）。

---

## 9. `[疑似遗留怪癖]` 汇总

| # | 位置 | 现象 |
|---|---|---|
| 1 | `simulation/characters.js:169-184` | `armor/attackRating/defenceRating/damage` 四条 `levelValue` 同用 `armorCurve`；`damageCurve` 只喂 `spellSpiritCost`（§P-1） |
| 2 | `combat/encounters.js:76-83, 205-210` | 怪物"伤害/生命"取了对方名字的曲线；`experienceReward`（经验）取自名为 `monsterArmorCurve` 的曲线（§7） |
| 3 | `progression/points.js:134-149` | `bookcasePointEvent`/`weaponRackPointEvent` 变量名与自身文案互换（纯命名） |
| 4 | `progression/points.js:246-268` | 点事件 ID 无 20；`pointEventsById[20]` 为空，发放只打日志 |
| 5 | `progression/points.js:26-46` + `:57-73` | 成就加成对历史事件次数**追溯生效**，"先杀后领"回补全部差额（§2.2/§2.3） |
| 6 | `progression/upgrades.js:546-549` | `applyLevelStats` 在 `characterLevel` 自增前调用（靠传参 `c` 保持正确）；且升级即把 `health/spirit` 设为满值 |
| 7 | `progression/upgrades.js:217-252` | `equipmentQualityBonus` 实为卖价加成、`itemCostBonus` 实为怪物等级折扣 |
| 8 | `progression/upgrades.js:943` | 农场"即将可买"用绝对差额 `<120`，而全局升级用"差额 ≤400 或 ≤30%"、升级 XP 用"≤300 或 ≤20%"，三套口径 |
| 9 | `combat/scrolls.js:61-63` + `progression/upgrades.js:1100` | 卷轴的价格档位与等级门槛是同一个表达式；`sg = 0` 的 `shockScroll` 开局即解锁 |
| 10 | `runtime/game.js:448-450` | "继续"路径把地牢定价计数器 `Mk` 重置为**农场数量** |
| 11 | `progression/statistics.js:39,69` | `levelsCleared`/`minionKills` 的记录方法仍是混淆名 `recordLevelCleared`/`$k`（与 `docs/reverse-engineering/unresolved.md` 第七批一致，未落地改名） |
| 12 | `characters/character.js:440,454` + `ai/targeting.js:422` | `MELEE_ACTION_TYPE = 3` 记账为 `rangedAttackCount`（存档键为准，勿顺手纠正） |
| 13 | `progression/achievements.js:98-99` | `requirementType 16` 读实时队伍等级，进度可随重生回退；函数无 `default` |
| 14 | `persistence/entities.js:286-288` | `farmsPurchased` 缺失时用"当前农场数"补值，"0 农场"与"从未买农场"不可区分 |
| 15 | `persistence/entities.js:283-284,318-319` | `weaponRacksLooted` 取 `weaponRacksLooted/weaponsRacksLooted` 两键最大值，`bookcasesLooted` 只取一键 |
| 16 | `characters/party.js:302-308` + `views/results.js:61` | `currentContinueCount` 在"点继续"时才自增，首胜不进 `Xm/mm` |
| 17 | `runtime/game.js:471` vs `simulation/loop.js:42` | 12h/14h/16h 上限只约束读档离线；后台标签页累加不受钳 |
| 18 | `loot/inventory.js:9` | 背包容量在 `Inventory` 构造时快照 `victoryCount`，之后不回填 |
| 19 | `runtime/game.js:360-376,415-417` | `resetRun` 用同一形参承担"重生"与"清档"两种语义；`resetContinuation` 与它保留集合不一致（全局升级/卷轴/怪物目录在"继续"中保留、在"重生"中清空） |
