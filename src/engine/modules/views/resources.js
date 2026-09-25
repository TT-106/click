// @ts-nocheck -- M10 渐进类型化：JSDoc 覆盖后摘除（见 docs/WORKSTATE.md）
/** 黄金资源显示。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { View } from "./base.js";
import { game } from "../runtime/game.js";
import { setElementHtml } from "./dom.js";
import { formatGroupedAmount } from "../core/math.js";
export function GoldView() {
  this.elementId = "goldContainer";
  this.visible = true;
  this.uD = "partyGoldPanel";
  this.Dk = -1;
}
export function initializeViewsResources() {
  GoldView.prototype = new View();
  GoldView.prototype.reset = function () {
    this.Dk = -1;
  };
  GoldView.prototype.update = function () {
    var a = game.state.party.gold;
    if (a !== this.Dk) {
      this.Dk = a;
      setElementHtml(this.uD, "" + formatGroupedAmount(a));
    }
  };
}
