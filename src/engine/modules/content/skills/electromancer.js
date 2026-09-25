/** 电法师技能定义。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
export var improvedDamageMageElectric1Definition, improvedDamageMageElectric2Definition, improvedDamageMageElectric3Definition, improvedArmorMageElectric1Definition, improvedArmorMageElectric2Definition, improvedArmorMageElectric3Definition, improvedAttackRatingMageElectric1Definition, improvedAttackRatingMageElectric2Definition, improvedAttackRatingMageElectric3Definition, improvedDefenseRatingMageElectric1Definition, improvedDefenseRatingMageElectric2Definition, improvedDefenseRatingMageElectric3Definition, healthRegenerationMageElectric1Definition, healthRegenerationMageElectric2Definition, spiritRegenerationMageElectric1Definition, spiritRegenerationMageElectric2Definition, improvedHealthMageElectric1Definition, improvedHealthMageElectric2Definition, improvedSpiritMageElectric1Definition, improvedSpiritMageElectric2Definition, spellCostMageElectric1Definition, spellCostMageElectric2Definition, fasterAttacksMageElectric1Definition, fasterAttacksMageElectric2Definition, improvedSpiderWebMageElectric1Definition, improvedSpiderWebMageElectric2Definition, improvedSpiderWebMageElectric3Definition, improvedChainLightningMageElectric1Definition, improvedChainLightningMageElectric2Definition, improvedChainLightningMageElectric3Definition, improvedLightningRainMageElectric1Definition, improvedLightningRainMageElectric2Definition;
export function initializeContentSkillsElectromancer() {
  improvedDamageMageElectric1Definition = {
    c: "improvedDamageMageElectric1",
    title: "伤害提高 I",
    e: "10%伤害加成",
    g: 10,
    f: 2
  };
  improvedDamageMageElectric2Definition = {
    c: "improvedDamageMageElectric2",
    title: "伤害提高 II",
    e: "10%伤害加成",
    g: 10,
    f: 2
  };
  improvedDamageMageElectric3Definition = {
    c: "improvedDamageMageElectric3",
    title: "伤害提高 III",
    e: "10%伤害加成",
    g: 10,
    f: 2
  };
  improvedArmorMageElectric1Definition = {
    c: "improvedArmorMageElectric1",
    title: "护甲提高 I",
    e: "10%护甲加成",
    g: 10,
    f: 3
  };
  improvedArmorMageElectric2Definition = {
    c: "improvedArmorMageElectric2",
    title: "护甲提高 II",
    e: "10%护甲加成",
    g: 10,
    f: 3
  };
  improvedArmorMageElectric3Definition = {
    c: "improvedArmorMageElectric3",
    title: "护甲提高 III",
    e: "10%护甲加成",
    g: 10,
    f: 3
  };
  improvedAttackRatingMageElectric1Definition = {
    c: "improvedAttackRatingMageElectric1",
    title: "攻击等级提高 I",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
  };
  improvedAttackRatingMageElectric2Definition = {
    c: "improvedAttackRatingMageElectric2",
    title: "攻击等级提高 II",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
  };
  improvedAttackRatingMageElectric3Definition = {
    c: "improvedAttackRatingMageElectric3",
    title: "攻击等级提高 III",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
  };
  improvedDefenseRatingMageElectric1Definition = {
    c: "improvedDefenseRatingMageElectric1",
    title: "防御等级提高 I",
    e: "10%防御等级加成",
    g: 10,
    f: 5
  };
  improvedDefenseRatingMageElectric2Definition = {
    c: "improvedDefenseRatingMageElectric2",
    title: "防御等级提高 II",
    e: "10%防御等级加成",
    g: 10,
    f: 5
  };
  improvedDefenseRatingMageElectric3Definition = {
    c: "improvedDefenseRatingMageElectric3",
    title: "防御等级提高 III",
    e: "10%防御等级加成",
    g: 10,
    f: 5
  };
  healthRegenerationMageElectric1Definition = {
    c: "healthRegenerationMageElectric1",
    title: "快速生命回复 I",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
  };
  healthRegenerationMageElectric2Definition = {
    c: "healthRegenerationMageElectric2",
    title: "快速生命回复 II",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
  };
  spiritRegenerationMageElectric1Definition = {
    c: "spiritRegenerationMageElectric1",
    title: "快速法力回复 I",
    e: "法力回复速率+1%",
    g: 1,
    f: 9
  };
  spiritRegenerationMageElectric2Definition = {
    c: "spiritRegenerationMageElectric2",
    title: "快速法力回复 II",
    e: "法力回复速率+1%",
    g: 1,
    f: 9
  };
  improvedHealthMageElectric1Definition = {
    c: "improvedHealthMageElectric1",
    title: "生命提高 I",
    e: "最大生命+20%",
    g: 20,
    f: 6
  };
  improvedHealthMageElectric2Definition = {
    c: "improvedHealthMageElectric2",
    title: "生命提高 II",
    e: "最大生命+20%",
    g: 20,
    f: 6
  };
  improvedSpiritMageElectric1Definition = {
    c: "improvedSpiritMageElectric1",
    title: "法力提高 I",
    e: "最大法力+20%",
    g: 20,
    f: 7
  };
  improvedSpiritMageElectric2Definition = {
    c: "improvedSpiritMageElectric2",
    title: "法力提高 II",
    e: "最大法力+20%",
    g: 20,
    f: 7
  };
  spellCostMageElectric1Definition = {
    c: "spellCostMageElectric1",
    title: "高效施法者 I",
    e: "技能消耗法力降低10%",
    g: 10,
    f: 16
  };
  spellCostMageElectric2Definition = {
    c: "spellCostMageElectric2",
    title: "高效施法者 II",
    e: "技能消耗法力降低10%",
    g: 10,
    f: 16
  };
  fasterAttacksMageElectric1Definition = {
    c: "fasterAttacksMageElectric1",
    title: "快速攻击 I",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
  };
  fasterAttacksMageElectric2Definition = {
    c: "fasterAttacksMageElectric2",
    title: "快速攻击 II",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
  };
  improvedSpiderWebMageElectric1Definition = {
    c: "improvedSpiderWebMageElectric1",
    title: "蛛网提高 I",
    e: "捕捉更多敌人",
    g: 1,
    f: 20
  };
  improvedSpiderWebMageElectric2Definition = {
    c: "improvedSpiderWebMageElectric2",
    title: "蛛网提高 II",
    e: "捕捉更多敌人",
    g: 2,
    f: 20
  };
  improvedSpiderWebMageElectric3Definition = {
    c: "improvedSpiderWebMageElectric3",
    title: "蛛网提高 III",
    e: "捕捉更多敌人",
    g: 2,
    f: 20
  };
  improvedChainLightningMageElectric1Definition = {
    c: "improvedChainLightningMageElectric1",
    title: "链形闪电提高 I",
    e: "闪电弧+2",
    g: 2,
    f: 21
  };
  improvedChainLightningMageElectric2Definition = {
    c: "improvedChainLightningMageElectric2",
    title: "链形闪电提高 II",
    e: "闪电弧+2",
    g: 2,
    f: 21
  };
  improvedChainLightningMageElectric3Definition = {
    c: "improvedChainLightningMageElectric3",
    title: "链形闪电提高 III",
    e: "闪电弧+2",
    g: 2,
    f: 21
  };
  improvedLightningRainMageElectric1Definition = {
    c: "improvedLightningRainMageElectric1",
    title: "闪电雨提高 I",
    e: "法术面积扩大.",
    g: 1,
    f: 22
  };
  improvedLightningRainMageElectric2Definition = {
    c: "improvedLightningRainMageElectric2",
    title: "闪电雨提高 II",
    e: "法术面积扩大.",
    g: 1,
    f: 22
  };
}
