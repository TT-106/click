# 道具生成公式（以代码为准）

> 引用规范：形如 `combat/actions.js:84` 的路径相对 `src/engine/modules/`；若某处只写了裸文件名（如 `character.js:677`），以所在小节的模块归属为准——`characters/character.js` 与 `views/character.js` 同名，未逐一消歧。

> 事实来源：`src/engine/modules/**` 当前实现。每条公式给出 `file:line` 与原文 JS 片段。
> 与 `archive/original/c2.js` 的等价性由 **89 场景差分矩阵（`npm run test:scenarios`）保证，因此本文描述的是**权威行为**，不是设计意图。
> **片段同步状态（2026-09-27）**：内嵌片段与散文里的标识符已按 `docs/symbol-map.json` 的字段映射批量同步到当前语义名（`scripts/fix-doc-identifiers.mjs`）；节选/伪码型片段的行号不逐字对应（见 `scripts/check-doc-snippets.mjs` 的残留清单），判读时以片段上方的 `file:line` 为准。
> 凡看起来像 bug 的地方一律按原样记录并标 `[疑似遗留怪癖]`；本文不提出修正。
> **引用体例**：JS 片段为源码原文，但为控制篇幅做了两种压缩——(a) `…` 表示省略的行；(b) 少数多行嵌套被并为单行（token 序列不变）。凡 token 序列与源码不一致之处均为笔误，欢迎按 `file:line` 复核后修正。

字段速查（`Item` 实例，`loot/items.js:61-73`）：

| 字段 | 含义（依据赋值点/消费点） | 证据 |
|---|---|---|
| `itemType` | 指向 `ItemType`（模板） | `loot/items.js:62` ← `loot/items.js:202` |
| `slot` | 装备槽字符串（`"20"`/`"80"`/…） | `loot/items.js:63` |
| `characterClass` | 生成时传入的职业号，装备校验用 | `loot/items.js:64`、`characters/character.js:143` |
| `itemName` | 最终显示名（已拼好的字符串，派生值被持久化） | `loot/items.js:65`、`loot/items.js:201` |
| `itemRarity` | 稀有度序号 0–4 | `loot/items.js:66`、`loot/items.js:112-127` |
| `itemLevel` | 道具等级 | `loot/items.js:67`、`views/character.js:185` |
| `itemGold` | 金币价值（排序/卖出基准，非"更好"判据） | `loot/items.js:68`、`loot/inventory.js:56`、`characters/character.js:1198` |
| `itemValue` | 属性数值（"更好"判据、属性求和来源） | `loot/items.js:69`、`loot/inventory.js:75`、`characters/character.js:168-178` |
| `characteristic` | 该槽位绑定的属性类型 1–6（= 职业定义的 `statType`） | `loot/items.js:70`、`characters/character.js:46-55` |
| `itemEffect` | `ItemEffect`（元素特效）或 `null` | `loot/items.js:71` |
| `nj` | 持有者 Character | `loot/items.js:72`、`loot/items.js:203`、`loot/inventory.js:15` |

`kA/ns/zf/itemValue/characteristic/Rm` 这些名字未在代码内命名语义，上表含义由**赋值点 + 消费点**反推，置信度：高（`persistence/entities.js:7-51` 的存档键名 `itemRarity/itemLevel/itemGold/itemValue/itemCharacteristic/itemEffect` 与之一一对应）。

---

## 1. 稀有度掷点

### I-1 概率表

`src/engine/modules/content/balance.js:443-467`

```js
  VISIBLE_MONSTER_LEVELS = 5;
  BASE_HIGHER_ITEM_CHANCE = 0.1;
  LOWER_ITEM_LEVEL_CHANCE = 0.15;
  itemRarityProbabilities = [0.8, 0.16, 0.036, 0.0036, 4E-4];
  itemRarityTiers = [{
    tierId: 0,
    statMultiplier: 1,
    elementalEffectChance: 0.2
  }, {
    tierId: 1,
    statMultiplier: 1.2,
    elementalEffectChance: 0.5
  }, {
    tierId: 2,
    statMultiplier: 1.35,
    elementalEffectChance: 0.75
  }, {
    tierId: 3,
    statMultiplier: 1.5,
    elementalEffectChance: 0.9
  }, {
    tierId: 4,
    statMultiplier: 1.65,
    elementalEffectChance: 0.99
  }];
```

- `tierId` = 稀有度序号；`statMultiplier` = 属性/金币倍率（乘数）；`elementalEffectChance` = 元素特效出现概率。三个字段的语义由消费点确定（`loot/items.js:157-167`、`:170`），置信度高。
- 名义总和 = 1.0；浮点实测 `0.8+0.16+0.036+0.0036+4e-4 === 1.0000000000000002`（不是 `1`）。落底的 `return 0` 分支吸收残差，故不影响分布。

### I-2 归一化掷点

<!-- snippet: abridged -->
`src/engine/modules/loot/items.js:332-343`

```js
ItemGenerator.prototype.uf = function (a) {
  var b = 0,
    c = Math.random() * a;
  for (a = itemRarityProbabilities.length - 1; 0 <= a; a--) {
    b = itemRarityProbabilities[a];
    if (c < b) {
      return a;
    }
    c -= b;
  }
  return 0;
};
```

参数 `a` ∈ (0,1] 是"压缩因子"。记 `S_i = Σ_{j>i} p_j`（高端累积），则

```
P(返回 i) = p_i / a            （i ≥ 1，只要 S_0 累积 < a 的边界成立）
P(返回 0) = (a - 0.2) / a
```

