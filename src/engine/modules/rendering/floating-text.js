/** 战斗文字的生命周期与坐标投影。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { randomInt } from "../core/math.js";
import { game } from "../runtime/game.js";
import { projectDungeonX, projectDungeonY } from "../simulation/characters.js";
export function FloatingText(text, color) {
  this.text = text;
  this.color = color;
  this.frameAge = this.screenY = this.screenX = 0;
  var driftXAmount = 1 + randomInt(1);
  this.driftX = 0.5 > Math.random() ? -driftXAmount : driftXAmount;
  this.driftY = -1 + -randomInt(1);
  this.movePhase = true;
}
export function FloatingTextLayer() {
  this.texts = [];
  this.screenYOffset = this.screenXOffset = 20;
}
export function showDamageText(targetCharacter, damage) {
  var floatingTextLayer = game.floatingText;
  if (0 < damage) {
    showFloatingText(floatingTextLayer, targetCharacter, "-" + damage, "#FF4444");
  }
}
export function showFloatingText(floatingTextLayer, b, c, d) {
  if (!game.processingOffline) {
    c = new FloatingText(c, d);
    b = b.position;
    if (game.worldActive) {
      d = b.getWorldPositionX();
      var positionY = b.getWorldPositionY();
      b = game.viewportHalfWidth + (d - game.world.worldCenterX - (positionY - game.world.worldCenterY)) + floatingTextLayer.screenXOffset;
      d = game.viewportHalfHeight + 0.5 * (d - game.world.worldCenterX + (positionY - game.world.worldCenterY)) + floatingTextLayer.screenYOffset;
    } else {
      d = b.getLevelPositionX();
      positionY = b.getLevelPositionY();
      b = projectDungeonX(d, positionY) + floatingTextLayer.screenXOffset;
      d = projectDungeonY(d, positionY) + floatingTextLayer.screenYOffset;
    }
    c.screenX = b;
    c.screenY = d;
    floatingTextLayer.texts.push(c);
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
    var textIndex,
      hasExpiredText = false;
    for (textIndex = 0; textIndex < this.texts.length; textIndex++) {
      if (this.texts[textIndex].update()) {
        hasExpiredText = true;
      }
    }
    if (hasExpiredText) {
      for (textIndex = this.texts.length - 1; 0 <= textIndex; textIndex--) {
        if (60 <= this.texts[textIndex].frameAge) {
          this.texts.splice(textIndex, 1);
        }
      }
    }
  };
}
