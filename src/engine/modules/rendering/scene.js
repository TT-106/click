/** 深度排序、即时渲染与地图画面。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { Vector2, distanceToPoint, randomInt, setVector } from "../core/math.js";
import { game } from "../runtime/game.js";
import { EMPTY_TILE } from "../world/rooms.js";
import { projectDungeonX, projectDungeonY, projectWorldX, projectWorldY } from "../simulation/characters.js";
import { statValue } from "../characters/stats.js";
import { View } from "../views/base.js";
import { canAttackCastle } from "../world/regions.js";
import { getScrollSprite } from "../combat/scrolls.js";
import { getMonsters } from "../combat/encounters.js";
import { TARGETED_EFFECT } from "./sprites.js";
import { createElement, getElement } from "../views/dom.js";
import { HALF_TILE_SIZE, TILE_SIZE, VIEWPORT_HALF_HEIGHT, VIEWPORT_HALF_WIDTH, VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from "../core/screen-layout.js";
import { createMapPresentation } from "./presentation.js";
export function RenderCommand() {
  this.animation = this.sprite = null;
  this.raiseOffset = this.sortKey = this.frameIndex = 0;
  this.isSet = false;
  this.alpha = this.renderSize = this.screenY = this.screenX = 0;
  this.layer = 'actor';
}
export function resetRenderCommand(command) {
  command.isSet = false;
  command.sprite = null;
  command.animation = null;
  command.sortKey = 1E5;
  command.raiseOffset = 0;
  command.layer = 'actor';
}
export function setSpriteRenderCommand(command, sprite, sortKey, screenX, screenY, renderSize, alpha, layer = 'actor') {
  command.sprite = sprite;
  command.sortKey = sortKey;
  command.screenX = screenX;
  command.screenY = screenY;
  command.renderSize = renderSize;
  command.alpha = alpha;
  command.isSet = true;
  command.layer = layer;
}
export function setAnimationRenderCommand(command, animation, frameIndex, sortKey, screenX, screenY, renderSize, alpha) {
  command.animation = animation;
  command.frameIndex = frameIndex;
  command.sortKey = sortKey;
  command.screenX = screenX;
  command.screenY = screenY;
  command.renderSize = renderSize;
  command.alpha = alpha;
  command.isSet = true;
}
export function DepthSortedRenderer() {
  this.compareRenderSortKey = function (left, right) {
    return left.getRenderSortKey() - right.getRenderSortKey();
  };
  this.scratchVector = new Vector2();
  this.renderCommands = [];
  this.commandIndex = 0;
  this.context = null;
  this.presentation = null;
}
export function acquireRenderCommand(renderer) {
  var command;
  if (renderer.commandIndex >= renderer.renderCommands.length) {
    command = new RenderCommand();
    renderer.renderCommands.push(command);
  } else {
    command = renderer.renderCommands[renderer.commandIndex];
  }
  renderer.commandIndex++;
  return command;
}
export function ImmediateRenderer() {
  this.context = null;
  this.presentation = null;
  this.command = new RenderCommand();
}
export function acquireImmediateCommand(renderer) {
  resetRenderCommand(renderer.command);
  return renderer.command;
}
export function SceneRenderer(context) {
  this.context = context;
  this.presentation = null;
  this.spriteRenderer = null;
  this.depthSortedRenderer = new DepthSortedRenderer();
  this.immediateRenderer = new ImmediateRenderer();
}
export function drawWorldTileRow(renderer, tileRow, startColumn, endColumn) {
  for (; startColumn < endColumn; startColumn++) {
    var tile = game.world.getTileAtPixel(startColumn, tileRow);
    if (tile) {
      var camera = game.camera;
      var screenX = VIEWPORT_HALF_WIDTH + (startColumn - camera.tileColumn - (tileRow - camera.tileRow)) * TILE_SIZE - camera.viewportOffsetX;
      var screenY = VIEWPORT_HALF_HEIGHT + (startColumn - camera.tileColumn + (tileRow - camera.tileRow)) * HALF_TILE_SIZE - camera.viewportOffsetY;
      if (renderer.presentation) {
        screenX = renderer.presentation.tileScreenX(startColumn, tileRow, game.world.worldCenterX, game.world.worldCenterY, TILE_SIZE, VIEWPORT_HALF_WIDTH);
        screenY = renderer.presentation.tileScreenY(startColumn, tileRow, game.world.worldCenterX, game.world.worldCenterY, TILE_SIZE, HALF_TILE_SIZE, VIEWPORT_HALF_HEIGHT);
      }
      renderer.drawSprite(tile.backgroundSprite, screenX, screenY, 'ground');
      var decorationSprite = tile.decorationSprite;
      if (decorationSprite) {
        renderer.spriteRenderer.drawSpriteDepth(decorationSprite, tile.getPixelX(), tile.getPixelY(), screenX, screenY, decorationSprite.spriteSheet.spriteSize, 0, 'scenery');
      }
    }
  }
}
export function drawDungeonTileRow(renderer, tileRow, startColumn, endColumn) {
  for (; startColumn < endColumn; startColumn++) {
    var tile = game.level.getTileAt(startColumn, tileRow);
    if (tile && tile.floorType !== EMPTY_TILE) {
      var camera = game.camera;
      var screenX = VIEWPORT_HALF_WIDTH + (startColumn - camera.tileColumn - (tileRow - camera.tileRow)) * TILE_SIZE - camera.viewportOffsetX;
      var screenY = VIEWPORT_HALF_HEIGHT + (startColumn - camera.tileColumn + (tileRow - camera.tileRow)) * HALF_TILE_SIZE - camera.viewportOffsetY;
      if (renderer.presentation) {
        screenX = renderer.presentation.tileScreenX(startColumn, tileRow, game.level.centerX, game.level.centerY, TILE_SIZE, VIEWPORT_HALF_WIDTH);
        screenY = renderer.presentation.tileScreenY(startColumn, tileRow, game.level.centerX, game.level.centerY, TILE_SIZE, HALF_TILE_SIZE, VIEWPORT_HALF_HEIGHT);
      }
      renderer.drawSprite(tile.backgroundSprite, screenX, screenY, 'ground');
      var decorationSprite = tile.decorationSprite;
      if (decorationSprite) {
        renderer.spriteRenderer.drawSpriteDepth(decorationSprite, tile.getPixelX(), tile.getPixelY(), screenX, screenY, decorationSprite.spriteSheet.spriteSize, 0, 'scenery');
      }
      var cachedBackgroundSprite = tile.cachedBackgroundSprite;
      if (cachedBackgroundSprite) {
        renderer.spriteRenderer.drawSpriteDepthRaised(cachedBackgroundSprite, tile.getPixelX(), tile.getPixelY(), screenX, screenY, cachedBackgroundSprite.spriteSheet.spriteSize, 0, 'scenery');
      }
    }
  }
}
export function drawWorldCharacters(renderer, characters) {
  var character, worldX, worldY, sprite, characterIndex;
  for (characterIndex = characters.length - 1; 0 <= characterIndex; characterIndex--) {
    character = characters[characterIndex];
    worldX = character.position.getWorldPositionX();
    worldY = character.position.getWorldPositionY();
    sprite = character.getSprite();
    renderer.spriteRenderer.drawSpriteDepth(sprite, worldX, worldY, VIEWPORT_HALF_WIDTH + (worldX - game.world.worldCenterX - (worldY - game.world.worldCenterY)), VIEWPORT_HALF_HEIGHT + 0.5 * (worldX - game.world.worldCenterX + (worldY - game.world.worldCenterY)), sprite.spriteSheet.spriteSize, 0);
  }
}
export function drawDungeonCharacters(renderer, characters) {
  var character,
    levelX,
    levelY,
    screenX,
    screenY,
    isStealthed = false,
    characterIndex;
  for (characterIndex = characters.length - 1; 0 <= characterIndex; characterIndex--) {
    character = characters[characterIndex];
    levelX = character.position.getLevelPositionX();
    levelY = character.position.getLevelPositionY();
    screenX = projectDungeonX(levelX, levelY);
    screenY = projectDungeonY(levelX, levelY);
    isStealthed = character.effects.isStealthed;
    var sprite = character.getSprite();
    renderer.spriteRenderer.drawSpriteDepth(sprite, levelX, levelY, screenX, screenY, sprite.spriteSheet.spriteSize, isStealthed ? 0.4 : 0);
  }
}
export function drawCharacterEffects(renderer, characters) {
  var characterIndex, effectIndex, character, levelX, levelY, screenX, screenY, activeEffects, effectAnimation, overlayFrameIndex, projected;
  for (characterIndex = 0; characterIndex < characters.length; characterIndex++) {
    if (character = characters[characterIndex], !character.isDead) {
      for (projected = false, activeEffects = character.effects.activeEffects, effectIndex = 0; effectIndex < activeEffects.length; effectIndex++) {
        if (effectAnimation = activeEffects[effectIndex], effectAnimation.hasAnimation && (effectAnimation = effectAnimation.animation)) {
          overlayFrameIndex = activeEffects[effectIndex].overlayFrameIndex;
          if (!projected) {
            levelX = character.position.getLevelPositionX();
            levelY = character.position.getLevelPositionY();
            screenX = projectDungeonX(levelX, levelY) + 10;
            screenY = projectDungeonY(levelX, levelY) + 10;
            projected = true;
          }
          renderer.spriteRenderer.drawAnimationRaised(effectAnimation, overlayFrameIndex, levelX, levelY, screenX, screenY, effectAnimation.spriteSheet.spriteSize, 0);
        }
      }
    }
  }
}
export function drawFloatingText(renderer) {
  if (renderer.presentation) {
    renderer.presentation.drawCombatText(renderer.context, game.floatingText.texts);
    return;
  }
  var textIndex, floatingText, texts;
  texts = game.floatingText.texts;
  if (0 !== texts.length) {
    for (renderer.context.font = "12px Georgia", textIndex = 0; textIndex < texts.length; textIndex++) {
      floatingText = texts[textIndex];
      renderer.context.fillStyle = floatingText.color;
      renderer.context.fillText(floatingText.text, floatingText.screenX, floatingText.screenY);
    }
  }
}
export function drawEntityHighlight(renderer, entity, cellWidth, cellHeight) {
  var regions = entity.regions;
  var regionGrid = game.regions;
  var originColumn = regionGrid.regionGridOriginColumn,
    originRow = regionGrid.regionGridOriginRow,
    regionX;
  for (var regionIndex = 0; regionIndex < regions.length; regionIndex++) {
    var region = regions[regionIndex];
    regionX = cellWidth * (region.regionColumn - originColumn);
    var regionY = cellHeight * (region.regionRow - originRow);
    renderer.context.fillRect(regionX, regionY, cellWidth, cellHeight);
  }
}
export function drawCharacterHighlights(renderer, characters, healthBarColor) {
  var characterIndex, character, levelX, levelY, screenX, screenY, stats, health, maxHealth;
  for (characterIndex = 0; characterIndex < characters.length; characterIndex++) {
    character = characters[characterIndex];
    if (!character.isDead) {
      levelX = character.position.getLevelPositionX();
      levelY = character.position.getLevelPositionY();
      screenX = projectDungeonX(levelX, levelY);
      screenY = projectDungeonY(levelX, levelY);
      stats = character.stats;
      health = stats.health;
      maxHealth = statValue(stats.maxHealth);
      if (renderer.presentation) {
        renderer.presentation.drawHealthBar(renderer.context, screenX, screenY, health, maxHealth, healthBarColor);
        continue;
      }
      if (health === maxHealth) {
        renderer.context.fillStyle = healthBarColor;
        renderer.context.fillRect(screenX + 10, screenY + 0, 30, 4);
      } else {
        renderer.context.fillStyle = "white";
        renderer.context.fillRect(screenX + 10, screenY + 0, 30, 4);
        renderer.context.fillStyle = healthBarColor;
        renderer.context.fillRect(screenX + 10, screenY + 0, health / maxHealth * 30 | 0, 4);
      }
    }
  }
}
export function randomLightningOffset() {
  var offset = Math.max(2, randomInt(5));
  return 0.5 > Math.random() ? -offset : offset;
}
export function GameCanvasView() {
  this.containerElementId = "gameTabContent";
  this.elementId = "gameCanvas";
  this.renderer = null;
  this.presentationStyle = 'classic';
}
export function initializeRenderingScene() {
  RenderCommand.prototype.getRenderSortKey = function () {
    return this.sortKey - this.raiseOffset;
  };
  RenderCommand.prototype.draw = function (context, presentation = null) {
    if (this.isSet) {
      if (0 < this.alpha) {
        context.save();
        context.globalAlpha = 0.4;
      }
      var spriteSize;
      if (this.sprite) {
        spriteSize = this.sprite.spriteSheet.spriteSize;
        if (presentation) presentation.drawSprite(context, this.sprite, this.screenX, this.screenY, this.renderSize, this.layer);
        else context.drawImage(this.sprite.getSheetImage(), this.sprite.sourceX, this.sprite.sourceY, spriteSize, spriteSize, this.screenX, this.screenY, this.renderSize, this.renderSize);
      } else if (this.animation) {
        var frame = this.animation.frames[this.frameIndex];
        spriteSize = this.animation.spriteSheet.spriteSize;
        if (presentation) presentation.drawAnimation(context, this.animation, this.frameIndex, this.screenX, this.screenY, this.renderSize);
        else context.drawImage(this.animation.getSheetImage(), frame.frameSourceX, frame.frameSourceY, spriteSize, spriteSize, this.screenX, this.screenY, this.renderSize, this.renderSize);
      }
      if (0 < this.alpha) {
        context.restore();
      }
    }
  };
  DepthSortedRenderer.prototype.setContext = function (context) {
    this.context = context;
    this.commandIndex = 0;
    for (var commandIndex = 0; commandIndex < this.renderCommands.length; commandIndex++) {
      resetRenderCommand(this.renderCommands[commandIndex]);
    }
    var halfViewportWidth = VIEWPORT_WIDTH / 2,
      doubleViewportHeight = 2 * VIEWPORT_HEIGHT;
    var centerX, centerY;
    if (game.worldActive) {
      centerX = game.world.worldCenterX + (0.5 * (halfViewportWidth - VIEWPORT_HALF_WIDTH) + (doubleViewportHeight - VIEWPORT_HALF_HEIGHT)) | 0;
      centerY = game.world.worldCenterY + (doubleViewportHeight - VIEWPORT_HALF_HEIGHT - 0.5 * (halfViewportWidth - VIEWPORT_HALF_WIDTH)) | 0;
    } else {
      centerX = game.level.centerX + (0.5 * (halfViewportWidth - VIEWPORT_HALF_WIDTH) + (doubleViewportHeight - VIEWPORT_HALF_HEIGHT)) | 0;
      centerY = game.level.centerY + (doubleViewportHeight - VIEWPORT_HALF_HEIGHT - 0.5 * (halfViewportWidth - VIEWPORT_HALF_WIDTH)) | 0;
    }
    setVector(this.scratchVector, centerX, centerY);
  };
  DepthSortedRenderer.prototype.drawSpriteDepth = function (sprite, worldX, worldY, screenX, screenY, renderSize, alpha, layer = 'actor') {
    if (sprite) {
      var distance = this.presentation ? this.presentation.depthKey(worldX, worldY) : distanceToPoint(this.scratchVector, worldX, worldY);
      setSpriteRenderCommand(acquireRenderCommand(this), sprite, distance, screenX, screenY, renderSize, alpha, layer);
    }
  };
  DepthSortedRenderer.prototype.drawSpriteDepthRaised = function (sprite, worldX, worldY, screenX, screenY, renderSize, alpha, layer = 'actor') {
    if (sprite) {
      var distance = this.presentation ? this.presentation.depthKey(worldX, worldY) : distanceToPoint(this.scratchVector, worldX, worldY);
      var command = acquireRenderCommand(this);
      setSpriteRenderCommand(command, sprite, distance, screenX, screenY, renderSize, alpha, layer);
      command.raiseOffset = 0.1;
    }
  };
  DepthSortedRenderer.prototype.drawAnimation = function (animation, frameIndex, worldX, worldY, screenX, screenY, renderSize, alpha) {
    if (animation) {
      var distance = this.presentation ? this.presentation.depthKey(worldX, worldY) : distanceToPoint(this.scratchVector, worldX, worldY);
      setAnimationRenderCommand(acquireRenderCommand(this), animation, frameIndex, distance, screenX, screenY, renderSize, alpha);
    }
  };
  DepthSortedRenderer.prototype.drawAnimationRaised = function (animation, frameIndex, worldX, worldY, screenX, screenY, renderSize, alpha) {
    if (animation) {
      var distance = this.presentation ? this.presentation.depthKey(worldX, worldY) : distanceToPoint(this.scratchVector, worldX, worldY);
      var command = acquireRenderCommand(this);
      setAnimationRenderCommand(command, animation, frameIndex, distance, screenX, screenY, renderSize, alpha);
      command.raiseOffset = 0.1;
    }
  };
  DepthSortedRenderer.prototype.sortCommands = function () {
    if (!(2 > this.commandIndex)) {
      this.renderCommands.sort(this.compareRenderSortKey);
    }
    for (var commandIndex = this.commandIndex - 1; 0 <= commandIndex; commandIndex--) {
      this.renderCommands[commandIndex].draw(this.context, this.presentation);
    }
  };
  ImmediateRenderer.prototype.setContext = function (context) {
    this.context = context;
  };
  ImmediateRenderer.prototype.drawSpriteDepth = function (sprite, worldX, worldY, screenX, screenY, renderSize, alpha, layer = 'actor') {
    if (sprite) {
      var command = acquireImmediateCommand(this);
      setSpriteRenderCommand(command, sprite, 0, screenX, screenY, renderSize, alpha, layer);
      command.draw(this.context, this.presentation);
    }
  };
  ImmediateRenderer.prototype.drawSpriteDepthRaised = function (sprite, worldX, worldY, screenX, screenY, renderSize, alpha, layer = 'actor') {
    if (sprite) {
      var command = acquireImmediateCommand(this);
      setSpriteRenderCommand(command, sprite, 0, screenX, screenY, renderSize, alpha, layer);
      command.draw(this.context, this.presentation);
    }
  };
  ImmediateRenderer.prototype.drawAnimation = function (animation, frameIndex, worldX, worldY, screenX, screenY, renderSize, alpha) {
    if (animation) {
      var command = acquireImmediateCommand(this);
      setAnimationRenderCommand(command, animation, frameIndex, 0, screenX, screenY, renderSize, alpha);
      command.draw(this.context, this.presentation);
    }
  };
  ImmediateRenderer.prototype.drawAnimationRaised = function (animation, frameIndex, worldX, worldY, screenX, screenY, renderSize, alpha) {
    if (animation) {
      var command = acquireImmediateCommand(this);
      setAnimationRenderCommand(command, animation, frameIndex, 0, screenX, screenY, renderSize, alpha);
      command.draw(this.context, this.presentation);
    }
  };
  ImmediateRenderer.prototype.sortCommands = function () {};
  SceneRenderer.prototype.drawSprite = function (sprite, screenX, screenY, layer = 'actor') {
    if (sprite) {
      var spriteSize = sprite.spriteSheet.spriteSize;
      if (this.presentation) this.presentation.drawSprite(this.context, sprite, screenX, screenY, spriteSize, layer);
      else this.context.drawImage(sprite.getSheetImage(), sprite.sourceX, sprite.sourceY, spriteSize, spriteSize, screenX, screenY, spriteSize, spriteSize);
    }
  };
  GameCanvasView.prototype = new View();
  GameCanvasView.prototype.reset = function () {
    (/** @type {GameCanvasView & { createDomElements: () => void }} */ (/** @type {unknown} */ (this))).createDomElements();
  };
  GameCanvasView.prototype.update = function () {
    var renderer = this.renderer;
    if (renderer.presentation) renderer.presentation.beginFrame(renderer.context);
    renderer.spriteRenderer = game.options.depthSortSprites ? renderer.depthSortedRenderer : renderer.immediateRenderer;
    renderer.spriteRenderer.presentation = renderer.presentation;
    renderer.spriteRenderer.setContext(renderer.context);
    if (game.world.hasPartyPlaced) {
      if (renderer.context.fillStyle = "#000000", renderer.context.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT), game.worldActive) {
        var centerTileColumn = game.world.pixelToTileColumn(game.world.worldCenterX),
          worldRowCursor = game.world.pixelToTileRow(game.world.worldCenterY) - 18;
        drawWorldTileRow(renderer, worldRowCursor++, centerTileColumn - 5, centerTileColumn - 3);
        drawWorldTileRow(renderer, worldRowCursor++, centerTileColumn - 6, centerTileColumn - 2);
        drawWorldTileRow(renderer, worldRowCursor++, centerTileColumn - 7, centerTileColumn - 1);
        drawWorldTileRow(renderer, worldRowCursor++, centerTileColumn - 8, centerTileColumn);
        drawWorldTileRow(renderer, worldRowCursor++, centerTileColumn - 9, centerTileColumn + 1);
        drawWorldTileRow(renderer, worldRowCursor++, centerTileColumn - 10, centerTileColumn + 2);
        drawWorldTileRow(renderer, worldRowCursor++, centerTileColumn - 11, centerTileColumn + 3);
        drawWorldTileRow(renderer, worldRowCursor++, centerTileColumn - 12, centerTileColumn + 4);
        drawWorldTileRow(renderer, worldRowCursor++, centerTileColumn - 13, centerTileColumn + 5);
        drawWorldTileRow(renderer, worldRowCursor++, centerTileColumn - 14, centerTileColumn + 6);
        drawWorldTileRow(renderer, worldRowCursor++, centerTileColumn - 15, centerTileColumn + 7);
        drawWorldTileRow(renderer, worldRowCursor++, centerTileColumn - 16, centerTileColumn + 8);
        drawWorldTileRow(renderer, worldRowCursor++, centerTileColumn - 17, centerTileColumn + 9);
        drawWorldTileRow(renderer, worldRowCursor++, centerTileColumn - 18, centerTileColumn + 10);
        drawWorldTileRow(renderer, worldRowCursor++, centerTileColumn - 19, centerTileColumn + 11);
        drawWorldTileRow(renderer, worldRowCursor++, centerTileColumn - 20, centerTileColumn + 12);
        drawWorldTileRow(renderer, worldRowCursor++, centerTileColumn - 19, centerTileColumn + 13);
        drawWorldTileRow(renderer, worldRowCursor++, centerTileColumn - 18, centerTileColumn + 14);
        drawWorldTileRow(renderer, worldRowCursor++, centerTileColumn - 17, centerTileColumn + 15);
        drawWorldTileRow(renderer, worldRowCursor++, centerTileColumn - 16, centerTileColumn + 16);
        drawWorldTileRow(renderer, worldRowCursor++, centerTileColumn - 14, centerTileColumn + 16);
        drawWorldTileRow(renderer, worldRowCursor++, centerTileColumn - 13, centerTileColumn + 16);
        drawWorldTileRow(renderer, worldRowCursor++, centerTileColumn - 12, centerTileColumn + 15);
        drawWorldTileRow(renderer, worldRowCursor++, centerTileColumn - 11, centerTileColumn + 14);
        drawWorldTileRow(renderer, worldRowCursor++, centerTileColumn - 10, centerTileColumn + 13);
        drawWorldTileRow(renderer, worldRowCursor++, centerTileColumn - 9, centerTileColumn + 12);
        drawWorldTileRow(renderer, worldRowCursor++, centerTileColumn - 8, centerTileColumn + 11);
        drawWorldTileRow(renderer, worldRowCursor++, centerTileColumn - 7, centerTileColumn + 10);
        drawWorldTileRow(renderer, worldRowCursor++, centerTileColumn - 6, centerTileColumn + 9);
        drawWorldTileRow(renderer, worldRowCursor++, centerTileColumn - 5, centerTileColumn + 8);
        drawWorldTileRow(renderer, worldRowCursor++, centerTileColumn - 4, centerTileColumn + 7);
        drawWorldTileRow(renderer, worldRowCursor++, centerTileColumn - 3, centerTileColumn + 6);
        drawWorldTileRow(renderer, worldRowCursor++, centerTileColumn - 2, centerTileColumn + 5);
        drawWorldTileRow(renderer, worldRowCursor++, centerTileColumn - 1, centerTileColumn + 4);
        drawWorldTileRow(renderer, worldRowCursor, centerTileColumn, centerTileColumn + 3);
        drawWorldCharacters(renderer, game.minions.minionList);
        drawWorldCharacters(renderer, game.state.adventurers);
        if (game.options.showCombatText) {
          drawFloatingText(renderer);
        }
        renderer.spriteRenderer.sortCommands();
        if (game.options.showMapOverlay) {
          var regionGrid = game.regions,
            regionOriginColumn = regionGrid.regionGridOriginColumn,
            regionOriginRow = regionGrid.regionGridOriginRow,
            mapCellWidth = 120 / (regionGrid.regionGridOriginColumn + regionGrid.regionGridSpan - regionOriginColumn) | 0,
            mapCellHeight = 120 / (regionGrid.regionGridOriginRow + regionGrid.regionGridSpan - regionOriginRow) | 0;
          renderer.context.save();
          renderer.context.translate(650, 280);
          renderer.context.rotate(Math.PI / 4);
          var maxUnlockedLevel = game.monsterCatalog.maxUnlockedLevel,
            castleList = game.castles.castleList,
            castle,
            castleIndex;
          renderer.context.fillStyle = "gray";
          for (castleIndex = 0; castleIndex < castleList.length; castleIndex++) {
            castle = castleList[castleIndex];
            if (castle.regionLocked) {
              drawEntityHighlight(renderer, castle, mapCellWidth, mapCellHeight);
            }
          }
          renderer.context.fillStyle = "green";
          for (castleIndex = 0; castleIndex < castleList.length; castleIndex++) {
            castle = castleList[castleIndex];
            if (castle.conquered) {
              drawEntityHighlight(renderer, castle, mapCellWidth, mapCellHeight);
            }
          }
          renderer.context.fillStyle = "#AA8800";
          for (castleIndex = 0; castleIndex < castleList.length; castleIndex++) {
            castle = castleList[castleIndex];
            if (castle.attackScheduled) {
              drawEntityHighlight(renderer, castle, mapCellWidth, mapCellHeight);
            }
          }
          renderer.context.fillStyle = "#885500";
          for (castleIndex = 0; castleIndex < castleList.length; castleIndex++) {
            castle = castleList[castleIndex];
            if (canAttackCastle(castle) && maxUnlockedLevel >= castle.requiredMonsterLevel) {
              drawEntityHighlight(renderer, castle, mapCellWidth, mapCellHeight);
            }
          }
          renderer.context.fillStyle = "#AA3300";
          for (castleIndex = 0; castleIndex < castleList.length; castleIndex++) {
            castle = castleList[castleIndex];
            if (canAttackCastle(castle) && maxUnlockedLevel < castle.requiredMonsterLevel) {
              drawEntityHighlight(renderer, castle, mapCellWidth, mapCellHeight);
            }
          }
          renderer.context.fillStyle = "white";
          for (castleIndex = 0; castleIndex < castleList.length; castleIndex++) {
            castle = castleList[castleIndex];
            if (!(canAttackCastle(castle) || castle.regionLocked || castle.attackScheduled || castle.conquered)) {
              drawEntityHighlight(renderer, castle, mapCellWidth, mapCellHeight);
            }
          }
          var centerWorldBlock = game.world.worldBlocks[1][1],
            homeBlockScreenX = mapCellWidth * (centerWorldBlock.regionColumn - regionOriginColumn),
            homeBlockScreenY = mapCellHeight * (centerWorldBlock.regionRow - regionOriginRow);
          renderer.context.fillStyle = "blue";
          renderer.context.fillRect(homeBlockScreenX + 2, homeBlockScreenY + 2, 4, 4);
          renderer.context.restore();
        }
      } else {
        var centerTileColumn = game.level.pixelToTileColumn(game.level.centerX),
          dungeonRowCursor = game.level.pixelToTileRow(game.level.centerY) - 18;
        drawDungeonTileRow(renderer, dungeonRowCursor++, centerTileColumn - 5, centerTileColumn - 3);
        drawDungeonTileRow(renderer, dungeonRowCursor++, centerTileColumn - 6, centerTileColumn - 2);
        drawDungeonTileRow(renderer, dungeonRowCursor++, centerTileColumn - 7, centerTileColumn - 1);
        drawDungeonTileRow(renderer, dungeonRowCursor++, centerTileColumn - 8, centerTileColumn);
        drawDungeonTileRow(renderer, dungeonRowCursor++, centerTileColumn - 9, centerTileColumn + 1);
        drawDungeonTileRow(renderer, dungeonRowCursor++, centerTileColumn - 10, centerTileColumn + 2);
        drawDungeonTileRow(renderer, dungeonRowCursor++, centerTileColumn - 11, centerTileColumn + 3);
        drawDungeonTileRow(renderer, dungeonRowCursor++, centerTileColumn - 12, centerTileColumn + 4);
        drawDungeonTileRow(renderer, dungeonRowCursor++, centerTileColumn - 13, centerTileColumn + 5);
        drawDungeonTileRow(renderer, dungeonRowCursor++, centerTileColumn - 14, centerTileColumn + 6);
        drawDungeonTileRow(renderer, dungeonRowCursor++, centerTileColumn - 15, centerTileColumn + 7);
        drawDungeonTileRow(renderer, dungeonRowCursor++, centerTileColumn - 16, centerTileColumn + 8);
        drawDungeonTileRow(renderer, dungeonRowCursor++, centerTileColumn - 17, centerTileColumn + 9);
        drawDungeonTileRow(renderer, dungeonRowCursor++, centerTileColumn - 18, centerTileColumn + 10);
        drawDungeonTileRow(renderer, dungeonRowCursor++, centerTileColumn - 19, centerTileColumn + 11);
        drawDungeonTileRow(renderer, dungeonRowCursor++, centerTileColumn - 20, centerTileColumn + 12);
        drawDungeonTileRow(renderer, dungeonRowCursor++, centerTileColumn - 19, centerTileColumn + 13);
        drawDungeonTileRow(renderer, dungeonRowCursor++, centerTileColumn - 18, centerTileColumn + 14);
        drawDungeonTileRow(renderer, dungeonRowCursor++, centerTileColumn - 17, centerTileColumn + 15);
        drawDungeonTileRow(renderer, dungeonRowCursor++, centerTileColumn - 16, centerTileColumn + 16);
        drawDungeonTileRow(renderer, dungeonRowCursor++, centerTileColumn - 14, centerTileColumn + 16);
        drawDungeonTileRow(renderer, dungeonRowCursor++, centerTileColumn - 13, centerTileColumn + 16);
        drawDungeonTileRow(renderer, dungeonRowCursor++, centerTileColumn - 12, centerTileColumn + 15);
        drawDungeonTileRow(renderer, dungeonRowCursor++, centerTileColumn - 11, centerTileColumn + 14);
        drawDungeonTileRow(renderer, dungeonRowCursor++, centerTileColumn - 10, centerTileColumn + 13);
        drawDungeonTileRow(renderer, dungeonRowCursor++, centerTileColumn - 9, centerTileColumn + 12);
        drawDungeonTileRow(renderer, dungeonRowCursor++, centerTileColumn - 8, centerTileColumn + 11);
        drawDungeonTileRow(renderer, dungeonRowCursor++, centerTileColumn - 7, centerTileColumn + 10);
        drawDungeonTileRow(renderer, dungeonRowCursor++, centerTileColumn - 6, centerTileColumn + 9);
        drawDungeonTileRow(renderer, dungeonRowCursor++, centerTileColumn - 5, centerTileColumn + 8);
        drawDungeonTileRow(renderer, dungeonRowCursor++, centerTileColumn - 4, centerTileColumn + 7);
        drawDungeonTileRow(renderer, dungeonRowCursor++, centerTileColumn - 3, centerTileColumn + 6);
        drawDungeonTileRow(renderer, dungeonRowCursor++, centerTileColumn - 2, centerTileColumn + 5);
        drawDungeonTileRow(renderer, dungeonRowCursor++, centerTileColumn - 1, centerTileColumn + 4);
        drawDungeonTileRow(renderer, dungeonRowCursor, centerTileColumn, centerTileColumn + 3);
        var goldDropList = game.goldDrops.drops,
          goldDrop,
          goldDropX,
          goldDropY,
          goldScreenX,
          goldScreenY,
          goldDropIndex;
        for (goldDropIndex = 0; goldDropIndex < goldDropList.length; goldDropIndex++) {
          goldDrop = goldDropList[goldDropIndex];
          goldDropX = goldDrop.levelPositionX;
          goldDropY = goldDrop.levelPositionY;
          goldScreenX = projectWorldX(goldDropX, goldDropY);
          goldScreenY = projectWorldY(goldDropX, goldDropY);
          var goldAmount = goldDrop.goldAmount,
            goldDrops = game.goldDrops;
          renderer.drawSprite(100 > goldAmount ? goldDrops.smallGoldSprite : 1E3 > goldAmount ? goldDrops.mediumGoldSprite : goldDrops.largeGoldSprite, goldScreenX, goldScreenY);
        }
        var scrollDropList = game.scrollDrops.drops,
          scrollDrop,
          scrollDropX,
          scrollDropY,
          scrollScreenX,
          scrollScreenY,
          scrollDropIndex;
        for (scrollDropIndex = 0; scrollDropIndex < scrollDropList.length; scrollDropIndex++) {
          scrollDrop = scrollDropList[scrollDropIndex];
          scrollDropX = scrollDrop.levelPositionX;
          scrollDropY = scrollDrop.levelPositionY;
          scrollScreenX = projectWorldX(scrollDropX, scrollDropY);
          scrollScreenY = projectWorldY(scrollDropX, scrollDropY);
          renderer.drawSprite(getScrollSprite(scrollDrop.getScroll()), scrollScreenX, scrollScreenY);
        }
        var potionDropList = game.potionDrops.drops,
          potionDrop,
          potionDropX,
          potionDropY,
          potionScreenX,
          potionScreenY,
          potionDropIndex;
        for (potionDropIndex = 0; potionDropIndex < potionDropList.length; potionDropIndex++) {
          potionDrop = potionDropList[potionDropIndex];
          potionDropX = potionDrop.levelPositionX;
          potionDropY = potionDrop.levelPositionY;
          potionScreenX = projectWorldX(potionDropX, potionDropY);
          potionScreenY = projectWorldY(potionDropX, potionDropY);
          renderer.drawSprite(potionDrop.potion.potionSprite, potionScreenX, potionScreenY);
        }
        var itemDropList = game.itemDrops.drops,
          itemDrop,
          itemDropX,
          itemDropY,
          itemScreenX,
          itemScreenY,
          itemDropIndex;
        for (itemDropIndex = 0; itemDropIndex < itemDropList.length; itemDropIndex++) {
          itemDrop = itemDropList[itemDropIndex];
          itemDropX = itemDrop.levelPositionX;
          itemDropY = itemDrop.levelPositionY;
          itemScreenX = projectWorldX(itemDropX, itemDropY);
          itemScreenY = projectWorldY(itemDropX, itemDropY);
          renderer.drawSprite(itemDrop.getItem().getIconSprite(), itemScreenX, itemScreenY);
        }
        var treasureTargets = game.treasure.targets,
          treasure,
          treasureX,
          treasureY,
          treasureScreenX,
          treasureScreenY,
          treasureIndex,
          treasureSprite;
        for (treasureIndex = 0; treasureIndex < treasureTargets.length; treasureIndex++) {
          treasure = treasureTargets[treasureIndex];
          if (treasure.room.discovered) {
            treasureX = treasure.levelX;
            treasureY = treasure.levelY;
            treasureScreenX = projectWorldX(treasureX, treasureY);
            treasureScreenY = projectWorldY(treasureX, treasureY);
            treasureSprite = treasure.opened ? treasure.openedSpriteName : treasure.closedSpriteName;
            if (treasure.definition.flushPlacement) {
              renderer.spriteRenderer.drawSpriteDepthRaised(treasureSprite, treasureX, treasureY, treasureScreenX, treasureScreenY, treasureSprite.spriteSheet.spriteSize, 0);
            } else {
              renderer.spriteRenderer.drawSpriteDepth(treasureSprite, treasureX, treasureY, treasureScreenX, treasureScreenY, treasureSprite.spriteSheet.spriteSize, 0);
            }
          }
        }
        var defeatedMonsterList = game.monsters.defeatedMonsters,
          defeatedMonster,
          defeatedX,
          defeatedY,
          defeatedScreenX,
          defeatedScreenY,
          defeatedIndex;
        for (defeatedIndex = 0; defeatedIndex < defeatedMonsterList.length; defeatedIndex++) {
          defeatedMonster = defeatedMonsterList[defeatedIndex];
          defeatedX = defeatedMonster.position.getLevelPositionX();
          defeatedY = defeatedMonster.position.getLevelPositionY();
          defeatedScreenX = projectWorldX(defeatedX, defeatedY);
          defeatedScreenY = projectWorldY(defeatedX, defeatedY);
          renderer.drawSprite(defeatedMonster.getSprite(), defeatedScreenX, defeatedScreenY);
        }
        var monsterList = getMonsters(),
          monster,
          monsterX,
          monsterY,
          monsterScreenX,
          monsterScreenY,
          halfTileSize = TILE_SIZE / 2 | 0,
          monsterIndex,
          monsterSprite;
        for (monsterIndex = 0; monsterIndex < monsterList.length; monsterIndex++) {
          monster = monsterList[monsterIndex];
          monsterX = monster.position.getLevelPositionX();
          monsterY = monster.position.getLevelPositionY();
          monsterScreenX = projectDungeonX(monsterX, monsterY);
          monsterScreenY = projectDungeonY(monsterX, monsterY);
          monsterSprite = monster.getSprite();
          if (4 === monster.characterType) {
            renderer.spriteRenderer.drawSpriteDepth(monsterSprite, monsterX, monsterY, monsterScreenX - halfTileSize, monsterScreenY - halfTileSize, 3 * TILE_SIZE, 0);
          } else {
            renderer.spriteRenderer.drawSpriteDepth(monsterSprite, monsterX, monsterY, monsterScreenX, monsterScreenY, monsterSprite.spriteSheet.spriteSize, 0);
          }
        }
        drawDungeonCharacters(renderer, game.minions.minionList);
        drawDungeonCharacters(renderer, game.state.adventurers);
        drawCharacterEffects(renderer, getMonsters());
        drawCharacterEffects(renderer, game.minions.minionList);
        drawCharacterEffects(renderer, game.state.adventurers);
        if (game.options.showSpellEffects) {
          var effectPool = game.effects.pool;
          if (effectPool && 0 !== effectPool.length) {
            var effectIndex,
              effectAnimation,
              effectPosition,
              effectX,
              effectY,
              effectScreenX,
              effectScreenY,
              effectFrameIndex,
              effect,
              effectType,
              targetedRoom = null,
              hasTargetedRoom = false;
            for (effectIndex = 0; effectIndex < effectPool.length; effectIndex++) {
              if (effect = effectPool[effectIndex], effectType = effect.effectType, 1 === effectType) {
                effectAnimation = effect.getAnimation();
                effectPosition = effect.currentPosition;
                effectFrameIndex = effect.frameIndex;
                effectX = effectPosition.x;
                effectY = effectPosition.y;
                effectScreenX = projectDungeonX(effectX, effectY) + 10;
                effectScreenY = projectDungeonY(effectX, effectY) + 10;
                renderer.spriteRenderer.drawAnimationRaised(effectAnimation, effectFrameIndex, effectX, effectY, effectScreenX, effectScreenY, effectAnimation.spriteSheet.spriteSize, 0);
              } else if (2 === effectType) {
                renderer.context.lineWidth = 1;
                renderer.context.strokeStyle = "#FFD700";
                var startPosition = effect.startPosition;
                var startX = startPosition.x;
                var startY = startPosition.y;
                var lightningStartX = projectDungeonX(startX, startY) + TILE_SIZE;
                var lightningStartY = projectDungeonY(startX, startY) + TILE_SIZE;
                var targetPosition = effect.targetPosition;
                var targetX = targetPosition.x;
                var targetY = targetPosition.y;
                var lightningEndX = projectDungeonX(targetX, targetY) + TILE_SIZE;
                var lightningEndY = projectDungeonY(targetX, targetY) + TILE_SIZE;
                renderer.context.beginPath();
                renderer.context.moveTo(lightningStartX, lightningStartY);
                var lightningMidX = lightningStartX + (lightningEndX - lightningStartX) / 3 | 0,
                  lightningMidY = lightningStartY + (lightningEndY - lightningStartY) / 3 | 0;
                lightningMidX = lightningMidX + randomLightningOffset();
                lightningMidY = lightningMidY + randomLightningOffset();
                renderer.context.lineTo(lightningMidX, lightningMidY);
                lightningMidX = lightningMidX + (lightningEndX - lightningMidX) / 2 | 0;
                lightningMidY = lightningMidY + (lightningEndY - lightningMidY) / 2 | 0;
                lightningMidX += randomLightningOffset();
                lightningMidY += randomLightningOffset();
                renderer.context.lineTo(lightningMidX, lightningMidY);
                renderer.context.lineTo(lightningEndX, lightningEndY);
                renderer.context.stroke();
              } else {
                if (effectType === TARGETED_EFFECT) {
                  targetedRoom = effect.room;
                  hasTargetedRoom = true;
                }
              }
            }
            if (hasTargetedRoom && targetedRoom) {
              var tileEffect,
                tileEffectAnimation,
                tileEffectFrameIndex,
                roomStartColumn = targetedRoom.tileColumn,
                roomStartRow = targetedRoom.tileRow,
                roomEndColumn = roomStartColumn + targetedRoom.widthInTiles,
                roomEndRow = roomStartRow + targetedRoom.heightInTiles,
                tile,
                tilePixelX,
                tilePixelY,
                tileScreenX,
                tileScreenY,
                effectColumn,
                effectRow;
              for (effectColumn = roomStartColumn; effectColumn <= roomEndColumn; effectColumn++) {
                for (effectRow = roomStartRow; effectRow <= roomEndRow; effectRow++) {
                  if ((tile = game.level.getTileAt(effectColumn, effectRow)) && (tileEffect = tile.tileEffect) && tileEffect.hasSpawned && !tileEffect.isFinished()) {
                    tileEffectAnimation = tileEffect.getAnimation();
                    tileEffectFrameIndex = tileEffect.frameIndex;
                    tilePixelX = tile.getPixelX();
                    tilePixelY = tile.getPixelY();
                    tileScreenX = projectDungeonX(tilePixelX, tilePixelY) + 10;
                    tileScreenY = projectDungeonY(tilePixelX, tilePixelY) + 10;
                    renderer.spriteRenderer.drawAnimation(tileEffectAnimation, tileEffectFrameIndex, tilePixelX, tilePixelY, tileScreenX, tileScreenY, tileEffectAnimation.spriteSheet.spriteSize, 0);
                  }
                }
              }
            }
          }
        }
        renderer.spriteRenderer.sortCommands();
        drawCharacterHighlights(renderer, getMonsters(), "red");
        if (!game.state.encounter.noMonstersLeft) {
          drawCharacterHighlights(renderer, game.minions.minionList, "#007FFF");
          drawCharacterHighlights(renderer, game.state.adventurers, "#8B008B");
        }
        if (game.options.showCombatText) {
          drawFloatingText(renderer);
        }
      }
    }
    if (game.options.showFps) {
      renderer.context.font = "12px Georgia";
      renderer.context.fillStyle = "white";
      renderer.context.fillText("帧数: " + game.state.fps, 10, 20);
    }
  };
  GameCanvasView.prototype.createDomElements = function () {
    var containerElement = getElement(this.containerElementId);
    if (containerElement) {
      var canvasElementId = this.elementId,
        canvas = /** @type {HTMLCanvasElement | null} */ (getElement(canvasElementId));
        if (!canvas) {
          canvas = /** @type {HTMLCanvasElement} */ (createElement("canvas", containerElement, canvasElementId, "gameTabTopLeftPanel"));
        canvas.width = VIEWPORT_WIDTH;
        canvas.height = VIEWPORT_HEIGHT;
        canvas.innerHTML = "你的浏览器不支持Html5.请升级你的浏览器.";
      }
      this.renderer = new SceneRenderer(canvas.getContext("2d"));
      if (this.presentationStyle === 'clean') {
        this.renderer.presentation = createMapPresentation();
        this.renderer.context.imageSmoothingEnabled = false;
      }
      (/** @type {GameCanvasView & { visible: boolean }} */ (/** @type {unknown} */ (this))).visible = true;
    }
  };
  GameCanvasView.prototype.setPresentation = function (style) {
    if (style !== 'clean' && style !== 'classic') throw new Error('未知画面风格');
    if (!this.renderer) {
      this.presentationStyle = style;
      return;
    }
    if (style === this.presentationStyle) return;
    this.presentationStyle = style;
    this.renderer.presentation = style === 'clean' ? createMapPresentation() : null;
    this.renderer.context.imageSmoothingEnabled = style !== 'clean';
    if (style === 'classic') resizeDisplay.call(this, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
  };
  /** @this {GameCanvasView} */
  function resizeDisplay(width, height) {
    if (!this.renderer) return;
    const context = this.renderer.context, canvas = context.canvas;
    width = this.presentationStyle === 'clean' ? width : VIEWPORT_WIDTH;
    height = this.presentationStyle === 'clean' ? height : VIEWPORT_HEIGHT;
    if (canvas.width === width && canvas.height === height) return;
    canvas.width = width; canvas.height = height;
    context.setTransform(width / VIEWPORT_WIDTH, 0, 0, height / VIEWPORT_HEIGHT, 0, 0);
    context.imageSmoothingEnabled = this.presentationStyle !== 'clean';
  }
  GameCanvasView.prototype.setDisplaySize = resizeDisplay;
}