即：**从"普通"里挖走的概率质量按比例摊给 4 个稀有档**，稀有档整体放大 `1/a` 倍。
代入 `a = (100 - itemQualityChance)/100`（`loot/items.js:277`）：

| `itemQualityChance` | `a` | P(罕见) | P(稀有) | P(历史) | P(远古) | P(普通) |
|---|---|---|---|---|---|---|
| 0（基础，`content/balance.js:342-345`） | 1.00 | 0.16 | 0.036 | 0.0036 | 0.0004 | 0.80 |
| 30（满级，`maxValue:30` `content/balance.js:346`） | 0.70 | 0.2286 | 0.05143 | 0.005143 | 0.000571 | 0.7143 |

调用点只有两处，都传 `a ≥ 0.55`，上式简化形式恒成立：

- 普通掉落：`loot/items.js:275` `rarity = generator.rollRarity((100 - upgrades.itemQualityChance.currentValue) / 100)`
- 宝箱掉落：`characters/character.js:1101-1102`

```js
zA = (100 - Math.min(90, globalUpgradeDefinitions.itemQualityChance.currentValue + CHEST_ITEM_QUALITY_BONUS)) / 100,
AA = Op.uf(zA),
```

`CHEST_ITEM_QUALITY_BONUS = 15`（`content/balance.js:293`）。宝箱路径的 `a` ∈ [0.55, 0.85]。

### I-3 序号 → tier 的匹配（数组顺序是否承重）

`src/engine/modules/loot/items.js:156-165`

```js
  rarityLookup: {
    for (let tierIndex = 0; tierIndex < rules.itemRarityTiers.length; tierIndex++) {
      const tier = rules.itemRarityTiers[tierIndex];
      if (tier.tierId === rarityId) {
        rarityTier = tier;
        break rarityLookup;
      }
    }
    rarityTier = rules.itemRarityTiers[0];
  }
```

- `itemRarityTiers` 按 `tierId` 值查表，**数组顺序不承重**（仅"查不到时回落 `[0]`"依赖顺序）。
- `itemRarityProbabilities` 的**索引本身即稀有度 ID**，顺序承重：
  - 存档字段 `itemRarity` 直接写 `a.uf()`（`persistence/entities.js:53,60`）；
  - UI 文案 `getItemRarityLabel`（`loot/items.js:112-127`）、CSS 类 `getRarityClass`（`views/upgrade-details.js:298`）、统计分档 `recordItemFound`（`progression/statistics.js:104-119`）、冒险点分档 `awardAdventurePoints(13/14/15/16)`（`characters/character.js:1036-1049`、`combat/actions.js:235-249`）全部按 `0..4` 硬编码 switch。
  - 越界值走 `"BUG FOUND: " + item.getRarity()`（`loot/items.js:125`）。
- **另一处顺序承重**：槽位池 `itemTypesBySlot[slot]` 是注册序数组，`itemType = availableTypes[randomInt(availableTypes.length)]`（`loot/items.js:150`）按下标取模板；`content/equipment.js:324+` 的 `registerItemType(...)` 调用顺序改变，同一次随机数会取出不同贴图/基底名，差分立即分叉。`itemTypeId` 是 `baseName + spriteFileName` 的字符串哈希（`loot/items.js:235-247`），与注册顺序无关。

---

## 2. 等级掷点与等级进入数值

### I-4 等级抖动

`src/engine/modules/loot/items.js:228-234`

```js
export function randomizeItemLevel(level, higherChanceBonus, rules) {
  if (Math.random() < rules.lowerItemLevelChance) {
    return Math.max(1, level - 1);
  }
  const higherChance = Math.min(1, rules.baseHigherItemChance + higherChanceBonus);
  return Math.random() < higherChance ? level + 1 : level;
}
```

`LOWER_ITEM_LEVEL_CHANCE = 0.15`、`BASE_HIGHER_ITEM_CHANCE = 0.1`（`content/balance.js:444-445`）。
调用方传的第二个参数是 **`(100 - higherLevelItemChance)/100`**：

- 普通掉落：`loot/items.js:276` `itemLevel = randomizeItemLevel(monsterLevel, (100 - upgrades.higherLevelItemChance.currentValue) / 100, generator.rules)`
- 宝箱：`characters/character.js:1103-1104`

```js
CA = (100 - Math.min(90, globalUpgradeDefinitions.higherLevelItemChance.currentValue + CHEST_ITEM_LEVEL_BONUS)) / 100,
DA = randomizeItemLevel(wl.stats.characterLevel, CA);
```

两次独立掷点（`loot/items.js:227` 与 `:231` 各一次 `Math.random()`），故

```
P(等级−1) = 0.15
P(等级+1) = 0.85 · min(1, 0.1 + b)
P(不变)   = 0.85 · (1 − min(1, 0.1 + b))
```

代入（`higherLevelItemChance` 基础 0、每级 +3、上限 30，`content/balance.js:351-363`）：

| `higherLevelItemChance` | `b` | `c = min(1, 0.1+b)` | P(等级−1) | P(等级+1) | P(不变) |
|---|---|---|---|---|---|
| 0 | 1.00 | 1.00 | 0.15 | 0.85 | 0.00 |
| 10 | 0.90 | 1.00 | 0.15 | 0.85 | 0.00 |
| 20 | 0.80 | 0.90 | 0.15 | 0.765 | 0.085 |
| 30 | 0.70 | 0.80 | 0.15 | 0.68 | 0.17 |

