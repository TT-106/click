/** 战士技能定义。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
export var improvedDamageFighter1Definition, improvedDamageFighter2Definition, improvedDamageFighter3Definition, improvedArmorFighter1Definition, improvedArmorFighter2Definition, improvedArmorFighter3Definition, improvedAttackRatingFighter1Definition, improvedAttackRatingFighter2Definition, improvedAttackRatingFighter3Definition, improvedDefenseRatingFighter1Definition, improvedDefenseRatingFighter2Definition, improvedDefenseRatingFighter3Definition, fasterAttacksFighter1Definition, fasterAttacksFighter2Definition, fasterAttacksFighter3Definition, healthRegenerationFighter1Definition, healthRegenerationFighter2Definition, healthRegenerationFighter3Definition, improvedHealthFighter1Definition, improvedHealthFighter2Definition, improvedHealthFighter3Definition, ignoreDamageFighter1Definition, ignoreDamageFighter2Definition, ignoreDamageFighter3Definition, ignoreDamageFighter4Definition, criticalHitChanceFighter1Definition, criticalHitChanceFighter2Definition, criticalHitChanceFighter3Definition, criticalHitChanceFighter4Definition, attacksPerTurnFighter1Definition, attacksPerTurnFighter2Definition, attacksPerTurnFighter3Definition, additionalAttackPercentFighter1Definition, additionalAttackPercentFighter2Definition, additionalAttackPercentFighter3Definition;
export function initializeContentSkillsFighter() {
  improvedDamageFighter1Definition = {
    c: "improvedDamageFighter1",
    title: "伤害提高 I",
    e: "10%伤害加成",
    g: 10,
    f: 2
  };
  improvedDamageFighter2Definition = {
    c: "improvedDamageFighter2",
    title: "伤害提高 II",
    e: "10%伤害加成",
    g: 10,
    f: 2
  };
  improvedDamageFighter3Definition = {
    c: "improvedDamageFighter3",
    title: "伤害提高 III",
    e: "10%伤害加成",
    g: 10,
    f: 2
  };
  improvedArmorFighter1Definition = {
    c: "improvedArmorFighter1",
    title: "护甲提高 I",
    e: "10%护甲加成",
    g: 10,
    f: 3
  };
  improvedArmorFighter2Definition = {
    c: "improvedArmorFighter2",
    title: "护甲提高 II",
    e: "10%护甲加成",
    g: 10,
    f: 3
  };
  improvedArmorFighter3Definition = {
    c: "improvedArmorFighter3",
    title: "护甲提高 III",
    e: "10%护甲加成",
    g: 10,
    f: 3
  };
  improvedAttackRatingFighter1Definition = {
    c: "improvedAttackRatingFighter1",
    title: "攻击等级提高 I",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
  };
  improvedAttackRatingFighter2Definition = {
    c: "improvedAttackRatingFighter2",
    title: "攻击等级提高 II",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
  };
  improvedAttackRatingFighter3Definition = {
    c: "improvedAttackRatingFighter3",
    title: "攻击等级提高 III",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
  };
  improvedDefenseRatingFighter1Definition = {
    c: "improvedDefenseRatingFighter1",
    title: "防御等级提高 I",
    e: "10%防御等级加成",
    g: 10,
    f: 5
  };
  improvedDefenseRatingFighter2Definition = {
    c: "improvedDefenseRatingFighter2",
    title: "防御等级提高 II",
    e: "10%防御等级加成",
    g: 10,
    f: 5
  };
  improvedDefenseRatingFighter3Definition = {
    c: "improvedDefenseRatingFighter3",
    title: "防御等级提高 III",
    e: "10%防御等级加成",
    g: 10,
    f: 5
  };
  fasterAttacksFighter1Definition = {
    c: "fasterAttacksFighter1",
    title: "快速攻击 I",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
  };
  fasterAttacksFighter2Definition = {
    c: "fasterAttacksFighter2",
    title: "快速攻击 II",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
  };
  fasterAttacksFighter3Definition = {
    c: "fasterAttacksFighter3",
    title: "快速攻击 III",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
  };
  healthRegenerationFighter1Definition = {
    c: "healthRegenerationFighter1",
    title: "快速生命回复 I",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
  };
  healthRegenerationFighter2Definition = {
    c: "healthRegenerationFighter2",
    title: "快速生命回复 II",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
  };
  healthRegenerationFighter3Definition = {
    c: "healthRegenerationFighter3",
    title: "快速生命回复 III",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
  };
  improvedHealthFighter1Definition = {
    c: "improvedHealthFighter1",
    title: "生命提高 I",
    e: "最大生命+20%",
    g: 20,
    f: 6
  };
  improvedHealthFighter2Definition = {
    c: "improvedHealthFighter2",
    title: "生命提高 II",
    e: "最大生命+20%",
    g: 20,
    f: 6
  };
  improvedHealthFighter3Definition = {
    c: "improvedHealthFighter3",
    title: "生命提高 III",
    e: "最大生命+20%",
    g: 20,
    f: 6
  };
  ignoreDamageFighter1Definition = {
    c: "ignoreDamageFighter1",
    title: "坦克模式",
    e: "免疫10%敌人的伤害",
    g: 10,
    f: 1
  };
  ignoreDamageFighter2Definition = {
    c: "ignoreDamageFighter2",
    title: "坦克 坦克 坦克",
    e: "免疫10%敌人的伤害",
    g: 10,
    f: 1
  };
  ignoreDamageFighter3Definition = {
    c: "ignoreDamageFighter3",
    title: "纯种坦克",
    e: "免疫10%敌人的伤害",
    g: 10,
    f: 1
  };
  ignoreDamageFighter4Definition = {
    c: "ignoreDamageFighter4",
    title: "主战坦克",
    e: "免疫10%敌人的伤害",
    g: 10,
    f: 1
  };
  criticalHitChanceFighter1Definition = {
    c: "criticalHitChanceFighter1",
    title: "暴击几率",
    e: "暴击几率+5%",
    g: 5,
    f: 17
  };
  criticalHitChanceFighter2Definition = {
    c: "criticalHitChanceFighter2",
    title: "临界暴击",
    e: "暴击几率+5%",
    g: 5,
    f: 17
  };
  criticalHitChanceFighter3Definition = {
    c: "criticalHitChanceFighter3",
    title: "频繁暴击",
    e: "暴击几率+5%",
    g: 5,
    f: 17
  };
  criticalHitChanceFighter4Definition = {
    c: "criticalHitChanceFighter4",
    title: "常常暴击",
    e: "暴击几率+5%",
    g: 5,
    f: 17
  };
  attacksPerTurnFighter1Definition = {
    c: "attacksPerTurnFighter1",
    title: "反手",
    e: "每回合最大攻击次数+1",
    g: 1,
    f: 18
  };
  attacksPerTurnFighter2Definition = {
    c: "attacksPerTurnFighter2",
    title: "旋风攻击",
    e: "每回合最大攻击次数+1",
    g: 1,
    f: 18
  };
  attacksPerTurnFighter3Definition = {
    c: "attacksPerTurnFighter3",
    title: "惊叹攻击",
    e: "每回合最大攻击次数+1",
    g: 1,
    f: 18
  };
  additionalAttackPercentFighter1Definition = {
    c: "additionalAttackPercentFighter1",
    title: "额外攻击几率",
    e: "+20%额外攻击几率",
    g: 20,
    f: 19
  };
  additionalAttackPercentFighter2Definition = {
    c: "additionalAttackPercentFighter2",
    title: "额外攻击几率",
    e: "+20%额外攻击几率",
    g: 20,
    f: 19
  };
  additionalAttackPercentFighter3Definition = {
    c: "additionalAttackPercentFighter3",
    title: "额外攻击几率",
    e: "+20%额外攻击几率",
    g: 20,
    f: 19
  };
}
