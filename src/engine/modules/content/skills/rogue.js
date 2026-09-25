// @ts-nocheck -- M10 渐进类型化：JSDoc 覆盖后摘除（见 docs/WORKSTATE.md）
/** 盗贼技能定义。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
export var improvedDamageRogue1Definition, improvedDamageRogue2Definition, improvedDamageRogue3Definition, improvedArmorRogue1Definition, improvedArmorRogue2Definition, improvedArmorRogue3Definition, improvedAttackRatingRogue1Definition, improvedAttackRatingRogue2Definition, improvedAttackRatingRogue3Definition, improvedDefenseRatingRogue1Definition, improvedDefenseRatingRogue2Definition, improvedDefenseRatingRogue3Definition, fasterAttacksRogue1Definition, fasterAttacksRogue2Definition, fasterAttacksRogue3Definition, healthRegenerationRogue1Definition, healthRegenerationRogue2Definition, healthRegenerationRogue3Definition, spiritRegenerationRogue1Definition, spiritRegenerationRogue2Definition, improvedHealthRogue1Definition, improvedHealthRogue2Definition, improvedHealthRogue3Definition, improvedSpiritRogue1Definition, criticalHitChanceRogue1Definition, criticalHitChanceRogue2Definition, criticalHitChanceRogue3Definition, attacksPerTurnRogue1Definition, attacksPerTurnRogue1Definition2, additionalAttackPercentRogue1Definition, additionalAttackPercentRogue2Definition, additionalAttackPercentRogue3Definition, additionalAttackPercentRogue4Definition;
export function initializeContentSkillsRogue() {
  improvedDamageRogue1Definition = {
    id: "improvedDamageRogue1",
    title: "伤害提高 I",
    description: "10%伤害加成",
    statBonusValue: 10,
    statType: 2
  };
  improvedDamageRogue2Definition = {
    id: "improvedDamageRogue2",
    title: "伤害提高 II",
    description: "10%伤害加成",
    statBonusValue: 10,
    statType: 2
  };
  improvedDamageRogue3Definition = {
    id: "improvedDamageRogue3",
    title: "伤害提高 III",
    description: "10%伤害加成",
    statBonusValue: 10,
    statType: 2
  };
  improvedArmorRogue1Definition = {
    id: "improvedArmorRogue1",
    title: "护甲提高 I",
    description: "10%护甲加成",
    statBonusValue: 10,
    statType: 3
  };
  improvedArmorRogue2Definition = {
    id: "improvedArmorRogue2",
    title: "护甲提高 II",
    description: "10%护甲加成",
    statBonusValue: 10,
    statType: 3
  };
  improvedArmorRogue3Definition = {
    id: "improvedArmorRogue3",
    title: "护甲提高 III",
    description: "10%护甲加成",
    statBonusValue: 10,
    statType: 3
  };
  improvedAttackRatingRogue1Definition = {
    id: "improvedAttackRatingRogue1",
    title: "攻击等级提高 I",
    description: "10%攻击等级加成",
    statBonusValue: 10,
    statType: 4
  };
  improvedAttackRatingRogue2Definition = {
    id: "improvedAttackRatingRogue2",
    title: "攻击等级提高 II",
    description: "10%攻击等级加成",
    statBonusValue: 10,
    statType: 4
  };
  improvedAttackRatingRogue3Definition = {
    id: "improvedAttackRatingRogue3",
    title: "攻击等级提高 III",
    description: "10%攻击等级加成",
    statBonusValue: 10,
    statType: 4
  };
  improvedDefenseRatingRogue1Definition = {
    id: "improvedDefenseRatingRogue1",
    title: "防御等级提高 I",
    description: "10%防御等级加成",
    statBonusValue: 10,
    statType: 5
  };
  improvedDefenseRatingRogue2Definition = {
    id: "improvedDefenseRatingRogue2",
    title: "防御等级提高 II",
    description: "10%防御等级加成",
    statBonusValue: 10,
    statType: 5
  };
  improvedDefenseRatingRogue3Definition = {
    id: "improvedDefenseRatingRogue3",
    title: "防御等级提高 III",
    description: "10%防御等级加成",
    statBonusValue: 10,
    statType: 5
  };
  fasterAttacksRogue1Definition = {
    id: "fasterAttacksRogue1",
    title: "快速攻击 I",
    description: "攻击冷却时间减少",
    statBonusValue: 2,
    statType: 10
  };
  fasterAttacksRogue2Definition = {
    id: "fasterAttacksRogue2",
    title: "快速攻击 II",
    description: "攻击冷却时间减少",
    statBonusValue: 2,
    statType: 10
  };
  fasterAttacksRogue3Definition = {
    id: "fasterAttacksRogue3",
    title: "快速攻击 III",
    description: "攻击冷却时间减少",
    statBonusValue: 2,
    statType: 10
  };
  healthRegenerationRogue1Definition = {
    id: "healthRegenerationRogue1",
    title: "快速生命回复 I",
    description: "生命回复速率+1%",
    statBonusValue: 1,
    statType: 8
  };
  healthRegenerationRogue2Definition = {
    id: "healthRegenerationRogue2",
    title: "快速生命回复 II",
    description: "生命回复速率+1%",
    statBonusValue: 1,
    statType: 8
  };
  healthRegenerationRogue3Definition = {
    id: "healthRegenerationRogue3",
    title: "快速生命回复 III",
    description: "生命回复速率+1%",
    statBonusValue: 1,
    statType: 8
  };
  spiritRegenerationRogue1Definition = {
    id: "spiritRegenerationRogue1",
    title: "快速法力回复 I",
    description: "法力回复速率+1%",
    statBonusValue: 1,
    statType: 9
  };
  spiritRegenerationRogue2Definition = {
    id: "spiritRegenerationRogue2",
    title: "快速法力回复 II",
    description: "法力回复速率+1%",
    statBonusValue: 1,
    statType: 9
  };
  improvedHealthRogue1Definition = {
    id: "improvedHealthRogue1",
    title: "生命提高 I",
    description: "最大生命+20%",
    statBonusValue: 20,
    statType: 6
  };
  improvedHealthRogue2Definition = {
    id: "improvedHealthRogue2",
    title: "生命提高 II",
    description: "最大生命+20%",
    statBonusValue: 20,
    statType: 6
  };
  improvedHealthRogue3Definition = {
    id: "improvedHealthRogue3",
    title: "生命提高 III",
    description: "最大生命+20%",
    statBonusValue: 20,
    statType: 6
  };
  improvedSpiritRogue1Definition = {
    id: "improvedSpiritRogue1",
    title: "法力提高 I",
    description: "最大法力+20%",
    statBonusValue: 20,
    statType: 7
  };
  criticalHitChanceRogue1Definition = {
    id: "criticalHitChanceRogue1",
    title: "暴击几率",
    description: "暴击几率+5%",
    statBonusValue: 5,
    statType: 17
  };
  criticalHitChanceRogue2Definition = {
    id: "criticalHitChanceRogue2",
    title: "暴击几率",
    description: "暴击几率+5%",
    statBonusValue: 5,
    statType: 17
  };
  criticalHitChanceRogue3Definition = {
    id: "criticalHitChanceRogue3",
    title: "暴击几率",
    description: "暴击几率+5%",
    statBonusValue: 5,
    statType: 17
  };
  attacksPerTurnRogue1Definition = {
    id: "attacksPerTurnRogue1",
    title: "额外打击",
    description: "每回合最大攻击次数+1",
    statBonusValue: 1,
    statType: 18
  };
  attacksPerTurnRogue1Definition2 = {
    id: "attacksPerTurnRogue1",
    title: "再次攻击",
    description: "每回合最大攻击次数+1",
    statBonusValue: 1,
    statType: 18
  };
  additionalAttackPercentRogue1Definition = {
    id: "additionalAttackPercentRogue1",
    title: "额外攻击几率",
    description: "+10%额外攻击几率",
    statBonusValue: 10,
    statType: 19
  };
  additionalAttackPercentRogue2Definition = {
    id: "additionalAttackPercentRogue2",
    title: "额外攻击几率",
    description: "+10%额外攻击几率",
    statBonusValue: 10,
    statType: 19
  };
  additionalAttackPercentRogue3Definition = {
    id: "additionalAttackPercentRogue3",
    title: "额外攻击几率",
    description: "+10%额外攻击几率",
    statBonusValue: 10,
    statType: 19
  };
  additionalAttackPercentRogue4Definition = {
    id: "additionalAttackPercentRogue4",
    title: "额外攻击几率",
    description: "+10%额外攻击几率",
    statBonusValue: 10,
    statType: 19
  };
}
