/** 战斗文字的生命周期与坐标投影。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { randomInt } from "../core/math.js";
import { projectDungeonX, projectDungeonY } from "../simulation/characters.js";
import { VIEWPORT_HALF_HEIGHT, VIEWPORT_HALF_WIDTH } from "../core/screen-layout.js";
/** 战斗文字渲染的四个依赖由组合根注入。floatingText 是容器对象，在 runtime 的 game 模块对象字面量里
 *  只构造一次、src 内 0 处 `game.floatingText =`（判据见 docs/reverse-engineering/facts.md），按引用绑安全；
 *  processingOffline 与 worldActive 是会被反复改写的标量布尔（game.js:393/454/486/491、character.js:1157/1182、
 *  party.js:212、game-save.js:55），world 更会在两条重置路径上被整体换成 new WorldMap()（game.js:394、455），
 *  这三者必须走"取现值"的回调，按值绑会读到装配那一刻的过期值。未绑定就用到一律立刻抛。 */
var boundFloatingTextLayer = null;
var boundProcessingOfflineProvider = null;
var boundWorldActiveProvider = null;
var boundWorldProvider = null;
export function bindFloatingTextRender(floatingTextLayer, isProcessingOffline, isWorldActive, worldProvider) {
  boundFloatingTextLayer = floatingTextLayer;
  boundProcessingOfflineProvider = isProcessingOffline;
  boundWorldActiveProvider = isWorldActive;
  boundWorldProvider = worldProvider;
}
function floatingTextLayerRef() {
  if (!boundFloatingTextLayer) {
    throw new Error('战斗文字尚未绑定文字层：请在组合根调用 bindFloatingTextRender(game.floatingText, () => game.processingOffline, () => game.worldActive, () => game.world)');
  }
  return boundFloatingTextLayer;
}
function processingOfflineNow() {
  if (!boundProcessingOfflineProvider) {
    throw new Error('战斗文字尚未绑定离线处理标志：请在组合根调用 bindFloatingTextRender(game.floatingText, () => game.processingOffline, () => game.worldActive, () => game.world)');
  }
  return boundProcessingOfflineProvider();
}
function worldActiveNow() {
  if (!boundWorldActiveProvider) {
    throw new Error('战斗文字尚未绑定世界激活标志：请在组合根调用 bindFloatingTextRender(game.floatingText, () => game.processingOffline, () => game.worldActive, () => game.world)');
  }
  return boundWorldActiveProvider();
}
function worldNow() {
  if (!boundWorldProvider) {
    throw new Error('战斗文字尚未绑定世界提供者：请在组合根调用 bindFloatingTextRender(game.floatingText, () => game.processingOffline, () => game.worldActive, () => game.world)');
  }
  return boundWorldProvider();
}
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
  var floatingTextLayer = floatingTextLayerRef();
  if (0 < damage) {
    showFloatingText(floatingTextLayer, targetCharacter, "-" + damage, "#FF4444");
  }
}
export function showFloatingText(floatingTextLayer, targetCharacter, text, color) {
  var screenX, screenY;
  if (!processingOfflineNow()) {
    var floatingText = new FloatingText(text, color);
    var position = targetCharacter.position;
    if (worldActiveNow()) {
      var worldX = position.getWorldPositionX();
      var positionY = position.getWorldPositionY();
      screenX = VIEWPORT_HALF_WIDTH + (worldX - worldNow().worldCenterX - (positionY - worldNow().worldCenterY)) + floatingTextLayer.screenXOffset;
      screenY = VIEWPORT_HALF_HEIGHT + 0.5 * (worldX - worldNow().worldCenterX + (positionY - worldNow().worldCenterY)) + floatingTextLayer.screenYOffset;
    } else {
      var levelX = position.getLevelPositionX();
      positionY = position.getLevelPositionY();
      screenX = projectDungeonX(levelX, positionY) + floatingTextLayer.screenXOffset;
      screenY = projectDungeonY(levelX, positionY) + floatingTextLayer.screenYOffset;
    }
    floatingText.screenX = screenX;
    floatingText.screenY = screenY;
    floatingTextLayer.texts.push(floatingText);
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