`[疑似遗留怪癖]` 标题为"道具等级加成/更高等级道具掉落几率(+3%)"的升级，**实际把 +1 级的概率从 85% 压低到 68%**。同一 `(100 - v)/100` 惯用法在稀有度处是正确的归一化除数（I-2），在等级处被当成加法概率使用。数值按原样记录。

- 等级基准 `a`：普通掉落用**被杀怪物的等级**（`loot/items.js:278` 的 `f` ← `simulation/characters.js:321` 传入的 `d = b.stats.characterLevel`，见 `simulation/characters.js:275-276`）；首领爆发同样用**死者（首领）等级**（`combat/actions.js:389` 的 `b.stats.characterLevel`）；只有宝箱用**随机冒险者等级**（`characters/character.js:1104` 的 `wl.stats.characterLevel`）。
- 新建队伍初始装备**不掷等级/稀有度**：`generateItem(game.itemGenerator, l[s], g, 1, 0)` 固定等级 1、稀有度 0（`views/party-creation.js:79`）。

### I-5 等级 → 数值（曲线 + ±10% 抖动）

`src/engine/modules/core/math.js:72-80`

```js
export function scaleByLevel(level, curve, multiplier) {
  level = Math.max(0, level - 1);
  return floorNumber(multiplier * (curve.base + curve.coefficient * Math.pow(level, curve.power) * Math.pow(curve.growth, level)));
}
export function randomizeScaledValue(a, curve, multiplier) {
  a = scaleByLevel(a, curve, multiplier);
  var jitterFactor = 1.1 - 0.2 * Math.random();
  return floorNumber(a * jitterFactor);
}
```

```
value(level, curve, mult) = floor( floor( mult · (base + coef·(level−1)^power · growth^(level−1)) ) · (0.9 + 0.2·U) )
```

- 等级先 `−1` 再求幂：`level=1` 时曲线值恰为 `floor(mult·base)`。
- 抖动区间 `[0.9, 1.1)`，**两次 floor**（曲线一次、抖动一次）。
- `floorNumber` 在 `< 2^31` 时用 `value | 0`（向零截断），否则 `Math.floor`：`core/math.js:66-68`。

### I-6 `itemStatCurve` 的具体参数与实算

`src/engine/modules/content/balance.js:81-92`

```js
  itemStatCurve = {
    power: 1.8,
    coefficient: 15,
    growth: 1.015,
    base: 15
  };
  itemGoldCurve = {
    power: 1.8,
    coefficient: 15,
    growth: 1.015,
    base: 15
  };
```

两条曲线常量**完全相同**（`power/coefficient/growth/base` 一字不差），所以同一次生成的 `itemValue` 与"基础 `itemGold`"是同一期望、两次独立抖动。
`scaleByLevel(level, itemStatCurve, mult)`（抖动前）实算：

| level | mult=1 | mult=1.65（远古） |
|---|---|---|
| 1 | 15 | 24 |
| 5 | 208 | 343 |
| 10 | 910 | 1501 |
| 20 | 4002 | 6604 |
| 40 | 19611 | 32359 |

### I-7 倍率合成

`src/engine/modules/loot/items.js:166-170`

```js
  let itemEffect = null;
  const characteristic = inventory.slotStatTypes[slot];
  const statMultiplier = getClassStatMultiplier(inventory, characteristic) * rarityTier.statMultiplier;
  const itemValue = randomizeScaledValue(itemLevel, rules.itemStatCurve, statMultiplier);
  const itemGold = randomizeScaledValue(itemLevel, rules.itemGoldCurve, statMultiplier) * rules.itemGoldModifier.currentValue;
```

`mult = 职业系数(characteristic) × 稀有度 pp`，属性与金币共用同一 `mult`，但各自消耗一次 `Math.random()`。

### I-8 一次 `generateItem` 的随机数消耗顺序（差分承重）

| 次序 | 位置 | 用途 |
|---|---|---|
| 1 | `loot/items.js:150` `randomInt(availableTypes.length)` | 槽位模板 |
| 2 | `loot/items.js:169`（内部 `:78`） | 属性抖动 |
| 3 | `loot/items.js:170`（内部 `:78`） | 金币抖动 |
| 4 | `loot/items.js:171` `Math.random() < rarityTier.elementalEffectChance` | 是否带元素特效（**仅 `characteristic===1` 时才消耗**，`&&` 短路） |
| 5–6 | `loot/items.js:173`、`:175` | 元素种类、特效量 |
| 7+ | `loot/item-names.js:58-60,62-69` 等 | 词库结构 1–2 次 + 取词 `randomInt` |

---

## 3. 逐属性生成

### I-9 属性类型集合

<!-- snippet: abridged -->
`src/engine/modules/loot/items.js:77-111`

```js
export function getItemStatLabel(a) {
  switch (a.characteristic) {
    case 2:
      return "护甲";
    case 3:
      return "攻击等级";
    case 4:
      return "防御等级";
    case 5:
      return "最大生命";
    case 6:
      return "最大法力";
    case 1:
      ...  // 伤害（有元素特效时换成 火焰/冰霜/毒药/休克/音波 伤害）
    default:
      return "Error";
  }
}
```

`characteristic` 与存档注释一致：`1=伤害 2=护甲 3=攻击等级 4=防御等级 5=生命 6=精神`（`persistence/save-dto.js:22`）。

### I-10 槽位 → 属性类型：来自职业定义，不来自道具

