// @ts-nocheck -- M10 渐进类型化：存档恢复/实体序列化的专项类型化待办（见 docs/WORKSTATE.md M10）
/** 角色、装备、怪物与统计序列化。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { Item, ItemEffect } from "../loot/items.js";
import { game } from "../runtime/game.js";
import { MonsterType, advanceMonsterTypeRank } from "../combat/encounters.js";
export function serializeItem(a) {
  var b = a.op.RD,
    c = a.slot,
    d = a.characterClass,
    f = a.Ew,
    g = a.uf(),
    h = a.Rm;
  return {
    itemTypeId: b,
    itemSlot: c,
    characterClass: d,
    itemName: f,
    itemRarity: g,
    itemLevel: a.ns,
    itemGold: a.zf,
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
    n = h.cd;
  h = {
    levelX: h.Ob(),
    levelY: h.Pb(),
    worldX: h.dc(),
    worldY: h.ec(),
    roomId: l ? l.roomId : -1,
    floorPositionIndex: h.fg,
    hallwayId: n ? n.hallwayId : -1
  };
  var n = a.spells,
    l = [],
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
  p = a.Z;
  s = a.equipment;
  var u = [];
  if (s && p) {
    var y, A;
    for (A = 0; A < p.length; A++) {
      if (y = s.ef(p[A])) {
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
    b[c.Jr().id] = c.He();
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
    playedMillis: a.Xj,
    turnCount: a.On,
    doorsOpened: a.Lk,
    roomsCleared: a.qn,
    levelsCleared: a.Mj,
    dungeonsCleared: a.wi,
    castlesConquered: a.uk,
    farmsPurchased: a.Rk,
    totalGoldFromMonsters: a.Xk,
    totalGoldFromItems: a.Wk,
    directKills: a.si,
    scrollKills: a.Dl,
    minionKills: a.minionKills,
    farmedKills: a.Sd,
    characterStunnedCount: a.oj,
    meleeAttackCount: a.hl,
    rangedAttackCount: a.wl,
    spellCastCount: a.Gl,
    potionsUsed: a.ul,
    scrollsUsed: a.El,
    minionsSummoned: a.kl,
    itemsSold: a.Ph,
    itemsFound: a.Gi,
    uncommonItemsFound: a.Ol,
    rareItemsFound: a.xl,
    historicItemsFound: a.Zk,
    ancientItemsFound: a.nk,
    treasureChestsLooted: a.Nl,
    weaponRacksLooted: a.Sl,
    bookcasesLooted: a.tk
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
    u = game.dungeons.dg.length;
  }
  b.Xj = c ? Math.max(0, d ? d : f) : Math.max(0, f ? f : 0);
  b.On = g ? g : 0;
  b.Lk = h ? h : 0;
  b.qn = l ? l : 0;
  b.Mj = n ? n : 0;
  b.wi = p ? p : 0;
  b.uk = s ? s : 0;
  b.Rk = u;
  b.Xk = y ? y : 0;
  b.Wk = A ? A : 0;
  b.si = C ? C : 0;
  b.Dl = v ? v : 0;
  b.wx(D ? D : 0);
  b.dt(N ? N : 0);
  b.oj = I ? I : 0;
  b.hl = x ? x : 0;
  b.wl = z ? z : 0;
  b.Gl = O ? O : 0;
  b.ul = J ? J : 0;
  b.El = la ? la : 0;
  b.kl = Q ? Q : 0;
  b.Ph = V ? V : 0;
  b.Gi = na ? na : 0;
  b.Ol = K ? K : 0;
  b.xl = H ? H : 0;
  b.Zk = S ? S : 0;
  b.nk = da ? da : 0;
  b.Nl = W ? W : 0;
  b.tk = a ? a : 0;
  c = Math.max(ia ? ia : 0, ea ? ea : 0);
  b.Sl = c;
}
export function initializePersistenceEntities() {
  MonsterSaveAdapter.prototype.Kw = function (a) {
    var b = game.monsterCatalog;
    b.hd = a.minUnlockedLevel;
    b.fc = a.maxUnlockedLevel;
    a = a.monsterLevelStates;
    for (b = 0; b < a.length; b++) {
      for (var c = a[b], d = c.level, c = c.monsterTypes, f = [], g = undefined, g = 0; g < c.length; g++) {
        f.push(restoreMonsterType(c[g], d));
      }
      game.monsterCatalog.en[d + ""] = f;
    }
  };
  StatisticsSaveAdapter.prototype.ts = function (a) {
    var b = a.count,
      c = a.locked,
      d = a.upgradeCount;
    if (a = game.scrolls.vf(a.scrollId)) {
      a.quantity = b;
      a.ts(c, d);
    }
  };
}
