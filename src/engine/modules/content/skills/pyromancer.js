/** 火法师技能定义。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
export var improvedDamageMageFire1Definition, improvedDamageMageFire2Definition, improvedDamageMageFire3Definition, improvedArmorMageFire1Definition, improvedArmorMageFire2Definition, improvedArmorMageFire3Definition, improvedAttackRatingMageFire1Definition, improvedAttackRatingMageFire2Definition, improvedAttackRatingMageFire3Definition, improvedDefenseRatingMageFire1Definition, improvedDefenseRatingMageFire2Definition, improvedDefenseRatingMageFire3Definition, healthRegenerationMageFire1Definition, healthRegenerationMageFire2Definition, spiritRegenerationMageFire1Definition, spiritRegenerationMageFire2Definition, improvedHealthMageFire1Definition, improvedHealthMageFire2Definition, improvedSpiritMageFire1Definition, improvedSpiritMageFire2Definition, spellCostMageFire1Definition, spellCostMageFire2Definition, fasterAttacksMageFire1Definition, fasterAttacksMageFire2Definition, improvedTurnMonsters1Definition, improvedTurnMonsters2Definition, improvedTurnMonsters3Definition, improvedFireRainMageFire1Definition, improvedFireRainMageFire2Definition, improvedFireballMageFire1Definition, improvedFireballMageFire2Definition;
export function initializeContentSkillsPyromancer() {
  improvedDamageMageFire1Definition = {
    c: "improvedDamageMageFire1",
    title: "伤害提高 I",
    e: "10%伤害加成",
    g: 10,
    f: 2
  };
  improvedDamageMageFire2Definition = {
    c: "improvedDamageMageFire2",
    title: "伤害提高 II",
    e: "10%伤害加成",
    g: 10,
    f: 2
  };
  improvedDamageMageFire3Definition = {
    c: "improvedDamageMageFire3",
    title: "伤害提高 III",
    e: "10%伤害加成",
    g: 10,
    f: 2
  };
  improvedArmorMageFire1Definition = {
    c: "improvedArmorMageFire1",
    title: "护甲提高 I",
    e: "10%护甲加成",
    g: 10,
    f: 3
  };
  improvedArmorMageFire2Definition = {
    c: "improvedArmorMageFire2",
    title: "护甲提高 II",
    e: "10%护甲加成",
    g: 10,
    f: 3
  };
  improvedArmorMageFire3Definition = {
    c: "improvedArmorMageFire3",
    title: "护甲提高 III",
    e: "10%护甲加成",
    g: 10,
    f: 3
  };
  improvedAttackRatingMageFire1Definition = {
    c: "improvedAttackRatingMageFire1",
    title: "攻击等级提高 I",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
  };
  improvedAttackRatingMageFire2Definition = {
    c: "improvedAttackRatingMageFire2",
    title: "攻击等级提高 II",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
  };
  improvedAttackRatingMageFire3Definition = {
    c: "improvedAttackRatingMageFire3",
    title: "攻击等级提高 III",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
  };
  improvedDefenseRatingMageFire1Definition = {
    c: "improvedDefenseRatingMageFire1",
    title: "防御等级提高 I",
    e: "10%防御等级加成",
    g: 10,
    f: 5
  };
  improvedDefenseRatingMageFire2Definition = {
    c: "improvedDefenseRatingMageFire2",
    title: "防御等级提高 II",
    e: "10%防御等级加成",
    g: 10,
    f: 5
  };
  improvedDefenseRatingMageFire3Definition = {
    c: "improvedDefenseRatingMageFire3",
    title: "防御等级提高 III",
    e: "10%防御等级加成",
    g: 10,
    f: 5
  };
  healthRegenerationMageFire1Definition = {
    c: "healthRegenerationMageFire1",
    title: "快速生命回复 I",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
  };
  healthRegenerationMageFire2Definition = {
    c: "healthRegenerationMageFire2",
    title: "快速生命回复 II",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
  };
  spiritRegenerationMageFire1Definition = {
    c: "spiritRegenerationMageFire1",
    title: "快速法力回复 I",
    e: "法力回复速率+1%",
    g: 1,
    f: 9
  };
  spiritRegenerationMageFire2Definition = {
    c: "spiritRegenerationMageFire2",
    title: "快速法力回复 II",
    e: "法力回复速率+1%",
    g: 1,
    f: 9
  };
  improvedHealthMageFire1Definition = {
    c: "improvedHealthMageFire1",
    title: "生命提高 I",
    e: "最大生命+20%",
    g: 20,
    f: 6
  };
  improvedHealthMageFire2Definition = {
    c: "improvedHealthMageFire2",
    title: "生命提高 II",
    e: "最大生命+20%",
    g: 20,
    f: 6
  };
  improvedSpiritMageFire1Definition = {
    c: "improvedSpiritMageFire1",
    title: "法力提高 I",
    e: "最大法力+20%",
    g: 20,
    f: 7
  };
  improvedSpiritMageFire2Definition = {
    c: "improvedSpiritMageFire2",
    title: "法力提高 II",
    e: "最大法力+20%",
    g: 20,
    f: 7
  };
  spellCostMageFire1Definition = {
    c: "spellCostMageFire1",
    title: "高效施法者 I",
    e: "技能消耗法力降低10%",
    g: 10,
    f: 16
  };
  spellCostMageFire2Definition = {
    c: "spellCostMageFire2",
    title: "高效施法者 II",
    e: "技能消耗法力降低10%",
    g: 10,
    f: 16
  };
  fasterAttacksMageFire1Definition = {
    c: "fasterAttacksMageFire1",
    title: "快速攻击 I",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
  };
  fasterAttacksMageFire2Definition = {
    c: "fasterAttacksMageFire2",
    title: "快速攻击 II",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
  };
  improvedTurnMonsters1Definition = {
    c: "improvedTurnMonsters1",
    title: "转变怪物提高 I",
    e: "转变更多怪物",
    g: 1,
    f: 27
  };
  improvedTurnMonsters2Definition = {
    c: "improvedTurnMonsters2",
    title: "转变怪物提高 II",
    e: "转变更多怪物",
    g: 2,
    f: 27
  };
  improvedTurnMonsters3Definition = {
    c: "improvedTurnMonsters3",
    title: "转变怪物提高 III",
    e: "转变更多怪物",
    g: 2,
    f: 27
  };
  improvedFireRainMageFire1Definition = {
    c: "improvedFireRainMageFire1",
    title: "火雨提高 I",
    e: "法术面积扩大.",
    g: 1,
    f: 22
  };
  improvedFireRainMageFire2Definition = {
    c: "improvedFireRainMageFire2",
    title: "火雨提高 II",
    e: "法术面积扩大.",
    g: 1,
    f: 22
  };
  improvedFireballMageFire1Definition = {
    c: "improvedFireballMageFire1",
    title: "火球提高 I",
    e: "大爆炸.",
    g: 1,
    f: 25
  };
  improvedFireballMageFire2Definition = {
    c: "improvedFireballMageFire2",
    title: "火球提高 II",
    e: "大爆炸.",
    g: 1,
    f: 25
  };
}