`src/engine/modules/characters/character.js:47-56`

```js
  if (d = d.slotStatBonusList) {
    a = {};
    for (var slotStatBonusIndex = 0; slotStatBonusIndex < d.length; slotStatBonusIndex++) {
      a[d[slotStatBonusIndex].slot] = d[slotStatBonusIndex].statType;
    }
    d = a;
  } else {
    d = null;
  }
  this.slotStatTypes = d;
```

每个职业恰有 6 个槽位、6 个 `statType`（例：战士 `content/classes.js:57-75`，槽 `"20"→1, "80"→2, "40"→4, "120"→5, "101"→3, "185"→6`）。
同一 `statType` 同时决定：数值倍率（I-11）、是否可出元素特效（I-12）、装备后计入哪条属性（I-13）。

### I-11 职业系数

`src/engine/modules/loot/items.js:208-227`

```js
export function getClassStatMultiplier(inventory, characteristic) {
  const multipliers = inventory.classDefinition.statMultipliers;
  if (!multipliers) {
    return 1;
  }
  switch (characteristic) {
    case 2:
      return multipliers.armorMultiplier;
    case 1:
      return multipliers.damageMultiplier;
    case 3:
      return multipliers.attackRatingMultiplier;
    case 4:
      return multipliers.defenceRatingMultiplier;
    case 5:
      return multipliers.maxHealthMultiplier;
    case 6:
      return multipliers.maxSpiritMultiplier;
  }
}
```

`[疑似遗留怪癖]` `switch` 无 `default`：`characteristic ∉ {1..6}` 时返回 `undefined` → 后续乘算得 `NaN`。当前所有调用点的 `characteristic` 都来自 `slotStatTypes`，而 `slotStatTypes` 的键与值域都由 `slotStatBonusList` 限定为 1–6，因此不可达。注意 `scrollCasterClass.statMultipliers.attackRatingMultiplier = 500`（`content/classes.js:636-643`），卷轴施法者槽 `"232"` 的道具数值/金币被放大 500 倍。

### I-12 元素特效

`src/engine/modules/loot/items.js:171-181`

```js
  if (1 === characteristic && Math.random() < rarityTier.elementalEffectChance) {
    const effectGenerator = generator.itemEffectGenerator;
    const effectRoll = Math.random();
    const effectType = 0.2 > effectRoll ? FIRE_ITEM_EFFECT : 0.4 > effectRoll ? ICE_ITEM_EFFECT : 0.6 > effectRoll ? SHOCK_ITEM_EFFECT : 0.7 > effectRoll ? SONIC_ITEM_EFFECT : POISON_ITEM_EFFECT;
    let effectAmount = floorNumber(Math.max(0.1 * itemValue, 0.4 * itemValue * Math.random()));
    if (1 > effectAmount) {
      effectAmount = 1;
    }
    const effectDefinition = effectGenerator.effectsByType[effectType];
    itemEffect = new ItemEffect(effectType, effectAmount, "+" + formatAmount(effectAmount) + " " + effectDefinition.description, effectDefinition.weaponEffectAnimationName);
  }
```

- 门槛：`characteristic === 1`（伤害槽）**且** `U() < tier.elementalEffectChance`。
- 种类分布：火 20% / 冰 20% / 休克 20% / 音波 10% / 毒 30%（阈值链顺序即概率，`FIRE=1, ICE=2, POISON=3, SHOCK=4, SONIC=5`，`loot/items.js:303-307`）。
- 特效量：`max(1, floor( max(0.1·itemValue, 0.4·itemValue·U) ))`，即"不低于属性值 10%，最高 40% 均匀"，下限 1。
- `formatAmount` 见 `core/math.js:55-60`（阈值链为原版行为锁定）。
- 恢复期局部变量复用已拆开：稀有度模板 `rarityTier` 与特效掷点 `effectRoll` 分别持有各自的值，随机消费顺序保持原样。
- `[疑似遗留怪癖]` 特效的消费链是死的：`Equipment.Qk` 用 `a.statType` 记录"主手武器"（`characters/movement.js:202-204`），但 `Item` 上只有 `characteristic`，从无 `statType` 字段 → `effectItem` 永不被赋值 → `So()` 恒 `null` → `combat/actions.js:453-454, 479-486` 读取的武器元素特效贴图分支永不生效。投射物分支 `projectileWeapon`（`characters/movement.js:199-201`，经 `Cw()`）不受影响。

---

## 4. 金币价值与卖价

### I-13 `itemGold`（道具金币价值）

`src/engine/modules/loot/items.js:169`（`s` → `Item` 第 7 参 → `this.itemGold`，`loot/items.js:68`）

```js
s = randomizeScaledValue(d, itemGoldCurve, s) * itemGoldModifier.currentValue;
```

`itemGoldModifier = { currentValue: 1, defaultValue: 1, activeValue: 1.2 }`（`content/balance.js:258-262`），由 `higherItemValues` 药水（`modifierId:14`，`combat/potions.js:58-59`、`combat/potions.js:196-202` "新道具+20%黄金"）激活。
`[疑似遗留怪癖]` `1.2 ×` 整数**不再取整**，药水生效期间 `itemGold` 可为小数（例 17 → 20.4）；显示经 `formatAmount` 截断（`views/character.js:186,318`），存档原样写入小数（`persistence/entities.js:62`）。

### I-14 卖价（商店）

<!-- snippet: abridged -->
`src/engine/modules/characters/character.js:1195-1207`

