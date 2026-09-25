// @ts-nocheck -- M10 渐进类型化：JSDoc 覆盖后摘除（见 docs/WORKSTATE.md）
/** 可购买升级、技能树与购买条件。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { game } from "../runtime/game.js";
import { floorNumber, recordGameEvent, scaleByLevel } from "../core/math.js";
import { invalidateCastleRevision, refreshAttackableCastles, refreshScheduledCastles } from "../world/regions.js";
import { addGold, addKills, getPartyMinLevel, refreshPartyLevels, spendGold, spendKills } from "../characters/party.js";
import { VISIBLE_MONSTER_LEVELS, attackCooldownBonus, dungeonCostBonus, equipmentQualityBonus, globalUpgradePriceCurve, healthRegenerationBonus, itemCostBonus, monsterUnlockPriceCurve, offlineTimeBonus, partyCapacityBonus, potionCapacityBonus, potionDurationBonus, potionPowerBonus, scrollCapacityBonus, spiritRegenerationBonus, walkingSpeedBonus } from "../content/balance.js";
import { isBetterItem } from "../loot/items.js";
import { applyLevelStats, initializeCharacterSkills } from "../simulation/characters.js";
import { hasUnspentSkills, learnSpell } from "../characters/character.js";
import { awardAdventurePoints } from "./points.js";
import { applyStatBonus, recalculateCharacterSkills } from "../combat/skill-effects.js";
import { Spell, getNextScrollLabel, getScrollLabel, getScrollUpgradeCost, registerUnlockedScroll } from "../combat/scrolls.js";
import { canFarmDungeon } from "../world/dungeons.js";
import { purchaseDungeonFarm } from "../simulation/tick.js";
import { updateScrollAccuracy } from "../characters/stats.js";
import { applyAchievementReward, getAchievementRequirementLabel, getAchievementRewardLabel } from "./achievements.js";
export var SKILL_UPGRADE_TYPE;
export function Upgrade() {
  this.lastAvailabilityFrame = -100;
  this.Wp = null;
  this.EC = false;
  this.lastChangeFrame = 0;
}
export function refreshUpgradeAvailability(a) {
  if (game.state.frameNumber != a.lastAvailabilityFrame) {
    a.lastAvailabilityFrame = game.state.frameNumber;
    a.EC = a.Cd();
  }
  return a.EC;
}
export function markUpgradeChanged(a) {
  a.lastChangeFrame = game.state.frameNumber;
}
export function UpgradeCollection(a, b) {
  this.upgradeRows = a;
  var c,
    d,
    f,
    g = [];
  for (c = 0; c < a.length; c++) {
    for (f = a[c], d = 0; d < f.length; d++) {
      g.push(f[d]);
    }
  }
  this.upgrades = g;
  if (b) {
    for (c = [], d = 0; d < this.upgrades.length; d++) {
      c.push(null);
    }
  } else {
    c = null;
  }
  this.sortedUpgrades = c;
  this.mj = 0;
  this.sortEnabled = b;
  this.lastSortFrame = 0;
}
export function resetUpgradeCollection(a) {
  var b;
  for (b = 0; b < a.upgrades.length; b++) {
    a.upgrades[b].og();
  }
  a.mj = 0;
  a.lastSortFrame = game.state.frameNumber - 1;
}
export function restoreUpgradeCollection(a) {
  var b, c, d;
  for (b = 0; b < a.upgradeRows.length; b++) {
    for (d = a.upgradeRows[b], c = 0; c < d.length; c++) {
      d[c].us();
    }
  }
  a.mj = 0;
}
export function refreshUpgradeCollection(a) {
  var b,
    c = false,
    d;
  for (b = 0; b < a.upgrades.length; b++) {
    if (d = refreshUpgradeAvailability(a.upgrades[b])) {
      c = true;
    }
  }
  if (c) {
    if (a.sortEnabled) {
      d = 0;
      var f = a.lastSortFrame;
      for (b = 0; b < a.upgrades.length; b++) {
        c = a.upgrades[b];
        if (c.qc() && c.lastChangeFrame < f) {
          a.sortedUpgrades[d++] = c;
        }
      }
      for (b = 0; b < a.upgrades.length; b++) {
        c = a.upgrades[b];
        if (c.qc() && c.lastChangeFrame >= f) {
          a.sortedUpgrades[d++] = c;
        }
      }
      for (b = 0; b < a.upgrades.length; b++) {
        c = a.upgrades[b];
        if (!c.qc()) {
          a.sortedUpgrades[d++] = c;
        }
      }
      b = a.upgrades;
      a.upgrades = a.sortedUpgrades;
      a.sortedUpgrades = b;
      a.lastSortFrame = game.state.frameNumber;
    }
    a.mj++;
  }
}
export function PurchaseItemUpgrade(a) {
  this.Ly = a;
  this.xc = null;
  this.jk = "计划攻击";
  this.Up = this.Ub = this.Ea = this.canPurchase = false;
}
export function GlobalUpgrade(a) {
  this.mb = a;
  this.canPurchase = this.Ea = false;
  this.$A = -1;
  this.Zj = this.Ub = this.$j = false;
  recalculateGlobalUpgrade(this);
}
export function recalculateGlobalUpgrade(a) {
  a.mb.rd = scaleByLevel(a.mb.ah + a.mb.purchasedLevels * a.mb.Pg, globalUpgradePriceCurve, 1);
  a.mb.currentValue = a.mb.baseValue + a.mb.purchasedLevels * a.mb.perLevelIncrement;
  if (a.mb.currentValue > a.mb.maxValue) {
    a.mb.currentValue = a.mb.maxValue;
  }
}
export function EquipBestItemUpgrade(a) {
  this.vh = false;
  this.Yz = -1;
  this.descriptionLabel = "";
  this.vp = a;
}
export function EquipItemUpgrade(a, b) {
  this.vh = false;
  this.hA = a;
  this.descriptionLabel = this.item = null;
  this.vp = b;
}
export function LevelUpUpgrade(a) {
  this.ZA = this.Up = this.canPurchase = this.Ea = false;
  this.WA = -1;
  this.descriptionLabel = null;
  this.Lo = 0;
  this.$ = a;
}
export function UnlockMonsterLevelUpgrade() {
  this.qe = -1;
  this.Ds = 1;
  this.Ql = this.canPurchase = false;
  this.Ve = "解锁怪物等级";
}
export function RetireMonsterLevelUpgrade() {
  this.Yd = -1;
  this.Cs = 1;
  this.Ql = this.Ea = this.canPurchase = false;
  this.Ve = "退休怪物等级";
}
export function CharacterSkillUpgrade(a) {
  this.it = a;
  this.Zb = null;
  this.Hc = this.canPurchase = false;
}
export function LearnSpellUpgrade(a) {
  this.oq = a;
  this.Zb = null;
  this.Hc = this.canPurchase = false;
  this.zd = null;
}
export function PurchaseDungeonUpgrade(a) {
  this.ua = a;
  this.Zj = this.Ub = this.$j = this.canPurchase = this.Ea = false;
}
export function PurchaseCastleUpgrade(a) {
  this.Ez = a;
  this.ua = null;
  this.Zj = this.Ub = this.$j = this.canPurchase = this.Ea = false;
}
export function AutoPurchaseDungeonUpgrade() {
  this.Ub = this.canPurchase = false;
}
export function ScrollUpgrade(a) {
  this.scrollId = a;
  this.Ea = this.canPurchase = false;
  this.scroll = null;
}
export function ClaimAchievementUpgrade(a) {
  this.vy = a;
  this.Ic = null;
  this.Ve = "Achievement";
  this.jk = "Reward";
  this.Ub = this.canPurchase = false;
}
export function AchievementUpgrade(a) {
  this.Ic = a;
  this.Ve = this.Ic.We ? this.Ic.name : getAchievementRequirementLabel(this.Ic);
  this.jk = getAchievementActionLabel(this);
  this.YA = this.VA = this.canPurchase = false;
}
export function getAchievementActionLabel(a) {
  return a.Ic.We ? getAchievementRewardLabel(a.Ic) : "奖励不明";
}
export function AdventurePointUpgrade(a) {
  this.kh = a;
  this.Ub = this.Hc = this.canPurchase = false;
}
export function applyPointUpgrade(a) {
  a = getPointUpgradeModifier(a);
  a.currentValue += a.levelIncrement;
}
export function getPointUpgradeModifier(a) {
  switch (a.kh.Tb) {
    case 5:
      return dungeonCostBonus;
    case 4:
      return partyCapacityBonus;
    case 3:
      return potionCapacityBonus;
    case 1:
      return scrollCapacityBonus;
    case 6:
      return itemCostBonus;
    case 2:
      return walkingSpeedBonus;
    case 7:
      return potionDurationBonus;
    case 8:
      return potionPowerBonus;
    case 9:
      return offlineTimeBonus;
    case 10:
      return equipmentQualityBonus;
    case 11:
      return attackCooldownBonus;
    case 12:
      return healthRegenerationBonus;
    case 13:
      return spiritRegenerationBonus;
  }
  console.log("Failed to find point upgrade setting: " + a.kh.Tb);
  return null;
}
export function CollectFarmUpgrade() {
  this.Ub = this.canPurchase = false;
}
export function initializeProgressionUpgrades() {
  SKILL_UPGRADE_TYPE = 5;
  Upgrade.prototype.sx = function () {};
  Upgrade.prototype.Oc = function () {
    return true;
  };
  Upgrade.prototype.qc = function () {
    return false;
  };
  Upgrade.prototype.Wo = function () {
    return null;
  };
  Upgrade.prototype.Pz = function () {
    return null;
  };
  Upgrade.prototype.ib = function () {
    return "upgrade title";
  };
  Upgrade.prototype.og = function () {};
  Upgrade.prototype.He = function () {
    return false;
  };
  Upgrade.prototype.Na = function () {
    return null;
  };
  Upgrade.prototype.uw = function () {
    return null;
  };
  Upgrade.prototype.Vo = function () {
    return null;
  };
  Upgrade.prototype.Kr = function () {
    return 1;
  };
  Upgrade.prototype.Nz = function () {
    return null;
  };
  Upgrade.prototype.us = function () {};
  Upgrade.prototype.Qc = function () {};
  Upgrade.prototype.lb = function () {};
  Upgrade.prototype.Oz = function () {
    return null;
  };
  Upgrade.prototype.Bb = function () {
    return 0;
  };
  Upgrade.prototype.Cd = function () {
    return false;
  };
  PurchaseItemUpgrade.prototype = new Upgrade();
  PurchaseItemUpgrade.prototype.Oc = function () {
    return this.canPurchase || this.Ea;
  };
  PurchaseItemUpgrade.prototype.qc = function () {
    return this.canPurchase;
  };
  PurchaseItemUpgrade.prototype.lb = function () {
    return this.jk;
  };
  PurchaseItemUpgrade.prototype.ib = function () {
    return "攻击城堡";
  };
  PurchaseItemUpgrade.prototype.He = function () {
    return this.xc && (this.xc.ye || this.xc.cb);
  };
  PurchaseItemUpgrade.prototype.Na = function () {
    return 13;
  };
  PurchaseItemUpgrade.prototype.Qc = function () {
    if (this.xc) {
      recordGameEvent("Castle", "计划攻击:" + this.xc.castleName);
      this.xc.ye = true;
      invalidateCastleRevision();
      refreshScheduledCastles(this.xc);
      refreshAttackableCastles(this.xc);
      this.canPurchase = false;
      this.xc = null;
      markUpgradeChanged(this);
    }
  };
  PurchaseItemUpgrade.prototype.Cd = function () {
    var a;
    a = game.castles.Jg;
    if (a = this.Ly < a.length ? a[this.Ly] : null) {
      this.canPurchase = game.monsterCatalog.fc >= a.requiredMonsterLevel;
      this.Ea = !this.canPurchase;
    } else {
      this.Ea = this.canPurchase = false;
    }
    var b = this.xc != a || this.Ub != this.canPurchase || this.Up != this.Ea;
    if (b && a) {
      this.jk = this.canPurchase ? a.castleName : "需要怪物等级: " + a.requiredMonsterLevel;
    }
    this.xc = a;
    this.Ub = this.canPurchase;
    this.Up = this.Ea;
    return b;
  };
  GlobalUpgrade.prototype = new Upgrade();
  GlobalUpgrade.prototype.us = function () {
    if (0 < this.mb.purchasedLevels) {
      recalculateGlobalUpgrade(this);
    }
  };
  GlobalUpgrade.prototype.og = function () {
    this.mb.purchasedLevels = 0;
    recalculateGlobalUpgrade(this);
  };
  GlobalUpgrade.prototype.ib = function () {
    return this.mb.title;
  };
  GlobalUpgrade.prototype.Na = function () {
    return 1;
  };
  GlobalUpgrade.prototype.Oc = function () {
    return this.canPurchase || this.Ea;
  };
  GlobalUpgrade.prototype.qc = function () {
    return this.canPurchase;
  };
  GlobalUpgrade.prototype.Qc = function () {
    if (!(this.mb.rd > game.state.party.kills)) {
      spendKills(game.state.party, this.mb.rd);
      this.mb.purchasedLevels++;
      this.canPurchase = false;
      recalculateGlobalUpgrade(this);
      markUpgradeChanged(this);
      recordGameEvent("Upgrade", this.mb.title + " 数值:" + this.mb.currentValue);
    }
  };
  GlobalUpgrade.prototype.Bb = function () {
    return this.mb.rd;
  };
  GlobalUpgrade.prototype.lb = function () {
    return this.mb.description;
  };
  GlobalUpgrade.prototype.Cd = function () {
    if (this.mb.currentValue >= this.mb.maxValue) {
      this.Ea = this.canPurchase = false;
    } else {
      this.canPurchase = this.mb.rd <= game.state.party.kills;
      this.Ea = !this.canPurchase && this.hu();
    }
    var a = this.Oc(),
      b = this.$A !== this.mb.purchasedLevels || this.Ub !== this.canPurchase || this.Zj !== this.Ea || this.$j !== a;
    this.$A = this.mb.purchasedLevels;
    this.Ub = this.canPurchase;
    this.Zj = this.Ea;
    this.$j = a;
    return b;
  };
  GlobalUpgrade.prototype.hu = function () {
    var a = game.state.party.kills;
    if (a >= this.mb.rd) {
      return false;
    }
    a = this.mb.rd - a;
    return 400 >= a || a <= 0.3 * this.mb.rd;
  };
  EquipBestItemUpgrade.prototype = new Upgrade();
  EquipBestItemUpgrade.prototype.Wo = function () {
    return null;
  };
  EquipBestItemUpgrade.prototype.Nz = function () {
    return game.inventories.Fj;
  };
  EquipBestItemUpgrade.prototype.ib = function () {
    return "装备所有道具";
  };
  EquipBestItemUpgrade.prototype.Na = function () {
    return 4;
  };
  EquipBestItemUpgrade.prototype.lb = function () {
    return this.descriptionLabel;
  };
  EquipBestItemUpgrade.prototype.Qc = function () {
    var a = game.inventories,
      b;
    for (b = 0; b < game.state.adventurers.length; b++) {
      a.Br(game.state.adventurers[b]);
    }
    markUpgradeChanged(this);
  };
  EquipBestItemUpgrade.prototype.Oc = function () {
    return this.vh;
  };
  EquipBestItemUpgrade.prototype.qc = function () {
    return this.vh;
  };
  EquipBestItemUpgrade.prototype.Cd = function () {
    var a,
      b = 0;
    for (a = 0; a < game.state.adventurers.length; a++) {
      var c;
      c = game.state.adventurers[a];
      var d = c.inventory.items;
      if (d && 0 !== d.length) {
        for (var f = undefined, g = undefined, h = undefined, l = 0, f = 0; f < d.length; f++) {
          g = d[f];
          if (!((h = c.ef(g.slot)) && !isBetterItem(g, h))) {
            l++;
          }
        }
        c = l;
      } else {
        c = 0;
      }
      b += c;
    }
    a = b;
    b = a > this.vp;
    if (c = this.vh !== b || this.Yz !== a) {
      this.descriptionLabel = "装备所有更好的道具(" + a + ")";
    }
    this.vh = b;
    this.Yz = a;
    return c;
  };
  EquipItemUpgrade.prototype = new Upgrade();
  EquipItemUpgrade.prototype.Wo = function () {
    return null;
  };
  EquipItemUpgrade.prototype.og = function () {
    this.descriptionLabel = this.item = null;
  };
  EquipItemUpgrade.prototype.Oz = function () {
    return this.item;
  };
  EquipItemUpgrade.prototype.Na = function () {
    return 3;
  };
  EquipItemUpgrade.prototype.lb = function () {
    return this.descriptionLabel;
  };
  EquipItemUpgrade.prototype.Qc = function () {
    var a = this.item.nj;
    if (a) {
      a.Qk(this.item);
      markUpgradeChanged(this);
    }
  };
  EquipItemUpgrade.prototype.Oc = function () {
    return this.vh;
  };
  EquipItemUpgrade.prototype.qc = function () {
    return this.vh;
  };
  EquipItemUpgrade.prototype.Cd = function () {
    var a = game.inventories.Fj,
      b = this.vh,
      c = this.item;
    if (a.length <= this.vp && a.length > this.hA) {
      this.item = a[this.hA];
      if (c != this.item) {
        this.descriptionLabel = "Equip " + this.item.Ew;
      }
      this.vh = true;
    } else {
      this.descriptionLabel = this.item = null;
      this.vh = false;
    }
    return b != this.vh || c != this.item;
  };
  LevelUpUpgrade.prototype = new Upgrade();
  LevelUpUpgrade.prototype.og = function () {
    this.descriptionLabel = null;
  };
  LevelUpUpgrade.prototype.Vo = function () {
    return this.$ >= game.state.adventurers.length ? null : game.state.adventurers[this.$];
  };
  LevelUpUpgrade.prototype.Na = function () {
    return 2;
  };
  LevelUpUpgrade.prototype.lb = function () {
    return this.descriptionLabel;
  };
  LevelUpUpgrade.prototype.Qc = function () {
    if (!(this.$ >= game.state.adventurers.length)) {
      this.canPurchase = false;
      var a = game.state.adventurers[this.$],
        b = a.stats,
        c = b.Am,
        d = getPartyMinLevel();
      if (!(game.state.party.experiencePoints < c)) {
        var f = game.state.party;
        f.experiencePoints -= c;
        if (0 > f.experiencePoints) {
          f.experiencePoints = 0;
        }
        c = b.characterLevel + 1;
        applyLevelStats(b, c, a.classDefinition.Ma);
        a.skillPoints++;
        a.hasUnspentSkills = hasUnspentSkills(a);
        b.characterLevel = c;
        if ((b = a.summonedMinions) && 0 < b.length) {
          for (f = 0; f < b.length; f++) {
            var g = b[f],
              h = c;
            g.stats.characterLevel = h;
            applyLevelStats(g.stats, h, g.classDefinition.Ma);
            initializeCharacterSkills(g, h);
          }
        }
        refreshPartyLevels();
        b = getPartyMinLevel();
        if (d !== b) {
          d = game.state.scrollCaster;
          b = d.stats;
          f = getPartyMinLevel();
          initializeCharacterSkills(d, f);
          applyLevelStats(b, f, d.classDefinition.Ma);
          b.characterLevel = f;
        }
        awardAdventurePoints(22);
        recordGameEvent("Adventurer", "升级" + a.classDefinition.className + ": " + c);
      }
      markUpgradeChanged(this);
    }
  };
  LevelUpUpgrade.prototype.hu = function () {
    var a = game.state.party.experiencePoints,
      b = game.state.adventurers[this.$].stats.Am;
    if (a >= b) {
      return false;
    }
    a = b - a;
    return 300 >= a ? true : a <= 0.2 * b;
  };
  LevelUpUpgrade.prototype.Oc = function () {
    return this.canPurchase || this.Ea;
  };
  LevelUpUpgrade.prototype.Bb = function () {
    return this.Lo;
  };
  LevelUpUpgrade.prototype.qc = function () {
    return this.canPurchase;
  };
  LevelUpUpgrade.prototype.Cd = function () {
    if (this.$ >= game.state.adventurers.length) {
      this.Ea = this.canPurchase = false;
    } else {
      var a = game.state.adventurers[this.$];
      if (!this.descriptionLabel) {
        this.descriptionLabel = "升级" + a.adventurerName;
      }
      this.Lo = a.stats.Am;
      this.canPurchase = game.state.party.experiencePoints >= this.Lo;
      this.Ea = !this.canPurchase && this.hu();
      a = this.ZA !== this.canPurchase || this.Up !== this.Ea || this.WA !== this.Lo;
      this.ZA = this.canPurchase;
      this.Up = this.Ea;
      this.WA = this.Lo;
      return a;
    }
  };
  UnlockMonsterLevelUpgrade.prototype = new Upgrade();
  UnlockMonsterLevelUpgrade.prototype.us = function () {
    if (!this.Ql) {
      this.Ql = true;
      this.qe = game.monsterCatalog.fc + 1;
      this.Ds = scaleByLevel(this.qe, monsterUnlockPriceCurve, 1);
      this.Ve = "解锁怪物等级" + this.qe;
    }
  };
  UnlockMonsterLevelUpgrade.prototype.Kr = function () {
    return this.qe;
  };
  UnlockMonsterLevelUpgrade.prototype.og = function () {
    this.Ql = false;
    this.qe = game.monsterCatalog.fc + 1;
    this.Ds = scaleByLevel(this.qe, monsterUnlockPriceCurve, 1);
    this.Ve = "解锁怪物等级" + this.qe;
  };
  UnlockMonsterLevelUpgrade.prototype.ib = function () {
    return this.Ve;
  };
  UnlockMonsterLevelUpgrade.prototype.Na = function () {
    return 11;
  };
  UnlockMonsterLevelUpgrade.prototype.lb = function () {
    return "";
  };
  UnlockMonsterLevelUpgrade.prototype.Qc = function () {
    if (this.canPurchase) {
      spendKills(game.state.party, this.Bb());
      var a = game.monsterCatalog;
      a.fc = Math.max(a.fc, this.qe);
      this.canPurchase = false;
      markUpgradeChanged(this);
      recordGameEvent("Monster Level", "解锁等级" + this.qe);
    }
  };
  UnlockMonsterLevelUpgrade.prototype.Oc = function () {
    return true;
  };
  UnlockMonsterLevelUpgrade.prototype.Bb = function () {
    return floorNumber(this.Ds * itemCostBonus.currentValue);
  };
  UnlockMonsterLevelUpgrade.prototype.qc = function () {
    return this.canPurchase;
  };
  UnlockMonsterLevelUpgrade.prototype.Cd = function () {
    var a = this.canPurchase,
      b = this.qe,
      c = game.monsterCatalog.fc + 1;
    if (this.qe != c) {
      this.qe = c;
      this.Ds = scaleByLevel(this.qe, monsterUnlockPriceCurve, 1);
      this.Ve = "解锁怪物等级" + this.qe;
    }
    if (c = game.state.party.kills >= this.Bb()) {
      if (c = getPartyMinLevel() >= this.qe) {
        c = game.monsterCatalog;
        c = 1 + c.fc - c.hd < VISIBLE_MONSTER_LEVELS;
      }
    }
    this.canPurchase = c;
    return a !== this.canPurchase || b !== this.qe;
  };
  RetireMonsterLevelUpgrade.prototype = new Upgrade();
  RetireMonsterLevelUpgrade.prototype.us = function () {
    if (!this.Ql) {
      this.Ql = true;
      this.Yd = game.monsterCatalog.hd;
      this.Cs = scaleByLevel(this.Yd, monsterUnlockPriceCurve, 1);
      this.Ve = "退休怪物等级" + this.Yd;
    }
  };
  RetireMonsterLevelUpgrade.prototype.Kr = function () {
    return this.Yd;
  };
  RetireMonsterLevelUpgrade.prototype.og = function () {
    this.Ql = false;
    this.Yd = game.monsterCatalog.hd;
    this.Cs = scaleByLevel(this.Yd, monsterUnlockPriceCurve, 1);
    this.Ve = "退休怪物等级" + this.Yd;
  };
  RetireMonsterLevelUpgrade.prototype.ib = function () {
    return this.Ve;
  };
  RetireMonsterLevelUpgrade.prototype.Na = function () {
    return 11;
  };
  RetireMonsterLevelUpgrade.prototype.lb = function () {
    return "";
  };
  RetireMonsterLevelUpgrade.prototype.Qc = function () {
    if (this.canPurchase) {
      spendKills(game.state.party, this.Bb());
      var a = this.Yd,
        b = game.monsterCatalog;
      if (a >= b.fc) {
        console.log("setMonsterLevelRetired attempt to retire max level");
      } else {
        if (a < b.hd) {
          console.log("setMonsterLevelRetired attempt to retire previously retired level");
        } else {
          if (a > b.hd) {
            console.log("setMonsterLevelRetired attempt to retire non-min level");
          } else {
            b.hd++;
            delete b.en[a + ""];
          }
        }
      }
      this.canPurchase = false;
      markUpgradeChanged(this);
      recordGameEvent("Monster Level", "退休等级" + this.Yd);
    }
  };
  RetireMonsterLevelUpgrade.prototype.Oc = function () {
    return this.canPurchase || this.Ea;
  };
  RetireMonsterLevelUpgrade.prototype.Bb = function () {
    return floorNumber(this.Cs * itemCostBonus.currentValue);
  };
  RetireMonsterLevelUpgrade.prototype.qc = function () {
    return this.canPurchase;
  };
  RetireMonsterLevelUpgrade.prototype.Cd = function () {
    var a = this.canPurchase,
      b = this.Ea,
      c = this.Yd;
    if (this.Yd != game.monsterCatalog.hd) {
      this.Yd = game.monsterCatalog.hd;
      this.Cs = scaleByLevel(this.Yd, monsterUnlockPriceCurve, 1);
      this.Ve = "退休怪物等级" + this.Yd;
    }
    if (this.Yd < getPartyMinLevel() && this.Yd < game.monsterCatalog.fc - 1) {
      this.canPurchase = game.state.party.kills >= this.Bb();
      this.Ea = !this.canPurchase;
    } else {
      this.Ea = this.canPurchase = false;
    }
    return a != this.canPurchase || b != this.Ea || c != this.Yd;
  };
  CharacterSkillUpgrade.prototype = new Upgrade();
  CharacterSkillUpgrade.prototype.sx = function (a) {
    this.Zb = a;
  };
  CharacterSkillUpgrade.prototype.Jr = function () {
    return this.it;
  };
  CharacterSkillUpgrade.prototype.He = function () {
    return this.Hc;
  };
  CharacterSkillUpgrade.prototype.ft = function (a) {
    this.Hc = a;
  };
  CharacterSkillUpgrade.prototype.og = function () {
    this.Zb = null;
    this.Hc = false;
  };
  CharacterSkillUpgrade.prototype.Vo = function () {
    return this.Zb;
  };
  CharacterSkillUpgrade.prototype.ib = function () {
    return this.it.title;
  };
  CharacterSkillUpgrade.prototype.Bb = function () {
    return 1;
  };
  CharacterSkillUpgrade.prototype.lb = function () {
    return this.it.description;
  };
  CharacterSkillUpgrade.prototype.Na = function () {
    return SKILL_UPGRADE_TYPE;
  };
  CharacterSkillUpgrade.prototype.Oc = function () {
    return true;
  };
  CharacterSkillUpgrade.prototype.qc = function () {
    return this.canPurchase;
  };
  CharacterSkillUpgrade.prototype.Qc = function () {
    if (!this.Hc) {
      if (!this.Zb) {
        console.log("error: adventurer not assigned to skill upgrade");
      } else if (!(1 > this.Zb.skillPoints)) {
        this.Hc = true;
        var a = this.Zb;
        a.skillPoints--;
        if (0 > a.skillPoints) {
          a.skillPoints = 0;
        }
        a.hasUnspentSkills = hasUnspentSkills(a);
        recalculateCharacterSkills(this.Zb);
        markUpgradeChanged(this);
        recordGameEvent("Skill", this.Zb.classDefinition.className + " " + this.it.title);
      }
    }
  };
  CharacterSkillUpgrade.prototype.Cd = function () {
    if (this.Zb) {
      var a = this.canPurchase;
      this.canPurchase = !this.Hc && (!this.Wp || this.Wp.He()) && 0 < this.Zb.skillPoints;
      return a !== this.canPurchase;
    }
    console.log("error: adventurer not assigned to skill upgrade");
  };
  LearnSpellUpgrade.prototype = new Upgrade();
  LearnSpellUpgrade.prototype.sx = function (a) {
    this.Zb = a;
  };
  LearnSpellUpgrade.prototype.Jr = function () {
    return this.oq;
  };
  LearnSpellUpgrade.prototype.He = function () {
    return this.Hc;
  };
  LearnSpellUpgrade.prototype.ft = function (a) {
    this.Hc = a;
  };
  LearnSpellUpgrade.prototype.og = function () {
    this.Zb = null;
    this.Hc = false;
    this.zd = null;
  };
  LearnSpellUpgrade.prototype.uw = function () {
    if (!this.zd) {
      this.zd = new Spell(this.oq.xa);
    }
    return this.zd;
  };
  LearnSpellUpgrade.prototype.Vo = function () {
    return this.Zb;
  };
  LearnSpellUpgrade.prototype.ib = function () {
    return this.oq.xa.name;
  };
  LearnSpellUpgrade.prototype.Bb = function () {
    return 1;
  };
  LearnSpellUpgrade.prototype.lb = function () {
    return this.oq.xa.description;
  };
  LearnSpellUpgrade.prototype.Na = function () {
    return 6;
  };
  LearnSpellUpgrade.prototype.Oc = function () {
    return true;
  };
  LearnSpellUpgrade.prototype.qc = function () {
    return this.canPurchase;
  };
  LearnSpellUpgrade.prototype.Qc = function () {
    if (!this.Hc) {
      if (this.Zb) {
        var a = this.Zb.initialSpellSkillPoint;
        if (!(1 > this.Zb.skillPoints && 1 > a)) {
          this.Hc = true;
          a = this.Zb;
          if (0 < a.initialSpellSkillPoint) {
            a.initialSpellSkillPoint = 0;
          } else {
            a.skillPoints--;
            if (0 > a.skillPoints) {
              a.skillPoints = 0;
            }
          }
          a.hasUnspentSkills = hasUnspentSkills(a);
          learnSpell(this.Zb, this.uw());
          markUpgradeChanged(this);
          recordGameEvent("Spell", this.Zb.classDefinition.className + " " + this.oq.xa.name);
        }
      } else {
        console.log("error: adventurer not assigned to spell upgrade");
      }
    }
  };
  LearnSpellUpgrade.prototype.Cd = function () {
    if (this.Zb) {
      var a = this.canPurchase,
        b = this.Zb.skillPoints,
        c = this.Zb.initialSpellSkillPoint;
      this.canPurchase = !this.Hc && (!this.Wp || this.Wp.He()) && (0 < b || c);
      return a !== this.canPurchase;
    }
    console.log("error: adventurer not assigned to spell upgrade: " + this.ib());
  };
  PurchaseDungeonUpgrade.prototype = new Upgrade();
  PurchaseDungeonUpgrade.prototype.Wo = function () {
    return this.ua;
  };
  PurchaseDungeonUpgrade.prototype.ct = function (a) {
    this.ua = a;
  };
  PurchaseDungeonUpgrade.prototype.Oc = function () {
    return this.canPurchase || this.Ea;
  };
  PurchaseDungeonUpgrade.prototype.qc = function () {
    return this.canPurchase;
  };
  PurchaseDungeonUpgrade.prototype.lb = function () {
    if (this.ua && !canFarmDungeon(this.ua)) {
      if (this.ua.isFarm) {
        return "收获地牢";
      }
      if (!this.ua.zj.cb) {
        return "先要征服城堡";
      }
    }
    return "购买地牢农场";
  };
  PurchaseDungeonUpgrade.prototype.ib = function () {
    return "地牢农场";
  };
  PurchaseDungeonUpgrade.prototype.He = function () {
    return this.ua && this.ua.isFarm;
  };
  PurchaseDungeonUpgrade.prototype.Na = function () {
    return 7;
  };
  PurchaseDungeonUpgrade.prototype.Bb = function () {
    return this.ua ? floorNumber(this.ua.farmCost * dungeonCostBonus.currentValue) : 0;
  };
  PurchaseDungeonUpgrade.prototype.Qc = function () {
    if (!(game.state.party.gold < this.Bb())) {
      purchaseDungeonFarm(this.ua, this.Bb());
      markUpgradeChanged(this);
    }
  };
  PurchaseDungeonUpgrade.prototype.Cd = function () {
    var a = canFarmDungeon(this.ua);
    this.canPurchase = a && game.state.party.gold >= this.Bb();
    this.Ea = a && !this.canPurchase && 120 > this.Bb() - game.state.party.gold;
    var a = this.Oc(),
      b = this.Ub !== this.canPurchase || this.Zj !== this.Ea || this.$j !== a;
    this.Ub = this.canPurchase;
    this.Zj = this.Ea;
    this.$j = a;
    return b;
  };
  PurchaseCastleUpgrade.prototype = new Upgrade();
  PurchaseCastleUpgrade.prototype.Wo = function () {
    return this.ua;
  };
  PurchaseCastleUpgrade.prototype.Oc = function () {
    return this.canPurchase || this.Ea;
  };
  PurchaseCastleUpgrade.prototype.qc = function () {
    return this.canPurchase;
  };
  PurchaseCastleUpgrade.prototype.lb = function () {
    return "购买地牢农场";
  };
  PurchaseCastleUpgrade.prototype.ib = function () {
    return "购买怪物农场";
  };
  PurchaseCastleUpgrade.prototype.He = function () {
    return this.ua && this.ua.isFarm;
  };
  PurchaseCastleUpgrade.prototype.Na = function () {
    return 8;
  };
  PurchaseCastleUpgrade.prototype.Bb = function () {
    return this.ua ? floorNumber(this.ua.farmCost * dungeonCostBonus.currentValue) : 0;
  };
  PurchaseCastleUpgrade.prototype.Qc = function () {
    if (!(!this.ua || game.state.party.gold < this.Bb())) {
      this.canPurchase = false;
      purchaseDungeonFarm(this.ua, this.Bb());
      markUpgradeChanged(this);
    }
  };
  PurchaseCastleUpgrade.prototype.Cd = function () {
    var a;
    a = game.dungeons.bk;
    if (a = this.Ez < a.length ? a[this.Ez] : null) {
      if (a.zj.cb) {
        this.canPurchase = game.state.party.gold >= this.Bb();
        this.Ea = !this.canPurchase;
      } else {
        this.Ea = this.canPurchase = false;
      }
    } else {
      this.Ea = this.canPurchase = false;
    }
    var b = this.Oc(),
      c = this.ua != a || this.Ub != this.canPurchase || this.Zj != this.Ea || this.$j != b;
    this.ua = a;
    this.Ub = this.canPurchase;
    this.Zj = this.Ea;
    this.$j = b;
    return c;
  };
  AutoPurchaseDungeonUpgrade.prototype = new Upgrade();
  AutoPurchaseDungeonUpgrade.prototype.Oc = function () {
    return this.canPurchase;
  };
  AutoPurchaseDungeonUpgrade.prototype.qc = function () {
    return this.canPurchase;
  };
  AutoPurchaseDungeonUpgrade.prototype.lb = function () {
    return "收集农场杀戮";
  };
  AutoPurchaseDungeonUpgrade.prototype.ib = function () {
    return "收获奖励";
  };
  AutoPurchaseDungeonUpgrade.prototype.Na = function () {
    return 9;
  };
  AutoPurchaseDungeonUpgrade.prototype.Qc = function () {
    recordGameEvent("Dungeon", "农场已收获");
    var a = game.dungeons.Sd;
    game.state.aa.Wr(a);
    addKills(a);
    game.dungeons.dt(0);
    this.canPurchase = false;
    markUpgradeChanged(this);
  };
  AutoPurchaseDungeonUpgrade.prototype.Cd = function () {
    this.canPurchase = 0 < game.dungeons.Sd;
    var a = this.Ub !== this.canPurchase;
    this.Ub = this.canPurchase;
    return a;
  };
  ScrollUpgrade.prototype = new Upgrade();
  ScrollUpgrade.prototype.og = function () {
    this.scroll = null;
    this.Ea = this.canPurchase = false;
  };
  ScrollUpgrade.prototype.vf = function () {
    if (!this.scroll) {
      this.scroll = game.scrolls.vf(this.scrollId);
    }
    return this.scroll;
  };
  ScrollUpgrade.prototype.Pz = function () {
    return this.vf();
  };
  ScrollUpgrade.prototype.ib = function () {
    return this.vf().lx;
  };
  ScrollUpgrade.prototype.Bb = function () {
    return this.vf().rn;
  };
  ScrollUpgrade.prototype.lb = function () {
    return this.vf().locked ? "解锁卷轴" : "升级卷轴";
  };
  ScrollUpgrade.prototype.Na = function () {
    return 12;
  };
  ScrollUpgrade.prototype.Oc = function () {
    return this.canPurchase || this.Ea;
  };
  ScrollUpgrade.prototype.qc = function () {
    return this.canPurchase;
  };
  ScrollUpgrade.prototype.Qc = function () {
    var a = this.vf(),
      b = a.rn;
    if (!(game.state.party.gold < b)) {
      spendGold(b);
      a: {
        if (a.locked) {
          a.locked = false;
          registerUnlockedScroll(game.scrolls, a);
          recordGameEvent("Scroll Unlock", a.rg);
        } else {
          if (a.upgradeCount >= a.Qh) {
            break a;
          }
          a.upgradeCount++;
          if (a.tn) {
            applyStatBonus(game.state.scrollCaster, a.tn.statType, a.tn.statBonusValue);
            updateScrollAccuracy();
          }
          recordGameEvent("Scroll Upgrade", a.rg + " (数量=" + a.upgradeCount + ")");
        }
        a.rg = getScrollLabel(a);
        a.lx = getNextScrollLabel(a);
        a.rn = getScrollUpgradeCost(a);
      }
      markUpgradeChanged(this);
      this.canPurchase = false;
    }
  };
  ScrollUpgrade.prototype.Cd = function () {
    var a = this.vf(),
      b = this.canPurchase,
      c = game.state.scrollCaster.stats.characterLevel,
      d = a.locked ? a.sg : a.sg + (a.upgradeCount + 1) * a.Yi;
    if (a.locked) {
      this.canPurchase = c >= d && game.state.party.gold >= a.rn;
      this.Ea = !this.canPurchase && c >= d;
    } else {
      this.canPurchase = a.upgradeCount < a.Qh && c >= d && game.state.party.gold >= a.rn;
      this.Ea = !this.canPurchase && a.upgradeCount < a.Qh && c >= d;
    }
    return b !== this.canPurchase;
  };
  ClaimAchievementUpgrade.prototype = new Upgrade();
  ClaimAchievementUpgrade.prototype.He = function () {
    return this.Ic ? this.Ic.Of : false;
  };
  ClaimAchievementUpgrade.prototype.ib = function () {
    return this.Ve;
  };
  ClaimAchievementUpgrade.prototype.lb = function () {
    return this.jk;
  };
  ClaimAchievementUpgrade.prototype.Na = function () {
    return 14;
  };
  ClaimAchievementUpgrade.prototype.Oc = function () {
    return this.canPurchase;
  };
  ClaimAchievementUpgrade.prototype.qc = function () {
    return this.canPurchase;
  };
  ClaimAchievementUpgrade.prototype.Qc = function () {
    if (this.Ic) {
      applyAchievementReward(this.Ic);
      this.Ic = null;
      this.canPurchase = false;
      markUpgradeChanged(this);
    }
  };
  ClaimAchievementUpgrade.prototype.Cd = function () {
    var a;
    a = game.state.achievements.Ze;
    a = this.vy < a.length ? a[this.vy] : null;
    this.canPurchase = null != a;
    var b = this.Ic != a || this.Ub != this.canPurchase;
    if (b && a) {
      this.Ve = a.name;
      this.jk = "奖励:" + getAchievementRewardLabel(a);
    }
    this.Ic = a;
    this.Ub = this.canPurchase;
    return b;
  };
  AchievementUpgrade.prototype = new Upgrade();
  AchievementUpgrade.prototype.He = function () {
    return this.Ic.Of;
  };
  AchievementUpgrade.prototype.ib = function () {
    return this.Ve;
  };
  AchievementUpgrade.prototype.lb = function () {
    return this.jk;
  };
  AchievementUpgrade.prototype.Na = function () {
    return 15;
  };
  AchievementUpgrade.prototype.qc = function () {
    return this.canPurchase;
  };
  AchievementUpgrade.prototype.Qc = function () {
    applyAchievementReward(this.Ic);
    this.canPurchase = false;
    markUpgradeChanged(this);
  };
  AchievementUpgrade.prototype.Cd = function () {
    var a = this.Ic.Of,
      b = this.Ic.We;
    this.canPurchase = b && !a;
    var c = this.VA != a || this.YA != b;
    if (c) {
      this.Ve = this.Ic.We ? this.Ic.name : getAchievementRequirementLabel(this.Ic);
      this.jk = getAchievementActionLabel(this);
    }
    this.VA = a;
    this.YA = b;
    return c;
  };
  AdventurePointUpgrade.prototype = new Upgrade();
  AdventurePointUpgrade.prototype.og = function () {
    this.Hc = this.canPurchase = false;
    this.Ub = !this.canPurchase;
    var a = getPointUpgradeModifier(this);
    a.currentValue = a.defaultValue;
  };
  AdventurePointUpgrade.prototype.He = function () {
    return this.Hc;
  };
  AdventurePointUpgrade.prototype.ft = function (a) {
    if (this.Hc = a) {
      applyPointUpgrade(this);
    }
  };
  AdventurePointUpgrade.prototype.ib = function () {
    return this.kh.title;
  };
  AdventurePointUpgrade.prototype.Na = function () {
    return 16;
  };
  AdventurePointUpgrade.prototype.qc = function () {
    return this.canPurchase;
  };
  AdventurePointUpgrade.prototype.Qc = function () {
    if (!(this.Hc || this.kh.Gb > game.state.ae.Dd)) {
      var a = this.kh.Gb,
        b = game.state.ae;
      b.An += a;
      b.Dd -= a;
      if (0 > b.Dd) {
        b.Dd = 0;
      }
      this.Hc = true;
      this.canPurchase = false;
      applyPointUpgrade(this);
      markUpgradeChanged(this);
      recordGameEvent("Points Upgrade", this.kh.title);
    }
  };
  AdventurePointUpgrade.prototype.Bb = function () {
    return this.kh.Gb;
  };
  AdventurePointUpgrade.prototype.lb = function () {
    return this.kh.mc;
  };
  AdventurePointUpgrade.prototype.Cd = function () {
    this.canPurchase = !this.Hc && this.kh.Gb <= game.state.ae.Dd;
    var a = this.Ub !== this.canPurchase;
    this.Ub = this.canPurchase;
    return a;
  };
  CollectFarmUpgrade.prototype = new Upgrade();
  CollectFarmUpgrade.prototype.Oc = function () {
    return this.canPurchase;
  };
  CollectFarmUpgrade.prototype.qc = function () {
    return this.canPurchase;
  };
  CollectFarmUpgrade.prototype.lb = function () {
    return "卖出道具获得黄金";
  };
  CollectFarmUpgrade.prototype.ib = function () {
    return "收集黄金";
  };
  CollectFarmUpgrade.prototype.Na = function () {
    return 10;
  };
  CollectFarmUpgrade.prototype.Qc = function () {
    recordGameEvent("Shop", "Gold Collected");
    var a = game.shops.ni;
    addGold(a);
    game.state.aa.Yr(a);
    game.shops.ni = 0;
    this.canPurchase = false;
    markUpgradeChanged(this);
  };
  CollectFarmUpgrade.prototype.Cd = function () {
    this.canPurchase = 0 < game.shops.ni;
    var a = this.Ub !== this.canPurchase;
    this.Ub = this.canPurchase;
    return a;
  };
}
