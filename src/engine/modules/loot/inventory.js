/** 背包容量、排序、替换及装备所有权。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { BASE_INVENTORY_CAPACITY, MAX_PRESTIGE_INVENTORY_BONUS } from "../content/balance.js";
import { game } from "../runtime/game.js";
import { isBetterItem } from "./items.js";
export function Inventory() {
  this.items = [];
  this.vp = BASE_INVENTORY_CAPACITY + Math.min(MAX_PRESTIGE_INVENTORY_BONUS, game.state.victoryCount);
  this.Bw = null;
  this.ip = false;
}
export function addInventoryItem(a, b) {
  if (a.items.length < a.vp) {
    b.nj = a.Bw;
    a.items.push(b);
    a.ip = true;
    sortInventory(game.inventories, a.items);
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
      b.nj = a.Bw;
      a.items.push(b);
      a.ip = true;
      sortInventory(game.inventories, a.items);
    }
  }
}
export function removeInventoryItemAt(a, b) {
  if (-1 !== b) {
    a.items[b].nj = null;
    a.items.splice(b, 1);
    a.ip = true;
  }
}
export function InventoryRegistry() {
  this.Fj = [];
  this.IE = function (a, b) {
    return b.itemGold - a.itemGold;
  };
}
export function sortInventory(a, b) {
  if (!(!b || 2 > b.length)) {
    b.sort(a.IE);
  }
}
export function initializeLootInventory() {
  Inventory.prototype.removeItem = function (a) {
    removeInventoryItemAt(this, this.items.indexOf(a));
  };
  InventoryRegistry.prototype.Br = function (a) {
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
        if (!((d = a.ef(b.slot)) && !isBetterItem(b, d))) {
          a.Qk(b);
        }
      }
    }
  };
  InventoryRegistry.prototype.Wt = function (a) {
    var b = a.inventory.items;
    if (!b || 0 === b.length) {
      return false;
    }
    var c, d, f;
    for (c = 0; c < b.length; c++) {
      if (d = b[c], f = a.ef(d.slot), !f || isBetterItem(d, f)) {
        return true;
      }
    }
    return false;
  };
}
