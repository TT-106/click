/** 角色、装备、怪物与统计序列化。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { Item, ItemEffect } from "../loot/items.js";
import { game } from "../runtime/game.js";
import { MonsterType, advanceMonsterTypeRank } from "../combat/encounters.js";
export function serializeItem(a) {
  var b = a.itemType.RD,
    c = a.slot,
    d = a.characterClass,
    f = a.itemName,
    g = a.getRarity(),
    h = a.itemEffect;
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
      itemEffectType: h.Dw,
      itemEffectAmount: h.LD,
      itemEffectDescription: h.MD,
      itemEffectName: h.ms
    } : null
  };
}
export function restoreItem(a) {
  var b = a.itemSlot,
    c = a.characterClass,
    d = a.itemName,
    f = a.itemRarity,
    g = a.itemLevel,
    h = a.itemGold,
    l = a.itemValue,
    n = a.itemCharacteristic,
    p;
  if (p = a.itemEffect) {
    var s = p.itemEffectType,
      u = p.itemEffectDescription;
    p = s && u ? new ItemEffect(s, p.itemEffectAmount, u, p.itemEffectName) : null;
  } else {
    p = null;
  }
  a = game.itemGenerator.os[a.itemTypeId];
  return a ? new Item(a, b, c, d ? d : "Error", g ? g : 1, f ? f : 0, h ? h : 0, l ? l : 0, n ? n : 1, p) : (console.log("failed to lookup item type"), null);
}
export function serializeCharacter(a) {
  var b = a.adventurerName,
    c = a.characterClass,
    d = a.characterType,
    f = a.getSprite().getName(),
    g;
  g = a.stats;
  g = {
    characterLevel: g.characterLevel,
    characterHealth: g.health,
    characterSpirit: g.spirit,
    kills: g.kills,
    damageComponent: serializeStatComponent(g.damage),
    armorComponent: serializeStatComponent(g.armor),
    attackRatingComponent: serializeStatComponent(g.attackRating),
    defenceRatingComponent: serializeStatComponent(g.defenceRating),
    maxHealthComponent: serializeStatComponent(g.maxHealth),
    maxSpiritComponent: serializeStatComponent(g.maxSpirit),
    stunCount: g.stunCount,
    minionKills: g.minionKills,
    damageGiven: g.damageGiven,
    damageReceived: g.damageReceived
  };
  var h;
  h = a.position;
  var l = h.room,
    n = h.currentHallway;
  h = {
    levelX: h.getLevelPositionX(),
    levelY: h.getLevelPositionY(),
    worldX: h.getWorldPositionX(),
    worldY: h.getWorldPositionY(),
    roomId: l ? l.roomId : -1,
    floorPositionIndex: h.fg,
    hallwayId: n ? n.hallwayId : -1
  };
  var n = a.spells,
    l = /** @type {any} */ ([]),
    p;
  if (n) {
    for (p = 0; p < n.length; p++) {
      l.push({
        spellName: n[p].name
      });
    }
  }
  p = a.inventory;
  n = [];
  if (p) {
    p = p.items;
    var s;
    for (s = 0; s < p.length; s++) {
      n.push(serializeItem(p[s]));
    }
  }
  p = a.slotList;
  s = a.equipment;
  var u = [];
  if (s && p) {
    var y, A;
    for (A = 0; A < p.length; A++) {
      if (y = s.getSlotItem(p[A])) {
        u.push(serializeItem(y));
      }
    }
  } else {
    console.log("failed to generate equipped item state array");
  }
  return {
    adventurerName: b,
    characterClass: c,
    characterType: d,
    spriteName: f,
    characteristicsComponent: g,
    positionComponent: h,
    spells: l,
    inventory: n,
    equippedItemCollection: u,
    skillPoints: a.skillPoints,
    initialSpellSkillPoint: a.initialSpellSkillPoint,
    upgrades1: serializeUpgradeFlags(a.skillTree1.upgrades),
    upgrades2: serializeUpgradeFlags(a.skillTree2.upgrades),
    upgrades3: serializeUpgradeFlags(a.skillTree3.upgrades),
    upgrades4: serializeUpgradeFlags(a.skillTree4.upgrades)
  };
}
export function serializeUpgradeFlags(a) {
  var b = {},
    c,
    d;
  for (d = 0; d < a.length; d++) {
    c = a[d];
    b[c.Jr().id] = c.isOwned();
  }
  return b;
}
export function restoreUpgradeFlags(a, b) {
  var c, d, f;
  for (c = 0; c < a.length; c++) {
    f = a[c];
    d = a[c].Jr();
    d = b[d.id];
    f.ft(d);
  }
}
export function serializeStatComponent(a) {
  return a ? {
    itemValue: a.itemValue,
    levelValue: a.levelValue,
    spellBonusPercent: a.spellBonusPercent,
    skillBonusPercent: a.skillBonusPercent
  } : null;
}
export function restoreStatComponent(a, b) {
  if (a && b) {
    var c = b.itemValue,
      d = b.levelValue,
      f = b.spellBonusPercent,
      g = b.skillBonusPercent;
    a.itemValue = c ? c : 0;
    a.levelValue = d ? d : 0;
    a.spellBonusPercent = f ? f : 0;
    a.skillBonusPercent = g ? g : 0;
  }
}
export function MonsterSaveAdapter() {}
export function serializeMonsterLevel(a, b) {
  var c = [],
    d;
  for (d = 0; d < b.length; d++) {
    c.push(serializeMonsterType(b[d]));
  }
  return {
    level: a,
    monsterTypes: c
  };
}
export function serializeMonsterType(a) {
  return {
    name: a.Vk(),
    sprite: a.ll.getName(),
    kills: a.xq
  };
}
export function restoreMonsterType(a, b) {
  var c = a.kills,
    d = new MonsterType(a.name, a.sprite, b),
    c = c ? c : 0;
  d.xq = 0;
  d.ml = 0;
  d.Sj = 0;
  d.Ep = 0;
  d.Gp = 0;
  d.Fp = 0;
  d.Hp = 0;
  d.No = 0;
  d.$o = 0;
  d.ek = 0;
  advanceMonsterTypeRank(d);
  for (d.xq = c; c > d.ek;) {
    c -= d.ek;
    advanceMonsterTypeRank(d);
  }
  d.ml = c;
  return d;
}
export function StatisticsSaveAdapter() {}
export function serializeStatistics(a) {
  return {
    playedMillis: a.playedMillis,
    turnCount: a.turnCount,
    doorsOpened: a.doorsOpened,
    roomsCleared: a.roomsCleared,
    levelsCleared: a.levelsCleared,
    dungeonsCleared: a.dungeonsCleared,
    castlesConquered: a.castlesConquered,
    farmsPurchased: a.farmsPurchased,
    totalGoldFromMonsters: a.totalGoldFromMonsters,
    totalGoldFromItems: a.totalGoldFromItems,
    directKills: a.directKills,
    scrollKills: a.scrollKills,
    minionKills: a.minionKills,
    farmedKills: a.farmedKills,
    characterStunnedCount: a.characterStunnedCount,
    meleeAttackCount: a.meleeAttackCount,
    rangedAttackCount: a.rangedAttackCount,
    spellCastCount: a.spellCastCount,
    potionsUsed: a.potionsUsed,
    scrollsUsed: a.scrollsUsed,
    minionsSummoned: a.minionsSummoned,
    itemsSold: a.itemsSold,
    itemsFound: a.itemsFound,
    uncommonItemsFound: a.uncommonItemsFound,
    rareItemsFound: a.rareItemsFound,
    historicItemsFound: a.historicItemsFound,
    ancientItemsFound: a.ancientItemsFound,
    treasureChestsLooted: a.treasureChestsLooted,
    weaponRacksLooted: a.weaponRacksLooted,
    bookcasesLooted: a.bookcasesLooted
  };
}
export function restoreStatistics(a, b, c) {
  var d = a.totalPlayedMillis,
    f = a.playedMillis,
    g = a.turnCount,
    h = a.doorsOpened,
    l = a.roomsCleared,
    n = a.levelsCleared,
    p = a.dungeonsCleared,
    s = a.castlesConquered,
    u = a.farmsPurchased,
    y = a.totalGoldFromMonsters,
    A = a.totalGoldFromItems,
    C = a.directKills,
    v = a.scrollKills,
    D = a.minionKills,
    N = a.farmedKills,
    I = a.characterStunnedCount,
    x = a.meleeAttackCount,
    z = a.rangedAttackCount,
    O = a.spellCastCount,
    J = a.potionsUsed,
    la = a.scrollsUsed,
    Q = a.minionsSummoned,
    V = a.itemsSold,
    na = a.itemsFound,
    K = a.uncommonItemsFound,
    H = a.rareItemsFound,
    S = a.historicItemsFound,
    da = a.ancientItemsFound,
    W = a.treasureChestsLooted,
    ia = a.weaponRacksLooted,
    ea = a.weaponsRacksLooted;
  a = a.bookcasesLooted;
  if (!u) {
    u = game.dungeons.farms.length;
  }
  b.playedMillis = c ? Math.max(0, d ? d : f) : Math.max(0, f ? f : 0);
  b.turnCount = g ? g : 0;
  b.doorsOpened = h ? h : 0;
  b.roomsCleared = l ? l : 0;
  b.levelsCleared = n ? n : 0;
  b.dungeonsCleared = p ? p : 0;
  b.castlesConquered = s ? s : 0;
  b.farmsPurchased = u;
  b.totalGoldFromMonsters = y ? y : 0;
  b.totalGoldFromItems = A ? A : 0;
  b.directKills = C ? C : 0;
  b.scrollKills = v ? v : 0;
  b.setMinionKills(D ? D : 0);
  b.setFarmedKills(N ? N : 0);
  b.characterStunnedCount = I ? I : 0;
  b.meleeAttackCount = x ? x : 0;
  b.rangedAttackCount = z ? z : 0;
  b.spellCastCount = O ? O : 0;
  b.potionsUsed = J ? J : 0;
  b.scrollsUsed = la ? la : 0;
  b.minionsSummoned = Q ? Q : 0;
  b.itemsSold = V ? V : 0;
  b.itemsFound = na ? na : 0;
  b.uncommonItemsFound = K ? K : 0;
  b.rareItemsFound = H ? H : 0;
  b.historicItemsFound = S ? S : 0;
  b.ancientItemsFound = da ? da : 0;
  b.treasureChestsLooted = W ? W : 0;
  b.bookcasesLooted = a ? a : 0;
  c = Math.max(ia ? ia : 0, ea ? ea : 0);
  b.weaponRacksLooted = c;
}
export function initializePersistenceEntities() {
  MonsterSaveAdapter.prototype.Kw = function (a) {
    var b = game.monsterCatalog;
    b.minUnlockedLevel = a.minUnlockedLevel;
    b.maxUnlockedLevel = a.maxUnlockedLevel;
    a = a.monsterLevelStates;
    for (b = 0; b < a.length; b++) {
      for (var c = a[b], d = c.level, c = c.monsterTypes, f = [], g = undefined, g = /** @type {any} */ (0); g < c.length; g++) {
        f.push(restoreMonsterType(c[g], d));
      }
      game.monsterCatalog.en[d + ""] = f;
    }
  };
  StatisticsSaveAdapter.prototype.ts = function (a) {
    var b = a.count,
      c = a.locked,
      d = a.upgradeCount;
    if (a = game.scrolls.getScrollById(a.scrollId)) {
      a.quantity = b;
      a.ts(c, d);
    }
  };
}
