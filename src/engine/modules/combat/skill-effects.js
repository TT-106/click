/** 状态效果定义和技能属性增益。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { resetSkillStatBonuses } from "../characters/stats.js";
import { SKILL_UPGRADE_TYPE } from "../progression/upgrades.js";
export var stunEffectDefinition, statusEffectDefinitions;
export function recalculateCharacterSkills(a) {
  resetSkillStatBonuses(a.stats);
  applySkillTreeBonuses(a, a.skillTree1);
  applySkillTreeBonuses(a, a.skillTree2);
  applySkillTreeBonuses(a, a.skillTree3);
  applySkillTreeBonuses(a, a.skillTree4);
}
export function applySkillTreeBonuses(a, b) {
  var c = b.upgrades,
    d,
    f;
  for (f = 0; f < c.length; f++) {
    d = c[f];
    if (d.getUpgradeType() === SKILL_UPGRADE_TYPE && d.isOwned()) {
      d = d.Jr();
      applyStatBonus(a, d.statType, d.statBonusValue);
    }
  }
}
export function applyBonusList(a, b) {
  if (b && 0 !== b.length) {
    var c, d;
    resetSkillStatBonuses(a.stats);
    for (d = 0; d < b.length; d++) {
      c = b[d];
      applyStatBonus(a, c.statType, c.statBonusValue);
    }
  }
}
export function applyStatBonus(a, b, c) {
  a = a.stats;
  switch (b) {
    case 1:
      a.wo += c;
      break;
    case 2:
      b = a.damage;
      b.skillBonusPercent += c;
      break;
    case 3:
      b = a.armor;
      b.skillBonusPercent += c;
      break;
    case 4:
      b = a.attackRating;
      b.skillBonusPercent += c;
      break;
    case 5:
      b = a.defenceRating;
      b.skillBonusPercent += c;
      break;
    case 6:
      b = a.maxHealth;
      b.skillBonusPercent += c;
      break;
    case 7:
      b = a.maxSpirit;
      b.skillBonusPercent += c;
      break;
    case 8:
      a.healthRegenBonus += c;
      break;
    case 9:
      a.spiritRegenBonus += c;
      break;
    case 10:
      a.attackCooldownReduction += c;
      break;
    case 11:
      a.Ts += c;
      break;
    case 13:
      a.Ps += c;
      break;
    case 12:
      a.Rs += c;
      break;
    case 14:
      a.Qs += c;
      break;
    case 15:
      a.Ss += c;
      break;
    case 16:
      a.spellCostReduction += c;
      break;
    case 17:
      a.lm += c;
      break;
    case 18:
      a.extraAttackCount += c;
      break;
    case 19:
      a.extraAttackChance += c;
      break;
    case 21:
      a.chainArcBonus += c;
      break;
    case 20:
      a.controlTargetBonus += c;
      break;
    case 27:
      a.transformTargetBonus += c;
      break;
    case 22:
      a.rainAreaBonus += c;
      break;
    case 25:
      a.areaRadiusBonus += 1;
      break;
    case 23:
      a.chainCount += c;
      break;
    case 24:
      a.chainChance += c;
      if (100 < a.chainChance) {
        a.chainChance = 100;
      }
      break;
    case 26:
      a.maxSummonedMinions += c;
      break;
    case 28:
      a.swiftStrikeTargetBonus += c;
      break;
    case 29:
      a.ricochetCountBonus += c;
      break;
    case 30:
      a.ku = c;
      break;
    case 31:
      a.lu = c;
      break;
    case 32:
      a.mu = c;
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
