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
export function addChildView(parentView, childView) {
  if (childView) {
    if (!parentView.childViews) {
      parentView.childViews = [];
    }
    parentView.childViews.push(childView);
  }
}
export function resetChildViews(parentView) {
  if (parentView.childViews) {
    var childIndex;
    for (childIndex = 0; childIndex < parentView.childViews.length; childIndex++) {
      parentView.childViews[childIndex].reset();
    }
  }
}
export function updateChildViews(parentView) {
  if (parentView.childViews) {
    var childIndex;
    for (childIndex = 0; childIndex < parentView.childViews.length; childIndex++) {
      parentView.childViews[childIndex].render();
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
      var visible = (/** @type {any} */ (this)).isVisible();
      if (this.cachedVisible != visible) {
        if (this.cachedVisible = visible) {
          showElementById(this.elementId);
        } else {
          hideElementById(this.elementId);
        }
      }
      if (visible) {
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
