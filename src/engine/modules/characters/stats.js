/** 角色属性、增益和法力消耗。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { floorNumber } from "../core/math.js";
export function StatComponent(owner) {
  this.owner = owner;
  this.skillBonusPercent = this.spellBonusPercent = this.levelValue = this.itemValue = 0;
}
export function addSpellStatBonus(stat, bonusPercent) {
  stat.spellBonusPercent += bonusPercent;
}
export function statValue(stat) {
  const baseValue = stat.itemValue + stat.levelValue;
  return baseValue + floorNumber((stat.skillBonusPercent + stat.spellBonusPercent) / 100 * baseValue);
}
export function CharacterStats(owner, rules) {
  this.owner = owner;
  this.rules = rules;
  this.characterLevel = 0;
  this.experienceToLevelUp = 100;
  this.critChance = this.spellSpiritCost = this.spirit = this.health = 0;
  this.baseHealthRegenPercent = 1;
  this.baseSpiritRegenPercent = 4;
  this.baseAttackCooldown = 12;
  this.stunCount = this.damageReceived = this.damageGiven = this.minionKills = this.kills = 0;
  this.maxSummonedMinions = rules.defaultMinionLimit;
  this.chainCount = this.attackCooldownReduction = this.spiritRegenBonus = this.healthRegenBonus = this.spellCostReduction = this.damageResistance = 0;
  this.chainChance = rules.defaultChainChance;
  this.extraAttackCount = 0;
  this.extraAttackChance = rules.defaultMultiAttackChance;
  this.rogueChickenChance = this.ninjaChickenChance = this.barbarianChickenChance = this.buffDefenceRatingPotency = this.buffAttackRatingPotency = this.buffArmorPotency = this.buffDamagePotency = this.healPotency = this.ricochetCountBonus = this.swiftStrikeTargetBonus = this.areaRadiusBonus = this.rainAreaBonus = this.transformTargetBonus = this.controlTargetBonus = this.chainArcBonus = 0;
  this.damage = new StatComponent(owner);
  this.armor = new StatComponent(owner);
  this.attackRating = new StatComponent(owner);
  this.defenceRating = new StatComponent(owner);
  this.maxHealth = new StatComponent(owner);
  this.maxSpirit = new StatComponent(owner);
}
export function getAttackCooldown(stats, includeUpgradeBonus) {
  return includeUpgradeBonus ? Math.max(4, stats.baseAttackCooldown - stats.attackCooldownReduction + stats.rules.attackCooldownBonus.currentValue) : Math.max(4, stats.baseAttackCooldown - stats.attackCooldownReduction);
}
export function spendSpirit(stats, cost) {
  if (!stats.rules.freeSpellsModifier.currentValue) {
    stats.spirit -= cost;
    if (0 > stats.spirit) {
      stats.spirit = 0;
    }
  }
}
export function getSpellSpiritCost(stats) {
  return Math.min(stats.spellSpiritCost - (0 < stats.spellCostReduction ? floorNumber(stats.spellCostReduction / 100 * stats.spellSpiritCost) : 0), statValue(stats.maxSpirit));
}
/** @param {CharacterStats} scrollCasterStats */
export function updateScrollAccuracy(scrollCasterStats) {
  scrollCasterStats.chainChance = 100;
  if (100 < scrollCasterStats.chainChance) {
    scrollCasterStats.chainChance = 100;
  }
}
export function resetSkillStatBonuses(stats) {
  stats.damageResistance = 0;
  stats.spellCostReduction = 0;
  stats.damage.skillBonusPercent = 0;
  stats.armor.skillBonusPercent = 0;
  stats.attackRating.skillBonusPercent = 0;
  stats.defenceRating.skillBonusPercent = 0;
  stats.maxHealth.skillBonusPercent = 0;
  stats.maxSpirit.skillBonusPercent = 0;
  stats.healthRegenBonus = 0;
  stats.spiritRegenBonus = 0;
  stats.attackCooldownReduction = 0;
  stats.healPotency = 0;
  stats.buffDamagePotency = 0;
  stats.buffArmorPotency = 0;
  stats.buffAttackRatingPotency = 0;
  stats.buffDefenceRatingPotency = 0;
  stats.extraAttackCount = 0;
  stats.extraAttackChance = stats.rules.defaultMultiAttackChance;
  stats.controlTargetBonus = 0;
  stats.transformTargetBonus = 0;
  stats.chainArcBonus = 0;
  stats.critChance = 0;
  stats.areaRadiusBonus = 0;
  stats.rainAreaBonus = 0;
  stats.swiftStrikeTargetBonus = 0;
  stats.ricochetCountBonus = 0;
  stats.barbarianChickenChance = 0;
  stats.ninjaChickenChance = 0;
  stats.rogueChickenChance = 0;
  stats.chainCount = 0;
  stats.chainChance = stats.rules.defaultChainChance;
  stats.maxSummonedMinions = stats.rules.defaultMinionLimit;
}
export function initializeCharactersStats() {
  CharacterStats.prototype.setMinionKills = function (count) {
    this.minionKills = count;
  };
  CharacterStats.prototype.recordMinionKill = function () {
    this.minionKills++;
  };
  CharacterStats.prototype.rollChainCount = function () {
    const chance = this.chainChance / 100;
    let successfulChains = 0;
    for (let attempt = 0; attempt < this.chainCount; attempt++) {
      if (Math.random() < chance) {
        successfulChains++;
      } else {
        break;
      }
    }
    return successfulChains;
  };
}
