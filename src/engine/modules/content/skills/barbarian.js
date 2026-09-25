// @ts-nocheck -- M10 渐进类型化：JSDoc 覆盖后摘除（见 docs/WORKSTATE.md）
/** 野蛮人技能定义。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
export var improvedDamageBarbarian1Definition, improvedDamageBarbarian2Definition, improvedDamageBarbarian3Definition, improvedArmorBarbarian1Definition, improvedArmorBarbarian2Definition, improvedArmorBarbarian3Definition, improvedAttackRatingBarbarian1Definition, improvedAttackRatingBarbarian2Definition, improvedAttackRatingBarbarian3Definition, improvedDefenseRatingBarbarian1Definition, improvedDefenseRatingBarbarian2Definition, improvedDefenseRatingBarbarian3Definition, fasterAttacksBarbarian1Definition, fasterAttacksBarbarian2Definition, fasterAttacksBarbarian3Definition, healthRegenerationBarbarian1Definition, healthRegenerationBarbarian2Definition, healthRegenerationBarbarian3Definition, spiritRegenerationBarbarian1Definition, spiritRegenerationBarbarian2Definition, improvedHealthBarbarian1Definition, improvedHealthBarbarian2Definition, improvedHealthBarbarian3Definition, improvedSpiritBarbarian1Definition, improvedSpiritBarbarian2Definition, ignoreDamageBarbarian1Definition, ignoreDamageBarbarian2Definition, ignoreDamageBarbarian3Definition, criticalHitChanceBarbarian1Definition, criticalHitChanceBarbarian2Definition, criticalHitChanceBarbarian3Definition, criticalHitChanceBarbarian4Definition, improvedSledgeHammerBarbarian1Definition, improvedSledgeHammerBarbarian2Definition;
export function initializeContentSkillsBarbarian() {
  improvedDamageBarbarian1Definition = {
    id: "improvedDamageBarbarian1",
    title: "伤害提高 I",
    description: "10%伤害加成",
    statBonusValue: 10,
    statType: 2
  };
  improvedDamageBarbarian2Definition = {
    id: "improvedDamageBarbarian2",
    title: "伤害提高 II",
    description: "10%伤害加成",
    statBonusValue: 10,
    statType: 2
  };
  improvedDamageBarbarian3Definition = {
    id: "improvedDamageBarbarian3",
    title: "伤害提高 III",
    description: "10%伤害加成",
    statBonusValue: 10,
    statType: 2
  };
  improvedArmorBarbarian1Definition = {
    id: "improvedArmorBarbarian1",
    title: "护甲提高 I",
    description: "10%护甲加成",
    statBonusValue: 10,
    statType: 3
  };
  improvedArmorBarbarian2Definition = {
    id: "improvedArmorBarbarian2",
    title: "护甲提高 II",
    description: "10%护甲加成",
    statBonusValue: 10,
    statType: 3
  };
  improvedArmorBarbarian3Definition = {
    id: "improvedArmorBarbarian3",
    title: "护甲提高 III",
    description: "10%护甲加成",
    statBonusValue: 10,
    statType: 3
  };
  improvedAttackRatingBarbarian1Definition = {
    id: "improvedAttackRatingBarbarian1",
    title: "攻击等级提高 I",
    description: "10%攻击等级加成",
    statBonusValue: 10,
    statType: 4
  };
  improvedAttackRatingBarbarian2Definition = {
    id: "improvedAttackRatingBarbarian2",
    title: "攻击等级提高 II",
    description: "10%攻击等级加成",
    statBonusValue: 10,
    statType: 4
  };
  improvedAttackRatingBarbarian3Definition = {
    id: "improvedAttackRatingBarbarian3",
    title: "攻击等级提高 III",
    description: "10%攻击等级加成",
    statBonusValue: 10,
    statType: 4
  };
  improvedDefenseRatingBarbarian1Definition = {
    id: "improvedDefenseRatingBarbarian1",
    title: "防御等级提高 I",
    description: "10%防御等级加成",
    statBonusValue: 10,
    statType: 5
  };
  improvedDefenseRatingBarbarian2Definition = {
    id: "improvedDefenseRatingBarbarian2",
    title: "防御等级提高 II",
    description: "10%防御等级加成",
    statBonusValue: 10,
    statType: 5
  };
  improvedDefenseRatingBarbarian3Definition = {
    id: "improvedDefenseRatingBarbarian3",
    title: "防御等级提高 III",
    description: "10%防御等级加成",
    statBonusValue: 10,
    statType: 5
  };
  fasterAttacksBarbarian1Definition = {
    id: "fasterAttacksBarbarian1",
    title: "快速攻击 I",
    description: "攻击冷却时间减少",
    statBonusValue: 2,
    statType: 10
  };
  fasterAttacksBarbarian2Definition = {
    id: "fasterAttacksBarbarian2",
    title: "快速攻击 II",
    description: "攻击冷却时间减少",
    statBonusValue: 2,
    statType: 10
  };
  fasterAttacksBarbarian3Definition = {
    id: "fasterAttacksBarbarian3",
    title: "快速攻击 III",
    description: "攻击冷却时间减少",
    statBonusValue: 2,
    statType: 10
  };
  healthRegenerationBarbarian1Definition = {
    id: "healthRegenerationBarbarian1",
    title: "快速生命回复 I",
    description: "生命回复速率+1%",
    statBonusValue: 1,
    statType: 8
  };
  healthRegenerationBarbarian2Definition = {
    id: "healthRegenerationBarbarian2",
    title: "快速生命回复 II",
    description: "生命回复速率+1%",
    statBonusValue: 1,
    statType: 8
  };
  healthRegenerationBarbarian3Definition = {
    id: "healthRegenerationBarbarian3",
    title: "快速生命回复 III",
    description: "生命回复速率+1%",
    statBonusValue: 1,
    statType: 8
  };
  spiritRegenerationBarbarian1Definition = {
    id: "spiritRegenerationBarbarian1",
    title: "快速法力回复 I",
    description: "法力回复速率+1%",
    statBonusValue: 1,
    statType: 9
  };
  spiritRegenerationBarbarian2Definition = {
    id: "spiritRegenerationBarbarian2",
    title: "快速法力回复 II",
    description: "法力回复速率+1%",
    statBonusValue: 1,
    statType: 9
  };
  improvedHealthBarbarian1Definition = {
    id: "improvedHealthBarbarian1",
    title: "生命提高 I",
    description: "最大生命+20%",
    statBonusValue: 20,
    statType: 6
  };
  improvedHealthBarbarian2Definition = {
    id: "improvedHealthBarbarian2",
    title: "生命提高 II",
    description: "最大生命+20%",
    statBonusValue: 20,
    statType: 6
  };
  improvedHealthBarbarian3Definition = {
    id: "improvedHealthBarbarian3",
    title: "生命提高 III",
    description: "最大生命+20%",
    statBonusValue: 20,
    statType: 6
  };
  improvedSpiritBarbarian1Definition = {
    id: "improvedSpiritBarbarian1",
    title: "法力提高 I",
    description: "最大法力+20%",
    statBonusValue: 20,
    statType: 7
  };
  improvedSpiritBarbarian2Definition = {
    id: "improvedSpiritBarbarian2",
    title: "法力提高 II",
    description: "最大法力+20%",
    statBonusValue: 20,
    statType: 7
  };
  ignoreDamageBarbarian1Definition = {
    id: "ignoreDamageBarbarian1",
    title: "伤害免疫 I",
    description: "免疫10%敌人的伤害",
    statBonusValue: 10,
    statType: 1
  };
  ignoreDamageBarbarian2Definition = {
    id: "ignoreDamageBarbarian2",
    title: "伤害免疫 II",
    description: "免疫10%敌人的伤害",
    statBonusValue: 10,
    statType: 1
  };
  ignoreDamageBarbarian3Definition = {
    id: "ignoreDamageBarbarian3",
    title: "伤害免疫 III",
    description: "免疫10%敌人的伤害",
    statBonusValue: 10,
    statType: 1
  };
  criticalHitChanceBarbarian1Definition = {
    id: "criticalHitChanceBarbarian1",
    title: "暴击几率",
    description: "暴击几率+5%",
    statBonusValue: 5,
    statType: 17
  };
  criticalHitChanceBarbarian2Definition = {
    id: "criticalHitChanceBarbarian2",
    title: "暴击几率",
    description: "暴击几率+5%",
    statBonusValue: 5,
    statType: 17
  };
  criticalHitChanceBarbarian3Definition = {
    id: "criticalHitChanceBarbarian3",
    title: "暴击几率",
    description: "暴击几率+5%",
    statBonusValue: 5,
    statType: 17
  };
  criticalHitChanceBarbarian4Definition = {
    id: "criticalHitChanceBarbarian4",
    title: "暴击几率",
    description: "暴击几率+5%",
    statBonusValue: 5,
    statType: 17
  };
  improvedSledgeHammerBarbarian1Definition = {
    id: "improvedSledgeHammerBarbarian1",
    title: "改进大锤 I",
    description: "大面积效果",
    statBonusValue: 1,
    statType: 25
  };
  improvedSledgeHammerBarbarian2Definition = {
    id: "improvedSledgeHammerBarbarian2",
    title: "改进大锤 II",
    description: "大面积效果",
    statBonusValue: 1,
    statType: 25
  };
}
