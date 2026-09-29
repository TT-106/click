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
    d,
    upgradeIndex;
  for (upgradeIndex = 0; upgradeIndex < skillTreeUpgrades.length; upgradeIndex++) {
    d = skillTreeUpgrades[upgradeIndex];
    if (d.getUpgradeType() === SKILL_UPGRADE_TYPE && d.isOwned()) {
      d = d.getUpgradeDefinition();
      applyStatBonus(character, d.statType, d.statBonusValue);
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
export function applyStatBonus(a, statType, statBonusValue) {
  a = a.stats;
  switch (statType) {
    case 1:
      a.damageResistance += statBonusValue;
      break;
    case 2:
      var statComponent = a.damage;
      statComponent.skillBonusPercent += statBonusValue;
      break;
    case 3:
      statComponent = a.armor;
      statComponent.skillBonusPercent += statBonusValue;
      break;
    case 4:
      statComponent = a.attackRating;
      statComponent.skillBonusPercent += statBonusValue;
      break;
    case 5:
      statComponent = a.defenceRating;
      statComponent.skillBonusPercent += statBonusValue;
      break;
    case 6:
      statComponent = a.maxHealth;
      statComponent.skillBonusPercent += statBonusValue;
      break;
    case 7:
      statComponent = a.maxSpirit;
      statComponent.skillBonusPercent += statBonusValue;
      break;
    case 8:
      a.healthRegenBonus += statBonusValue;
      break;
    case 9:
      a.spiritRegenBonus += statBonusValue;
      break;
    case 10:
      a.attackCooldownReduction += statBonusValue;
      break;
    case 11:
      a.healPotency += statBonusValue;
      break;
    case 13:
      a.buffArmorPotency += statBonusValue;
      break;
    case 12:
      a.buffDamagePotency += statBonusValue;
      break;
    case 14:
      a.buffAttackRatingPotency += statBonusValue;
      break;
    case 15:
      a.buffDefenceRatingPotency += statBonusValue;
      break;
    case 16:
      a.spellCostReduction += statBonusValue;
      break;
    case 17:
      a.critChance += statBonusValue;
      break;
    case 18:
      a.extraAttackCount += statBonusValue;
      break;
    case 19:
      a.extraAttackChance += statBonusValue;
      break;
    case 21:
      a.chainArcBonus += statBonusValue;
      break;
    case 20:
      a.controlTargetBonus += statBonusValue;
      break;
    case 27:
      a.transformTargetBonus += statBonusValue;
      break;
    case 22:
      a.rainAreaBonus += statBonusValue;
      break;
    case 25:
      a.areaRadiusBonus += 1;
      break;
    case 23:
      a.chainCount += statBonusValue;
      break;
    case 24:
      a.chainChance += statBonusValue;
      if (100 < a.chainChance) {
        a.chainChance = 100;
      }
      break;
    case 26:
      a.maxSummonedMinions += statBonusValue;
      break;
    case 28:
      a.swiftStrikeTargetBonus += statBonusValue;
      break;
    case 29:
      a.ricochetCountBonus += statBonusValue;
      break;
    case 30:
      a.barbarianChickenChance = statBonusValue;
      break;
    case 31:
      a.ninjaChickenChance = statBonusValue;
      break;
    case 32:
      a.rogueChickenChance = statBonusValue;
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