```js
for (var kj = undefined, Tp = 0, Up = undefined, Al = 0, LA = 0.1 + equipmentQualityBonus.currentValue, Ph = zl.length - 1; 0 <= Ph; Ph--) {
  kj = zl[Ph];
  if ((Up = yl.ef(kj.slot)) && !isBetterItem(kj, Up)) {
    Al += kj.itemGold * LA;
    Tp++;
    awardAdventurePoints(17);
    removeInventoryItemAt(Sp, Ph);
  }
}
game.state.statisticsRecorder.recordItemsSold(Tp);
...
Vp.ni += floorNumber(Al);
```

```
卖出所得 = floor( Σ_{被卖件} zf · (0.1 + equipmentQualityBonus.currentValue) )
```

- 回收率基线 **10%**；`equipmentQualityBonus.levelIncrement = 0.01`（`content/balance.js:172-176`），对应点升级 `itemSales1/2`（`bonusIndex:10`，`progression/points.js:329-341`，文案"商店回收价提高10%"→ 10% 的相对 10%，即 0.1→0.12）。
- **只有"不比已装备件好"的道具才卖**（空槽位的道具不卖）；每件卖出的道具记 1 次事件 17。
- 逐冒险者累加、`floor` 只在该冒险者的合计上做最后一次。
- 卖出的钱先进 `game.shops.ni`（"待收集"），由 `CollectFarmUpgrade.purchase` 才真正 `addGold`：`progression/upgrades.js:1253-1261`。

### I-15 怪物金币掉落（对照）

`src/engine/modules/content/balance.js:8-13`

```js
export function rollGoldDrop() {
  var minGold = globalUpgradeDefinitions.minGoldPerDrop.currentValue,
    goldRollSpan = Math.max(0, globalUpgradeDefinitions.maxGoldPerDrop.currentValue - minGold),
    goldMultiplier = doubleGoldModifier.currentValue;
  return (minGold + randomInt(goldRollSpan)) * goldMultiplier;
}
```

`minGoldPerDrop`=`minGoldPerDrop`（基础 0，+10/级，上限 2000）、`maxGoldPerDrop`=`maxGoldPerDrop`（基础 15，+25/级，上限 2500）（`content/balance.js:364-389`；键名 `As/ys` 未重命名，语义取自各自 `settingId`）。
`[疑似遗留怪癖]` 若 `min > max`，`randomInt(0)=0`（`core/math.js:44-46`）→ 恒定掉落 `min`，不报错。

---

## 5. 掉落门：什么才会掉落

### 5.1 前提：怪物死亡分派

<!-- snippet: abridged -->
`src/engine/modules/combat/actions.js:326-414`

```js
} else if (1 === b.characterType) {
  game.lifecycle.Lp(b);            // 随从死亡：无任何掉落
} else if (4 === b.characterType) {
  ...                              // 首领：必爆（I-16）
} else {
  game.lifecycle.ol(a, b);         // 普通怪：概率掉落（I-17）
}
```

### I-16 首领爆发（无概率门）

<!-- snippet: abridged -->
`src/engine/modules/combat/actions.js:374-403`

```js
s = 10 + randomInt(10),
        u;
if (doubleGoldDropsModifier.currentValue) {
  s *= 2;
}
for (g = 0; g < s; g++) {
  u = 1 + rollGoldDrop();
  ...
s = 7 + randomInt(8);
if (doubleItemDropsModifier.currentValue) {
  s *= 2;
}
for (g = 0; g < s; g++) {
  spawnItemDrop(game.itemDrops, tickCharacterTurn(n, c, f), tickCharacterTurn(p, h, l), d, b.stats.characterLevel);
}
s = 2 + randomInt(5);      // 卷轴
...
s = 0 + randomInt(2);      // 药水，且受容量约束
for (g = 0; g < s && game.potions.re.length < BASE_POTION_CAPACITY + potionCapacityBonus.currentValue; g++) {
```

件数：金 `10+U[0,9]`，道具 `7+U[0,7]`，卷轴 `2+U[0,4]`，药水 `U[0,1]`；前两者受药水 ×2，药水/道具不受"双倍掉落"药水之外的其他门约束。

### I-17 普通怪四类掉落门（**四套不同的比较式**）

<!-- snippet: abridged -->
`src/engine/modules/simulation/characters.js:298-325`

```js
if (randomInt(100) <= globalUpgradeDefinitions.goldDropChance.currentValue) {          // 金币
if (randomInt(100) <= globalUpgradeDefinitions.scrollDropChance.currentValue) {          // 卷轴
if (100 * Math.random() <= globalUpgradeDefinitions.potionDropChance.currentValue) {     // 药剂
if (randomInt(100) <= globalUpgradeDefinitions.itemDropChance.currentValue || guaranteedItemDropsModifier.currentValue) {   // 道具
```

| 掉落 | 升级键 / 基础 / 每级 / 上限 | 比较式 | 实际概率（基础值） |
|---|---|---|---|
| 金币 | `goldDropChance` = `goldDropChance`，25 / +5 / 100（`content/balance.js:390-402`） | `randomInt(100) <= v` | **31/100** |
| 卷轴 | `scrollDropChance` = `scrollDropChance`，20 / +2 / 40（`content/balance.js:403-415`） | 同上 | **21/100** |
| 道具 | `itemDropChance`，40 / +2 / 100（`content/balance.js:299-311`） | 同上，或药水 `guaranteedItemDrops` 强制 | **41/100** |
| 药剂 | `potionDropChance` = `potionDropChance`，1 / +0.5 / 5（`content/balance.js:416-428`） | `100*Math.random() <= v` | **1/100** |

