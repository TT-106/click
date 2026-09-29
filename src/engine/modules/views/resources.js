/** 黄金资源显示。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { View } from "./base.js";
import { setElementHtml } from "./dom.js";
import { formatGroupedAmount } from "../core/math.js";
/** @param {() => number} readGold */
export function GoldView(readGold) {
  this.readGold = readGold;
  this.elementId = "goldContainer";
  this.visible = true;
  this.amountElementId = "partyGoldPanel";
  this.cachedResourceCount = -1;
}
export function initializeViewsResources() {
  GoldView.prototype = new View();
  GoldView.prototype.reset = function () {
    this.cachedResourceCount = -1;
  };
  GoldView.prototype.update = function () {
    const gold = this.readGold();
    if (gold !== this.cachedResourceCount) {
      this.cachedResourceCount = gold;
      setElementHtml(this.amountElementId, "" + formatGroupedAmount(gold));
    }
  };
}
