// @ts-nocheck -- M10 渐进类型化：JSDoc 覆盖后摘除（见 docs/WORKSTATE.md）
/** 火法师技能定义。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
export var improvedDamageMageFire1Definition, improvedDamageMageFire2Definition, improvedDamageMageFire3Definition, improvedArmorMageFire1Definition, improvedArmorMageFire2Definition, improvedArmorMageFire3Definition, improvedAttackRatingMageFire1Definition, improvedAttackRatingMageFire2Definition, improvedAttackRatingMageFire3Definition, improvedDefenseRatingMageFire1Definition, improvedDefenseRatingMageFire2Definition, improvedDefenseRatingMageFire3Definition, healthRegenerationMageFire1Definition, healthRegenerationMageFire2Definition, spiritRegenerationMageFire1Definition, spiritRegenerationMageFire2Definition, improvedHealthMageFire1Definition, improvedHealthMageFire2Definition, improvedSpiritMageFire1Definition, improvedSpiritMageFire2Definition, spellCostMageFire1Definition, spellCostMageFire2Definition, fasterAttacksMageFire1Definition, fasterAttacksMageFire2Definition, improvedTurnMonsters1Definition, improvedTurnMonsters2Definition, improvedTurnMonsters3Definition, improvedFireRainMageFire1Definition, improvedFireRainMageFire2Definition, improvedFireballMageFire1Definition, improvedFireballMageFire2Definition;
export function initializeContentSkillsPyromancer() {
  improvedDamageMageFire1Definition = {
    id: "improvedDamageMageFire1",
    title: "伤害提高 I",
    description: "10%伤害加成",
    statBonusValue: 10,
    statType: 2
  };
  improvedDamageMageFire2Definition = {
    id: "improvedDamageMageFire2",
    title: "伤害提高 II",
    description: "10%伤害加成",
    statBonusValue: 10,
    statType: 2
  };
  improvedDamageMageFire3Definition = {
    id: "improvedDamageMageFire3",
    title: "伤害提高 III",
    description: "10%伤害加成",
    statBonusValue: 10,
    statType: 2
  };
  improvedArmorMageFire1Definition = {
    id: "improvedArmorMageFire1",
    title: "护甲提高 I",
    description: "10%护甲加成",
    statBonusValue: 10,
    statType: 3
  };
  improvedArmorMageFire2Definition = {
    id: "improvedArmorMageFire2",
    title: "护甲提高 II",
    description: "10%护甲加成",
    statBonusValue: 10,
    statType: 3
  };
  improvedArmorMageFire3Definition = {
    id: "improvedArmorMageFire3",
    title: "护甲提高 III",
    description: "10%护甲加成",
    statBonusValue: 10,
    statType: 3
  };
  improvedAttackRatingMageFire1Definition = {
    id: "improvedAttackRatingMageFire1",
    title: "攻击等级提高 I",
    description: "10%攻击等级加成",
    statBonusValue: 10,
    statType: 4
  };
  improvedAttackRatingMageFire2Definition = {
    id: "improvedAttackRatingMageFire2",
    title: "攻击等级提高 II",
    description: "10%攻击等级加成",
    statBonusValue: 10,
    statType: 4
  };
  improvedAttackRatingMageFire3Definition = {
    id: "improvedAttackRatingMageFire3",
    title: "攻击等级提高 III",
    description: "10%攻击等级加成",
    statBonusValue: 10,
    statType: 4
  };
  improvedDefenseRatingMageFire1Definition = {
    id: "improvedDefenseRatingMageFire1",
    title: "防御等级提高 I",
    description: "10%防御等级加成",
    statBonusValue: 10,
    statType: 5
  };
  improvedDefenseRatingMageFire2Definition = {
    id: "improvedDefenseRatingMageFire2",
    title: "防御等级提高 II",
    description: "10%防御等级加成",
    statBonusValue: 10,
    statType: 5
  };
  improvedDefenseRatingMageFire3Definition = {
    id: "improvedDefenseRatingMageFire3",
    title: "防御等级提高 III",
    description: "10%防御等级加成",
    statBonusValue: 10,
    statType: 5
  };
  healthRegenerationMageFire1Definition = {
    id: "healthRegenerationMageFire1",
    title: "快速生命回复 I",
    description: "生命回复速率+1%",
    statBonusValue: 1,
    statType: 8
  };
  healthRegenerationMageFire2Definition = {
    id: "healthRegenerationMageFire2",
    title: "快速生命回复 II",
    description: "生命回复速率+1%",
    statBonusValue: 1,
    statType: 8
  };
  spiritRegenerationMageFire1Definition = {
    id: "spiritRegenerationMageFire1",
    title: "快速法力回复 I",
    description: "法力回复速率+1%",
    statBonusValue: 1,
    statType: 9
  };
  spiritRegenerationMageFire2Definition = {
    id: "spiritRegenerationMageFire2",
    title: "快速法力回复 II",
    description: "法力回复速率+1%",
    statBonusValue: 1,
    statType: 9
  };
  improvedHealthMageFire1Definition = {
    id: "improvedHealthMageFire1",
    title: "生命提高 I",
    description: "最大生命+20%",
    statBonusValue: 20,
    statType: 6
  };
  improvedHealthMageFire2Definition = {
    id: "improvedHealthMageFire2",
    title: "生命提高 II",
    description: "最大生命+20%",
    statBonusValue: 20,
    statType: 6
  };
  improvedSpiritMageFire1Definition = {
    id: "improvedSpiritMageFire1",
    title: "法力提高 I",
    description: "最大法力+20%",
    statBonusValue: 20,
    statType: 7
  };
  improvedSpiritMageFire2Definition = {
    id: "improvedSpiritMageFire2",
    title: "法力提高 II",
    description: "最大法力+20%",
    statBonusValue: 20,
    statType: 7
  };
  spellCostMageFire1Definition = {
    id: "spellCostMageFire1",
    title: "高效施法者 I",
    description: "技能消耗法力降低10%",
    statBonusValue: 10,
    statType: 16
  };
  spellCostMageFire2Definition = {
    id: "spellCostMageFire2",
    title: "高效施法者 II",
    description: "技能消耗法力降低10%",
    statBonusValue: 10,
    statType: 16
  };
  fasterAttacksMageFire1Definition = {
    id: "fasterAttacksMageFire1",
    title: "快速攻击 I",
    description: "攻击冷却时间减少",
    statBonusValue: 2,
    statType: 10
  };
  fasterAttacksMageFire2Definition = {
    id: "fasterAttacksMageFire2",
    title: "快速攻击 II",
    description: "攻击冷却时间减少",
    statBonusValue: 2,
    statType: 10
  };
  improvedTurnMonsters1Definition = {
    id: "improvedTurnMonsters1",
    title: "转变怪物提高 I",
    description: "转变更多怪物",
    statBonusValue: 1,
    statType: 27
  };
  improvedTurnMonsters2Definition = {
    id: "improvedTurnMonsters2",
    title: "转变怪物提高 II",
    description: "转变更多怪物",
    statBonusValue: 2,
    statType: 27
  };
  improvedTurnMonsters3Definition = {
    id: "improvedTurnMonsters3",
    title: "转变怪物提高 III",
    description: "转变更多怪物",
    statBonusValue: 2,
    statType: 27
  };
  improvedFireRainMageFire1Definition = {
    id: "improvedFireRainMageFire1",
    title: "火雨提高 I",
    description: "法术面积扩大.",
    statBonusValue: 1,
    statType: 22
  };
  improvedFireRainMageFire2Definition = {
    id: "improvedFireRainMageFire2",
    title: "火雨提高 II",
    description: "法术面积扩大.",
    statBonusValue: 1,
    statType: 22
  };
  improvedFireballMageFire1Definition = {
    id: "improvedFireballMageFire1",
    title: "火球提高 I",
    description: "大爆炸.",
    statBonusValue: 1,
    statType: 25
  };
  improvedFireballMageFire2Definition = {
    id: "improvedFireballMageFire2",
    title: "火球提高 II",
    description: "大爆炸.",
    statBonusValue: 1,
    statType: 25
  };
}
