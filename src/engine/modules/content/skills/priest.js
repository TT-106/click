/** 牧师技能定义。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
export var improvedDamagePriest1Definition, improvedDamagePriest2Definition, improvedDamagePriest3Definition, improvedArmorPriest1Definition, improvedArmorPriest2Definition, improvedArmorPriest3Definition, improvedAttackRatingPriest1Definition, improvedAttackRatingPriest2Definition, improvedAttackRatingPriest3Definition, improvedDefenseRatingPriest1Definition, improvedDefenseRatingPriest2Definition, improvedDefenseRatingPriest3Definition, healthRegenerationPriest1Definition, healthRegenerationPriest2Definition, spiritRegenerationPriest1Definition, spiritRegenerationPriest2Definition, improvedHealthPriest1Definition, improvedHealthPriest2Definition, improvedSpiritPriest1Definition, improvedSpiritPriest2Definition, spellCostPriest1Definition, spellCostPriest2Definition, fasterAttacksPriest1Definition, ignoreDamagePriest1Definition, ignoreDamagePriest2Definition, improvedHealingSpellPriestDefinition, improvedDamageSpellPriestDefinition, improvedArmorSpellPriestDefinition, improvedAttackRatingSpellPriestDefinition, improvedDefenseRatingSpellPriestDefinition;
export function initializeContentSkillsPriest() {
  improvedDamagePriest1Definition = {
    c: "improvedDamagePriest1",
    title: "伤害提高 I",
    e: "10%伤害加成",
    g: 10,
    f: 2
  };
  improvedDamagePriest2Definition = {
    c: "improvedDamagePriest2",
    title: "伤害提高 II",
    e: "10%伤害加成",
    g: 10,
    f: 2
  };
  improvedDamagePriest3Definition = {
    c: "improvedDamagePriest3",
    title: "伤害提高 III",
    e: "10%伤害加成",
    g: 10,
    f: 2
  };
  improvedArmorPriest1Definition = {
    c: "improvedArmorPriest1",
    title: "护甲提高 I",
    e: "10%护甲加成",
    g: 10,
    f: 3
  };
  improvedArmorPriest2Definition = {
    c: "improvedArmorPriest2",
    title: "护甲提高 II",
    e: "10%护甲加成",
    g: 10,
    f: 3
  };
  improvedArmorPriest3Definition = {
    c: "improvedArmorPriest3",
    title: "护甲提高 III",
    e: "10%护甲加成",
    g: 10,
    f: 3
  };
  improvedAttackRatingPriest1Definition = {
    c: "improvedAttackRatingPriest1",
    title: "攻击等级提高 I",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
  };
  improvedAttackRatingPriest2Definition = {
    c: "improvedAttackRatingPriest2",
    title: "攻击等级提高 II",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
  };
  improvedAttackRatingPriest3Definition = {
    c: "improvedAttackRatingPriest3",
    title: "攻击等级提高 III",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
  };
  improvedDefenseRatingPriest1Definition = {
    c: "improvedDefenseRatingPriest1",
    title: "防御等级提高 I",
    e: "10%防御等级加成",
    g: 10,
    f: 5
  };
  improvedDefenseRatingPriest2Definition = {
    c: "improvedDefenseRatingPriest2",
    title: "防御等级提高 II",
    e: "10%防御等级加成",
    g: 10,
    f: 5
  };
  improvedDefenseRatingPriest3Definition = {
    c: "improvedDefenseRatingPriest3",
    title: "防御等级提高 III",
    e: "10%防御等级加成",
    g: 10,
    f: 5
  };
  healthRegenerationPriest1Definition = {
    c: "healthRegenerationPriest1",
    title: "快速生命回复 I",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
  };
  healthRegenerationPriest2Definition = {
    c: "healthRegenerationPriest2",
    title: "快速生命回复 II",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
  };
  spiritRegenerationPriest1Definition = {
    c: "spiritRegenerationPriest1",
    title: "快速法力回复 I",
    e: "法力回复速率+1%",
    g: 1,
    f: 9
  };
  spiritRegenerationPriest2Definition = {
    c: "spiritRegenerationPriest2",
    title: "快速法力回复 II",
    e: "法力回复速率+1",
    g: 1,
    f: 9
  };
  improvedHealthPriest1Definition = {
    c: "improvedHealthPriest1",
    title: "生命提高 I",
    e: "最大生命+20%",
    g: 20,
    f: 6
  };
  improvedHealthPriest2Definition = {
    c: "improvedHealthPriest2",
    title: "生命提高 II",
    e: "最大生命+20%",
    g: 20,
    f: 6
  };
  improvedSpiritPriest1Definition = {
    c: "improvedSpiritPriest1",
    title: "法力提高 I",
    e: "最大法力+20%",
    g: 20,
    f: 7
  };
  improvedSpiritPriest2Definition = {
    c: "improvedSpiritPriest2",
    title: "法力提高 II",
    e: "最大法力+20%",
    g: 20,
    f: 7
  };
  spellCostPriest1Definition = {
    c: "spellCostPriest1",
    title: "高效施法者 I",
    e: "技能消耗法力降低10%",
    g: 10,
    f: 16
  };
  spellCostPriest2Definition = {
    c: "spellCostPriest2",
    title: "高效施法者 II",
    e: "技能消耗法力降低10%",
    g: 10,
    f: 16
  };
  fasterAttacksPriest1Definition = {
    c: "fasterAttacksPriest1",
    title: "快速攻击 I",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
  };
  ignoreDamagePriest1Definition = {
    c: "ignoreDamagePriest1",
    title: "伤害抵抗",
    e: "免疫10%敌人的伤害",
    g: 10,
    f: 1
  };
  ignoreDamagePriest2Definition = {
    c: "ignoreDamagePriest2",
    title: "伤害抵抗",
    e: "免疫10%敌人的伤害",
    g: 10,
    f: 1
  };
  improvedHealingSpellPriestDefinition = {
    c: "improvedHealingSpellPriest",
    title: "治疗提高法术",
    e: "治疗法术效果翻倍",
    g: 2,
    f: 11
  };
  improvedDamageSpellPriestDefinition = {
    c: "improvedDamageSpellPriest",
    title: "伤害提高法术",
    e: "伤害法术加成x2",
    g: 2,
    f: 12
  };
  improvedArmorSpellPriestDefinition = {
    c: "improvedArmorSpellPriest",
    title: "护甲提高法术",
    e: "护甲法术加成x2",
    g: 2,
    f: 13
  };
  improvedAttackRatingSpellPriestDefinition = {
    c: "improvedAttackRatingSpellPriest",
    title: "攻击等级提高法术",
    e: "攻击等级加成x2",
    g: 2,
    f: 14
  };
  improvedDefenseRatingSpellPriestDefinition = {
    c: "improvedDefenseRatingSpellPriest",
    title: "防御等级提高法术",
    e: "防御等级加成x2",
    g: 2,
    f: 15
  };
}
