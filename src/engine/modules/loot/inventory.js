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
export function addInventoryItem(inventory, item, inventories) {
  if (inventory.items.length < inventory.capacity) {
    item.inventory = inventory.owner;
    inventory.items.push(item);
    inventory.dirty = true;
    sortInventory(inventories, inventory.items);
  } else {
    var itemCursor,
      lowestGoldIndex = -1,
      lowestGold = 0,
      currentItem;
    for (itemCursor = 0; itemCursor < inventory.items.length; itemCursor++) {
      currentItem = inventory.items[itemCursor];
      if (0 > lowestGoldIndex) {
        lowestGoldIndex = 0;
        lowestGold = currentItem.itemGold;
      } else {
        if (lowestGold > currentItem.itemGold) {
          lowestGoldIndex = itemCursor;
          lowestGold = currentItem.itemGold;
        }
      }
    }
    var replaceIndex = lowestGoldIndex;
    if (-1 < replaceIndex && isBetterItem(item, inventory.items[replaceIndex])) {
      removeInventoryItemAt(inventory, replaceIndex);
      item.inventory = inventory.owner;
      inventory.items.push(item);
      inventory.dirty = true;
      sortInventory(inventories, inventory.items);
    }
  }
}
export function removeInventoryItemAt(inventory, itemIndex) {
  if (-1 !== itemIndex) {
    inventory.items[itemIndex].inventory = null;
    inventory.items.splice(itemIndex, 1);
    inventory.dirty = true;
  }
}
export function InventoryRegistry() {
  this.list = [];
  this.compareByItemGold = function (leftItem, rightItem) {
    return rightItem.itemGold - leftItem.itemGold;
  };
}
export function sortInventory(inventories, items) {
  if (!(!items || 2 > items.length)) {
    items.sort(inventories.compareByItemGold);
  }
}
export function initializeLootInventory() {
  Inventory.prototype.removeItem = function (item) {
    removeInventoryItemAt(this, this.items.indexOf(item));
  };
  InventoryRegistry.prototype.equipBestForCharacter = function (character) {
    var inventoryItems = character.inventory.items;
    if (inventoryItems && 0 !== inventoryItems.length) {
      var itemIndex,
        equippedItem,
        copiedItems = [];
      for (itemIndex = 0; itemIndex < inventoryItems.length; itemIndex++) {
        copiedItems.push(inventoryItems[itemIndex]);
      }
      for (itemIndex = 0; itemIndex < copiedItems.length; itemIndex++) {
        var item = copiedItems[itemIndex];
        if (!((equippedItem = character.getSlotItem(item.slot)) && !isBetterItem(item, equippedItem))) {
          character.equipItem(item);
        }
      }
    }
  };
  InventoryRegistry.prototype.hasImprovement = function (character) {
    var inventoryItems = character.inventory.items;
    if (!inventoryItems || 0 === inventoryItems.length) {
      return false;
    }
    var itemIndex, item, equippedItem;
    for (itemIndex = 0; itemIndex < inventoryItems.length; itemIndex++) {
      if (item = inventoryItems[itemIndex], equippedItem = character.getSlotItem(item.slot), !equippedItem || isBetterItem(item, equippedItem)) {
        return true;
      }
    }
    return false;
  };
}
