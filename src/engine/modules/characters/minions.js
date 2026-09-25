// @ts-nocheck -- M10 渐进类型化：JSDoc 覆盖后摘除（见 docs/WORKSTATE.md）
/** 召唤物集合。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { game } from "../runtime/game.js";
export function MinionRegistry() {
  this.eh = [];
}
export function clearMinions() {
  var a = game.minions;
  if (0 < a.eh.length) {
    a.eh.length = 0;
  }
}
export function initializeCharactersMinions() {
  MinionRegistry.prototype.Lp = function (a) {
    if (a) {
      var b = this.eh.indexOf(a);
      if (-1 < b) {
        this.eh.splice(b, 1);
      }
      b = game.allies;
      a = b.Pf.indexOf(a);
      if (-1 < a) {
        b.Pf.splice(a, 1);
      }
    }
  };
  MinionRegistry.prototype.Tt = function (a) {
    this.eh.push(a);
    game.allies.Tt(a);
  };
}