`[疑似遗留怪癖]` `randomInt(100) ∈ [0,99]` 配 `<=` 使前三类比文案各多 1 个百分点；药剂那类改用连续比较，无此偏移。按原样记录。
`[疑似遗留怪癖]` 道具双倍药水是"再掷一次 `spawnItemDrop`"（`:322-324`），两次独立掷稀有度/等级/模板；金币双倍是"再放一份等量金堆"（`:303-306`），不重掷 `rollGoldDrop`。

### I-18 掉落生成用的槽位/持有者是随机选取

`src/engine/modules/loot/items.js:270-281`

```js
export function spawnItemDrop(dropRegistry, x, y, room, monsterLevel, generator, adventurers) {
  const upgrades = generator.rules.globalUpgradeDefinitions;
  const adventurer = adventurers[randomInt(adventurers.length)];
  const slots = adventurer.slotList;
  const slot = slots[randomInt(slots.length)];
  const rarity = generator.rollRarity((100 - upgrades.itemQualityChance.currentValue) / 100);
  const itemLevel = randomizeItemLevel(monsterLevel, (100 - upgrades.higherLevelItemChance.currentValue) / 100, generator.rules);
  const item = generateItem(generator, slot, adventurer, itemLevel, rarity);
  if (item) {
    dropRegistry.drops.push(new ItemDrop(item, x, y, room));
  }
}
```

随机挑**一名**冒险者 + 其**一个**槽位，与拾取者无关。拾取时才决定归属，两条路径不同：

- `combat/actions.js:221-233`：按 `characterClass` 匹配第一个冒险者；
- `characters/character.js:1028-1033`：用生成时写进 `nj` 的那名随机冒险者的背包。

两条路径随后都由 `addInventoryItem` 把 `nj` 改写成真正持有者（`loot/inventory.js:15`）。

### I-19 宝箱/武器架/书架（房间侧内容）

`src/engine/modules/loot/treasure.js:85-96`

```js
  var treasureRegistry = treasureRegistryRef();
    var hasMonsters = 0 < getMonsters().length;
  if (!getRoomTreasure(treasureRegistry, room)) {
    if (3 != room.encounterType) {
      if (!hasMonsters && 2 > room.doorList.length) {
        return;
      }
      var treasureSpawnChance = globalUpgradeDefinitions.treasureChance.currentValue / 100;
      if (Math.random() > treasureSpawnChance) {
        return;
      }
    }
```

- 门前置：房内已无怪物且房门数 `<2` → 不放宝箱。
- 概率门：`treasureChance` 基础 5 / +2 / 上限 20（`content/balance.js:429-441`）；连续比较 `Math.random() > v/100` → P = v/100。
- `room.encounterType === 3`（财宝房）跳过前置与概率门，必定放箱。财宝房由 `randomTreasureRoom` 药水在揭示房间时以 25% 概率就地改写房型：`world/rooms.js:57-58`。财宝房内每个内圈格子 80% 概率生成 `2 · rollGoldDrop()` 的金堆：`world/rooms.js:190-201`。
- 开箱产出（`characters/character.js:1081-1127`）由 `Mf` 分类：`1`=财宝箱（金 10+U[0,9] 份 + 道具 7+U[0,7] + 卷轴 2+U[0,4] + 药水 U[0,1]）、`2`=武器架（道具 + 卷轴）、`3`=书架（仅卷轴）。道具用等级/品质加成 `CHEST_ITEM_LEVEL_BONUS=10`、`CHEST_ITEM_QUALITY_BONUS=15`（`content/balance.js:293-294`），见 I-2、I-4。`Mf` 与 `ve` 表条目的对应见 `runtime/game.js:219-348`。

### I-20 卷轴掉落的取样池

<!-- snippet: abridged -->
`src/engine/modules/simulation/characters.js:309-313`

```js
if (randomInt(100) <= globalUpgradeDefinitions.scrollDropChance.currentValue) {
  const scrolls = game.scrolls.Pl;
  const scroll = scrolls[randomInt(scrolls.length)];
  const scrollDrop = new ScrollDrop(scroll, ...);
```

池 `Pl` 只含**已解锁**卷轴（`combat/scrolls.js:217-221`）。`shockScroll.sg = 0` → `resetScrollInventory` 里 `ts(0 < 0, 0)` 使其开局即解锁（`combat/scrolls.js:209`、`combat/scrolls.js:223-227`、`combat/scrolls.js:263-269`），故 `Pl` 非空。
`[疑似遗留怪癖]` 若 `Pl` 为空，`randomInt(0)=0` → `scrolls[0]` 为 `undefined`，掉落仍被创建，拾取时 `addScrollCharge(undefined)` 抛错；代码无保护。
药水入库另有容量门：`BASE_POTION_CAPACITY(6) + potionCapacityBonus.currentValue`（`combat/potions.js:111-116`），而**卷轴拾取无容量门**，只有叠加时被夹到 `30 + scrollCapacityBonus.currentValue`（`combat/scrolls.js:54-59`）。

---

## 6. 装备限制与"更好"判定

### I-21 唯一比较式

`src/engine/modules/loot/items.js:72-74`

```js
export function isBetterItem(candidate, currentItem) {
  return !currentItem || candidate.itemValue > currentItem.itemValue;
}
```

