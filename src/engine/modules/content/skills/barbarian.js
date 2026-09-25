/** 野蛮人技能定义。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
export var improvedDamageBarbarian1Definition, improvedDamageBarbarian2Definition, improvedDamageBarbarian3Definition, improvedArmorBarbarian1Definition, improvedArmorBarbarian2Definition, improvedArmorBarbarian3Definition, improvedAttackRatingBarbarian1Definition, improvedAttackRatingBarbarian2Definition, improvedAttackRatingBarbarian3Definition, improvedDefenseRatingBarbarian1Definition, improvedDefenseRatingBarbarian2Definition, improvedDefenseRatingBarbarian3Definition, fasterAttacksBarbarian1Definition, fasterAttacksBarbarian2Definition, fasterAttacksBarbarian3Definition, healthRegenerationBarbarian1Definition, healthRegenerationBarbarian2Definition, healthRegenerationBarbarian3Definition, spiritRegenerationBarbarian1Definition, spiritRegenerationBarbarian2Definition, improvedHealthBarbarian1Definition, improvedHealthBarbarian2Definition, improvedHealthBarbarian3Definition, improvedSpiritBarbarian1Definition, improvedSpiritBarbarian2Definition, ignoreDamageBarbarian1Definition, ignoreDamageBarbarian2Definition, ignoreDamageBarbarian3Definition, criticalHitChanceBarbarian1Definition, criticalHitChanceBarbarian2Definition, criticalHitChanceBarbarian3Definition, criticalHitChanceBarbarian4Definition, improvedSledgeHammerBarbarian1Definition, improvedSledgeHammerBarbarian2Definition;
export function initializeContentSkillsBarbarian() {
  improvedDamageBarbarian1Definition = {
    id: "improvedDamageBarbarian1",
    title: "伤害提高 I",
    e: "10%伤害加成",
    g: 10,
    f: 2
  };
  improvedDamageBarbarian2Definition = {
    id: "improvedDamageBarbarian2",
    title: "伤害提高 II",
    e: "10%伤害加成",
    g: 10,
    f: 2
  };
  improvedDamageBarbarian3Definition = {
    id: "improvedDamageBarbarian3",
    title: "伤害提高 III",
    e: "10%伤害加成",
    g: 10,
    f: 2
  };
  improvedArmorBarbarian1Definition = {
    id: "improvedArmorBarbarian1",
    title: "护甲提高 I",
    e: "10%护甲加成",
    g: 10,
    f: 3
  };
  improvedArmorBarbarian2Definition = {
    id: "improvedArmorBarbarian2",
    title: "护甲提高 II",
    e: "10%护甲加成",
    g: 10,
    f: 3
  };
  improvedArmorBarbarian3Definition = {
    id: "improvedArmorBarbarian3",
    title: "护甲提高 III",
    e: "10%护甲加成",
    g: 10,
    f: 3
  };
  improvedAttackRatingBarbarian1Definition = {
    id: "improvedAttackRatingBarbarian1",
    title: "攻击等级提高 I",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
  };
  improvedAttackRatingBarbarian2Definition = {
    id: "improvedAttackRatingBarbarian2",
    title: "攻击等级提高 II",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
  };
  improvedAttackRatingBarbarian3Definition = {
    id: "improvedAttackRatingBarbarian3",
    title: "攻击等级提高 III",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
  };
  improvedDefenseRatingBarbarian1Definition = {
    id: "improvedDefenseRatingBarbarian1",
    title: "防御等级提高 I",
    e: "10%防御等级加成",
    g: 10,
    f: 5
  };
  improvedDefenseRatingBarbarian2Definition = {
    id: "improvedDefenseRatingBarbarian2",
    title: "防御等级提高 II",
    e: "10%防御等级加成",
    g: 10,
    f: 5
  };
  improvedDefenseRatingBarbarian3Definition = {
    id: "improvedDefenseRatingBarbarian3",
    title: "防御等级提高 III",
    e: "10%防御等级加成",
    g: 10,
    f: 5
  };
  fasterAttacksBarbarian1Definition = {
    id: "fasterAttacksBarbarian1",
    title: "快速攻击 I",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
  };
  fasterAttacksBarbarian2Definition = {
    id: "fasterAttacksBarbarian2",
    title: "快速攻击 II",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
  };
  fasterAttacksBarbarian3Definition = {
    id: "fasterAttacksBarbarian3",
    title: "快速攻击 III",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
  };
  healthRegenerationBarbarian1Definition = {
    id: "healthRegenerationBarbarian1",
    title: "快速生命回复 I",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
  };
  healthRegenerationBarbarian2Definition = {
    id: "healthRegenerationBarbarian2",
    title: "快速生命回复 II",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
  };
  healthRegenerationBarbarian3Definition = {
    id: "healthRegenerationBarbarian3",
    title: "快速生命回复 III",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
  };
  spiritRegenerationBarbarian1Definition = {
    id: "spiritRegenerationBarbarian1",
    title: "快速法力回复 I",
    e: "法力回复速率+1%",
    g: 1,
    f: 9
  };
  spiritRegenerationBarbarian2Definition = {
    id: "spiritRegenerationBarbarian2",
    title: "快速法力回复 II",
    e: "法力回复速率+1%",
    g: 1,
    f: 9
  };
  improvedHealthBarbarian1Definition = {
    id: "improvedHealthBarbarian1",
    title: "生命提高 I",
    e: "最大生命+20%",
    g: 20,
    f: 6
  };
  improvedHealthBarbarian2Definition = {
    id: "improvedHealthBarbarian2",
    title: "生命提高 II",
    e: "最大生命+20%",
    g: 20,
    f: 6
  };
  improvedHealthBarbarian3Definition = {
    id: "improvedHealthBarbarian3",
    title: "生命提高 III",
    e: "最大生命+20%",
    g: 20,
    f: 6
  };
  improvedSpiritBarbarian1Definition = {
    id: "improvedSpiritBarbarian1",
    title: "法力提高 I",
    e: "最大法力+20%",
    g: 20,
    f: 7
  };
  improvedSpiritBarbarian2Definition = {
    id: "improvedSpiritBarbarian2",
    title: "法力提高 II",
    e: "最大法力+20%",
    g: 20,
    f: 7
  };
  ignoreDamageBarbarian1Definition = {
    id: "ignoreDamageBarbarian1",
    title: "伤害免疫 I",
    e: "免疫10%敌人的伤害",
    g: 10,
    f: 1
  };
  ignoreDamageBarbarian2Definition = {
    id: "ignoreDamageBarbarian2",
    title: "伤害免疫 II",
    e: "免疫10%敌人的伤害",
    g: 10,
    f: 1
  };
  ignoreDamageBarbarian3Definition = {
    id: "ignoreDamageBarbarian3",
    title: "伤害免疫 III",
    e: "免疫10%敌人的伤害",
    g: 10,
    f: 1
  };
  criticalHitChanceBarbarian1Definition = {
    id: "criticalHitChanceBarbarian1",
    title: "暴击几率",
    e: "暴击几率+5%",
    g: 5,
    f: 17
  };
  criticalHitChanceBarbarian2Definition = {
    id: "criticalHitChanceBarbarian2",
    title: "暴击几率",
    e: "暴击几率+5%",
    g: 5,
    f: 17
  };
  criticalHitChanceBarbarian3Definition = {
    id: "criticalHitChanceBarbarian3",
    title: "暴击几率",
    e: "暴击几率+5%",
    g: 5,
    f: 17
  };
  criticalHitChanceBarbarian4Definition = {
    id: "criticalHitChanceBarbarian4",
    title: "暴击几率",
    e: "暴击几率+5%",
    g: 5,
    f: 17
  };
  improvedSledgeHammerBarbarian1Definition = {
    id: "improvedSledgeHammerBarbarian1",
    title: "改进大锤 I",
    e: "大面积效果",
    g: 1,
    f: 25
  };
  improvedSledgeHammerBarbarian2Definition = {
    id: "improvedSledgeHammerBarbarian2",
    title: "改进大锤 II",
    e: "大面积效果",
    g: 1,
    f: 25
  };
}
