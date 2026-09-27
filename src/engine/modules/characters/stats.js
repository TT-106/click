/** 角色属性、增益和法力消耗。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { floorNumber } from "../core/math.js";
import { DEFAULT_CHAIN_CHANCE, DEFAULT_MINION_LIMIT, DEFAULT_MULTI_ATTACK_CHANCE, attackCooldownBonus, freeSpellsModifier } from "../content/balance.js";
import { game } from "../runtime/game.js";
export function StatComponent(a) {
  this.no = a;
  this.skillBonusPercent = this.spellBonusPercent = this.levelValue = this.itemValue = 0;
}
export function addSpellStatBonus(a, b) {
  a.spellBonusPercent += b;
}
export function statValue(a) {
  var b = a.itemValue + a.levelValue;
  return b + floorNumber((a.skillBonusPercent + a.spellBonusPercent) / 100 * b);
}
export function CharacterStats(a) {
  this.no = a;
  this.characterLevel = 0;
  this.experienceToLevelUp = 100;
  this.lm = this.spellSpiritCost = this.spirit = this.health = 0;
  this.baseHealthRegenPercent = 1;
  this.baseSpiritRegenPercent = 4;
  this.baseAttackCooldown = 12;
  this.stunCount = this.damageReceived = this.damageGiven = this.minionKills = this.kills = 0;
  this.maxSummonedMinions = DEFAULT_MINION_LIMIT;
  this.chainCount = this.attackCooldownReduction = this.spiritRegenBonus = this.healthRegenBonus = this.spellCostReduction = this.wo = 0;
  this.chainChance = DEFAULT_CHAIN_CHANCE;
  this.extraAttackCount = 0;
  this.extraAttackChance = DEFAULT_MULTI_ATTACK_CHANCE;
  this.mu = this.lu = this.ku = this.Ss = this.Qs = this.Ps = this.Rs = this.Ts = this.nt = this.vt = this.ho = this.Qq = this.Ft = this.mr = this.ar = 0;
  this.damage = new StatComponent(a);
  this.armor = new StatComponent(a);
  this.attackRating = new StatComponent(a);
  this.defenceRating = new StatComponent(a);
  this.maxHealth = new StatComponent(a);
  this.maxSpirit = new StatComponent(a);
}
export function getAttackCooldown(a, b) {
  return b ? Math.max(4, a.baseAttackCooldown - a.attackCooldownReduction + attackCooldownBonus.currentValue) : Math.max(4, a.baseAttackCooldown - a.attackCooldownReduction);
}
export function spendSpirit(a, b) {
  if (!freeSpellsModifier.currentValue) {
    a.spirit -= b;
    if (0 > a.spirit) {
      a.spirit = 0;
    }
  }
}
export function getSpellSpiritCost(a) {
  return Math.min(a.spellSpiritCost - (0 < a.spellCostReduction ? floorNumber(a.spellCostReduction / 100 * a.spellSpiritCost) : 0), statValue(a.maxSpirit));
}
export function updateScrollAccuracy() {
  var a = game.state.scrollCaster.stats;
  a.chainChance = 100;
  if (100 < a.chainChance) {
    a.chainChance = 100;
  }
}
export function resetSkillStatBonuses(a) {
  a.wo = 0;
  a.spellCostReduction = 0;
  a.damage.skillBonusPercent = 0;
  a.armor.skillBonusPercent = 0;
  a.attackRating.skillBonusPercent = 0;
  a.defenceRating.skillBonusPercent = 0;
  a.maxHealth.skillBonusPercent = 0;
  a.maxSpirit.skillBonusPercent = 0;
  a.healthRegenBonus = 0;
  a.spiritRegenBonus = 0;
  a.attackCooldownReduction = 0;
  a.Ts = 0;
  a.Rs = 0;
  a.Ps = 0;
  a.Qs = 0;
  a.Ss = 0;
  a.extraAttackCount = 0;
  a.extraAttackChance = DEFAULT_MULTI_ATTACK_CHANCE;
  a.mr = 0;
  a.Ft = 0;
  a.ar = 0;
  a.lm = 0;
  a.ho = 0;
  a.Qq = 0;
  a.vt = 0;
  a.nt = 0;
  a.ku = 0;
  a.lu = 0;
  a.mu = 0;
  a.chainCount = 0;
  a.chainChance = DEFAULT_CHAIN_CHANCE;
  a.maxSummonedMinions = DEFAULT_MINION_LIMIT;
}
export function initializeCharactersStats() {
  CharacterStats.prototype.setMinionKills = function (a) {
    this.minionKills = a;
  };
  CharacterStats.prototype.recordMinionKill = function () {
    this.minionKills++;
  };
  CharacterStats.prototype.Ir = function () {
    var a = this.chainChance / 100,
      b = 0,
      c;
    for (c = 0; c < this.chainCount; c++) {
      if (Math.random() < a) {
        b++;
      } else {
        break;
      }
    }
    return b;
  };
}