- 判据是**属性数值 `itemValue`**，不是金币 `itemGold`，也不是等级/稀有度。
- **严格大于**：同价值不视为更好 → 不触发自动装备、不会被卖出、也不会替换背包里价值最低者。
- `currentItem` 为 `null`（槽位空）时恒为"更好"。

### I-22 装备校验与属性回算

<!-- snippet: abridged -->
`src/engine/modules/characters/character.js:142-184`

```js
export function equipItem(a, b) {
  if (b.characterClass !== a.characterClass) {
    console.log("failed to equip non-equipable item. itemSlot=" + b.slot + " charClass=" + a.characterClass);
  } else if (a.equipment) {
    var c = a.equipment.ef(b.slot);
    a.equipment.Qk(b);
    if (a.inventory) {
      a.inventory.removeItem(b);
      if (c) {
        addInventoryItem(a.inventory, c);
      }
    }
    ...
    c.attackRating.itemValue = 0;
    ... （六条清零）
    for (d = 0; d < g.length; d++) {
      if (f = h.ef(g[d])) {
        var l = c.damage;
        l.itemValue += 1 === f.characteristic ? f.itemValue : 0;
        ...
```

限制只有两条：
1. `characterClass` 必须相同（否则只打日志，静默不装）；
2. `a.equipment` 存在（怪物 `MONSTER_TYPE` 的 `equipment` 为 `null`，`characters/character.js:56`）。

`[疑似遗留怪癖]` **不校验槽位是否属于该角色的 `slotList`**：`Qk` 无条件 `this.hw[a.slot] = a`（`characters/movement.js:197-198`），异职业槽位会写入一个不在 `slotList` 里的键，因而回算循环（`characters/character.js:163-180` 遍历 `slotList`）看不见它 —— 装备进"影子槽"，既不生效也不显示，只有存档会带上它。当前所有生成路径的 `slot` 都取自持有者 `slotList`，因此正常流程不可达。

属性显示值（派生，不存字段）：`characters/stats.js:13-16`

```js
export function statValue(a) {
  var b = a.itemValue + a.levelValue;
  return b + floorNumber((a.skillBonusPercent + a.spellBonusPercent) / 100 * b);
}
```

装备末尾还会夹住当前生命/法力：`characters/character.js:181-182`。

### I-23 自动装备

三处入口共用同一判据，但**取集合的口径不同**：

- 单人"装备所有"（`loot/inventory.js:68-84`）：对**该角色背包的快照**逐件判定，条件为"槽位空 或 `isBetterItem`"，落地用 `Qk`（会把被换下的旧件塞回背包）。

```js
for (c = 0; c < f.length; c++) {
  b = f[c];
  if (!((d = a.ef(b.slot)) && !isBetterItem(b, d))) {
    a.Qk(b);
  }
}
```

- "装备所有道具"升级（`progression/upgrades.js:431-438`）：对每名冒险者调 `equipBestForCharacter`。计数版判定 `Cd` 在 `progression/upgrades.js:445-473`，可购条件是 `可装件数 > this.vp`（`vp` 是构造入参 5，`progression/upgrades.js:138-143`、`content/balance.js:487`）——`[疑似遗留怪癖]` 字段名 `vp` 与背包容量字段同名但语义是"件数门槛"。
- 逐件装备升级 `EquipItemUpgrade`（`progression/upgrades.js:490-518`）：从**全局扁平池** `game.inventories.Fj` 的第 `inventoryIndex`(0–4) 位取件，落到 `item.nj.Qk(item)`。
- 背包行 UI 的装备按钮：`views/character.js:193-198`，判据写作 `!b || this.item.itemValue > b.itemValue`，与 `isBetterItem` 等价（重复实现）。

全局池 `Fj` 只在有背包被改动（`dirty` 脏位）时于回合边界重建，并且**已经过滤掉"比已装备件差"的件**：`simulation/tick.js:487-513`

```js
if (!((nf = oe.ef(Y.slot)) && !isBetterItem(Y, nf))) {
  Ya.Fj.push(Y);
}
...
if (1 < Ya.Fj.length) {
  sortInventory(Ya, Ya.Fj);
}
```

`[疑似遗留怪癖]` 背包侧的两套排序口径不一致：排序与"最低价值"用 `itemGold`（金币），替换门槛用 `itemValue`（属性）：

`src/engine/modules/loot/inventory.js:53-58, 13-45`

```js
export function InventoryRegistry() {
  this.Fj = [];
  this.compareByItemGold = function (a, b) {
    return b.itemGold - a.itemGold;
  };
}
```

```js
} else {
  var c, d = -1, f = 0, g;
  for (c = 0; c < a.items.length; c++) {
    g = a.items[c];
    if (0 > d) { d = 0; f = g.itemGold; }
    else { if (f > g.itemGold) { d = c; f = g.itemGold; } }
  }
  c = d;
  if (-1 < c && isBetterItem(b, a.items[c])) {
    removeInventoryItemAt(a, c);
```

背包满时先找 `itemGold` 最小者（并列取**下标最小**的那个），再要求新件 `itemValue` 严格大于它才替换；否则新件直接消失（既不入库也不落地）。

背包容量：`loot/inventory.js:7-12`

```js
this.vp = BASE_INVENTORY_CAPACITY + Math.min(MAX_PRESTIGE_INVENTORY_BONUS, game.state.victoryCount);
```

`BASE_INVENTORY_CAPACITY = 20`、`MAX_PRESTIGE_INVENTORY_BONUS = 10`（`content/balance.js:123,126`）→ 每次胜利 +1 格，最多 +10。

