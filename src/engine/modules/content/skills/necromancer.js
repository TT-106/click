// @ts-nocheck -- M10 渐进类型化：JSDoc 覆盖后摘除（见 docs/WORKSTATE.md）
/** 死灵法师技能定义。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
export var improvedDamageNecromancer1Definition, improvedDamageNecromancer2Definition, improvedDamageNecromancer3Definition, improvedArmorNecromancer1Definition, improvedArmorNecromancer2Definition, improvedArmorNecromancer3Definition, improvedAttackRatingNecromancer1Definition, improvedAttackRatingNecromancer2Definition, improvedAttackRatingNecromancer3Definition, improvedDefenseRatingNecromancer1Definition, improvedDefenseRatingNecromancer2Definition, improvedDefenseRatingNecromancer3Definition, healthRegenerationNecromancer1Definition, healthRegenerationNecromancer2Definition, spiritRegenerationNecromancer1Definition, spiritRegenerationNecromancer2Definition, improvedHealthNecromancer1Definition, improvedHealthNecromancer2Definition, improvedHealthNecromancer3Definition, improvedSpiritNecromancer1Definition, improvedSpiritNecromancer2Definition, spellCostNecromancer1Definition, spellCostNecromancer2Definition, fasterAttacksNecromancer1Definition, fasterAttacksNecromancer2Definition, largerSkeletonArmyNecromancer1Definition, largerSkeletonArmyNecromancer2Definition, largerSkeletonArmyNecromancer3Definition, greenDeathRicochetCountNecromancer1Definition, greenDeathRicochetCountNecromancer2Definition, greenDeathRicochetCountNecromancer3Definition;
export function initializeContentSkillsNecromancer() {
  improvedDamageNecromancer1Definition = {
    id: "improvedDamageNecromancer1",
    title: "伤害+10%",
    description: "宠物和召唤者加成",
    statBonusValue: 10,
    statType: 2
  };
  improvedDamageNecromancer2Definition = {
    id: "improvedDamageNecromancer2",
    title: "伤害+10%",
    description: "宠物和召唤者加成",
    statBonusValue: 10,
    statType: 2
  };
  improvedDamageNecromancer3Definition = {
    id: "improvedDamageNecromancer3",
    title: "伤害+10%",
    description: "宠物和召唤者加成",
    statBonusValue: 10,
    statType: 2
  };
  improvedArmorNecromancer1Definition = {
    id: "improvedArmorNecromancer1",
    title: "护甲+10%",
    description: "宠物和召唤者加成",
    statBonusValue: 10,
    statType: 3
  };
  improvedArmorNecromancer2Definition = {
    id: "improvedArmorNecromancer2",
    title: "护甲+10%",
    description: "宠物和召唤者加成",
    statBonusValue: 10,
    statType: 3
  };
  improvedArmorNecromancer3Definition = {
    id: "improvedArmorNecromancer3",
    title: "护甲+10%",
    description: "宠物和召唤者加成",
    statBonusValue: 10,
    statType: 3
  };
  improvedAttackRatingNecromancer1Definition = {
    id: "improvedAttackRatingNecromancer1",
    title: "攻击等级+10%",
    description: "宠物和召唤者加成",
    statBonusValue: 10,
    statType: 4
  };
  improvedAttackRatingNecromancer2Definition = {
    id: "improvedAttackRatingNecromancer2",
    title: "攻击等级+10%",
    description: "宠物和召唤者加成",
    statBonusValue: 10,
    statType: 4
  };
  improvedAttackRatingNecromancer3Definition = {
    id: "improvedAttackRatingNecromancer3",
    title: "攻击等级+10%",
    description: "宠物和召唤者加成",
    statBonusValue: 10,
    statType: 4
  };
  improvedDefenseRatingNecromancer1Definition = {
    id: "improvedDefenseRatingNecromancer1",
    title: "防御等级+10%",
    description: "宠物和召唤者加成",
    statBonusValue: 10,
    statType: 5
  };
  improvedDefenseRatingNecromancer2Definition = {
    id: "improvedDefenseRatingNecromancer2",
    title: "防御等级+10%",
    description: "宠物和召唤者加成",
    statBonusValue: 10,
    statType: 5
  };
  improvedDefenseRatingNecromancer3Definition = {
    id: "improvedDefenseRatingNecromancer3",
    title: "防御等级+10%",
    description: "宠物和召唤者加成",
    statBonusValue: 10,
    statType: 5
  };
  healthRegenerationNecromancer1Definition = {
    id: "healthRegenerationNecromancer1",
    title: "生命回复等级+1%",
    description: "宠物和召唤者加成",
    statBonusValue: 1,
    statType: 8
  };
  healthRegenerationNecromancer2Definition = {
    id: "healthRegenerationNecromancer2",
    title: "生命回复等级+1%",
    description: "宠物和召唤者加成",
    statBonusValue: 1,
    statType: 8
  };
  spiritRegenerationNecromancer1Definition = {
    id: "spiritRegenerationNecromancer1",
    title: "法力回复速率+1%",
    description: "宠物和召唤者加成",
    statBonusValue: 1,
    statType: 9
  };
  spiritRegenerationNecromancer2Definition = {
    id: "spiritRegenerationNecromancer2",
    title: "法力回复速率+1%",
    description: "宠物和召唤者加成",
    statBonusValue: 1,
    statType: 9
  };
  improvedHealthNecromancer1Definition = {
    id: "improvedHealthNecromancer1",
    title: "最大生命+20%",
    description: "宠物和召唤者加成",
    statBonusValue: 20,
    statType: 6
  };
  improvedHealthNecromancer2Definition = {
    id: "improvedHealthNecromancer2",
    title: "最大生命+20%",
    description: "宠物和召唤者加成",
    statBonusValue: 20,
    statType: 6
  };
  improvedHealthNecromancer3Definition = {
    id: "improvedHealthNecromancer3",
    title: "生命提高+20%",
    description: "宠物和召唤者加成",
    statBonusValue: 20,
    statType: 6
  };
  improvedSpiritNecromancer1Definition = {
    id: "improvedSpiritNecromancer1",
    title: "最大法力+20%",
    description: "宠物和召唤者加成",
    statBonusValue: 20,
    statType: 7
  };
  improvedSpiritNecromancer2Definition = {
    id: "improvedSpiritNecromancer2",
    title: "最大法力+20%",
    description: "宠物和召唤者加成",
    statBonusValue: 20,
    statType: 7
  };
  spellCostNecromancer1Definition = {
    id: "spellCostNecromancer1",
    title: "最大法力+20%",
    description: "宠物和召唤者加成",
    statBonusValue: 10,
    statType: 16
  };
  spellCostNecromancer2Definition = {
    id: "spellCostNecromancer2",
    title: "最大法力+20%",
    description: "宠物和召唤者加成",
    statBonusValue: 10,
    statType: 16
  };
  fasterAttacksNecromancer1Definition = {
    id: "fasterAttacksNecromancer1",
    title: "攻击冷却时间减少",
    description: "宠物和召唤者加成",
    statBonusValue: 2,
    statType: 10
  };
  fasterAttacksNecromancer2Definition = {
    id: "fasterAttacksNecromancer2",
    title: "攻击冷却时间减少",
    description: "宠物和召唤者加成",
    statBonusValue: 2,
    statType: 10
  };
  largerSkeletonArmyNecromancer1Definition = {
    id: "largerSkeletonArmyNecromancer1",
    title: "更多骷髅",
    description: "更多死亡,更多屠杀",
    statBonusValue: 1,
    statType: 26
  };
  largerSkeletonArmyNecromancer2Definition = {
    id: "largerSkeletonArmyNecromancer2",
    title: "更多骷髅",
    description: "更多死亡,更多屠杀",
    statBonusValue: 1,
    statType: 26
  };
  largerSkeletonArmyNecromancer3Definition = {
    id: "largerSkeletonArmyNecromancer3",
    title: "更多骷髅",
    description: "更多死亡,更多屠杀",
    statBonusValue: 1,
    statType: 26
  };
  greenDeathRicochetCountNecromancer1Definition = {
    id: "greenDeathRicochetCountNecromancer1",
    title: "绿色死亡 II",
    description: "更多绿色死亡",
    statBonusValue: 1,
    statType: 29
  };
  greenDeathRicochetCountNecromancer2Definition = {
    id: "greenDeathRicochetCountNecromancer2",
    title: "绿色死亡 III",
    description: "更多绿色死亡",
    statBonusValue: 1,
    statType: 29
  };
  greenDeathRicochetCountNecromancer3Definition = {
    id: "greenDeathRicochetCountNecromancer3",
    title: "绿色死亡 IV",
    description: "更多绿色死亡",
    statBonusValue: 1,
    statType: 29
  };
}
