/** 角色状态集合与持续效果结算。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { game } from "../runtime/game.js";
import { addSpellStatBonus, statValue } from "./stats.js";
import { floorNumber } from "../core/math.js";
export function StatusEffect(a, b, c, d, f, g, h) {
  this.statusEffectTypeId = a;
  this.startTurn = b;
  this.durationTurns = c;
  this.animation = d;
  this.overlayFrameIndex = f;
  this.expired = false;
  this.hasAnimation = g;
  this.potencyMultiplier = h;
}
export function isDisablingEffect(a) {
  return 0 === a.statusEffectTypeId || 1 === a.statusEffectTypeId || 13 === a.statusEffectTypeId || 14 === a.statusEffectTypeId;
}
export function CharacterEffects(a) {
  this.no = a;
  this.isStunned = this.isStealthed = this.isConverted = this.isEnraged = this.hasStealthEffect = this.isDisabled = false;
  this.activeEffects = [];
}
export function updateCharacterEffects(a, b) {
  var c,
    d = game.state.turnNumber,
    f,
    g = false,
    h,
    l = a.isStunned;
  a.isDisabled = false;
  a.hasStealthEffect = false;
  a.isEnraged = false;
  a.isConverted = false;
  a.isStealthed = false;
  a.isStunned = false;
  var n = a.no.stats,
    p = n.damage,
    s = n.armor,
    u = n.attackRating,
    y = n.defenceRating;
  s.spellBonusPercent = 0;
  p.spellBonusPercent = 0;
  u.spellBonusPercent = 0;
  for (c = y.spellBonusPercent = 0; c < a.activeEffects.length; c++) {
    h = f = a.activeEffects[c];
    h.expired = d - h.startTurn >= h.durationTurns;
    if (h.expired) {
      g = true;
    } else {
      if (isDisablingEffect(f)) {
        a.isDisabled = true;
      }
      h = f.statusEffectTypeId;
      if (5 === h) {
        addSpellStatBonus(s, f.potencyMultiplier);
      } else {
        if (6 === h && p) {
          addSpellStatBonus(p, f.potencyMultiplier);
        } else {
          if (7 === h) {
            addSpellStatBonus(u, f.potencyMultiplier);
          } else {
            if (8 === h) {
              addSpellStatBonus(y, f.potencyMultiplier);
            } else {
              if (10 === h) {
                a.hasStealthEffect = true;
                addSpellStatBonus(y, f.potencyMultiplier);
              } else {
                if (11 === h) {
                  a.isStealthed = true;
                  addSpellStatBonus(u, f.potencyMultiplier);
                } else {
                  if (12 === h) {
                    a.isEnraged = true;
                    addSpellStatBonus(p, f.potencyMultiplier);
                  } else {
                    if (4 === h) {
                      a.isConverted = true;
                    } else {
                      if (13 === h) {
                        a.isStunned = true;
                      } else {
                        if (14 === h) {
                          a.isStunned = true;
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  if (g) {
    for (c = a.activeEffects.length - 1; 0 <= c; c--) {
      if (a.activeEffects[c].isExpired()) {
        a.activeEffects.splice(c, 1);
      }
    }
  }
  if (b && l && !a.isStunned) {
    n.health = floorNumber(statValue(n.maxHealth));
    n.spirit = statValue(n.maxSpirit);
  }
}
export function removeStunEffects(a) {
  if (0 < a.activeEffects.length) {
    var b, c;
    for (b = a.activeEffects.length - 1; 0 <= b; b--) {
      c = a.activeEffects[b];
      if (13 === c.statusEffectTypeId) {
        a.activeEffects.splice(b, 1);
      }
    }
  }
}
export function hasStatusEffect(a, b) {
  switch (b) {
    case 1:
    case 13:
    case 14:
    case 0:
      return a.isDisabled;
    case 4:
      return a.isConverted;
    case 10:
      return a.hasStealthEffect;
    case 12:
      return a.isEnraged;
  }
  return false;
}
export function initializeCharactersEffects() {
  StatusEffect.prototype.isExpired = function () {
    return this.expired;
  };
}
