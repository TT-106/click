/** 状态效果定义和技能属性增益。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { resetSkillStatBonuses } from "../characters/stats.js";
import { SKILL_UPGRADE_TYPE } from "../progression/upgrades.js";
export var stunEffectDefinition, statusEffectDefinitions;
export function recalculateCharacterSkills(character) {
  resetSkillStatBonuses(character.stats);
  applySkillTreeBonuses(character, character.skillTree1);
  applySkillTreeBonuses(character, character.skillTree2);
  applySkillTreeBonuses(character, character.skillTree3);
  applySkillTreeBonuses(character, character.skillTree4);
}
export function applySkillTreeBonuses(character, skillTree) {
  var skillTreeUpgrades = skillTree.upgrades,
    upgrade, upgradeDefinition,
    upgradeIndex;
  for (upgradeIndex = 0; upgradeIndex < skillTreeUpgrades.length; upgradeIndex++) {
    upgrade = skillTreeUpgrades[upgradeIndex];
    if (upgrade.getUpgradeType() === SKILL_UPGRADE_TYPE && upgrade.isOwned()) {
      upgradeDefinition = upgrade.getUpgradeDefinition();
      applyStatBonus(character, upgradeDefinition.statType, upgradeDefinition.statBonusValue);
    }
  }
}
export function applyBonusList(character, statBonusList) {
  if (statBonusList && 0 !== statBonusList.length) {
    var statBonus, statBonusIndex;
    resetSkillStatBonuses(character.stats);
    for (statBonusIndex = 0; statBonusIndex < statBonusList.length; statBonusIndex++) {
      statBonus = statBonusList[statBonusIndex];
      applyStatBonus(character, statBonus.statType, statBonus.statBonusValue);
    }
  }
}
export function applyStatBonus(character, statType, statBonusValue) {
  var stats = character.stats;
  switch (statType) {
    case 1:
      stats.damageResistance += statBonusValue;
      break;
    case 2:
      var statComponent = stats.damage;
      statComponent.skillBonusPercent += statBonusValue;
      break;
    case 3:
      statComponent = stats.armor;
      statComponent.skillBonusPercent += statBonusValue;
      break;
    case 4:
      statComponent = stats.attackRating;
      statComponent.skillBonusPercent += statBonusValue;
      break;
    case 5:
      statComponent = stats.defenceRating;
      statComponent.skillBonusPercent += statBonusValue;
      break;
    case 6:
      statComponent = stats.maxHealth;
      statComponent.skillBonusPercent += statBonusValue;
      break;
    case 7:
      statComponent = stats.maxSpirit;
      statComponent.skillBonusPercent += statBonusValue;
      break;
    case 8:
      stats.healthRegenBonus += statBonusValue;
      break;
    case 9:
      stats.spiritRegenBonus += statBonusValue;
      break;
    case 10:
      stats.attackCooldownReduction += statBonusValue;
      break;
    case 11:
      stats.healPotency += statBonusValue;
      break;
    case 13:
      stats.buffArmorPotency += statBonusValue;
      break;
    case 12:
      stats.buffDamagePotency += statBonusValue;
      break;
    case 14:
      stats.buffAttackRatingPotency += statBonusValue;
      break;
    case 15:
      stats.buffDefenceRatingPotency += statBonusValue;
      break;
    case 16:
      stats.spellCostReduction += statBonusValue;
      break;
    case 17:
      stats.critChance += statBonusValue;
      break;
    case 18:
      stats.extraAttackCount += statBonusValue;
      break;
    case 19:
      stats.extraAttackChance += statBonusValue;
      break;
    case 21:
      stats.chainArcBonus += statBonusValue;
      break;
    case 20:
      stats.controlTargetBonus += statBonusValue;
      break;
    case 27:
      stats.transformTargetBonus += statBonusValue;
      break;
    case 22:
      stats.rainAreaBonus += statBonusValue;
      break;
    case 25:
      stats.areaRadiusBonus += 1;
      break;
    case 23:
      stats.chainCount += statBonusValue;
      break;
    case 24:
      stats.chainChance += statBonusValue;
      if (100 < stats.chainChance) {
        stats.chainChance = 100;
      }
      break;
    case 26:
      stats.maxSummonedMinions += statBonusValue;
      break;
    case 28:
      stats.swiftStrikeTargetBonus += statBonusValue;
      break;
    case 29:
      stats.ricochetCountBonus += statBonusValue;
      break;
    case 30:
      stats.barbarianChickenChance = statBonusValue;
      break;
    case 31:
      stats.ninjaChickenChance = statBonusValue;
      break;
    case 32:
      stats.rogueChickenChance = statBonusValue;
  }
}
export function initializeCombatSkillEffects() {
  stunEffectDefinition = {
    statusEffectTypeId: 13,
    spritesheetPath: "spritesheet/SpellFXAnim2.png",
    animationName: "Bubbles",
    overlayFrameIndex: 1,
    hasAnimation: false,
    durationTurns: 100,
    tooltipLabel: "昏迷"
  };
  statusEffectDefinitions = {
    0: {
      statusEffectTypeId: 0,
      spritesheetPath: "spritesheet/SpellFXAnim4.png",
      animationName: "Sleep",
      overlayFrameIndex: 7,
      hasAnimation: true,
      durationTurns: 100,
      tooltipLabel: "睡着"
    },
    1: {
      statusEffectTypeId: 1,
      spritesheetPath: "spritesheet/SpellFXAnim1.png",
      animationName: "Spider Web",
      overlayFrameIndex: 7,
      hasAnimation: true,
      durationTurns: 100,
      tooltipLabel: "定身"
    },
    3: {
      statusEffectTypeId: 3,
      spritesheetPath: "spritesheet/SpellFXAnim4.png",
      animationName: "Blind Eye Blink",
      overlayFrameIndex: 7,
      hasAnimation: true,
      durationTurns: 100,
      tooltipLabel: "失明"
    },
    4: {
      statusEffectTypeId: 4,
      spritesheetPath: "spritesheet/SpellFXAnim4.png",
      animationName: "Red Eye Blink",
      overlayFrameIndex: 6,
      hasAnimation: true,
      durationTurns: 100,
      tooltipLabel: "转变"
    },
    5: {
      statusEffectTypeId: 5,
      spritesheetPath: "spritesheet/SpellFXAnim3.png",
      animationName: "Shield",
      overlayFrameIndex: 6,
      hasAnimation: false,
      durationTurns: 700,
      tooltipLabel: "护甲提高"
    },
    6: {
      statusEffectTypeId: 6,
      spritesheetPath: "spritesheet/SpellFXAnim3.png",
      animationName: "Arm Flex",
      overlayFrameIndex: 0,
      hasAnimation: false,
      durationTurns: 700,
      tooltipLabel: "伤害提高"
    },
    7: {
      statusEffectTypeId: 7,
      spritesheetPath: "spritesheet/SpellFXAnim4.png",
      animationName: "Eagle",
      overlayFrameIndex: 0,
      hasAnimation: false,
      durationTurns: 700,
      tooltipLabel: "攻击等级提高"
    },
    8: {
      statusEffectTypeId: 8,
      spritesheetPath: "spritesheet/SpellFXAnim4.png",
      animationName: "Armor",
      overlayFrameIndex: 3,
      hasAnimation: false,
      durationTurns: 700,
      tooltipLabel: "防御等级提高"
    },
    9: {
      statusEffectTypeId: 9,
      spritesheetPath: "spritesheet/SpellFXAnim3.png",
      animationName: "Super Speed",
      overlayFrameIndex: 0,
      hasAnimation: false,
      durationTurns: 100,
      tooltipLabel: "迅捷"
    },
    10: {
      statusEffectTypeId: 10,
      spritesheetPath: "spritesheet/SpellFXAnim3.png",
      animationName: "Target",
      overlayFrameIndex: 8,
      hasAnimation: false,
      durationTurns: 50,
      tooltipLabel: "怪物目标"
    },
    11: {
      statusEffectTypeId: 11,
      spritesheetPath: "spritesheet/SpellFXAnim3.png",
      animationName: "Color Spiral",
      overlayFrameIndex: 8,
      hasAnimation: false,
      durationTurns: 50,
      tooltipLabel: "潜行模式"
    },
    12: {
      statusEffectTypeId: 12,
      spritesheetPath: "spritesheet/SpellFXAnim4.png",
      animationName: "Totems",
      overlayFrameIndex: 2,
      hasAnimation: false,
      durationTurns: 50,
      tooltipLabel: "暴怒"
    }
  };
  statusEffectDefinitions[13] = stunEffectDefinition;
  statusEffectDefinitions[14] = {
    statusEffectTypeId: 14,
    spritesheetPath: "spritesheet/SpellFXAnim2.png",
    animationName: "Bubbles",
    overlayFrameIndex: 1,
    hasAnimation: false,
    durationTurns: 10,
    tooltipLabel: "Stunned"
  };
}
