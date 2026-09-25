/** 德鲁伊技能定义。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
export var improvedDamageDruid1Definition, improvedDamageDruid2Definition, improvedDamageDruid3Definition, improvedArmorDruid1Definition, improvedArmorDruid2Definition, improvedArmorDruid3Definition, improvedAttackRatingDruid1Definition, improvedAttackRatingDruid2Definition, improvedAttackRatingDruid3Definition, improvedDefenseRatingDruid1Definition, improvedDefenseRatingDruid2Definition, improvedDefenseRatingDruid3Definition, healthRegenerationDruid1Definition, healthRegenerationDruid2Definition, spiritRegenerationDruid1Definition, spiritRegenerationDruid2Definition, improvedHealthDruid1Definition, improvedHealthDruid2Definition, improvedSpiritDruid1Definition, improvedSpiritDruid2Definition, spellCostDruid1Definition, spellCostDruid2Definition, fasterAttacksDruid1Definition, fasterAttacksDruid2Definition, largerWolfPackDruid1Definition, largerWolfPackDruid2Definition, largerWolfPackDruid3Definition, largerWolfPackDruid4Definition, largerWolfPackDruid5Definition, improvedSleepDruid1Definition, improvedSleepDruid2Definition, improvedSleepDruid3Definition;
export function initializeContentSkillsDruid() {
  improvedDamageDruid1Definition = {
    id: "improvedDamageDruid1",
    title: "伤害+10%",
    e: "宠物加成",
    g: 10,
    f: 2
  };
  improvedDamageDruid2Definition = {
    id: "improvedDamageDruid2",
    title: "伤害+10%",
    e: "宠物加成",
    g: 10,
    f: 2
  };
  improvedDamageDruid3Definition = {
    id: "improvedDamageDruid3",
    title: "伤害+10%",
    e: "宠物加成",
    g: 10,
    f: 2
  };
  improvedArmorDruid1Definition = {
    id: "improvedArmorDruid1",
    title: "护甲+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 3
  };
  improvedArmorDruid2Definition = {
    id: "improvedArmorDruid2",
    title: "护甲+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 3
  };
  improvedArmorDruid3Definition = {
    id: "improvedArmorDruid3",
    title: "护甲+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 3
  };
  improvedAttackRatingDruid1Definition = {
    id: "improvedAttackRatingDruid1",
    title: "攻击等级+10%",
    e: "宠物加成",
    g: 10,
    f: 4
  };
  improvedAttackRatingDruid2Definition = {
    id: "improvedAttackRatingDruid2",
    title: "攻击等级+10%",
    e: "宠物加成",
    g: 10,
    f: 4
  };
  improvedAttackRatingDruid3Definition = {
    id: "improvedAttackRatingDruid3",
    title: "攻击等级+10%",
    e: "宠物加成",
    g: 10,
    f: 4
  };
  improvedDefenseRatingDruid1Definition = {
    id: "improvedDefenseRatingDruid1",
    title: "防御等级+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 5
  };
  improvedDefenseRatingDruid2Definition = {
    id: "improvedDefenseRatingDruid2",
    title: "防御等级+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 5
  };
  improvedDefenseRatingDruid3Definition = {
    id: "improvedDefenseRatingDruid3",
    title: "防御等级+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 5
  };
  healthRegenerationDruid1Definition = {
    id: "healthRegenerationDruid1",
    title: "生命回复等级+1%",
    e: "宠物和召唤者加成",
    g: 1,
    f: 8
  };
  healthRegenerationDruid2Definition = {
    id: "healthRegenerationDruid2",
    title: "生命回复等级+1%",
    e: "宠物和召唤者加成",
    g: 1,
    f: 8
  };
  spiritRegenerationDruid1Definition = {
    id: "spiritRegenerationDruid1",
    title: "法力回复速率+1%",
    e: "宠物和召唤者加成",
    g: 1,
    f: 9
  };
  spiritRegenerationDruid2Definition = {
    id: "spiritRegenerationDruid2",
    title: "法力回复速率+1%",
    e: "宠物和召唤者加成",
    g: 1,
    f: 9
  };
  improvedHealthDruid1Definition = {
    id: "improvedHealthDruid1",
    title: "最大生命+20%",
    e: "宠物和召唤者加成",
    g: 20,
    f: 6
  };
  improvedHealthDruid2Definition = {
    id: "improvedHealthDruid2",
    title: "最大生命+20%",
    e: "宠物和召唤者加成",
    g: 20,
    f: 6
  };
  improvedSpiritDruid1Definition = {
    id: "improvedSpiritDruid1",
    title: "最大法力+20%",
    e: "宠物和召唤者加成",
    g: 20,
    f: 7
  };
  improvedSpiritDruid2Definition = {
    id: "improvedSpiritDruid2",
    title: "最大法力+20%",
    e: "宠物和召唤者加成",
    g: 20,
    f: 7
  };
  spellCostDruid1Definition = {
    id: "spellCostDruid1",
    title: "技能消耗法力降低10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 16
  };
  spellCostDruid2Definition = {
    id: "spellCostDruid2",
    title: "技能消耗法力降低10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 16
  };
  fasterAttacksDruid1Definition = {
    id: "fasterAttacksDruid1",
    title: "攻击冷却时间减少",
    e: "宠物和召唤者加成",
    g: 2,
    f: 10
  };
  fasterAttacksDruid2Definition = {
    id: "fasterAttacksDruid2",
    title: "攻击冷却时间减少",
    e: "宠物和召唤者加成",
    g: 2,
    f: 10
  };
  largerWolfPackDruid1Definition = {
    id: "largerWolfPackDruid1",
    title: "大型狼群",
    e: "更多野狼,更多杀戮",
    g: 1,
    f: 26
  };
  largerWolfPackDruid2Definition = {
    id: "largerWolfPackDruid2",
    title: "大型狼群",
    e: "更多野狼,更多杀戮",
    g: 1,
    f: 26
  };
  largerWolfPackDruid3Definition = {
    id: "largerWolfPackDruid3",
    title: "大型狼群",
    e: "更多野狼,更多杀戮",
    g: 1,
    f: 26
  };
  largerWolfPackDruid4Definition = {
    id: "largerWolfPackDruid4",
    title: "大型狼群",
    e: "更多野狼,更多杀戮",
    g: 1,
    f: 26
  };
  largerWolfPackDruid5Definition = {
    id: "largerWolfPackDruid5",
    title: "大型狼群",
    e: "更多野狼,更多杀戮",
    g: 1,
    f: 26
  };
  improvedSleepDruid1Definition = {
    id: "improvedSleepDruid1",
    title: "睡眠提高 I",
    e: "更多怪物陷入睡眠",
    g: 1,
    f: 20
  };
  improvedSleepDruid2Definition = {
    id: "improvedSleepDruid2",
    title: "睡眠提高 II",
    e: "更多怪物陷入睡眠",
    g: 2,
    f: 20
  };
  improvedSleepDruid3Definition = {
    id: "improvedSleepDruid3",
    title: "睡眠提高 III",
    e: "更多怪物陷入睡眠",
    g: 2,
    f: 20
  };
}
