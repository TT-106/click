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
  this.mp = b;
  this.np = c;
  this.PD = d;
  this.gc = false;
  this.Zc = null;
  this.ph = 0;
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
  this.na = f;
  this.ma = g;
  this.la = h;
  this.isProjectileItem = l;
}
export function Item(a, b, c, d, f, g, h, l, n, p) {
  this.op = a;
  this.slot = b;
  this.characterClass = c;
  this.Ew = d;
  this.kA = g;
  this.ns = f;
  this.zf = h;
  this.itemValue = l;
  this.characteristic = n;
  this.Rm = p;
  this.nj = null;
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
      if (a.Rm) {
        switch (a.Rm.Dw) {
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
  switch (a.kA) {
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
      return "BUG FOUND: " + a.uf();
  }
}
export function getHighlightedItemName(a) {
  var b = a.op.baseName;
  a = a.Ew;
  var c = a.indexOf(b);
  return -1 === c ? a : a.substring(0, c) + '<span style="color:#FAF;">' + b + "</span>" + a.substring(c + b.length);
}
export function ItemGenerator() {
  this.OD = new ItemNameGenerator();
  this.ND = new ItemEffectGenerator();
  this.ps = {};
  this.os = {};
}
export function generateItem(a, b, c, d, f) {
  var g;
  if (!(g = a.ps[b])) {
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
      if (n = itemRarityTiers[l], n.Vp === f) {
        h = n;
        break a;
      }
    }
    h = itemRarityTiers[0];
  }
  var p = null;
  l = c.KD[b];
  var s = getClassStatMultiplier(c, l) * h.pp;
  n = randomizeScaledValue(d, itemStatCurve, s);
  s = randomizeScaledValue(d, itemGoldCurve, s) * itemGoldModifier.currentValue;
  if (1 === l && Math.random() < h.jp) {
    p = a.ND;
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
      a = a.$y;
      break;
    case 1:
      a = a.LE;
      break;
    case 2:
      a = a.lE;
      break;
    case 3:
      a = a.BD;
      break;
    case 4:
      a = a.UE;
      break;
    default:
      a = a.$y;
  }
  a = formatItemName(g.baseName, a);
  b = new Item(g, b, c.characterClass, a, d, f, s, n, l, p);
  b.nj = c;
  return b;
}
export function getClassStatMultiplier(a, b) {
  var c = a.classDefinition.Ma;
  if (!c) {
    return 1;
  }
  switch (b) {
    case 2:
      return c.Qf;
    case 1:
      return c.Xf;
    case 3:
      return c.Rf;
    case 4:
      return c.Zf;
    case 5:
      return c.Cf;
    case 6:
      return c.Ef;
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
  b = new ItemType(g, b.baseName, f, c, b.na, b.ma, b.la, b.isProjectile, b.projectileAnimationId);
  if (a.os[g]) {
    console.log("item type hash collision: " + d);
  }
  a.os[g] = b;
  for (g = 0; g < (/** @type {any} */ (f)).length; g++) {
    d = f[g];
    c = a.ps[d];
    if (!c) {
      c = [];
      a.ps[d] = c;
    }
    c.push(b);
  }
}
export function ItemDropRegistry() {
  this.yf = [];
}
export function clearItemDrops() {
  var a = game.itemDrops;
  if (0 < a.yf.length) {
    a.yf.length = 0;
  }
}
export function spawnItemDrop(a, b, c, d, f) {
  var g;
  g = game.itemGenerator;
  var h = game.state.adventurers[randomInt(game.state.adventurers.length)],
    l = h.slotList,
    l = l[randomInt(l.length)],
    n = g.uf((100 - globalUpgradeDefinitions.itemQualityChance.currentValue) / 100);
  f = randomizeItemLevel(f, (100 - globalUpgradeDefinitions.higherLevelItemChance.currentValue) / 100);
  if (g = generateItem(g, l, h, f, n)) {
    a.yf.push(new ItemDrop(g, b, c, d));
  }
}
export function removeItemDrop(a) {
  var b = game.itemDrops;
  a = b.yf.indexOf(a);
  if (-1 < a) {
    b.yf.splice(a, 1);
  }
}
export function initializeLootItems() {
  ItemDrop.prototype.getItem = function () {
    return this.item;
  };
  ItemDrop.prototype.oh = function (a) {
    this.gc = a;
  };
  ItemDrop.prototype.Re = function (a) {
    this.Zc = a;
  };
  ItemDrop.prototype.Ud = function () {
    return this.ph;
  };
  ItemDrop.prototype.Se = function (a) {
    this.ph = a;
  };
  FIRE_ITEM_EFFECT = 1;
  ICE_ITEM_EFFECT = 2;
  POISON_ITEM_EFFECT = 3;
  SHOCK_ITEM_EFFECT = 4;
  SONIC_ITEM_EFFECT = 5;
  ItemType.prototype.Uk = function () {
    return this.lA;
  };
  ItemType.prototype.sw = function () {
    return this.projectileAnimationId;
  };
  ItemType.prototype.Cw = function () {
    return this.isProjectileItem;
  };
  Item.prototype.Uk = function () {
    return this.op.Uk();
  };
  Item.prototype.sw = function () {
    return this.op.sw();
  };
  Item.prototype.uf = function () {
    return this.kA;
  };
  Item.prototype.Cw = function () {
    return this.op.Cw();
  };
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
  ItemDropRegistry.prototype.zl = function () {
    var a;
    for (a = 0; a < this.yf.length; a++) {
      this.yf[a].Re(null);
      this.yf[a].Se(0);
    }
  };
}
