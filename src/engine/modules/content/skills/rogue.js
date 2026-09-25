/** 盗贼技能定义。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
export var improvedDamageRogue1Definition, improvedDamageRogue2Definition, improvedDamageRogue3Definition, improvedArmorRogue1Definition, improvedArmorRogue2Definition, improvedArmorRogue3Definition, improvedAttackRatingRogue1Definition, improvedAttackRatingRogue2Definition, improvedAttackRatingRogue3Definition, improvedDefenseRatingRogue1Definition, improvedDefenseRatingRogue2Definition, improvedDefenseRatingRogue3Definition, fasterAttacksRogue1Definition, fasterAttacksRogue2Definition, fasterAttacksRogue3Definition, healthRegenerationRogue1Definition, healthRegenerationRogue2Definition, healthRegenerationRogue3Definition, spiritRegenerationRogue1Definition, spiritRegenerationRogue2Definition, improvedHealthRogue1Definition, improvedHealthRogue2Definition, improvedHealthRogue3Definition, improvedSpiritRogue1Definition, criticalHitChanceRogue1Definition, criticalHitChanceRogue2Definition, criticalHitChanceRogue3Definition, attacksPerTurnRogue1Definition, attacksPerTurnRogue1Definition2, additionalAttackPercentRogue1Definition, additionalAttackPercentRogue2Definition, additionalAttackPercentRogue3Definition, additionalAttackPercentRogue4Definition;
export function initializeContentSkillsRogue() {
  improvedDamageRogue1Definition = {
    c: "improvedDamageRogue1",
    title: "伤害提高 I",
    e: "10%伤害加成",
    g: 10,
    f: 2
  };
  improvedDamageRogue2Definition = {
    c: "improvedDamageRogue2",
    title: "伤害提高 II",
    e: "10%伤害加成",
    g: 10,
    f: 2
  };
  improvedDamageRogue3Definition = {
    c: "improvedDamageRogue3",
    title: "伤害提高 III",
    e: "10%伤害加成",
    g: 10,
    f: 2
  };
  improvedArmorRogue1Definition = {
    c: "improvedArmorRogue1",
    title: "护甲提高 I",
    e: "10%护甲加成",
    g: 10,
    f: 3
  };
  improvedArmorRogue2Definition = {
    c: "improvedArmorRogue2",
    title: "护甲提高 II",
    e: "10%护甲加成",
    g: 10,
    f: 3
  };
  improvedArmorRogue3Definition = {
    c: "improvedArmorRogue3",
    title: "护甲提高 III",
    e: "10%护甲加成",
    g: 10,
    f: 3
  };
  improvedAttackRatingRogue1Definition = {
    c: "improvedAttackRatingRogue1",
    title: "攻击等级提高 I",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
  };
  improvedAttackRatingRogue2Definition = {
    c: "improvedAttackRatingRogue2",
    title: "攻击等级提高 II",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
  };
  improvedAttackRatingRogue3Definition = {
    c: "improvedAttackRatingRogue3",
    title: "攻击等级提高 III",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
  };
  improvedDefenseRatingRogue1Definition = {
    c: "improvedDefenseRatingRogue1",
    title: "防御等级提高 I",
    e: "10%防御等级加成",
    g: 10,
    f: 5
  };
  improvedDefenseRatingRogue2Definition = {
    c: "improvedDefenseRatingRogue2",
    title: "防御等级提高 II",
    e: "10%防御等级加成",
    g: 10,
    f: 5
  };
  improvedDefenseRatingRogue3Definition = {
    c: "improvedDefenseRatingRogue3",
    title: "防御等级提高 III",
    e: "10%防御等级加成",
    g: 10,
    f: 5
  };
  fasterAttacksRogue1Definition = {
    c: "fasterAttacksRogue1",
    title: "快速攻击 I",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
  };
  fasterAttacksRogue2Definition = {
    c: "fasterAttacksRogue2",
    title: "快速攻击 II",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
  };
  fasterAttacksRogue3Definition = {
    c: "fasterAttacksRogue3",
    title: "快速攻击 III",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
  };
  healthRegenerationRogue1Definition = {
    c: "healthRegenerationRogue1",
    title: "快速生命回复 I",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
  };
  healthRegenerationRogue2Definition = {
    c: "healthRegenerationRogue2",
    title: "快速生命回复 II",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
  };
  healthRegenerationRogue3Definition = {
    c: "healthRegenerationRogue3",
    title: "快速生命回复 III",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
  };
  spiritRegenerationRogue1Definition = {
    c: "spiritRegenerationRogue1",
    title: "快速法力回复 I",
    e: "法力回复速率+1%",
    g: 1,
    f: 9
  };
  spiritRegenerationRogue2Definition = {
    c: "spiritRegenerationRogue2",
    title: "快速法力回复 II",
    e: "法力回复速率+1%",
    g: 1,
    f: 9
  };
  improvedHealthRogue1Definition = {
    c: "improvedHealthRogue1",
    title: "生命提高 I",
    e: "最大生命+20%",
    g: 20,
    f: 6
  };
  improvedHealthRogue2Definition = {
    c: "improvedHealthRogue2",
    title: "生命提高 II",
    e: "最大生命+20%",
    g: 20,
    f: 6
  };
  improvedHealthRogue3Definition = {
    c: "improvedHealthRogue3",
    title: "生命提高 III",
    e: "最大生命+20%",
    g: 20,
    f: 6
  };
  improvedSpiritRogue1Definition = {
    c: "improvedSpiritRogue1",
    title: "法力提高 I",
    e: "最大法力+20%",
    g: 20,
    f: 7
  };
  criticalHitChanceRogue1Definition = {
    c: "criticalHitChanceRogue1",
    title: "暴击几率",
    e: "暴击几率+5%",
    g: 5,
    f: 17
  };
  criticalHitChanceRogue2Definition = {
    c: "criticalHitChanceRogue2",
    title: "暴击几率",
    e: "暴击几率+5%",
    g: 5,
    f: 17
  };
  criticalHitChanceRogue3Definition = {
    c: "criticalHitChanceRogue3",
    title: "暴击几率",
    e: "暴击几率+5%",
    g: 5,
    f: 17
  };
  attacksPerTurnRogue1Definition = {
    c: "attacksPerTurnRogue1",
    title: "额外打击",
    e: "每回合最大攻击次数+1",
    g: 1,
    f: 18
  };
  attacksPerTurnRogue1Definition2 = {
    c: "attacksPerTurnRogue1",
    title: "再次攻击",
    e: "每回合最大攻击次数+1",
    g: 1,
    f: 18
  };
  additionalAttackPercentRogue1Definition = {
    c: "additionalAttackPercentRogue1",
    title: "额外攻击几率",
    e: "+10%额外攻击几率",
    g: 10,
    f: 19
  };
  additionalAttackPercentRogue2Definition = {
    c: "additionalAttackPercentRogue2",
    title: "额外攻击几率",
    e: "+10%额外攻击几率",
    g: 10,
    f: 19
  };
  additionalAttackPercentRogue3Definition = {
    c: "additionalAttackPercentRogue3",
    title: "额外攻击几率",
    e: "+10%额外攻击几率",
    g: 10,
    f: 19
  };
  additionalAttackPercentRogue4Definition = {
    c: "additionalAttackPercentRogue4",
    title: "额外攻击几率",
    e: "+10%额外攻击几率",
    g: 10,
    f: 19
  };
}
