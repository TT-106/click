/** 战士技能定义。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
export var improvedDamageFighter1Definition, improvedDamageFighter2Definition, improvedDamageFighter3Definition, improvedArmorFighter1Definition, improvedArmorFighter2Definition, improvedArmorFighter3Definition, improvedAttackRatingFighter1Definition, improvedAttackRatingFighter2Definition, improvedAttackRatingFighter3Definition, improvedDefenseRatingFighter1Definition, improvedDefenseRatingFighter2Definition, improvedDefenseRatingFighter3Definition, fasterAttacksFighter1Definition, fasterAttacksFighter2Definition, fasterAttacksFighter3Definition, healthRegenerationFighter1Definition, healthRegenerationFighter2Definition, healthRegenerationFighter3Definition, improvedHealthFighter1Definition, improvedHealthFighter2Definition, improvedHealthFighter3Definition, ignoreDamageFighter1Definition, ignoreDamageFighter2Definition, ignoreDamageFighter3Definition, ignoreDamageFighter4Definition, criticalHitChanceFighter1Definition, criticalHitChanceFighter2Definition, criticalHitChanceFighter3Definition, criticalHitChanceFighter4Definition, attacksPerTurnFighter1Definition, attacksPerTurnFighter2Definition, attacksPerTurnFighter3Definition, additionalAttackPercentFighter1Definition, additionalAttackPercentFighter2Definition, additionalAttackPercentFighter3Definition;
export function initializeContentSkillsFighter() {
  improvedDamageFighter1Definition = {
    id: "improvedDamageFighter1",
    title: "伤害提高 I",
    e: "10%伤害加成",
    g: 10,
    f: 2
  };
  improvedDamageFighter2Definition = {
    id: "improvedDamageFighter2",
    title: "伤害提高 II",
    e: "10%伤害加成",
    g: 10,
    f: 2
  };
  improvedDamageFighter3Definition = {
    id: "improvedDamageFighter3",
    title: "伤害提高 III",
    e: "10%伤害加成",
    g: 10,
    f: 2
  };
  improvedArmorFighter1Definition = {
    id: "improvedArmorFighter1",
    title: "护甲提高 I",
    e: "10%护甲加成",
    g: 10,
    f: 3
  };
  improvedArmorFighter2Definition = {
    id: "improvedArmorFighter2",
    title: "护甲提高 II",
    e: "10%护甲加成",
    g: 10,
    f: 3
  };
  improvedArmorFighter3Definition = {
    id: "improvedArmorFighter3",
    title: "护甲提高 III",
    e: "10%护甲加成",
    g: 10,
    f: 3
  };
  improvedAttackRatingFighter1Definition = {
    id: "improvedAttackRatingFighter1",
    title: "攻击等级提高 I",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
  };
  improvedAttackRatingFighter2Definition = {
    id: "improvedAttackRatingFighter2",
    title: "攻击等级提高 II",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
  };
  improvedAttackRatingFighter3Definition = {
    id: "improvedAttackRatingFighter3",
    title: "攻击等级提高 III",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
  };
  improvedDefenseRatingFighter1Definition = {
    id: "improvedDefenseRatingFighter1",
    title: "防御等级提高 I",
    e: "10%防御等级加成",
    g: 10,
    f: 5
  };
  improvedDefenseRatingFighter2Definition = {
    id: "improvedDefenseRatingFighter2",
    title: "防御等级提高 II",
    e: "10%防御等级加成",
    g: 10,
    f: 5
  };
  improvedDefenseRatingFighter3Definition = {
    id: "improvedDefenseRatingFighter3",
    title: "防御等级提高 III",
    e: "10%防御等级加成",
    g: 10,
    f: 5
  };
  fasterAttacksFighter1Definition = {
    id: "fasterAttacksFighter1",
    title: "快速攻击 I",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
  };
  fasterAttacksFighter2Definition = {
    id: "fasterAttacksFighter2",
    title: "快速攻击 II",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
  };
  fasterAttacksFighter3Definition = {
    id: "fasterAttacksFighter3",
    title: "快速攻击 III",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
  };
  healthRegenerationFighter1Definition = {
    id: "healthRegenerationFighter1",
    title: "快速生命回复 I",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
  };
  healthRegenerationFighter2Definition = {
    id: "healthRegenerationFighter2",
    title: "快速生命回复 II",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
  };
  healthRegenerationFighter3Definition = {
    id: "healthRegenerationFighter3",
    title: "快速生命回复 III",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
  };
  improvedHealthFighter1Definition = {
    id: "improvedHealthFighter1",
    title: "生命提高 I",
    e: "最大生命+20%",
    g: 20,
    f: 6
  };
  improvedHealthFighter2Definition = {
    id: "improvedHealthFighter2",
    title: "生命提高 II",
    e: "最大生命+20%",
    g: 20,
    f: 6
  };
  improvedHealthFighter3Definition = {
    id: "improvedHealthFighter3",
    title: "生命提高 III",
    e: "最大生命+20%",
    g: 20,
    f: 6
  };
  ignoreDamageFighter1Definition = {
    id: "ignoreDamageFighter1",
    title: "坦克模式",
    e: "免疫10%敌人的伤害",
    g: 10,
    f: 1
  };
  ignoreDamageFighter2Definition = {
    id: "ignoreDamageFighter2",
    title: "坦克 坦克 坦克",
    e: "免疫10%敌人的伤害",
    g: 10,
    f: 1
  };
  ignoreDamageFighter3Definition = {
    id: "ignoreDamageFighter3",
    title: "纯种坦克",
    e: "免疫10%敌人的伤害",
    g: 10,
    f: 1
  };
  ignoreDamageFighter4Definition = {
    id: "ignoreDamageFighter4",
    title: "主战坦克",
    e: "免疫10%敌人的伤害",
    g: 10,
    f: 1
  };
  criticalHitChanceFighter1Definition = {
    id: "criticalHitChanceFighter1",
    title: "暴击几率",
    e: "暴击几率+5%",
    g: 5,
    f: 17
  };
  criticalHitChanceFighter2Definition = {
    id: "criticalHitChanceFighter2",
    title: "临界暴击",
    e: "暴击几率+5%",
    g: 5,
    f: 17
  };
  criticalHitChanceFighter3Definition = {
    id: "criticalHitChanceFighter3",
    title: "频繁暴击",
    e: "暴击几率+5%",
    g: 5,
    f: 17
  };
  criticalHitChanceFighter4Definition = {
    id: "criticalHitChanceFighter4",
    title: "常常暴击",
    e: "暴击几率+5%",
    g: 5,
    f: 17
  };
  attacksPerTurnFighter1Definition = {
    id: "attacksPerTurnFighter1",
    title: "反手",
    e: "每回合最大攻击次数+1",
    g: 1,
    f: 18
  };
  attacksPerTurnFighter2Definition = {
    id: "attacksPerTurnFighter2",
    title: "旋风攻击",
    e: "每回合最大攻击次数+1",
    g: 1,
    f: 18
  };
  attacksPerTurnFighter3Definition = {
    id: "attacksPerTurnFighter3",
    title: "惊叹攻击",
    e: "每回合最大攻击次数+1",
    g: 1,
    f: 18
  };
  additionalAttackPercentFighter1Definition = {
    id: "additionalAttackPercentFighter1",
    title: "额外攻击几率",
    e: "+20%额外攻击几率",
    g: 20,
    f: 19
  };
  additionalAttackPercentFighter2Definition = {
    id: "additionalAttackPercentFighter2",
    title: "额外攻击几率",
    e: "+20%额外攻击几率",
    g: 20,
    f: 19
  };
  additionalAttackPercentFighter3Definition = {
    id: "additionalAttackPercentFighter3",
    title: "额外攻击几率",
    e: "+20%额外攻击几率",
    g: 20,
    f: 19
  };
}
