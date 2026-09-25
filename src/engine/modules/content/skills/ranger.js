// @ts-nocheck -- M10 渐进类型化：JSDoc 覆盖后摘除（见 docs/WORKSTATE.md）
/** 游侠技能定义。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
export var improvedDamageRanger1Definition, improvedDamageRanger2Definition, improvedDamageRanger3Definition, improvedArmorRanger1Definition, improvedArmorRanger2Definition, improvedArmorRanger3Definition, improvedAttackRatingRanger1Definition, improvedAttackRatingRanger2Definition, improvedAttackRatingRanger3Definition, improvedDefenseRatingRanger1Definition, improvedDefenseRatingRanger2Definition, improvedDefenseRatingRanger3Definition, criticalHitChanceRanger1Definition, criticalHitChanceRanger2Definition, criticalHitChanceRanger3Definition, criticalHitChanceRanger4Definition, healthRegenerationRanger1Definition, healthRegenerationRanger2Definition, healthRegenerationRanger3Definition, improvedHealthRanger1Definition, improvedHealthRanger2Definition, improvedHealthRanger3Definition, fasterAttacksRanger1Definition, fasterAttacksRanger2Definition, fasterAttacksRanger3Definition, ricochetCountRanger1Definition, ricochetCountRanger2Definition, ricochetCountRanger3Definition, ricochetCountRanger4Definition, ricochetPercentRanger1Definition, ricochetPercentRanger2Definition, ricochetPercentRanger3Definition, ricochetPercentRanger4Definition;
export function initializeContentSkillsRanger() {
  improvedDamageRanger1Definition = {
    id: "improvedDamageRanger1",
    title: "伤害提高 I",
    description: "10%伤害加成",
    statBonusValue: 10,
    statType: 2
  };
  improvedDamageRanger2Definition = {
    id: "improvedDamageRanger2",
    title: "伤害提高 II",
    description: "10%伤害加成",
    statBonusValue: 10,
    statType: 2
  };
  improvedDamageRanger3Definition = {
    id: "improvedDamageRanger3",
    title: "伤害提高 III",
    description: "10%伤害加成",
    statBonusValue: 10,
    statType: 2
  };
  improvedArmorRanger1Definition = {
    id: "improvedArmorRanger1",
    title: "护甲提高 I",
    description: "10%护甲加成",
    statBonusValue: 10,
    statType: 3
  };
  improvedArmorRanger2Definition = {
    id: "improvedArmorRanger2",
    title: "护甲提高 II",
    description: "10%护甲加成",
    statBonusValue: 10,
    statType: 3
  };
  improvedArmorRanger3Definition = {
    id: "improvedArmorRanger3",
    title: "护甲提高 III",
    description: "10%护甲加成",
    statBonusValue: 10,
    statType: 3
  };
  improvedAttackRatingRanger1Definition = {
    id: "improvedAttackRatingRanger1",
    title: "攻击等级提高 I",
    description: "10%攻击等级加成",
    statBonusValue: 10,
    statType: 4
  };
  improvedAttackRatingRanger2Definition = {
    id: "improvedAttackRatingRanger2",
    title: "攻击等级提高 II",
    description: "10%攻击等级加成",
    statBonusValue: 10,
    statType: 4
  };
  improvedAttackRatingRanger3Definition = {
    id: "improvedAttackRatingRanger3",
    title: "攻击等级提高 III",
    description: "10%攻击等级加成",
    statBonusValue: 10,
    statType: 4
  };
  improvedDefenseRatingRanger1Definition = {
    id: "improvedDefenseRatingRanger1",
    title: "防御等级提高 I",
    description: "10%防御等级加成",
    statBonusValue: 10,
    statType: 5
  };
  improvedDefenseRatingRanger2Definition = {
    id: "improvedDefenseRatingRanger2",
    title: "防御等级提高 II",
    description: "10%防御等级加成",
    statBonusValue: 10,
    statType: 5
  };
  improvedDefenseRatingRanger3Definition = {
    id: "improvedDefenseRatingRanger3",
    title: "防御等级提高 III",
    description: "10%防御等级加成",
    statBonusValue: 10,
    statType: 5
  };
  criticalHitChanceRanger1Definition = {
    id: "criticalHitChanceRanger1",
    title: "致命一击",
    description: "暴击几率+5%",
    statBonusValue: 5,
    statType: 17
  };
  criticalHitChanceRanger2Definition = {
    id: "criticalHitChanceRanger2",
    title: "致命一击s",
    description: "暴击几率+5%",
    statBonusValue: 5,
    statType: 17
  };
  criticalHitChanceRanger3Definition = {
    id: "criticalHitChanceRanger3",
    title: "更多致命一击",
    description: "暴击几率+5%",
    statBonusValue: 5,
    statType: 17
  };
  criticalHitChanceRanger4Definition = {
    id: "criticalHitChanceRanger4",
    title: "更多致命一击",
    description: "暴击几率+5%",
    statBonusValue: 5,
    statType: 17
  };
  healthRegenerationRanger1Definition = {
    id: "healthRegenerationRanger1",
    title: "快速生命回复 I",
    description: "生命回复速率+1%",
    statBonusValue: 1,
    statType: 8
  };
  healthRegenerationRanger2Definition = {
    id: "healthRegenerationRanger2",
    title: "快速生命回复 II",
    description: "生命回复速率+1%",
    statBonusValue: 1,
    statType: 8
  };
  healthRegenerationRanger3Definition = {
    id: "healthRegenerationRanger3",
    title: "快速生命回复 III",
    description: "生命回复速率+1%",
    statBonusValue: 1,
    statType: 8
  };
  improvedHealthRanger1Definition = {
    id: "improvedHealthRanger1",
    title: "生命提高 I",
    description: "最大生命+20%",
    statBonusValue: 20,
    statType: 6
  };
  improvedHealthRanger2Definition = {
    id: "improvedHealthRanger2",
    title: "生命提高 II",
    description: "最大生命+20%",
    statBonusValue: 20,
    statType: 6
  };
  improvedHealthRanger3Definition = {
    id: "improvedHealthRanger3",
    title: "生命提高 III",
    description: "最大生命+20%",
    statBonusValue: 20,
    statType: 6
  };
  fasterAttacksRanger1Definition = {
    id: "fasterAttacksRanger1",
    title: "快速射击",
    description: "攻击冷却时间减少",
    statBonusValue: 2,
    statType: 10
  };
  fasterAttacksRanger2Definition = {
    id: "fasterAttacksRanger2",
    title: "高速射击",
    description: "攻击冷却时间减少",
    statBonusValue: 2,
    statType: 10
  };
  fasterAttacksRanger3Definition = {
    id: "fasterAttacksRanger3",
    title: "飞速射击",
    description: "攻击冷却时间减少",
    statBonusValue: 2,
    statType: 10
  };
  ricochetCountRanger1Definition = {
    id: "ricochetCountRanger1",
    title: "跳弹射击",
    description: "最大可能弹跳次数+1",
    statBonusValue: 1,
    statType: 23
  };
  ricochetCountRanger2Definition = {
    id: "ricochetCountRanger2",
    title: "跳弹射击",
    description: "最大可能弹跳次数+1",
    statBonusValue: 1,
    statType: 23
  };
  ricochetCountRanger3Definition = {
    id: "ricochetCountRanger3",
    title: "跳弹射击",
    description: "最大可能弹跳次数+1",
    statBonusValue: 1,
    statType: 23
  };
  ricochetCountRanger4Definition = {
    id: "ricochetCountRanger4",
    title: "跳弹射击",
    description: "最大可能弹跳次数+1",
    statBonusValue: 1,
    statType: 23
  };
  ricochetPercentRanger1Definition = {
    id: "ricochetPercentRanger1",
    title: "弹跳几率",
    description: "弹跳几率+15%",
    statBonusValue: 15,
    statType: 24
  };
  ricochetPercentRanger2Definition = {
    id: "ricochetPercentRanger2",
    title: "弹跳几率",
    description: "弹跳几率+15%",
    statBonusValue: 15,
    statType: 24
  };
  ricochetPercentRanger3Definition = {
    id: "ricochetPercentRanger3",
    title: "弹跳几率",
    description: "弹跳几率+15%",
    statBonusValue: 15,
    statType: 24
  };
  ricochetPercentRanger4Definition = {
    id: "ricochetPercentRanger4",
    title: "弹跳几率",
    description: "弹跳几率+15%",
    statBonusValue: 15,
    statType: 24
  };
}
