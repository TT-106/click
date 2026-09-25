/** 面板生命周期与组合视图。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { hideElementById, showElementById } from "./dom.js";
export function View() {
  this.elementId = null;
  this.Vw = false;
}
export function CompositeView() {
  this.Lg = null;
}
export function addChildView(a, b) {
  if (b) {
    if (!a.Lg) {
      a.Lg = [];
    }
    a.Lg.push(b);
  }
}
export function resetChildViews(a) {
  if (a.Lg) {
    var b;
    for (b = 0; b < a.Lg.length; b++) {
      a.Lg[b].reset();
    }
  }
}
export function updateChildViews(a) {
  if (a.Lg) {
    var b;
    for (b = 0; b < a.Lg.length; b++) {
      a.Lg[b].render();
    }
  }
}
export function initializeViewsBase() {
  View.prototype.isVisible = function () {
    return this.visible;
  };
  View.prototype.reset = function () {};
  View.prototype.render = function () {
    if (this.elementId) {
      var a = this.isVisible();
      if (this.Vw != a) {
        if (this.Vw = a) {
          showElementById(this.elementId);
        } else {
          hideElementById(this.elementId);
        }
      }
      if (a) {
        this.update();
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
