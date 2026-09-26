/** 面板生命周期与组合视图。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { hideElementById, showElementById } from "./dom.js";
export function View() {
  this.elementId = null;
  this.cachedVisible = false;
}
export function CompositeView() {
  this.childViews = null;
}
export function addChildView(a, b) {
  if (b) {
    if (!a.childViews) {
      a.childViews = [];
    }
    a.childViews.push(b);
  }
}
export function resetChildViews(a) {
  if (a.childViews) {
    var b;
    for (b = 0; b < a.childViews.length; b++) {
      a.childViews[b].reset();
    }
  }
}
export function updateChildViews(a) {
  if (a.childViews) {
    var b;
    for (b = 0; b < a.childViews.length; b++) {
      a.childViews[b].render();
    }
  }
}
export function initializeViewsBase() {
  View.prototype.isVisible = function () {
    return (/** @type {any} */ (this)).visible;
  };
  View.prototype.reset = function () {};
  View.prototype.render = function () {
    if (this.elementId) {
      var a = (/** @type {any} */ (this)).isVisible();
      if (this.cachedVisible != a) {
        if (this.cachedVisible = a) {
          showElementById(this.elementId);
        } else {
          hideElementById(this.elementId);
        }
      }
      if (a) {
        (/** @type {any} */ (this)).update();
      }
    }
  };
  View.prototype.update = function () {};
  CompositeView.prototype = new View();
  CompositeView.prototype.reset = function () {
    resetChildViews(this);
  };
  CompositeView.prototype.update = function () {
    updateChildViews(this);
  };
}
