/** 战斗文字的生命周期与坐标投影。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { randomInt } from "../core/math.js";
import { game } from "../runtime/game.js";
import { projectDungeonX, projectDungeonY } from "../simulation/characters.js";
export function FloatingText(a, b) {
  this.text = a;
  this.SE = b;
  this.frameAge = this.yt = this.xt = 0;
  var c = 1 + randomInt(1);
  this.GD = 0.5 > Math.random() ? -c : c;
  this.HD = -1 + -randomInt(1);
  this.pw = true;
}
export function FloatingTextLayer() {
  this.texts = [];
  this.dA = this.cA = 20;
}
export function showDamageText(a, b) {
  var c = game.floatingText;
  if (0 < b) {
    showFloatingText(c, a, "-" + b, "#FF4444");
  }
}
export function showFloatingText(a, b, c, d) {
  if (!game.processingOffline) {
    c = new FloatingText(c, d);
    b = b.position;
    if (game.worldActive) {
      d = b.getWorldPositionX();
      var f = b.getWorldPositionY();
      b = game.viewportHalfWidth + (d - game.world.worldCenterX - (f - game.world.worldCenterY)) + a.cA;
      d = game.viewportHalfHeight + 0.5 * (d - game.world.worldCenterX + (f - game.world.worldCenterY)) + a.dA;
    } else {
      d = b.getLevelPositionX();
      f = b.getLevelPositionY();
      b = projectDungeonX(d, f) + a.cA;
      d = projectDungeonY(d, f) + a.dA;
    }
    c.xt = b;
    c.yt = d;
    a.texts.push(c);
  }
}
export function initializeRenderingFloatingText() {
  FloatingText.prototype.oy = function () {
    if (this.pw) {
      if (0.5 > Math.random()) {
        this.xt += this.GD;
      }
      this.yt += this.HD;
    }
    this.pw = !this.pw;
    this.frameAge++;
    return 60 <= this.frameAge;
  };
  FloatingTextLayer.prototype.oy = function () {
    var a,
      b = false;
    for (a = 0; a < this.texts.length; a++) {
      if (this.texts[a].oy()) {
        b = true;
      }
    }
    if (b) {
      for (a = this.texts.length - 1; 0 <= a; a--) {
        if (60 <= this.texts[a].frameAge) {
          this.texts.splice(a, 1);
        }
      }
    }
  };
}
