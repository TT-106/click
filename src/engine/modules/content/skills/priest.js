/** 牧师技能定义。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
export var improvedDamagePriest1Definition, improvedDamagePriest2Definition, improvedDamagePriest3Definition, improvedArmorPriest1Definition, improvedArmorPriest2Definition, improvedArmorPriest3Definition, improvedAttackRatingPriest1Definition, improvedAttackRatingPriest2Definition, improvedAttackRatingPriest3Definition, improvedDefenseRatingPriest1Definition, improvedDefenseRatingPriest2Definition, improvedDefenseRatingPriest3Definition, healthRegenerationPriest1Definition, healthRegenerationPriest2Definition, spiritRegenerationPriest1Definition, spiritRegenerationPriest2Definition, improvedHealthPriest1Definition, improvedHealthPriest2Definition, improvedSpiritPriest1Definition, improvedSpiritPriest2Definition, spellCostPriest1Definition, spellCostPriest2Definition, fasterAttacksPriest1Definition, ignoreDamagePriest1Definition, ignoreDamagePriest2Definition, improvedHealingSpellPriestDefinition, improvedDamageSpellPriestDefinition, improvedArmorSpellPriestDefinition, improvedAttackRatingSpellPriestDefinition, improvedDefenseRatingSpellPriestDefinition;
export function initializeContentSkillsPriest() {
  improvedDamagePriest1Definition = {
    id: "improvedDamagePriest1",
    title: "伤害提高 I",
    description: "10%伤害加成",
    statBonusValue: 10,
    statType: 2
  };
  improvedDamagePriest2Definition = {
    id: "improvedDamagePriest2",
    title: "伤害提高 II",
    description: "10%伤害加成",
    statBonusValue: 10,
    statType: 2
  };
  improvedDamagePriest3Definition = {
    id: "improvedDamagePriest3",
    title: "伤害提高 III",
    description: "10%伤害加成",
    statBonusValue: 10,
    statType: 2
  };
  improvedArmorPriest1Definition = {
    id: "improvedArmorPriest1",
    title: "护甲提高 I",
    description: "10%护甲加成",
    statBonusValue: 10,
    statType: 3
  };
  improvedArmorPriest2Definition = {
    id: "improvedArmorPriest2",
    title: "护甲提高 II",
    description: "10%护甲加成",
    statBonusValue: 10,
    statType: 3
  };
  improvedArmorPriest3Definition = {
    id: "improvedArmorPriest3",
    title: "护甲提高 III",
    description: "10%护甲加成",
    statBonusValue: 10,
    statType: 3
  };
  improvedAttackRatingPriest1Definition = {
    id: "improvedAttackRatingPriest1",
    title: "攻击等级提高 I",
    description: "10%攻击等级加成",
    statBonusValue: 10,
    statType: 4
  };
  improvedAttackRatingPriest2Definition = {
    id: "improvedAttackRatingPriest2",
    title: "攻击等级提高 II",
    description: "10%攻击等级加成",
    statBonusValue: 10,
    statType: 4
  };
  improvedAttackRatingPriest3Definition = {
    id: "improvedAttackRatingPriest3",
    title: "攻击等级提高 III",
    description: "10%攻击等级加成",
    statBonusValue: 10,
    statType: 4
  };
  improvedDefenseRatingPriest1Definition = {
    id: "improvedDefenseRatingPriest1",
    title: "防御等级提高 I",
    description: "10%防御等级加成",
    statBonusValue: 10,
    statType: 5
  };
  improvedDefenseRatingPriest2Definition = {
    id: "improvedDefenseRatingPriest2",
    title: "防御等级提高 II",
    description: "10%防御等级加成",
    statBonusValue: 10,
    statType: 5
  };
  improvedDefenseRatingPriest3Definition = {
    id: "improvedDefenseRatingPriest3",
    title: "防御等级提高 III",
    description: "10%防御等级加成",
    statBonusValue: 10,
    statType: 5
  };
  healthRegenerationPriest1Definition = {
    id: "healthRegenerationPriest1",
    title: "快速生命回复 I",
    description: "生命回复速率+1%",
    statBonusValue: 1,
    statType: 8
  };
  healthRegenerationPriest2Definition = {
    id: "healthRegenerationPriest2",
    title: "快速生命回复 II",
    description: "生命回复速率+1%",
    statBonusValue: 1,
    statType: 8
  };
  spiritRegenerationPriest1Definition = {
    id: "spiritRegenerationPriest1",
    title: "快速法力回复 I",
    description: "法力回复速率+1%",
    statBonusValue: 1,
    statType: 9
  };
  spiritRegenerationPriest2Definition = {
    id: "spiritRegenerationPriest2",
    title: "快速法力回复 II",
    description: "法力回复速率+1",
    statBonusValue: 1,
    statType: 9
  };
  improvedHealthPriest1Definition = {
    id: "improvedHealthPriest1",
    title: "生命提高 I",
    description: "最大生命+20%",
    statBonusValue: 20,
    statType: 6
  };
  improvedHealthPriest2Definition = {
    id: "improvedHealthPriest2",
    title: "生命提高 II",
    description: "最大生命+20%",
    statBonusValue: 20,
    statType: 6
  };
  improvedSpiritPriest1Definition = {
    id: "improvedSpiritPriest1",
    title: "法力提高 I",
    description: "最大法力+20%",
    statBonusValue: 20,
    statType: 7
  };
  improvedSpiritPriest2Definition = {
    id: "improvedSpiritPriest2",
    title: "法力提高 II",
    description: "最大法力+20%",
    statBonusValue: 20,
    statType: 7
  };
  spellCostPriest1Definition = {
    id: "spellCostPriest1",
    title: "高效施法者 I",
    description: "技能消耗法力降低10%",
    statBonusValue: 10,
    statType: 16
  };
  spellCostPriest2Definition = {
    id: "spellCostPriest2",
    title: "高效施法者 II",
    description: "技能消耗法力降低10%",
    statBonusValue: 10,
    statType: 16
  };
  fasterAttacksPriest1Definition = {
    id: "fasterAttacksPriest1",
    title: "快速攻击 I",
    description: "攻击冷却时间减少",
    statBonusValue: 2,
    statType: 10
  };
  ignoreDamagePriest1Definition = {
    id: "ignoreDamagePriest1",
    title: "伤害抵抗",
    description: "免疫10%敌人的伤害",
    statBonusValue: 10,
    statType: 1
  };
  ignoreDamagePriest2Definition = {
    id: "ignoreDamagePriest2",
    title: "伤害抵抗",
    description: "免疫10%敌人的伤害",
    statBonusValue: 10,
    statType: 1
  };
  improvedHealingSpellPriestDefinition = {
    id: "improvedHealingSpellPriest",
    title: "治疗提高法术",
    description: "治疗法术效果翻倍",
    statBonusValue: 2,
    statType: 11
  };
  improvedDamageSpellPriestDefinition = {
    id: "improvedDamageSpellPriest",
    title: "伤害提高法术",
    description: "伤害法术加成x2",
    statBonusValue: 2,
    statType: 12
  };
  improvedArmorSpellPriestDefinition = {
    id: "improvedArmorSpellPriest",
    title: "护甲提高法术",
    description: "护甲法术加成x2",
    statBonusValue: 2,
    statType: 13
  };
  improvedAttackRatingSpellPriestDefinition = {
    id: "improvedAttackRatingSpellPriest",
    title: "攻击等级提高法术",
    description: "攻击等级加成x2",
    statBonusValue: 2,
    statType: 14
  };
  improvedDefenseRatingSpellPriestDefinition = {
    id: "improvedDefenseRatingSpellPriest",
    title: "防御等级提高法术",
    description: "防御等级加成x2",
    statBonusValue: 2,
    statType: 15
  };
}
