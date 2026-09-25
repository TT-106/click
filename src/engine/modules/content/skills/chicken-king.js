/** 鸡王技能定义。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
export var improvedDamageChickenKing1Definition, improvedDamageChickenKing2Definition, improvedDamageChickenKing3Definition, improvedArmorChickenKing1Definition, improvedArmorChickenKing2Definition, improvedArmorChickenKing3Definition, improvedAttackRatingChickenKing1Definition, improvedAttackRatingChickenKing2Definition, improvedAttackRatingChickenKing3Definition, improvedDefenseRatingChickenKing1Definition, improvedDefenseRatingChickenKing2Definition, improvedDefenseRatingChickenKing3Definition, healthRegenerationChickenKing1Definition, healthRegenerationChickenKing2Definition, spiritRegenerationChickenKing1Definition, spiritRegenerationChickenKing2Definition, improvedHealthChickenKing1Definition, improvedHealthChickenKing2Definition, improvedSpiritChickenKing1Definition, improvedSpiritChickenKing2Definition, spellCostChickenKing1Definition, spellCostChickenKing2Definition, fasterAttacksChickenKing1Definition, fasterAttacksChickenKing2Definition, largerFlockChickenKing1Definition, largerFlockChickenKing2Definition, largerFlockChickenKing3Definition, largerFlockChickenKing4Definition, largerFlockChickenKing5Definition, largerFlockChickenKing6Definition, barbarianChanceChickenKingDefinition, ninjaChanceChickenKingDefinition, rogueChanceChickenKingDefinition;
export function initializeContentSkillsChickenKing() {
  improvedDamageChickenKing1Definition = {
    c: "improvedDamageChickenKing1",
    title: "伤害+10%",
    e: "宠物加成",
    g: 10,
    f: 2
  };
  improvedDamageChickenKing2Definition = {
    c: "improvedDamageChickenKing2",
    title: "伤害+10%",
    e: "宠物加成",
    g: 10,
    f: 2
  };
  improvedDamageChickenKing3Definition = {
    c: "improvedDamageChickenKing3",
    title: "伤害+10%",
    e: "宠物加成",
    g: 10,
    f: 2
  };
  improvedArmorChickenKing1Definition = {
    c: "improvedArmorChickenKing1",
    title: "护甲+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 3
  };
  improvedArmorChickenKing2Definition = {
    c: "improvedArmorChickenKing2",
    title: "护甲+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 3
  };
  improvedArmorChickenKing3Definition = {
    c: "improvedArmorChickenKing3",
    title: "护甲+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 3
  };
  improvedAttackRatingChickenKing1Definition = {
    c: "improvedAttackRatingChickenKing1",
    title: "攻击等级+10%",
    e: "宠物加成",
    g: 10,
    f: 4
  };
  improvedAttackRatingChickenKing2Definition = {
    c: "improvedAttackRatingChickenKing2",
    title: "攻击等级+10%",
    e: "宠物加成",
    g: 10,
    f: 4
  };
  improvedAttackRatingChickenKing3Definition = {
    c: "improvedAttackRatingChickenKing3",
    title: "攻击等级+10%",
    e: "宠物加成",
    g: 10,
    f: 4
  };
  improvedDefenseRatingChickenKing1Definition = {
    c: "improvedDefenseRatingChickenKing1",
    title: "防御等级+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 5
  };
  improvedDefenseRatingChickenKing2Definition = {
    c: "improvedDefenseRatingChickenKing2",
    title: "防御等级+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 5
  };
  improvedDefenseRatingChickenKing3Definition = {
    c: "improvedDefenseRatingChickenKing3",
    title: "防御等级+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 5
  };
  healthRegenerationChickenKing1Definition = {
    c: "healthRegenerationChickenKing1",
    title: "生命回复等级+1%",
    e: "宠物和召唤者加成",
    g: 1,
    f: 8
  };
  healthRegenerationChickenKing2Definition = {
    c: "healthRegenerationChickenKing2",
    title: "生命回复等级+1%",
    e: "宠物和召唤者加成",
    g: 1,
    f: 8
  };
  spiritRegenerationChickenKing1Definition = {
    c: "spiritRegenerationChickenKing1",
    title: "法力回复速率+1%",
    e: "宠物和召唤者加成",
    g: 1,
    f: 9
  };
  spiritRegenerationChickenKing2Definition = {
    c: "spiritRegenerationChickenKing2",
    title: "法力回复速率+1%",
    e: "宠物和召唤者加成",
    g: 1,
    f: 9
  };
  improvedHealthChickenKing1Definition = {
    c: "improvedHealthChickenKing1",
    title: "最大生命+20%",
    e: "宠物和召唤者加成",
    g: 20,
    f: 6
  };
  improvedHealthChickenKing2Definition = {
    c: "improvedHealthChickenKing2",
    title: "最大生命+20%",
    e: "宠物和召唤者加成",
    g: 20,
    f: 6
  };
  improvedSpiritChickenKing1Definition = {
    c: "improvedSpiritChickenKing1",
    title: "最大法力+20%",
    e: "宠物和召唤者加成",
    g: 20,
    f: 7
  };
  improvedSpiritChickenKing2Definition = {
    c: "improvedSpiritChickenKing2",
    title: "最大法力+20%",
    e: "宠物和召唤者加成",
    g: 20,
    f: 7
  };
  spellCostChickenKing1Definition = {
    c: "spellCostChickenKing1",
    title: "技能消耗法力降低10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 16
  };
  spellCostChickenKing2Definition = {
    c: "spellCostChickenKing2",
    title: "技能消耗法力降低10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 16
  };
  fasterAttacksChickenKing1Definition = {
    c: "fasterAttacksChickenKing1",
    title: "攻击冷却时间减少",
    e: "宠物和召唤者加成",
    g: 2,
    f: 10
  };
  fasterAttacksChickenKing2Definition = {
    c: "fasterAttacksChickenKing2",
    title: "攻击冷却时间减少",
    e: "宠物和召唤者加成",
    g: 2,
    f: 10
  };
  largerFlockChickenKing1Definition = {
    c: "largerFlockChickenKing1",
    title: "我爱小鸡!",
    e: "多一只鸡",
    g: 1,
    f: 26
  };
  largerFlockChickenKing2Definition = {
    c: "largerFlockChickenKing2",
    title: "小鸡军队",
    e: "多一只鸡",
    g: 1,
    f: 26
  };
  largerFlockChickenKing3Definition = {
    c: "largerFlockChickenKing3",
    title: "鸡瘟致死",
    e: "多一只鸡",
    g: 1,
    f: 26
  };
  largerFlockChickenKing4Definition = {
    c: "largerFlockChickenKing4",
    title: "小鸡派对",
    e: "多一只鸡",
    g: 1,
    f: 26
  };
  largerFlockChickenKing5Definition = {
    c: "largerFlockChickenKing5",
    title: "鸡群",
    e: "多一只鸡",
    g: 1,
    f: 26
  };
  largerFlockChickenKing6Definition = {
    c: "largerFlockChickenKing6",
    title: "家禽领地",
    e: "多一只鸡",
    g: 1,
    f: 26
  };
  barbarianChanceChickenKingDefinition = {
    c: "barbarianChanceChickenKing",
    title: "小鸡几率:野蛮人",
    e: "25%几率为野蛮人",
    g: 25,
    f: 30
  };
  ninjaChanceChickenKingDefinition = {
    c: "ninjaChanceChickenKing",
    title: "小鸡几率:忍者",
    e: "25%几率为忍者",
    g: 25,
    f: 31
  };
  rogueChanceChickenKingDefinition = {
    c: "rogueChanceChickenKing",
    title: "小鸡几率:盗贼",
    e: "25%几率为盗贼",
    g: 25,
    f: 32
  };
}
