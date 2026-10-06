# 经典道具生成与装备公式

本页描述经典Item/Inventory，不是原野七材料背包或60物品准备草案。旧I-1至I-23的推导、概率表、消费顺序取证完整保留在 [历史稿](../history/formulas-items-before-governance.md)；其旧字段名与缺陷状态不作当前接口。

## 模板、实例和保存

`loot/items.js` 的ItemType是模板，Item是实例；固定存档键由 `persistence/entities.js` 适配，不因运行时重命名改变。

| 当前字段 | 含义 |
|---|---|
| itemType、slot、characterClass | 模板、装备槽、职业资格 |
| itemName、itemRarity、itemLevel | 派生名称、稀有度0–4、等级 |
| itemGold、itemValue | 金币价值、主要属性量；不以金币判断优劣 |
| characteristic | 1伤害、2护甲、3攻击等级、4防御等级、5生命、6精神；由职业slotStatTypes决定 |
| itemEffect | 元素效果，可能null |
| inventory | 实际持有者Character引用，非背包容器；保存使用适配层 |

稀有度从高向低累减概率阈值，Math.random()*chanceScale取点；不是先按总权重重新归一化。当前概率表为普通0.8、不常见0.16、稀有0.036、历史0.0036、古老0.0004；普通品质chanceScale=(100-itemQualityChance)/100，宝箱另有15品质加成。正常chanceScale≥0.55时高四档总概率为0.2/chanceScale，普通档为1-0.2/chanceScale；异常输入不套此推导。

`src/engine/modules/loot/items.js:331-343`

```js
  ItemGenerator.prototype.rollRarity = function (chanceScale) {
    const probabilities = this.rules.itemRarityProbabilities;
    let threshold = 0;
    let roll = Math.random() * chanceScale;
    for (let rarityIndex = probabilities.length - 1; 0 <= rarityIndex; rarityIndex--) {
      threshold = probabilities[rarityIndex];
      if (roll < threshold) {
        return rarityIndex;
      }
      roll -= threshold;
    }
    return 0;
  };
```

## 等级、数值和元素

F为经典floorNumber，S(L,C,m)=F(m*(C.base+C.coefficient*z^C.power*C.growth^z))，z=max(0,L-1)，详见 [成长公式](progression.md)。

| 量 | 当前规则 | 定位 |
|---|---|---|
| 等级 | 先以0.15概率减1（最低1），否则独立掷点以min(1,0.1+调用方bonus)概率加1 | `loot/items.js` / `randomizeItemLevel` |
| 属性量 | F(S(itemLevel,itemStatCurve,m)*(1.1-0.2*Math.random())) | `core/math.js` / `randomizeScaledValue` |
| 金币值 | 独立随机化itemGoldCurve后乘itemGoldModifier.currentValue；乘完不再取整 | `loot/items.js` / `generateItem` |
| 倍率m | 职业属性系数*rarityTier.statMultiplier；属性/金币共用倍率但独立掷抖动 | 同函数 / `getClassStatMultiplier` |
| 元素出现 | characteristic===1时才消耗概率随机，阈值rarityTier.elementalEffectChance | 同函数 |
| 元素类型 | 火20%、冰20%、休克20%、音波10%、毒30%（阈值链按此顺序） | 同函数 |
| 元素量 | max(1,F(max(0.1*itemValue,0.4*itemValue*U))) | 同函数，U是此处独立随机值 |

两条item曲线当前均为power1.8/coefficient15/growth1.015/base15，具体稀有度倍率以 `content/balance.js` 的itemRarityTiers为准，不复制第二份目录。模板按slot池数组下标取样，命名再消费随机；不能改注册顺序或以“概率等价”换随机调用次序。

`src/engine/modules/loot/items.js:167-182`

```js
  let itemEffect = null;
  const characteristic = inventory.slotStatTypes[slot];
  const statMultiplier = getClassStatMultiplier(inventory, characteristic) * rarityTier.statMultiplier;
  const itemValue = randomizeScaledValue(itemLevel, rules.itemStatCurve, statMultiplier);
  const itemGold = randomizeScaledValue(itemLevel, rules.itemGoldCurve, statMultiplier) * rules.itemGoldModifier.currentValue;
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

## 掉落、拾取和出售

| 路径 | 当前规则/源码 |
|---|---|
| 普通敌人 | `simulation/characters.js` / `CharacterLifecycle.clearEncounter`：金币/卷轴/道具为randomInt(100)≤配置值，药水为100*Math.random()≤配置值；不是同一套端点 |
| 首领 | `combat/actions.js` / `resolveCharacterDefeat`：金10+randomInt(10)、物7+randomInt(8)、卷2+randomInt(5)、药randomInt(2)；金/物计数可被双倍药水翻倍，药另受库存容量门 |
| 金币数量 | `content/balance.js` / `rollGoldDrop`：(minGold+randomInt(max(0,maxGold-minGold)))*doubleGoldModifier，max端点不包含 |
| 宝箱/架/书 | `characters/character.js` 的开箱分支；kind区分内容，宝箱按随机冒险者等级和加成生成道具 |
| 掉落生成/归属 | `loot/items.js` / `spawnItemDrop`；`addInventoryItem`最终设置实际owner，不能把模板职业当永久主人 |
| 卷轴池 | 已解锁卷轴，`combat/scrolls.js`；休克开局解锁。卷轴拾取数量夹到30+scrollCapacityBonus |
| 药水容量 | BASE_POTION_CAPACITY(6)+potionCapacityBonus；`combat/potions.js` |
| 商店出售 | `characters/character.js`：F(被卖件itemGold*(0.1+equipmentQualityBonus)的总和)，先进入game.shops.collectedGold，收集升级才转入队伍金币 |

## 装备与“更好”

`isBetterItem(candidate,currentItem)` 只比较itemValue严格更大或槽位为空；金币/元素/稀有度不另加权。`characters/character.js` 的equipItem校验职业并重算六属性，替换件回背包，当前生命/精神夹到新上限。`loot/inventory.js` 的equipBestForCharacter遍历单人背包快照，`simulation/tick.js`另维护dirty驱动的全局可装备候选list，二者不是一份容器。

`characters/movement.js` 的Equipment.equipItem更新slotItems、投射武器和effectItem；当前已按characteristic===1选择主手效果。旧statType读取导致“消费链永远不执行”的诊断已过期，详见 [战斗说明](combat.md)。槽位是否属于slotList仍依赖生成/调用契约，不据此宣称非法存档输入全面验证。

Inventory.capacity构造时为20+min(10,victoryCount)；既有实例不会随胜场自动扩容，继续路径保留实例。原野用姓名识别背包的另一个问题见 [原野背包](../EXPEDITION-INVENTORY.md)，勿混为经典契约。

行为覆盖和未闭合路径统一引用 [经典验收矩阵](../../REFACTOR_REPORT.md)、[U7入口映射](../u7-upgrade-usage.md)。
