// 背包模块的单元差分（R25 game 直连解耦切片）。
//
// 切片前：Inventory 构造器直读 game.state.victoryCount，addInventoryItem 直读
// game.inventories（仅取 sortInventory 的比较器），inventory.js 无法脱离引擎验证。
// 切片后：victoryCount 由构造方显式传入（仍在构造时急切求值），addInventoryItem
// 显式接收 InventoryRegistry，本文件**不启动引擎、不构造 game**。
//
// 覆盖五件事：
//   1) capacity = BASE + min(MAX, victoryCount)：0 奖励、普通奖励、超上限截断；
//   2) 未满追加：置 owner 背链与 dirty，并按注入注册表的 itemGold 降序比较器排序；
//   3) 满容量：新物品优于价值最低散件时替换（被换者背链断开），否则原样丢弃；
//   4) removeInventoryItemAt：断背链、置 dirty，-1 哨兵为无操作；
//   5) 注入遗漏（inventories 缺省）在背包第 2 件物品排序时抛错——绑定遗漏不可能静默通过。
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  initializeContentBalance,
  BASE_INVENTORY_CAPACITY,
  MAX_PRESTIGE_INVENTORY_BONUS,
} from '../../src/engine/modules/content/balance.js';
import {
  Inventory,
  InventoryRegistry,
  addInventoryItem,
  removeInventoryItemAt,
} from '../../src/engine/modules/loot/inventory.js';

// balance.js 的常量（BASE_INVENTORY_CAPACITY 等）由 initializeContentBalance 赋值；
// 依赖注入只在其尾部的升级类装配处用到，用空壳类补齐即可，背包路径不触碰它们。
initializeContentBalance(makeUpgradeDependencies());

function makeUpgradeDependencies() {
  class Fake {}
  return {
    LevelUpUpgrade: Fake,
    EquipBestItemUpgrade: Fake,
    EquipItemUpgrade: Fake,
    GlobalUpgrade: Fake,
    ScrollUpgrade: Fake,
    UnlockMonsterLevelUpgrade: Fake,
    RetireMonsterLevelUpgrade: Fake,
    PurchaseCastleUpgrade: Fake,
    PurchaseItemUpgrade: Fake,
    ClaimAchievementUpgrade: Fake,
    AutoPurchaseDungeonUpgrade: Fake,
    CollectFarmUpgrade: Fake,
    UpgradeCollection: Fake,
    scrollDefinitions: [],
  };
}

function makeItem(itemGold, itemValue) {
  return {
    itemGold,
    itemValue: itemValue === undefined ? itemGold : itemValue,
    slot: 1,
    characterClass: 0,
    inventory: null,
  };
}

function makeBackpack(victoryCount, capacityOwner) {
  const registry = new InventoryRegistry();
  const pack = new Inventory(victoryCount);
  pack.owner = capacityOwner;
  return { registry, pack };
}

test('capacity = BASE + min(MAX, victoryCount)：0、普通、超上限截断', () => {
  assert.equal(new Inventory(0).capacity, BASE_INVENTORY_CAPACITY);
  assert.equal(new Inventory(3).capacity, BASE_INVENTORY_CAPACITY + 3);
  assert.equal(new Inventory(999).capacity, BASE_INVENTORY_CAPACITY + MAX_PRESTIGE_INVENTORY_BONUS);
  assert.equal(typeof BASE_INVENTORY_CAPACITY, 'number');
  assert.equal(typeof MAX_PRESTIGE_INVENTORY_BONUS, 'number');
});

test('未满追加：置 owner 背链与 dirty，按注入注册表的 itemGold 降序排序', () => {
  const owner = { marker: 'owner' };
  const { registry, pack } = makeBackpack(2, owner);
  addInventoryItem(pack, makeItem(10), registry);
  addInventoryItem(pack, makeItem(30), registry);
  addInventoryItem(pack, makeItem(20), registry);
  assert.deepEqual(pack.items.map((item) => item.itemGold), [30, 20, 10]);
  assert.ok(pack.items.every((item) => item.inventory === owner));
  assert.equal(pack.dirty, true);
});

test('满容量：新物品优于价值最低者时替换（被换者断背链），否则丢弃', () => {
  const owner = { marker: 'owner' };
  const { registry, pack } = makeBackpack(0, owner); // victoryCount=0 → capacity=BASE（最小档）
  assert.equal(pack.capacity, BASE_INVENTORY_CAPACITY);
  for (let gold = 1; gold <= BASE_INVENTORY_CAPACITY; gold++) {
    addInventoryItem(pack, makeItem(gold * 10), registry);
  }
  const descending = Array.from({ length: BASE_INVENTORY_CAPACITY }, (_, index) => (BASE_INVENTORY_CAPACITY - index) * 10);
  assert.deepEqual(pack.items.map((item) => item.itemGold), descending);
  const worst = pack.items[pack.items.length - 1];
  assert.equal(worst.itemGold, 10);
  pack.dirty = false;
  addInventoryItem(pack, makeItem(15), registry); // 优于最低者 10 → 替换
  assert.equal(pack.items.length, BASE_INVENTORY_CAPACITY);
  assert.equal(worst.inventory, null);
  assert.equal(pack.dirty, true);
  assert.equal(pack.items.some((item) => item.itemGold === 15), true);
  assert.equal(pack.items.some((item) => item.itemGold === 10), false);
  pack.dirty = false;
  const junk = makeItem(1);
  addInventoryItem(pack, junk, registry); // 不优于最低者 15 → 丢弃
  assert.equal(pack.items.length, BASE_INVENTORY_CAPACITY);
  assert.equal(junk.inventory, null);
  assert.equal(pack.dirty, false);
});

test('removeInventoryItemAt：断背链并置 dirty；-1 哨兵为无操作', () => {
  const pack = new Inventory(0);
  const item = makeItem(10);
  pack.items.push(item);
  removeInventoryItemAt(pack, 0);
  assert.equal(item.inventory, null);
  assert.equal(pack.items.length, 0);
  assert.equal(pack.dirty, true);
  pack.dirty = false;
  removeInventoryItemAt(pack, -1);
  assert.equal(pack.dirty, false);
});

test('注入遗漏：inventories 缺省时第 2 件物品排序抛错，不可能静默通过', () => {
  const pack = new Inventory(5);
  pack.owner = {};
  addInventoryItem(pack, makeItem(10));
  assert.throws(() => addInventoryItem(pack, makeItem(20)), /compareByItemGold/);
});
