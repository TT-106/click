// @ts-nocheck -- M10 渐进类型化：JSDoc 覆盖后摘除（见 docs/WORKSTATE.md）
/** 忍者技能定义。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
export var improvedDamageNinja1Definition, improvedDamageNinja2Definition, improvedDamageNinja3Definition, improvedArmorNinja1Definition, improvedArmorNinja2Definition, improvedArmorNinja3Definition, improvedAttackRatingNinja1Definition, improvedAttackRatingNinja2Definition, improvedAttackRatingNinja3Definition, improvedDefenseRatingNinja1Definition, improvedDefenseRatingNinja2Definition, improvedDefenseRatingNinja3Definition, fasterAttacksNinja1Definition, fasterAttacksNinja2Definition, fasterAttacksNinja3Definition, healthRegenerationNinja1Definition, healthRegenerationNinja2Definition, healthRegenerationNinja3Definition, improvedHealthNinja1Definition, improvedHealthNinja2Definition, improvedHealthNinja3Definition, criticalHitChanceNinja1Definition, criticalHitChanceNinja2Definition, criticalHitChanceNinja3Definition, criticalHitChanceNinja4Definition, criticalHitChanceNinja5Definition, attacksPerTurnNinja1Definition, attacksPerTurnNinja2Definition, attacksPerTurnNinja3Definition, additionalAttackPercentNinja1Definition, additionalAttackPercentNinja2Definition, additionalAttackPercentNinja3Definition, additionalAttackPercentNinja4Definition, swiftStrikeUpgradeNinja1Definition, swiftStrikeUpgradeNinja2Definition;
export function initializeContentSkillsNinja() {
  improvedDamageNinja1Definition = {
    id: "improvedDamageNinja1",
    title: "伤害提高 I",
    description: "10%伤害加成",
    statBonusValue: 10,
    statType: 2
  };
  improvedDamageNinja2Definition = {
    id: "improvedDamageNinja2",
    title: "伤害提高 II",
    description: "10%伤害加成",
    statBonusValue: 10,
    statType: 2
  };
  improvedDamageNinja3Definition = {
    id: "improvedDamageNinja3",
    title: "伤害提高 III",
    description: "10%伤害加成",
    statBonusValue: 10,
    statType: 2
  };
  improvedArmorNinja1Definition = {
    id: "improvedArmorNinja1",
    title: "护甲提高 I",
    description: "10%护甲加成",
    statBonusValue: 10,
    statType: 3
  };
  improvedArmorNinja2Definition = {
    id: "improvedArmorNinja2",
    title: "护甲提高 II",
    description: "10%护甲加成",
    statBonusValue: 10,
    statType: 3
  };
  improvedArmorNinja3Definition = {
    id: "improvedArmorNinja3",
    title: "护甲提高 III",
    description: "10%护甲加成",
    statBonusValue: 10,
    statType: 3
  };
  improvedAttackRatingNinja1Definition = {
    id: "improvedAttackRatingNinja1",
    title: "攻击等级提高 I",
    description: "10%攻击等级加成",
    statBonusValue: 10,
    statType: 4
  };
  improvedAttackRatingNinja2Definition = {
    id: "improvedAttackRatingNinja2",
    title: "攻击等级提高 II",
    description: "10%攻击等级加成",
    statBonusValue: 10,
    statType: 4
  };
  improvedAttackRatingNinja3Definition = {
    id: "improvedAttackRatingNinja3",
    title: "攻击等级提高 III",
    description: "10%攻击等级加成",
    statBonusValue: 10,
    statType: 4
  };
  improvedDefenseRatingNinja1Definition = {
    id: "improvedDefenseRatingNinja1",
    title: "防御等级提高 I",
    description: "10%防御等级加成",
    statBonusValue: 10,
    statType: 5
  };
  improvedDefenseRatingNinja2Definition = {
    id: "improvedDefenseRatingNinja2",
    title: "防御等级提高 II",
    description: "10%防御等级加成",
    statBonusValue: 10,
    statType: 5
  };
  improvedDefenseRatingNinja3Definition = {
    id: "improvedDefenseRatingNinja3",
    title: "防御等级提高 III",
    description: "10%防御等级加成",
    statBonusValue: 10,
    statType: 5
  };
  fasterAttacksNinja1Definition = {
    id: "fasterAttacksNinja1",
    title: "快速攻击 I",
    description: "攻击冷却时间减少",
    statBonusValue: 2,
    statType: 10
  };
  fasterAttacksNinja2Definition = {
    id: "fasterAttacksNinja2",
    title: "快速攻击 II",
    description: "攻击冷却时间减少",
    statBonusValue: 2,
    statType: 10
  };
  fasterAttacksNinja3Definition = {
    id: "fasterAttacksNinja3",
    title: "快速攻击 III",
    description: "攻击冷却时间减少",
    statBonusValue: 2,
    statType: 10
  };
  healthRegenerationNinja1Definition = {
    id: "healthRegenerationNinja1",
    title: "快速生命回复 I",
    description: "生命回复速率+1%",
    statBonusValue: 1,
    statType: 8
  };
  healthRegenerationNinja2Definition = {
    id: "healthRegenerationNinja2",
    title: "快速生命回复 II",
    description: "生命回复速率+1%",
    statBonusValue: 1,
    statType: 8
  };
  healthRegenerationNinja3Definition = {
    id: "healthRegenerationNinja3",
    title: "快速生命回复 III",
    description: "生命回复速率+1%",
    statBonusValue: 1,
    statType: 8
  };
  improvedHealthNinja1Definition = {
    id: "improvedHealthNinja1",
    title: "生命提高 I",
    description: "最大生命+20%",
    statBonusValue: 20,
    statType: 6
  };
  improvedHealthNinja2Definition = {
    id: "improvedHealthNinja2",
    title: "生命提高 II",
    description: "最大生命+20%",
    statBonusValue: 20,
    statType: 6
  };
  improvedHealthNinja3Definition = {
    id: "improvedHealthNinja3",
    title: "生命提高 III",
    description: "最大生命+20%",
    statBonusValue: 20,
    statType: 6
  };
  criticalHitChanceNinja1Definition = {
    id: "criticalHitChanceNinja1",
    title: "暴击几率",
    description: "暴击几率+5%",
    statBonusValue: 5,
    statType: 17
  };
  criticalHitChanceNinja2Definition = {
    id: "criticalHitChanceNinja2",
    title: "暴击几率",
    description: "暴击几率+5%",
    statBonusValue: 5,
    statType: 17
  };
  criticalHitChanceNinja3Definition = {
    id: "criticalHitChanceNinja3",
    title: "暴击几率",
    description: "暴击几率+5%",
    statBonusValue: 5,
    statType: 17
  };
  criticalHitChanceNinja4Definition = {
    id: "criticalHitChanceNinja4",
    title: "暴击几率",
    description: "暴击几率+5%",
    statBonusValue: 5,
    statType: 17
  };
  criticalHitChanceNinja5Definition = {
    id: "criticalHitChanceNinja5",
    title: "暴击几率",
    description: "暴击几率+5%",
    statBonusValue: 5,
    statType: 17
  };
  attacksPerTurnNinja1Definition = {
    id: "attacksPerTurnNinja1",
    title: "额外打击",
    description: "每回合最大攻击次数+1",
    statBonusValue: 1,
    statType: 18
  };
  attacksPerTurnNinja2Definition = {
    id: "attacksPerTurnNinja2",
    title: "再次攻击",
    description: "每回合最大攻击次数+1",
    statBonusValue: 1,
    statType: 18
  };
  attacksPerTurnNinja3Definition = {
    id: "attacksPerTurnNinja3",
    title: "再次攻击",
    description: "每回合最大攻击次数+1",
    statBonusValue: 1,
    statType: 18
  };
  additionalAttackPercentNinja1Definition = {
    id: "additionalAttackPercentNinja1",
    title: "额外攻击几率",
    description: "+10%额外攻击几率",
    statBonusValue: 10,
    statType: 19
  };
  additionalAttackPercentNinja2Definition = {
    id: "additionalAttackPercentNinja2",
    title: "额外攻击几率",
    description: "+10%额外攻击几率",
    statBonusValue: 10,
    statType: 19
  };
  additionalAttackPercentNinja3Definition = {
    id: "additionalAttackPercentNinja3",
    title: "额外攻击几率",
    description: "+10%额外攻击几率",
    statBonusValue: 10,
    statType: 19
  };
  additionalAttackPercentNinja4Definition = {
    id: "additionalAttackPercentNinja4",
    title: "额外攻击几率",
    description: "+10%额外攻击几率",
    statBonusValue: 10,
    statType: 19
  };
  swiftStrikeUpgradeNinja1Definition = {
    id: "swiftStrikeUpgradeNinja1",
    title: "快速打击 II",
    description: "额外受害者",
    statBonusValue: 1,
    statType: 28
  };
  swiftStrikeUpgradeNinja2Definition = {
    id: "swiftStrikeUpgradeNinja2",
    title: "快速打击 III",
    description: "额外受害者",
    statBonusValue: 1,
    statType: 28
  };
}
