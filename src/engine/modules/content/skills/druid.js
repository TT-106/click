/** 德鲁伊技能定义。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
export var improvedDamageDruid1Definition, improvedDamageDruid2Definition, improvedDamageDruid3Definition, improvedArmorDruid1Definition, improvedArmorDruid2Definition, improvedArmorDruid3Definition, improvedAttackRatingDruid1Definition, improvedAttackRatingDruid2Definition, improvedAttackRatingDruid3Definition, improvedDefenseRatingDruid1Definition, improvedDefenseRatingDruid2Definition, improvedDefenseRatingDruid3Definition, healthRegenerationDruid1Definition, healthRegenerationDruid2Definition, spiritRegenerationDruid1Definition, spiritRegenerationDruid2Definition, improvedHealthDruid1Definition, improvedHealthDruid2Definition, improvedSpiritDruid1Definition, improvedSpiritDruid2Definition, spellCostDruid1Definition, spellCostDruid2Definition, fasterAttacksDruid1Definition, fasterAttacksDruid2Definition, largerWolfPackDruid1Definition, largerWolfPackDruid2Definition, largerWolfPackDruid3Definition, largerWolfPackDruid4Definition, largerWolfPackDruid5Definition, improvedSleepDruid1Definition, improvedSleepDruid2Definition, improvedSleepDruid3Definition;
export function initializeContentSkillsDruid() {
  improvedDamageDruid1Definition = {
    c: "improvedDamageDruid1",
    title: "伤害+10%",
    e: "宠物加成",
    g: 10,
    f: 2
  };
  improvedDamageDruid2Definition = {
    c: "improvedDamageDruid2",
    title: "伤害+10%",
    e: "宠物加成",
    g: 10,
    f: 2
  };
  improvedDamageDruid3Definition = {
    c: "improvedDamageDruid3",
    title: "伤害+10%",
    e: "宠物加成",
    g: 10,
    f: 2
  };
  improvedArmorDruid1Definition = {
    c: "improvedArmorDruid1",
    title: "护甲+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 3
  };
  improvedArmorDruid2Definition = {
    c: "improvedArmorDruid2",
    title: "护甲+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 3
  };
  improvedArmorDruid3Definition = {
    c: "improvedArmorDruid3",
    title: "护甲+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 3
  };
  improvedAttackRatingDruid1Definition = {
    c: "improvedAttackRatingDruid1",
    title: "攻击等级+10%",
    e: "宠物加成",
    g: 10,
    f: 4
  };
  improvedAttackRatingDruid2Definition = {
    c: "improvedAttackRatingDruid2",
    title: "攻击等级+10%",
    e: "宠物加成",
    g: 10,
    f: 4
  };
  improvedAttackRatingDruid3Definition = {
    c: "improvedAttackRatingDruid3",
    title: "攻击等级+10%",
    e: "宠物加成",
    g: 10,
    f: 4
  };
  improvedDefenseRatingDruid1Definition = {
    c: "improvedDefenseRatingDruid1",
    title: "防御等级+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 5
  };
  improvedDefenseRatingDruid2Definition = {
    c: "improvedDefenseRatingDruid2",
    title: "防御等级+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 5
  };
  improvedDefenseRatingDruid3Definition = {
    c: "improvedDefenseRatingDruid3",
    title: "防御等级+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 5
  };
  healthRegenerationDruid1Definition = {
    c: "healthRegenerationDruid1",
    title: "生命回复等级+1%",
    e: "宠物和召唤者加成",
    g: 1,
    f: 8
  };
  healthRegenerationDruid2Definition = {
    c: "healthRegenerationDruid2",
    title: "生命回复等级+1%",
    e: "宠物和召唤者加成",
    g: 1,
    f: 8
  };
  spiritRegenerationDruid1Definition = {
    c: "spiritRegenerationDruid1",
    title: "法力回复速率+1%",
    e: "宠物和召唤者加成",
    g: 1,
    f: 9
  };
  spiritRegenerationDruid2Definition = {
    c: "spiritRegenerationDruid2",
    title: "法力回复速率+1%",
    e: "宠物和召唤者加成",
    g: 1,
    f: 9
  };
  improvedHealthDruid1Definition = {
    c: "improvedHealthDruid1",
    title: "最大生命+20%",
    e: "宠物和召唤者加成",
    g: 20,
    f: 6
  };
  improvedHealthDruid2Definition = {
    c: "improvedHealthDruid2",
    title: "最大生命+20%",
    e: "宠物和召唤者加成",
    g: 20,
    f: 6
  };
  improvedSpiritDruid1Definition = {
    c: "improvedSpiritDruid1",
    title: "最大法力+20%",
    e: "宠物和召唤者加成",
    g: 20,
    f: 7
  };
  improvedSpiritDruid2Definition = {
    c: "improvedSpiritDruid2",
    title: "最大法力+20%",
    e: "宠物和召唤者加成",
    g: 20,
    f: 7
  };
  spellCostDruid1Definition = {
    c: "spellCostDruid1",
    title: "技能消耗法力降低10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 16
  };
  spellCostDruid2Definition = {
    c: "spellCostDruid2",
    title: "技能消耗法力降低10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 16
  };
  fasterAttacksDruid1Definition = {
    c: "fasterAttacksDruid1",
    title: "攻击冷却时间减少",
    e: "宠物和召唤者加成",
    g: 2,
    f: 10
  };
  fasterAttacksDruid2Definition = {
    c: "fasterAttacksDruid2",
    title: "攻击冷却时间减少",
    e: "宠物和召唤者加成",
    g: 2,
    f: 10
  };
  largerWolfPackDruid1Definition = {
    c: "largerWolfPackDruid1",
    title: "大型狼群",
    e: "更多野狼,更多杀戮",
    g: 1,
    f: 26
  };
  largerWolfPackDruid2Definition = {
    c: "largerWolfPackDruid2",
    title: "大型狼群",
    e: "更多野狼,更多杀戮",
    g: 1,
    f: 26
  };
  largerWolfPackDruid3Definition = {
    c: "largerWolfPackDruid3",
    title: "大型狼群",
    e: "更多野狼,更多杀戮",
    g: 1,
    f: 26
  };
  largerWolfPackDruid4Definition = {
    c: "largerWolfPackDruid4",
    title: "大型狼群",
    e: "更多野狼,更多杀戮",
    g: 1,
    f: 26
  };
  largerWolfPackDruid5Definition = {
    c: "largerWolfPackDruid5",
    title: "大型狼群",
    e: "更多野狼,更多杀戮",
    g: 1,
    f: 26
  };
  improvedSleepDruid1Definition = {
    c: "improvedSleepDruid1",
    title: "睡眠提高 I",
    e: "更多怪物陷入睡眠",
    g: 1,
    f: 20
  };
  improvedSleepDruid2Definition = {
    c: "improvedSleepDruid2",
    title: "睡眠提高 II",
    e: "更多怪物陷入睡眠",
    g: 2,
    f: 20
  };
  improvedSleepDruid3Definition = {
    c: "improvedSleepDruid3",
    title: "睡眠提高 III",
    e: "更多怪物陷入睡眠",
    g: 2,
    f: 20
  };
}