`[疑似遗留怪癖]` 恢复存档时同一件道具经 `addInventoryItem` 重投，若容量小于存档条目数会静默丢件（`persistence/game-save.js:479-485`）。

---

## 7. 模板 / 实例 / 派生显示值 / 存档

三层结构：

1. **模板 `ItemType`**（`loot/items.js:47-60`）：`itemTypeId`(哈希 id)、`baseName`、`slotList`、`iconSprite`(sprite)、四个 `is*` 旗标、`projectileAnimationId`。仅存在内存，注册时由 `content/equipment.js` 重建（`initializeItemCatalog` 每次清空 `itemTypesById`/`itemTypesBySlot`，`content/equipment.js:6-9`）。
   - `isMeleeWeapon / isArmor / isMiscItem` 三旗标是 **write-only**，代码内无任何读者（注释见 `loot/items.js:55-58`）。
2. **实例 `Item`**（`loot/items.js:61-73`）：生成瞬间即定型的数值 + 名字。
3. **派生显示值**：`getItemStatLabel`、`getItemRarityLabel`、`getHighlightedItemName`、`formatAmount(zf)`、`formatAmount(itemValue)` 全为函数式派生，**不入库**。

`[重要]` 但 `itemName`（最终显示名）**不是派生值而是实例字段**，由 `formatItemName` 掷词后固化（`loot/items.js:181-201`）并写进存档 `itemName`。`getHighlightedItemName`（`loot/items.js:128-133`）在读取时才对 `itemName` 做子串高亮，找不到基底名时原样返回。

### 存档字段（`persistence/entities.js:48-72`）

```js
return {
  itemTypeId: b,
  itemSlot: c,
  characterClass: d,
  itemName: f,
  itemRarity: g,
  itemLevel: a.itemLevel,
  itemGold: a.itemGold,
  itemValue: a.itemValue,
  itemCharacteristic: a.characteristic,
  itemEffect: h ? {
    itemEffectType: h.itemEffectType,
    itemEffectAmount: h.itemEffectAmount,
    itemEffectDescription: h.itemEffectDescription,
    itemEffectName: h.itemEffectName
  } : null
};
```

- **全部数值都是"存下来的"而非"重算的"**：等级、稀有度、属性值、金币值、特效量逐字回读（`persistence/entities.js:73-92`）。加载不重掷任何随机数。
- 特效的 4 个字段（含描述字符串与动画名）也全部持久化。
- 恢复只依赖 `itemTypeId` 反查模板：`game.itemGenerator.itemTypesById[a.itemTypeId]`，查不到 → `console.log("failed to lookup item type")` 并返回 `null`，调用点跳过该件（`persistence/game-save.js:481,490`）。基底名或 PNG 任一处改名都会改变哈希（`loot/items.js:234-245`）而使旧档道具整体消失。
- 回读时的零值兜底会**改写 0**：`g ? g : 1`（等级 0→1）、`n ? n : 1`（`characteristic` 0→1）、`f ? f : 0`、`h/l ? : 0`（`persistence/entities.js:91`）。
- 角色侧另有 `characteristicsComponent` 保存六条 `StatComponent` 的 `itemValue/levelValue/spellBonusPercent/skillBonusPercent`（`persistence/entities.js:157-164`）。装备回算发生两次：先由 `equipItem` 求和（`persistence/game-save.js:491`），再由 `restoreStatComponent` 用存档值覆写（`persistence/game-save.js:522-527`）—— **存档值优先**。

---

## 8. `[疑似遗留怪癖]` 汇总

| # | 位置 | 现象 |
|---|---|---|
| 1 | `loot/items.js:278` + `content/balance.js:444-445` | "道具等级加成"升级把 +1 级概率由 85% 压到 68%（I-4） |
| 2 | `simulation/characters.js:298-325` | 金/卷轴/道具门为 `(v+1)/100`，文案为 `v%`；药剂门为 `v/100`（I-17） |
| 3 | `loot/items.js:169` | `itemGold` 在 `itemGoldModifier=1.2` 激活期可为小数，无取整（I-13） |
| 4 | `characters/movement.js:202-204` | `Equipment.Qk` 读不存在的 `item.statType` → `effectItem`/`So()` 恒 null → 武器元素特效贴图分支死代码（I-12） |
| 5 | `loot/inventory.js:56` vs `:79` | 背包排序/淘汰用 `itemGold`，替换门槛用 `itemValue`，口径不一致（I-23） |
| 6 | `loot/items.js:206-225` | `getClassStatMultiplier` 无 `default`，越界 `characteristic` → `NaN`（当前不可达）（I-11） |
| 7 | `characters/character.js:145-147`、`characters/movement.js:197-198` | 装备不校验槽位归属，可写"影子槽"（当前不可达）（I-22） |
| 8 | `loot/items.js:55-58` | `isMeleeWeapon/isArmor/isMiscItem` write-only |
| 9 | `content/balance.js:81-92` | `itemStatCurve` 与 `itemGoldCurve` 常量完全相同 |
| 10 | `combat/scrolls.js:309-313`（`simulation/characters.js`） | 卷轴池为空时会生成 `scroll: undefined` 的掉落，拾取即抛错（当前不可达） |
| 11 | `progression/upgrades.js:466` | `EquipBestItemUpgrade` 可购门槛写死为"件数 > 5"（构造参数 `equipmentUpgrades` 首项索引 5），与背包容量无关 |
