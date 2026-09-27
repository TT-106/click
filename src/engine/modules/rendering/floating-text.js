/** 战斗文字的生命周期与坐标投影。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { randomInt } from "../core/math.js";
import { game } from "../runtime/game.js";
import { projectDungeonX, projectDungeonY } from "../simulation/characters.js";
export function FloatingText(a, b) {
  this.text = a;
  this.color = b;
  this.frameAge = this.screenY = this.screenX = 0;
  var c = 1 + randomInt(1);
  this.driftX = 0.5 > Math.random() ? -c : c;
  this.driftY = -1 + -randomInt(1);
  this.movePhase = true;
}
export function FloatingTextLayer() {
  this.texts = [];
  this.screenYOffset = this.screenXOffset = 20;
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
      b = game.viewportHalfWidth + (d - game.world.worldCenterX - (f - game.world.worldCenterY)) + a.screenXOffset;
      d = game.viewportHalfHeight + 0.5 * (d - game.world.worldCenterX + (f - game.world.worldCenterY)) + a.screenYOffset;
    } else {
      d = b.getLevelPositionX();
      f = b.getLevelPositionY();
      b = projectDungeonX(d, f) + a.screenXOffset;
      d = projectDungeonY(d, f) + a.screenYOffset;
    }
    c.screenX = b;
    c.screenY = d;
    a.texts.push(c);
  }
}
export function initializeRenderingFloatingText() {
  FloatingText.prototype.update = function () {
    if (this.movePhase) {
      if (0.5 > Math.random()) {
        this.screenX += this.driftX;
      }
      this.screenY += this.driftY;
    }
    this.movePhase = !this.movePhase;
    this.frameAge++;
    return 60 <= this.frameAge;
  };
  FloatingTextLayer.prototype.update = function () {
    var a,
      b = false;
    for (a = 0; a < this.texts.length; a++) {
      if (this.texts[a].update()) {
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
