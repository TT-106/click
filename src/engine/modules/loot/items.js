/** 装备模板、数值、稀有度与掉落生成。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { game } from "../runtime/game.js";
import { ItemNameGenerator, formatItemName } from "./item-names.js";
import { floorNumber, formatAmount, randomInt, randomizeScaledValue } from "../core/math.js";
import { BASE_HIGHER_ITEM_CHANCE, LOWER_ITEM_LEVEL_CHANCE, globalUpgradeDefinitions, itemGoldCurve, itemGoldModifier, itemRarityProbabilities, itemRarityTiers, itemStatCurve } from "../content/balance.js";
export var FIRE_ITEM_EFFECT, ICE_ITEM_EFFECT, POISON_ITEM_EFFECT, SHOCK_ITEM_EFFECT, SONIC_ITEM_EFFECT;
export function ItemDrop(a, b, c, d) {
  this.item = a;
  this.levelPositionX = b;
  this.levelPositionY = c;
  this.room = d;
  this.collected = false;
  this.claimedBy = null;
  this.claimDistance = 0;
}
export function ItemEffect(a, b, c, d) {
  this.Dw = a;
  this.LD = b;
  this.MD = c;
  this.ms = d;
}
export function ItemEffectGenerator() {
  this.xm = [];
  this.xm[FIRE_ITEM_EFFECT] = {
    description: "Fire Damage",
    weaponEffectAnimationName: "Red Damage"
  };
  this.xm[ICE_ITEM_EFFECT] = {
    description: "Ice Damage",
    weaponEffectAnimationName: "White Damage"
  };
  this.xm[POISON_ITEM_EFFECT] = {
    description: "Poison Damage",
    weaponEffectAnimationName: "Green Damage"
  };
  this.xm[SHOCK_ITEM_EFFECT] = {
    description: "Shock Damage",
    weaponEffectAnimationName: "Electric Damage"
  };
  this.xm[SONIC_ITEM_EFFECT] = {
    description: "Sonic Damage",
    weaponEffectAnimationName: "Sonic Damage"
  };
}
export function ItemType(a, b, c, d, f, g, h, l, n) {
  this.RD = a;
  this.baseName = b;
  this.slotList = c;
  this.projectileAnimationId = n;
  if (!(this.lA = game.itemSprites.getSprite(d))) {
    console.log("error. invalid item sprite: " + d);
  }
  // write-only 分类旗标（原 na/ma/la；双端零读者，语义由数据模式推断：近战/护甲/杂项）
  this.isMeleeWeapon = f;
  this.isArmor = g;
  this.isMiscItem = h;
  this.isProjectileItem = l;
}
export function Item(a, b, c, d, f, g, h, l, n, p) {
  this.itemType = a;
  this.slot = b;
  this.characterClass = c;
  this.itemName = d;
  this.itemRarity = g;
  this.itemLevel = f;
  this.itemGold = h;
  this.itemValue = l;
  this.characteristic = n;
  this.itemEffect = p;
  this.inventory = null;
}
export function isBetterItem(a, b) {
  return !b || a.itemValue > b.itemValue;
}
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
      if (a.itemEffect) {
        switch (a.itemEffect.Dw) {
          case FIRE_ITEM_EFFECT:
            return "火焰伤害";
          case ICE_ITEM_EFFECT:
            return "冰霜伤害";
          case POISON_ITEM_EFFECT:
            return "毒药伤害";
          case SHOCK_ITEM_EFFECT:
            return "休克伤害";
          case SONIC_ITEM_EFFECT:
            return "音波伤害";
          default:
            return "伤害";
        }
      } else {
        return "伤害";
      }
    default:
      return "Error";
  }
}
export function getItemRarityLabel(a) {
  switch (a.itemRarity) {
    case 0:
      return "普通";
    case 1:
      return "罕见";
    case 2:
      return "稀有";
    case 3:
      return "历史";
    case 4:
      return "远古";
    default:
      return "BUG FOUND: " + a.getRarity();
  }
}
export function getHighlightedItemName(a) {
  var b = a.itemType.baseName;
  a = a.itemName;
  var c = a.indexOf(b);
  return -1 === c ? a : a.substring(0, c) + '<span style="color:#FAF;">' + b + "</span>" + a.substring(c + b.length);
}
export function ItemGenerator() {
  this.OD = new ItemNameGenerator();
  this.itemEffectGenerator = new ItemEffectGenerator();
  this.itemTypesBySlot = {};
  this.itemTypesById = {};
}
export function generateItem(a, b, c, d, f) {
  var g;
  if (!(g = a.itemTypesBySlot[b])) {
    console.log("ItemGenerator.getRandomItemType() failed to find item types for slot: " + b);
  }
  if (0 === g.length) {
    console.log("ItemGenerator.getRandomItemType() no item types for slot: " + b);
    g = null;
  } else {
    g = g[randomInt(g.length)];
  }
  if (!g) {
    return null;
  }
  var h;
  a: {
    var l, n;
    for (l = 0; l < itemRarityTiers.length; l++) {
      if (n = itemRarityTiers[l], n.tierId === f) {
        h = n;
        break a;
      }
    }
    h = itemRarityTiers[0];
  }
  var p = null;
  l = c.slotStatTypes[b];
  var s = getClassStatMultiplier(c, l) * h.statMultiplier;
  n = randomizeScaledValue(d, itemStatCurve, s);
  s = randomizeScaledValue(d, itemGoldCurve, s) * itemGoldModifier.currentValue;
  if (1 === l && Math.random() < h.elementalEffectChance) {
    p = a.itemEffectGenerator;
    h = Math.random();
    h = 0.2 > h ? FIRE_ITEM_EFFECT : 0.4 > h ? ICE_ITEM_EFFECT : 0.6 > h ? SHOCK_ITEM_EFFECT : 0.7 > h ? SONIC_ITEM_EFFECT : POISON_ITEM_EFFECT;
    var u = floorNumber(Math.max(0.1 * n, 0.4 * n * Math.random()));
    if (1 > u) {
      u = 1;
    }
    p = p.xm[h];
    p = new ItemEffect(h, u, "+" + formatAmount(u) + " " + p.description, p.weaponEffectAnimationName);
  }
  a = a.OD;
  switch (f) {
    case 0:
      a = a.commonNames;
      break;
    case 1:
      a = a.uncommonNames;
      break;
    case 2:
      a = a.rareNames;
      break;
    case 3:
      a = a.historicNames;
      break;
    case 4:
      a = a.ancientNames;
      break;
    default:
      a = a.commonNames;
  }
  a = formatItemName(g.baseName, a);
  b = new Item(g, b, c.characterClass, a, d, f, s, n, l, p);
  b.inventory = c;
  return b;
}
export function getClassStatMultiplier(a, b) {
  var c = a.classDefinition.statMultipliers;
  if (!c) {
    return 1;
  }
  switch (b) {
    case 2:
      return c.armorMultiplier;
    case 1:
      return c.damageMultiplier;
    case 3:
      return c.attackRatingMultiplier;
    case 4:
      return c.defenceRatingMultiplier;
    case 5:
      return c.maxHealthMultiplier;
    case 6:
      return c.maxSpiritMultiplier;
  }
}
export function randomizeItemLevel(a, b) {
  if (Math.random() < LOWER_ITEM_LEVEL_CHANCE) {
    return Math.max(1, a - 1);
  }
  var c = Math.min(1, BASE_HIGHER_ITEM_CHANCE + b);
  return Math.random() < c ? a + 1 : a;
}
export function registerItemType(a, b, c) {
  var d = b.baseName + c;
  var f = 0,
    g,
    h;
  if (0 !== d.length) {
    for (g = 0; g < d.length; g++) {
      h = d.charCodeAt(g);
      f = (f << 5) - f + h;
      f |= 0;
    }
  }
  g = f + "";
  f = b.slotList;
  b = new ItemType(g, b.baseName, f, c, b.isMeleeWeapon, b.isArmor, b.isMiscItem, b.isProjectile, b.projectileAnimationId);
  if (a.itemTypesById[g]) {
    console.log("item type hash collision: " + d);
  }
  a.itemTypesById[g] = b;
  for (g = 0; g < (/** @type {any} */ (f)).length; g++) {
    d = f[g];
    c = a.itemTypesBySlot[d];
    if (!c) {
      c = [];
      a.itemTypesBySlot[d] = c;
    }
    c.push(b);
  }
}
export function ItemDropRegistry() {
  this.drops = [];
}
export function clearItemDrops() {
  var a = game.itemDrops;
  if (0 < a.drops.length) {
    a.drops.length = 0;
  }
}
export function spawnItemDrop(a, b, c, d, f) {
  var g;
  g = game.itemGenerator;
  var h = game.state.adventurers[randomInt(game.state.adventurers.length)],
    l = h.slotList,
    l = l[randomInt(l.length)],
    n = g.rollRarity((100 - globalUpgradeDefinitions.itemQualityChance.currentValue) / 100);
  f = randomizeItemLevel(f, (100 - globalUpgradeDefinitions.higherLevelItemChance.currentValue) / 100);
  if (g = generateItem(g, l, h, f, n)) {
    a.drops.push(new ItemDrop(g, b, c, d));
  }
}
export function removeItemDrop(a) {
  var b = game.itemDrops;
  a = b.drops.indexOf(a);
  if (-1 < a) {
    b.drops.splice(a, 1);
  }
}
export function initializeLootItems() {
  ItemDrop.prototype.getItem = function () {
    return this.item;
  };
  ItemDrop.prototype.setCollected = function (a) {
    this.collected = a;
  };
  ItemDrop.prototype.setClaimedBy = function (a) {
    this.claimedBy = a;
  };
  ItemDrop.prototype.getClaimDistance = function () {
    return this.claimDistance;
  };
  ItemDrop.prototype.setClaimDistance = function (a) {
    this.claimDistance = a;
  };
  FIRE_ITEM_EFFECT = 1;
  ICE_ITEM_EFFECT = 2;
  POISON_ITEM_EFFECT = 3;
  SHOCK_ITEM_EFFECT = 4;
  SONIC_ITEM_EFFECT = 5;
  ItemType.prototype.getIconSprite = function () {
    return this.lA;
  };
  ItemType.prototype.sw = function () {
    return this.projectileAnimationId;
  };
  ItemType.prototype.Cw = function () {
    return this.isProjectileItem;
  };
  Item.prototype.getIconSprite = function () {
    return this.itemType.getIconSprite();
  };
  Item.prototype.sw = function () {
    return this.itemType.sw();
  };
  Item.prototype.getRarity = function () {
    return this.itemRarity;
  };
  Item.prototype.Cw = function () {
    return this.itemType.Cw();
  };
  ItemGenerator.prototype.rollRarity = function (a) {
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
  ItemDropRegistry.prototype.releaseClaims = function () {
    var a;
    for (a = 0; a < this.drops.length; a++) {
      this.drops[a].setClaimedBy(null);
      this.drops[a].setClaimDistance(0);
    }
  };
}
