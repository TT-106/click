/** 鸡王技能定义。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
export var improvedDamageChickenKing1Definition, improvedDamageChickenKing2Definition, improvedDamageChickenKing3Definition, improvedArmorChickenKing1Definition, improvedArmorChickenKing2Definition, improvedArmorChickenKing3Definition, improvedAttackRatingChickenKing1Definition, improvedAttackRatingChickenKing2Definition, improvedAttackRatingChickenKing3Definition, improvedDefenseRatingChickenKing1Definition, improvedDefenseRatingChickenKing2Definition, improvedDefenseRatingChickenKing3Definition, healthRegenerationChickenKing1Definition, healthRegenerationChickenKing2Definition, spiritRegenerationChickenKing1Definition, spiritRegenerationChickenKing2Definition, improvedHealthChickenKing1Definition, improvedHealthChickenKing2Definition, improvedSpiritChickenKing1Definition, improvedSpiritChickenKing2Definition, spellCostChickenKing1Definition, spellCostChickenKing2Definition, fasterAttacksChickenKing1Definition, fasterAttacksChickenKing2Definition, largerFlockChickenKing1Definition, largerFlockChickenKing2Definition, largerFlockChickenKing3Definition, largerFlockChickenKing4Definition, largerFlockChickenKing5Definition, largerFlockChickenKing6Definition, barbarianChanceChickenKingDefinition, ninjaChanceChickenKingDefinition, rogueChanceChickenKingDefinition;
export function initializeContentSkillsChickenKing() {
  improvedDamageChickenKing1Definition = {
    id: "improvedDamageChickenKing1",
    title: "伤害+10%",
    description: "宠物加成",
    statBonusValue: 10,
    statType: 2
  };
  improvedDamageChickenKing2Definition = {
    id: "improvedDamageChickenKing2",
    title: "伤害+10%",
    description: "宠物加成",
    statBonusValue: 10,
    statType: 2
  };
  improvedDamageChickenKing3Definition = {
    id: "improvedDamageChickenKing3",
    title: "伤害+10%",
    description: "宠物加成",
    statBonusValue: 10,
    statType: 2
  };
  improvedArmorChickenKing1Definition = {
    id: "improvedArmorChickenKing1",
    title: "护甲+10%",
    description: "宠物和召唤者加成",
    statBonusValue: 10,
    statType: 3
  };
  improvedArmorChickenKing2Definition = {
    id: "improvedArmorChickenKing2",
    title: "护甲+10%",
    description: "宠物和召唤者加成",
    statBonusValue: 10,
    statType: 3
  };
  improvedArmorChickenKing3Definition = {
    id: "improvedArmorChickenKing3",
    title: "护甲+10%",
    description: "宠物和召唤者加成",
    statBonusValue: 10,
    statType: 3
  };
  improvedAttackRatingChickenKing1Definition = {
    id: "improvedAttackRatingChickenKing1",
    title: "攻击等级+10%",
    description: "宠物加成",
    statBonusValue: 10,
    statType: 4
  };
  improvedAttackRatingChickenKing2Definition = {
    id: "improvedAttackRatingChickenKing2",
    title: "攻击等级+10%",
    description: "宠物加成",
    statBonusValue: 10,
    statType: 4
  };
  improvedAttackRatingChickenKing3Definition = {
    id: "improvedAttackRatingChickenKing3",
    title: "攻击等级+10%",
    description: "宠物加成",
    statBonusValue: 10,
    statType: 4
  };
  improvedDefenseRatingChickenKing1Definition = {
    id: "improvedDefenseRatingChickenKing1",
    title: "防御等级+10%",
    description: "宠物和召唤者加成",
    statBonusValue: 10,
    statType: 5
  };
  improvedDefenseRatingChickenKing2Definition = {
    id: "improvedDefenseRatingChickenKing2",
    title: "防御等级+10%",
    description: "宠物和召唤者加成",
    statBonusValue: 10,
    statType: 5
  };
  improvedDefenseRatingChickenKing3Definition = {
    id: "improvedDefenseRatingChickenKing3",
    title: "防御等级+10%",
    description: "宠物和召唤者加成",
    statBonusValue: 10,
    statType: 5
  };
  healthRegenerationChickenKing1Definition = {
    id: "healthRegenerationChickenKing1",
    title: "生命回复等级+1%",
    description: "宠物和召唤者加成",
    statBonusValue: 1,
    statType: 8
  };
  healthRegenerationChickenKing2Definition = {
    id: "healthRegenerationChickenKing2",
    title: "生命回复等级+1%",
    description: "宠物和召唤者加成",
    statBonusValue: 1,
    statType: 8
  };
  spiritRegenerationChickenKing1Definition = {
    id: "spiritRegenerationChickenKing1",
    title: "法力回复速率+1%",
    description: "宠物和召唤者加成",
    statBonusValue: 1,
    statType: 9
  };
  spiritRegenerationChickenKing2Definition = {
    id: "spiritRegenerationChickenKing2",
    title: "法力回复速率+1%",
    description: "宠物和召唤者加成",
    statBonusValue: 1,
    statType: 9
  };
  improvedHealthChickenKing1Definition = {
    id: "improvedHealthChickenKing1",
    title: "最大生命+20%",
    description: "宠物和召唤者加成",
    statBonusValue: 20,
    statType: 6
  };
  improvedHealthChickenKing2Definition = {
    id: "improvedHealthChickenKing2",
    title: "最大生命+20%",
    description: "宠物和召唤者加成",
    statBonusValue: 20,
    statType: 6
  };
  improvedSpiritChickenKing1Definition = {
    id: "improvedSpiritChickenKing1",
    title: "最大法力+20%",
    description: "宠物和召唤者加成",
    statBonusValue: 20,
    statType: 7
  };
  improvedSpiritChickenKing2Definition = {
    id: "improvedSpiritChickenKing2",
    title: "最大法力+20%",
    description: "宠物和召唤者加成",
    statBonusValue: 20,
    statType: 7
  };
  spellCostChickenKing1Definition = {
    id: "spellCostChickenKing1",
    title: "技能消耗法力降低10%",
    description: "宠物和召唤者加成",
    statBonusValue: 10,
    statType: 16
  };
  spellCostChickenKing2Definition = {
    id: "spellCostChickenKing2",
    title: "技能消耗法力降低10%",
    description: "宠物和召唤者加成",
    statBonusValue: 10,
    statType: 16
  };
  fasterAttacksChickenKing1Definition = {
    id: "fasterAttacksChickenKing1",
    title: "攻击冷却时间减少",
    description: "宠物和召唤者加成",
    statBonusValue: 2,
    statType: 10
  };
  fasterAttacksChickenKing2Definition = {
    id: "fasterAttacksChickenKing2",
    title: "攻击冷却时间减少",
    description: "宠物和召唤者加成",
    statBonusValue: 2,
    statType: 10
  };
  largerFlockChickenKing1Definition = {
    id: "largerFlockChickenKing1",
    title: "我爱小鸡!",
    description: "多一只鸡",
    statBonusValue: 1,
    statType: 26
  };
  largerFlockChickenKing2Definition = {
    id: "largerFlockChickenKing2",
    title: "小鸡军队",
    description: "多一只鸡",
    statBonusValue: 1,
    statType: 26
  };
  largerFlockChickenKing3Definition = {
    id: "largerFlockChickenKing3",
    title: "鸡瘟致死",
    description: "多一只鸡",
    statBonusValue: 1,
    statType: 26
  };
  largerFlockChickenKing4Definition = {
    id: "largerFlockChickenKing4",
    title: "小鸡派对",
    description: "多一只鸡",
    statBonusValue: 1,
    statType: 26
  };
  largerFlockChickenKing5Definition = {
    id: "largerFlockChickenKing5",
    title: "鸡群",
    description: "多一只鸡",
    statBonusValue: 1,
    statType: 26
  };
  largerFlockChickenKing6Definition = {
    id: "largerFlockChickenKing6",
    title: "家禽领地",
    description: "多一只鸡",
    statBonusValue: 1,
    statType: 26
  };
  barbarianChanceChickenKingDefinition = {
    id: "barbarianChanceChickenKing",
    title: "小鸡几率:野蛮人",
    description: "25%几率为野蛮人",
    statBonusValue: 25,
    statType: 30
  };
  ninjaChanceChickenKingDefinition = {
    id: "ninjaChanceChickenKing",
    title: "小鸡几率:忍者",
    description: "25%几率为忍者",
    statBonusValue: 25,
    statType: 31
  };
  rogueChanceChickenKingDefinition = {
    id: "rogueChanceChickenKing",
    title: "小鸡几率:盗贼",
    description: "25%几率为盗贼",
    statBonusValue: 25,
    statType: 32
  };
}
