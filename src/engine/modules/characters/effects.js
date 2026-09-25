// @ts-nocheck -- M10 渐进类型化：JSDoc 覆盖后摘除（见 docs/WORKSTATE.md）
/** 角色状态集合与持续效果结算。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { game } from "../runtime/game.js";
import { addSpellStatBonus, statValue } from "./stats.js";
import { floorNumber } from "../core/math.js";
export function StatusEffect(a, b, c, d, f, g, h) {
  this.statusEffectTypeId = a;
  this.jD = b;
  this.Qd = c;
  this.hD = d;
  this.Od = f;
  this.bg = false;
  this.Pd = g;
  this.Ok = h;
}
export function isDisablingEffect(a) {
  return 0 === a.statusEffectTypeId || 1 === a.statusEffectTypeId || 13 === a.statusEffectTypeId || 14 === a.statusEffectTypeId;
}
export function CharacterEffects(a) {
  this.no = a;
  this.Kf = this.wg = this.bi = this.Vs = this.Gn = this.Kd = false;
  this.of = [];
}
export function updateCharacterEffects(a, b) {
  var c,
    d = game.state.turnNumber,
    f,
    g = false,
    h,
    l = a.Kf;
  a.Kd = false;
  a.Gn = false;
  a.Vs = false;
  a.bi = false;
  a.wg = false;
  a.Kf = false;
  var n = a.no.stats,
    p = n.damage,
    s = n.armor,
    u = n.attackRating,
    y = n.defenceRating;
  s.spellBonusPercent = 0;
  p.spellBonusPercent = 0;
  u.spellBonusPercent = 0;
  for (c = y.spellBonusPercent = 0; c < a.of.length; c++) {
    h = f = a.of[c];
    h.bg = d - h.jD >= h.Qd;
    if (h.bg) {
      g = true;
    } else {
      if (isDisablingEffect(f)) {
        a.Kd = true;
      }
      h = f.statusEffectTypeId;
      if (5 === h) {
        addSpellStatBonus(s, f.Ok);
      } else {
        if (6 === h && p) {
          addSpellStatBonus(p, f.Ok);
        } else {
          if (7 === h) {
            addSpellStatBonus(u, f.Ok);
          } else {
            if (8 === h) {
              addSpellStatBonus(y, f.Ok);
            } else {
              if (10 === h) {
                a.Gn = true;
                addSpellStatBonus(y, f.Ok);
              } else {
                if (11 === h) {
                  a.wg = true;
                  addSpellStatBonus(u, f.Ok);
                } else {
                  if (12 === h) {
                    a.Vs = true;
                    addSpellStatBonus(p, f.Ok);
                  } else {
                    if (4 === h) {
                      a.bi = true;
                    } else {
                      if (13 === h) {
                        a.Kf = true;
                      } else {
                        if (14 === h) {
                          a.Kf = true;
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
    for (c = a.of.length - 1; 0 <= c; c--) {
      if (a.of[c].bl()) {
        a.of.splice(c, 1);
      }
    }
  }
  if (b && l && !a.Kf) {
    n.health = floorNumber(statValue(n.maxHealth));
    n.spirit = statValue(n.maxSpirit);
  }
}
export function removeStunEffects(a) {
  if (0 < a.of.length) {
    var b, c;
    for (b = a.of.length - 1; 0 <= b; b--) {
      c = a.of[b];
      if (13 === c.statusEffectTypeId) {
        a.of.splice(b, 1);
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
      return a.Kd;
    case 4:
      return a.bi;
    case 10:
      return a.Gn;
    case 12:
      return a.Vs;
  }
  return false;
}
export function initializeCharactersEffects() {
  StatusEffect.prototype.bl = function () {
    return this.bg;
  };
}
