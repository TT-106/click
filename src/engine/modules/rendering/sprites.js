/** 精灵图、动画帧、方向和视觉效果。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { FRAME_DURATION_MS, Vector2, assignVector, copyVector, floorNumber, normalizeVector, subtractVector } from "../core/math.js";
import { EFFECT_FRAME_DURATION_MS, PROJECTILE_FRAME_DURATION_MS } from "../content/balance.js";
export var TARGETED_EFFECT, directionScratchVector;
var effectAnimationsCatalog = null;
/**
 * 绑定动画目录，供 VisualEffect 构造时按名称查动画。目录由调用者提供，
 * 避免本模块依赖全局游戏实例；game.animations 在存档恢复时不被替换（引用稳定），会话内绑定一次即可。
 * @param {{ getAnimation: (name: string) => unknown }} catalog
 */
export function bindEffectAnimations(catalog) {
  effectAnimationsCatalog = catalog;
}
export function Sprite(spriteSheet, sourceX, sourceY, spriteName) {
  this.spriteSheet = spriteSheet;
  this.sourceX = sourceX;
  this.sourceY = sourceY;
  this.name = spriteName;
}
export function SpriteSheet(imageUrl, spriteSize, spriteDefinitions) {
  this.loaded = false;
  this.spriteSize = spriteSize;
  this.animationMap = {};
  var sheet = this;
  this.image = new Image();
  this.image.onload = function () {
    (/** @type {any} */ (sheet)).registerDefinitions(spriteDefinitions);
    sheet.loaded = true;
  };
  this.error = null;
  this.image.onerror = function () { sheet.error = `无法加载图集: ${imageUrl}`; };
  this.image.src = imageUrl;
}
export function SpriteAnimation(spriteSheet, animationName, firstFrameColumn, firstFrameRow, lastRowFrameCount, lastFrameRow, lastFrameColumnIndex, isDirectional) {
  this.spriteSheet = spriteSheet;
  this.animationName = animationName;
  this.isDirectional = isDirectional;
  var frameList = [];
  var frameRow, frameColumn, frameSourceX, frameSourceY;
  var frameCounter = 0;
  var rowLastColumnIndex;
  var spriteSize = this.spriteSheet.spriteSize;
  for (frameRow = firstFrameRow; frameRow <= lastFrameRow; frameRow++) {
    for (frameSourceY = frameRow * spriteSize, rowLastColumnIndex = frameRow < lastFrameRow ? lastFrameColumnIndex : Math.min(lastRowFrameCount, lastFrameColumnIndex), frameColumn = firstFrameColumn; frameColumn <= rowLastColumnIndex; frameColumn++) {
      frameSourceX = frameColumn * spriteSize;
      frameList.push(new AnimationFrame(frameCounter++, frameSourceX, frameSourceY));
    }
  }
  this.frames = frameList;
}
export function AnimationFrame(frameIndex, frameSourceX, frameSourceY) {
  this.frameIndex = frameIndex;
  this.frameSourceX = frameSourceX;
  this.frameSourceY = frameSourceY;
}
export function AnimationSheet(fileName, spriteSize, animationDefinitions, lastFrameColumnIndex) {
  this.loaded = false;
  this.fileName = fileName;
  this.spriteSize = spriteSize;
  this.animationMap = {};
  this.animationNames = [];
  var sheet = this;
  this.image = new Image();
  this.image.onload = function () {
    (/** @type {any} */ (sheet)).registerDefinitions(animationDefinitions, lastFrameColumnIndex);
    sheet.loaded = true;
  };
  this.error = null;
  this.image.onerror = function () { sheet.error = `无法加载动画图集: ${fileName}`; };
  this.image.src = fileName;
}
export function AnimationCatalog(sheets) {
  this.animationMap = null;
  this.sheets = sheets;
}
export function VisualEffect(impactEffectName, startPosition, targetPosition, projectileEffect, effectType) {
  this.impactEffectName = impactEffectName;
  this.effectType = effectType;
  this.room = this.boundCharacter = null;
  this.remainingEffectDamage = 0;
  var currentPosition;
  if (projectileEffect) {
    currentPosition = new Vector2();
    copyVector(currentPosition, startPosition);
  } else {
    if (effectType === TARGETED_EFFECT) {
      currentPosition = new Vector2();
      copyVector(currentPosition, targetPosition);
    } else {
      currentPosition = targetPosition;
    }
  }
  this.startPosition = startPosition;
  this.currentPosition = currentPosition;
  this.targetPosition = targetPosition;
  this.reachedTarget = false;
  this.projectileEffect = projectileEffect;
  this.finished = this.hasSpawned = this.isReturning = false;
  this.animation = impactEffectName ? effectAnimationsCatalog.getAnimation(impactEffectName) : null;
  if (impactEffectName && !this.animation) {
    console.log("Failed to find animated sprite: " + impactEffectName);
  }
  this.frameCount = this.animation ? this.animation.getFrameCount() : 0;
  this.previousFrameIndex = -1;
  this.frameIndex = 0;
  if (this.animation && this.animation.isDirectional) {
    this.frameIndex = getEffectDirection(this);
  }
  this.elapsedMs = 0;
  this.loopsWhileStunned = false;
}
export function getEffectDirection(visualEffect) {
  assignVector(directionScratchVector, visualEffect.targetPosition);
  subtractVector(directionScratchVector, visualEffect.currentPosition);
  normalizeVector(directionScratchVector);
  var directionX = directionScratchVector.x;
  var directionY = directionScratchVector.y,
    angleDegrees = 180 * -Math.atan2(directionY, directionX) / Math.PI;
  if (0 > angleDegrees) {
    angleDegrees += 360;
  }
  if (337.5 <= angleDegrees || 22.5 > angleDegrees) {
    return 3;
  }
  if (22.5 <= angleDegrees && 67.5 > angleDegrees) {
    return 2;
  }
  if (67.5 <= angleDegrees && 112.5 > angleDegrees) {
    return 1;
  }
  if (112.5 <= angleDegrees && 157.5 > angleDegrees) {
    return 0;
  }
  if (157.5 <= angleDegrees && 202.5 > angleDegrees) {
    return 7;
  }
  if (202.5 <= angleDegrees && 247.5 > angleDegrees) {
    return 6;
  }
  if (247.5 <= angleDegrees && 292.5 > angleDegrees) {
    return 5;
  }
  if (292.5 <= angleDegrees && 337.5 > angleDegrees) {
    return 4;
  }
  console.log("direction fail x=" + directionX + " y=" + directionY + " angle=" + angleDegrees);
}
export function advanceEffectFrame(visualEffect, elapsedUnits) {
  visualEffect.elapsedMs += elapsedUnits * FRAME_DURATION_MS;
  var frameDurationMs = visualEffect.projectileEffect ? PROJECTILE_FRAME_DURATION_MS : EFFECT_FRAME_DURATION_MS;
  visualEffect.previousFrameIndex = visualEffect.frameIndex;
  if (visualEffect.elapsedMs >= frameDurationMs) {
    var framesToAdvance = Math.min(1, floorNumber(visualEffect.elapsedMs / frameDurationMs));
    visualEffect.elapsedMs = Math.max(0, floorNumber(visualEffect.elapsedMs % frameDurationMs));
    visualEffect.frameIndex += framesToAdvance;
    if (visualEffect.frameIndex >= visualEffect.frameCount) {
      if (visualEffect.loopsWhileStunned) {
        if (visualEffect.boundCharacter.effects.isStunned) {
          visualEffect.frameIndex = 0;
        } else {
          visualEffect.finished = true;
        }
      } else {
        if (visualEffect.projectileEffect) {
          visualEffect.frameIndex = 0;
        } else {
          visualEffect.finished = true;
        }
      }
    }
  }
}
export function clearVisualEffects(effects) {
  if (0 < effects.pool.length) {
    var effectIndex;
    for (effectIndex = 0; effectIndex < effects.pool.length; effectIndex++) {
      var effect = effects.pool[effectIndex];
      effect.finished = true;
      effect.reachedTarget = true;
    }
    effects.pool.length = 0;
  }
}
export function addVisualEffect(visualEffects, visualEffect) {
  if (visualEffect) {
    visualEffects.pool.push(visualEffect);
  }
}
export function initializeRenderingSprites() {
  Sprite.prototype.getName = function () {
    return this.name;
  };
  Sprite.prototype.getSheetImage = function () {
    return this.spriteSheet.getSheetImage();
  };
  SpriteSheet.prototype.registerDefinitions = function (spriteDefinitions) {
    var definitionIndex, definition;
    for (definitionIndex = 0; definitionIndex < spriteDefinitions.length; definitionIndex++) {
      definition = spriteDefinitions[definitionIndex];
      this.animationMap[definition.name] = new Sprite(this, definition.position.x, definition.position.y, definition.name);
    }
  };
  SpriteSheet.prototype.getSprite = function (spriteName) {
    return this.animationMap[spriteName];
  };
  SpriteSheet.prototype.getSheetImage = function () {
    return this.image;
  };
  SpriteSheet.prototype.isLoaded = function () {
    return this.loaded;
  };
  SpriteAnimation.prototype.getSheetImage = function () {
    return this.spriteSheet.getSheetImage();
  };
  SpriteAnimation.prototype.getFrameCount = function () {
    return this.frames.length;
  };
  AnimationSheet.prototype.registerDefinitions = function (animationDefinitions, lastFrameColumnIndex) {
    var definitionIndex, definition;
    for (definitionIndex = 0; definitionIndex < animationDefinitions.length; definitionIndex++) {
      definition = animationDefinitions[definitionIndex];
      this.animationNames.push(definition.animationName);
      this.animationMap[definition.animationName] = new SpriteAnimation(this, definition.animationName, definition.firstFrameColumn, definition.firstFrameRow, definition.lastRowFrameCount, definition.lastFrameRow, lastFrameColumnIndex, definition.isDirectional);
    }
  };
  AnimationSheet.prototype.getAnimation = function (animationName) {
    return this.animationMap[animationName];
  };
  AnimationSheet.prototype.getSheetImage = function () {
    return this.image;
  };
  AnimationSheet.prototype.isLoaded = function () {
    return this.loaded;
  };
  AnimationCatalog.prototype.getAnimation = function (animationName) {
    var ownerSheet = this.animationMap[animationName];
    return ownerSheet ? ownerSheet.getAnimation(animationName) : null;
  };
  AnimationCatalog.prototype.isLoaded = function () {
    var checkIndex;
    for (checkIndex = 0; checkIndex < this.sheets.length; checkIndex++) {
      if (!this.sheets[checkIndex].isLoaded()) {
        return false;
      }
    }
    if (!this.animationMap) {
      var sheets = this.sheets;
      var sheetIndex,
        nameIndex,
        sheet,
        animationNames,
        sheetByAnimationName = {};
      for (sheetIndex = 0; sheetIndex < sheets.length; sheetIndex++) {
        for (sheet = sheets[sheetIndex], animationNames = sheet.animationNames, nameIndex = 0; nameIndex < animationNames.length; nameIndex++) {
          if (sheetByAnimationName[animationNames[nameIndex]]) {
            console.log("effect name already defined: " + animationNames[nameIndex]);
          }
          sheetByAnimationName[animationNames[nameIndex]] = sheet;
        }
      }
      this.animationMap = sheetByAnimationName;
    }
    return true;
  };
  TARGETED_EFFECT = 3;
  directionScratchVector = new Vector2();
  VisualEffect.prototype.getAnimation = function () {
    return this.animation;
  };
  VisualEffect.prototype.setRemainingEffectDamage = function (remainingEffectDamage) {
    this.remainingEffectDamage = remainingEffectDamage;
  };
  VisualEffect.prototype.isFinished = function () {
    return this.finished || this.reachedTarget;
  };
  VisualEffect.prototype.getFrameCount = function () {
    return this.frameCount;
  };
}
