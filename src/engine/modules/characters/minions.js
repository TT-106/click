/** 召唤物集合。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { game } from "../runtime/game.js";
export function MinionRegistry() {
  this.minionList = [];
}
export function clearMinions() {
  var a = game.minions;
  if (0 < a.minionList.length) {
    a.minionList.length = 0;
  }
}
export function initializeCharactersMinions() {
  MinionRegistry.prototype.removeMinion = function (a) {
    if (a) {
      var b = this.minionList.indexOf(a);
      if (-1 < b) {
        this.minionList.splice(b, 1);
      }
      b = game.allies;
      a = (/** @type {any} */ (b)).allies.indexOf(a);
      if (-1 < a) {
        (/** @type {any} */ (b)).allies.splice(a, 1);
      }
    }
  };
  MinionRegistry.prototype.addMinion = function (a) {
    this.minionList.push(a);
    game.allies.addAlly(a);
  };
}
