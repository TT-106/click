/** 忍者技能定义。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
export var improvedDamageNinja1Definition, improvedDamageNinja2Definition, improvedDamageNinja3Definition, improvedArmorNinja1Definition, improvedArmorNinja2Definition, improvedArmorNinja3Definition, improvedAttackRatingNinja1Definition, improvedAttackRatingNinja2Definition, improvedAttackRatingNinja3Definition, improvedDefenseRatingNinja1Definition, improvedDefenseRatingNinja2Definition, improvedDefenseRatingNinja3Definition, fasterAttacksNinja1Definition, fasterAttacksNinja2Definition, fasterAttacksNinja3Definition, healthRegenerationNinja1Definition, healthRegenerationNinja2Definition, healthRegenerationNinja3Definition, improvedHealthNinja1Definition, improvedHealthNinja2Definition, improvedHealthNinja3Definition, criticalHitChanceNinja1Definition, criticalHitChanceNinja2Definition, criticalHitChanceNinja3Definition, criticalHitChanceNinja4Definition, criticalHitChanceNinja5Definition, attacksPerTurnNinja1Definition, attacksPerTurnNinja2Definition, attacksPerTurnNinja3Definition, additionalAttackPercentNinja1Definition, additionalAttackPercentNinja2Definition, additionalAttackPercentNinja3Definition, additionalAttackPercentNinja4Definition, swiftStrikeUpgradeNinja1Definition, swiftStrikeUpgradeNinja2Definition;
export function initializeContentSkillsNinja() {
  improvedDamageNinja1Definition = {
    c: "improvedDamageNinja1",
    title: "伤害提高 I",
    e: "10%伤害加成",
    g: 10,
    f: 2
  };
  improvedDamageNinja2Definition = {
    c: "improvedDamageNinja2",
    title: "伤害提高 II",
    e: "10%伤害加成",
    g: 10,
    f: 2
  };
  improvedDamageNinja3Definition = {
    c: "improvedDamageNinja3",
    title: "伤害提高 III",
    e: "10%伤害加成",
    g: 10,
    f: 2
  };
  improvedArmorNinja1Definition = {
    c: "improvedArmorNinja1",
    title: "护甲提高 I",
    e: "10%护甲加成",
    g: 10,
    f: 3
  };
  improvedArmorNinja2Definition = {
    c: "improvedArmorNinja2",
    title: "护甲提高 II",
    e: "10%护甲加成",
    g: 10,
    f: 3
  };
  improvedArmorNinja3Definition = {
    c: "improvedArmorNinja3",
    title: "护甲提高 III",
    e: "10%护甲加成",
    g: 10,
    f: 3
  };
  improvedAttackRatingNinja1Definition = {
    c: "improvedAttackRatingNinja1",
    title: "攻击等级提高 I",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
  };
  improvedAttackRatingNinja2Definition = {
    c: "improvedAttackRatingNinja2",
    title: "攻击等级提高 II",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
  };
  improvedAttackRatingNinja3Definition = {
    c: "improvedAttackRatingNinja3",
    title: "攻击等级提高 III",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
  };
  improvedDefenseRatingNinja1Definition = {
    c: "improvedDefenseRatingNinja1",
    title: "防御等级提高 I",
    e: "10%防御等级加成",
    g: 10,
    f: 5
  };
  improvedDefenseRatingNinja2Definition = {
    c: "improvedDefenseRatingNinja2",
    title: "防御等级提高 II",
    e: "10%防御等级加成",
    g: 10,
    f: 5
  };
  improvedDefenseRatingNinja3Definition = {
    c: "improvedDefenseRatingNinja3",
    title: "防御等级提高 III",
    e: "10%防御等级加成",
    g: 10,
    f: 5
  };
  fasterAttacksNinja1Definition = {
    c: "fasterAttacksNinja1",
    title: "快速攻击 I",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
  };
  fasterAttacksNinja2Definition = {
    c: "fasterAttacksNinja2",
    title: "快速攻击 II",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
  };
  fasterAttacksNinja3Definition = {
    c: "fasterAttacksNinja3",
    title: "快速攻击 III",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
  };
  healthRegenerationNinja1Definition = {
    c: "healthRegenerationNinja1",
    title: "快速生命回复 I",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
  };
  healthRegenerationNinja2Definition = {
    c: "healthRegenerationNinja2",
    title: "快速生命回复 II",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
  };
  healthRegenerationNinja3Definition = {
    c: "healthRegenerationNinja3",
    title: "快速生命回复 III",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
  };
  improvedHealthNinja1Definition = {
    c: "improvedHealthNinja1",
    title: "生命提高 I",
    e: "最大生命+20%",
    g: 20,
    f: 6
  };
  improvedHealthNinja2Definition = {
    c: "improvedHealthNinja2",
    title: "生命提高 II",
    e: "最大生命+20%",
    g: 20,
    f: 6
  };
  improvedHealthNinja3Definition = {
    c: "improvedHealthNinja3",
    title: "生命提高 III",
    e: "最大生命+20%",
    g: 20,
    f: 6
  };
  criticalHitChanceNinja1Definition = {
    c: "criticalHitChanceNinja1",
    title: "暴击几率",
    e: "暴击几率+5%",
    g: 5,
    f: 17
  };
  criticalHitChanceNinja2Definition = {
    c: "criticalHitChanceNinja2",
    title: "暴击几率",
    e: "暴击几率+5%",
    g: 5,
    f: 17
  };
  criticalHitChanceNinja3Definition = {
    c: "criticalHitChanceNinja3",
    title: "暴击几率",
    e: "暴击几率+5%",
    g: 5,
    f: 17
  };
  criticalHitChanceNinja4Definition = {
    c: "criticalHitChanceNinja4",
    title: "暴击几率",
    e: "暴击几率+5%",
    g: 5,
    f: 17
  };
  criticalHitChanceNinja5Definition = {
    c: "criticalHitChanceNinja5",
    title: "暴击几率",
    e: "暴击几率+5%",
    g: 5,
    f: 17
  };
  attacksPerTurnNinja1Definition = {
    c: "attacksPerTurnNinja1",
    title: "额外打击",
    e: "每回合最大攻击次数+1",
    g: 1,
    f: 18
  };
  attacksPerTurnNinja2Definition = {
    c: "attacksPerTurnNinja2",
    title: "再次攻击",
    e: "每回合最大攻击次数+1",
    g: 1,
    f: 18
  };
  attacksPerTurnNinja3Definition = {
    c: "attacksPerTurnNinja3",
    title: "再次攻击",
    e: "每回合最大攻击次数+1",
    g: 1,
    f: 18
  };
  additionalAttackPercentNinja1Definition = {
    c: "additionalAttackPercentNinja1",
    title: "额外攻击几率",
    e: "+10%额外攻击几率",
    g: 10,
    f: 19
  };
  additionalAttackPercentNinja2Definition = {
    c: "additionalAttackPercentNinja2",
    title: "额外攻击几率",
    e: "+10%额外攻击几率",
    g: 10,
    f: 19
  };
  additionalAttackPercentNinja3Definition = {
    c: "additionalAttackPercentNinja3",
    title: "额外攻击几率",
    e: "+10%额外攻击几率",
    g: 10,
    f: 19
  };
  additionalAttackPercentNinja4Definition = {
    c: "additionalAttackPercentNinja4",
    title: "额外攻击几率",
    e: "+10%额外攻击几率",
    g: 10,
    f: 19
  };
  swiftStrikeUpgradeNinja1Definition = {
    c: "swiftStrikeUpgradeNinja1",
    title: "快速打击 II",
    e: "额外受害者",
    g: 1,
    f: 28
  };
  swiftStrikeUpgradeNinja2Definition = {
    c: "swiftStrikeUpgradeNinja2",
    title: "快速打击 III",
    e: "额外受害者",
    g: 1,
    f: 28
  };
}
