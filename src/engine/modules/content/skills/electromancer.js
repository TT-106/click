/** 电法师技能定义。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
export var improvedDamageMageElectric1Definition, improvedDamageMageElectric2Definition, improvedDamageMageElectric3Definition, improvedArmorMageElectric1Definition, improvedArmorMageElectric2Definition, improvedArmorMageElectric3Definition, improvedAttackRatingMageElectric1Definition, improvedAttackRatingMageElectric2Definition, improvedAttackRatingMageElectric3Definition, improvedDefenseRatingMageElectric1Definition, improvedDefenseRatingMageElectric2Definition, improvedDefenseRatingMageElectric3Definition, healthRegenerationMageElectric1Definition, healthRegenerationMageElectric2Definition, spiritRegenerationMageElectric1Definition, spiritRegenerationMageElectric2Definition, improvedHealthMageElectric1Definition, improvedHealthMageElectric2Definition, improvedSpiritMageElectric1Definition, improvedSpiritMageElectric2Definition, spellCostMageElectric1Definition, spellCostMageElectric2Definition, fasterAttacksMageElectric1Definition, fasterAttacksMageElectric2Definition, improvedSpiderWebMageElectric1Definition, improvedSpiderWebMageElectric2Definition, improvedSpiderWebMageElectric3Definition, improvedChainLightningMageElectric1Definition, improvedChainLightningMageElectric2Definition, improvedChainLightningMageElectric3Definition, improvedLightningRainMageElectric1Definition, improvedLightningRainMageElectric2Definition;
export function initializeContentSkillsElectromancer() {
  improvedDamageMageElectric1Definition = {
    id: "improvedDamageMageElectric1",
    title: "伤害提高 I",
    description: "10%伤害加成",
    statBonusValue: 10,
    statType: 2
  };
  improvedDamageMageElectric2Definition = {
    id: "improvedDamageMageElectric2",
    title: "伤害提高 II",
    description: "10%伤害加成",
    statBonusValue: 10,
    statType: 2
  };
  improvedDamageMageElectric3Definition = {
    id: "improvedDamageMageElectric3",
    title: "伤害提高 III",
    description: "10%伤害加成",
    statBonusValue: 10,
    statType: 2
  };
  improvedArmorMageElectric1Definition = {
    id: "improvedArmorMageElectric1",
    title: "护甲提高 I",
    description: "10%护甲加成",
    statBonusValue: 10,
    statType: 3
  };
  improvedArmorMageElectric2Definition = {
    id: "improvedArmorMageElectric2",
    title: "护甲提高 II",
    description: "10%护甲加成",
    statBonusValue: 10,
    statType: 3
  };
  improvedArmorMageElectric3Definition = {
    id: "improvedArmorMageElectric3",
    title: "护甲提高 III",
    description: "10%护甲加成",
    statBonusValue: 10,
    statType: 3
  };
  improvedAttackRatingMageElectric1Definition = {
    id: "improvedAttackRatingMageElectric1",
    title: "攻击等级提高 I",
    description: "10%攻击等级加成",
    statBonusValue: 10,
    statType: 4
  };
  improvedAttackRatingMageElectric2Definition = {
    id: "improvedAttackRatingMageElectric2",
    title: "攻击等级提高 II",
    description: "10%攻击等级加成",
    statBonusValue: 10,
    statType: 4
  };
  improvedAttackRatingMageElectric3Definition = {
    id: "improvedAttackRatingMageElectric3",
    title: "攻击等级提高 III",
    description: "10%攻击等级加成",
    statBonusValue: 10,
    statType: 4
  };
  improvedDefenseRatingMageElectric1Definition = {
    id: "improvedDefenseRatingMageElectric1",
    title: "防御等级提高 I",
    description: "10%防御等级加成",
    statBonusValue: 10,
    statType: 5
  };
  improvedDefenseRatingMageElectric2Definition = {
    id: "improvedDefenseRatingMageElectric2",
    title: "防御等级提高 II",
    description: "10%防御等级加成",
    statBonusValue: 10,
    statType: 5
  };
  improvedDefenseRatingMageElectric3Definition = {
    id: "improvedDefenseRatingMageElectric3",
    title: "防御等级提高 III",
    description: "10%防御等级加成",
    statBonusValue: 10,
    statType: 5
  };
  healthRegenerationMageElectric1Definition = {
    id: "healthRegenerationMageElectric1",
    title: "快速生命回复 I",
    description: "生命回复速率+1%",
    statBonusValue: 1,
    statType: 8
  };
  healthRegenerationMageElectric2Definition = {
    id: "healthRegenerationMageElectric2",
    title: "快速生命回复 II",
    description: "生命回复速率+1%",
    statBonusValue: 1,
    statType: 8
  };
  spiritRegenerationMageElectric1Definition = {
    id: "spiritRegenerationMageElectric1",
    title: "快速法力回复 I",
    description: "法力回复速率+1%",
    statBonusValue: 1,
    statType: 9
  };
  spiritRegenerationMageElectric2Definition = {
    id: "spiritRegenerationMageElectric2",
    title: "快速法力回复 II",
    description: "法力回复速率+1%",
    statBonusValue: 1,
    statType: 9
  };
  improvedHealthMageElectric1Definition = {
    id: "improvedHealthMageElectric1",
    title: "生命提高 I",
    description: "最大生命+20%",
    statBonusValue: 20,
    statType: 6
  };
  improvedHealthMageElectric2Definition = {
    id: "improvedHealthMageElectric2",
    title: "生命提高 II",
    description: "最大生命+20%",
    statBonusValue: 20,
    statType: 6
  };
  improvedSpiritMageElectric1Definition = {
    id: "improvedSpiritMageElectric1",
    title: "法力提高 I",
    description: "最大法力+20%",
    statBonusValue: 20,
    statType: 7
  };
  improvedSpiritMageElectric2Definition = {
    id: "improvedSpiritMageElectric2",
    title: "法力提高 II",
    description: "最大法力+20%",
    statBonusValue: 20,
    statType: 7
  };
  spellCostMageElectric1Definition = {
    id: "spellCostMageElectric1",
    title: "高效施法者 I",
    description: "技能消耗法力降低10%",
    statBonusValue: 10,
    statType: 16
  };
  spellCostMageElectric2Definition = {
    id: "spellCostMageElectric2",
    title: "高效施法者 II",
    description: "技能消耗法力降低10%",
    statBonusValue: 10,
    statType: 16
  };
  fasterAttacksMageElectric1Definition = {
    id: "fasterAttacksMageElectric1",
    title: "快速攻击 I",
    description: "攻击冷却时间减少",
    statBonusValue: 2,
    statType: 10
  };
  fasterAttacksMageElectric2Definition = {
    id: "fasterAttacksMageElectric2",
    title: "快速攻击 II",
    description: "攻击冷却时间减少",
    statBonusValue: 2,
    statType: 10
  };
  improvedSpiderWebMageElectric1Definition = {
    id: "improvedSpiderWebMageElectric1",
    title: "蛛网提高 I",
    description: "捕捉更多敌人",
    statBonusValue: 1,
    statType: 20
  };
  improvedSpiderWebMageElectric2Definition = {
    id: "improvedSpiderWebMageElectric2",
    title: "蛛网提高 II",
    description: "捕捉更多敌人",
    statBonusValue: 2,
    statType: 20
  };
  improvedSpiderWebMageElectric3Definition = {
    id: "improvedSpiderWebMageElectric3",
    title: "蛛网提高 III",
    description: "捕捉更多敌人",
    statBonusValue: 2,
    statType: 20
  };
  improvedChainLightningMageElectric1Definition = {
    id: "improvedChainLightningMageElectric1",
    title: "链形闪电提高 I",
    description: "闪电弧+2",
    statBonusValue: 2,
    statType: 21
  };
  improvedChainLightningMageElectric2Definition = {
    id: "improvedChainLightningMageElectric2",
    title: "链形闪电提高 II",
    description: "闪电弧+2",
    statBonusValue: 2,
    statType: 21
  };
  improvedChainLightningMageElectric3Definition = {
    id: "improvedChainLightningMageElectric3",
    title: "链形闪电提高 III",
    description: "闪电弧+2",
    statBonusValue: 2,
    statType: 21
  };
  improvedLightningRainMageElectric1Definition = {
    id: "improvedLightningRainMageElectric1",
    title: "闪电雨提高 I",
    description: "法术面积扩大.",
    statBonusValue: 1,
    statType: 22
  };
  improvedLightningRainMageElectric2Definition = {
    id: "improvedLightningRainMageElectric2",
    title: "闪电雨提高 II",
    description: "法术面积扩大.",
    statBonusValue: 1,
    statType: 22
  };
}
