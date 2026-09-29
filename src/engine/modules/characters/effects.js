/** 角色状态集合与持续效果结算。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { addSpellStatBonus, statValue } from "./stats.js";
import { floorNumber } from "../core/math.js";
export function StatusEffect(typeId, startTurn, durationTurns, animation, overlayFrameIndex, hasAnimation, potencyMultiplier) {
  this.statusEffectTypeId = typeId;
  this.startTurn = startTurn;
  this.durationTurns = durationTurns;
  this.animation = animation;
  this.overlayFrameIndex = overlayFrameIndex;
  this.expired = false;
  this.hasAnimation = hasAnimation;
  this.potencyMultiplier = potencyMultiplier;
}
export function isDisablingEffect(effect) {
  return 0 === effect.statusEffectTypeId || 1 === effect.statusEffectTypeId || 13 === effect.statusEffectTypeId || 14 === effect.statusEffectTypeId;
}
export function CharacterEffects(owner) {
  this.owner = owner;
  this.isStunned = this.isStealthed = this.isConverted = this.isEnraged = this.hasStealthEffect = this.isDisabled = false;
  this.activeEffects = [];
}
/** @param {number} currentTurn */
export function updateCharacterEffects(effects, restoreOnStunEnd, currentTurn) {
  let expiredEffectFound = false;
  const wasStunned = effects.isStunned;
  effects.isDisabled = false;
  effects.hasStealthEffect = false;
  effects.isEnraged = false;
  effects.isConverted = false;
  effects.isStealthed = false;
  effects.isStunned = false;
  const stats = effects.owner.stats;
  const damage = stats.damage;
  const armor = stats.armor;
  const attackRating = stats.attackRating;
  const defenceRating = stats.defenceRating;
  armor.spellBonusPercent = 0;
  damage.spellBonusPercent = 0;
  attackRating.spellBonusPercent = 0;
  defenceRating.spellBonusPercent = 0;
  for (let effectIndex = 0; effectIndex < effects.activeEffects.length; effectIndex++) {
    const effect = effects.activeEffects[effectIndex];
    effect.expired = currentTurn - effect.startTurn >= effect.durationTurns;
    if (effect.expired) {
      expiredEffectFound = true;
    } else {
      if (isDisablingEffect(effect)) {
        effects.isDisabled = true;
      }
      const typeId = effect.statusEffectTypeId;
      if (5 === typeId) {
        addSpellStatBonus(armor, effect.potencyMultiplier);
      } else if (6 === typeId && damage) {
        addSpellStatBonus(damage, effect.potencyMultiplier);
      } else if (7 === typeId) {
        addSpellStatBonus(attackRating, effect.potencyMultiplier);
      } else if (8 === typeId) {
        addSpellStatBonus(defenceRating, effect.potencyMultiplier);
      } else if (10 === typeId) {
        effects.hasStealthEffect = true;
        addSpellStatBonus(defenceRating, effect.potencyMultiplier);
      } else if (11 === typeId) {
        effects.isStealthed = true;
        addSpellStatBonus(attackRating, effect.potencyMultiplier);
      } else if (12 === typeId) {
        effects.isEnraged = true;
        addSpellStatBonus(damage, effect.potencyMultiplier);
      } else if (4 === typeId) {
        effects.isConverted = true;
      } else if (13 === typeId || 14 === typeId) {
        effects.isStunned = true;
      }
    }
  }
  if (expiredEffectFound) {
    for (let effectIndex = effects.activeEffects.length - 1; 0 <= effectIndex; effectIndex--) {
      if (effects.activeEffects[effectIndex].isExpired()) {
        effects.activeEffects.splice(effectIndex, 1);
      }
    }
  }
  if (restoreOnStunEnd && wasStunned && !effects.isStunned) {
    stats.health = floorNumber(statValue(stats.maxHealth));
    stats.spirit = statValue(stats.maxSpirit);
  }
}
export function removeStunEffects(effects) {
  if (0 < effects.activeEffects.length) {
    for (let effectIndex = effects.activeEffects.length - 1; 0 <= effectIndex; effectIndex--) {
      const effect = effects.activeEffects[effectIndex];
      if (13 === effect.statusEffectTypeId) {
        effects.activeEffects.splice(effectIndex, 1);
      }
    }
  }
}
export function hasStatusEffect(effects, typeId) {
  switch (typeId) {
    case 1:
    case 13:
    case 14:
    case 0:
      return effects.isDisabled;
    case 4:
      return effects.isConverted;
    case 10:
      return effects.hasStealthEffect;
    case 12:
      return effects.isEnraged;
  }
  return false;
}
export function initializeCharactersEffects() {
  StatusEffect.prototype.isExpired = function () {
    return this.expired;
  };
}
