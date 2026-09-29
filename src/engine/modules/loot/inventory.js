/** 背包容量、排序、替换及装备所有权。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 * 不依赖全局 game 实例：容量奖励的 victoryCount 由构造方显式传入（仍在构造时求值），
 * addInventoryItem 显式接收 InventoryRegistry（sortInventory 比较器来源）。
 */
import { BASE_INVENTORY_CAPACITY, MAX_PRESTIGE_INVENTORY_BONUS } from "../content/balance.js";
import { isBetterItem } from "./items.js";
export function Inventory(victoryCount) {
  this.items = [];
  this.capacity = BASE_INVENTORY_CAPACITY + Math.min(MAX_PRESTIGE_INVENTORY_BONUS, victoryCount);
  this.owner = null;
  this.dirty = false;
}
export function addInventoryItem(a, b, inventories) {
  if (a.items.length < a.capacity) {
    b.inventory = a.owner;
    a.items.push(b);
    a.dirty = true;
    sortInventory(inventories, a.items);
  } else {
    var c,
      d = -1,
      f = 0,
      g;
    for (c = 0; c < a.items.length; c++) {
      g = a.items[c];
      if (0 > d) {
        d = 0;
        f = g.itemGold;
      } else {
        if (f > g.itemGold) {
          d = c;
          f = g.itemGold;
        }
      }
    }
    c = d;
    if (-1 < c && isBetterItem(b, a.items[c])) {
      removeInventoryItemAt(a, c);
      b.inventory = a.owner;
      a.items.push(b);
      a.dirty = true;
      sortInventory(inventories, a.items);
    }
  }
}
export function removeInventoryItemAt(a, b) {
  if (-1 !== b) {
    a.items[b].inventory = null;
    a.items.splice(b, 1);
    a.dirty = true;
  }
}
export function InventoryRegistry() {
  this.list = [];
  this.compareByItemGold = function (a, b) {
    return b.itemGold - a.itemGold;
  };
}
export function sortInventory(a, b) {
  if (!(!b || 2 > b.length)) {
    b.sort(a.compareByItemGold);
  }
}
export function initializeLootInventory() {
  Inventory.prototype.removeItem = function (a) {
    removeInventoryItemAt(this, this.items.indexOf(a));
  };
  InventoryRegistry.prototype.equipBestForCharacter = function (a) {
    var b = a.inventory.items;
    if (b && 0 !== b.length) {
      var c,
        d,
        f = [];
      for (c = 0; c < b.length; c++) {
        f.push(b[c]);
      }
      for (c = 0; c < f.length; c++) {
        b = f[c];
        if (!((d = a.getSlotItem(b.slot)) && !isBetterItem(b, d))) {
          a.equipItem(b);
        }
      }
    }
  };
  InventoryRegistry.prototype.hasImprovement = function (a) {
    var b = a.inventory.items;
    if (!b || 0 === b.length) {
      return false;
    }
    var c, d, f;
    for (c = 0; c < b.length; c++) {
      if (d = b[c], f = a.getSlotItem(d.slot), !f || isBetterItem(d, f)) {
        return true;
      }
    }
    return false;
  };
}
