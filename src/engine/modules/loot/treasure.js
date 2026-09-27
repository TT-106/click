/** 金币掉落、宝箱生成和拾取。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { game } from "../runtime/game.js";
import { Vector2, randomInt, setVector } from "../core/math.js";
import { getMonsters } from "../combat/encounters.js";
import { globalUpgradeDefinitions } from "../content/balance.js";
import { canPlaceRoomObject } from "../world/rooms.js";
export function GoldDrop(a, b, c, d) {
  this.goldAmount = a;
  this.levelPositionX = b;
  this.levelPositionY = c;
  this.room = d;
  this.collected = false;
  this.claimedBy = null;
  this.claimDistance = 0;
}
export function GoldDropRegistry() {
  this.drops = [];
  this.mediumGoldSprite = this.mediumGoldSprite = this.smallGoldSprite = null;
}
export function removeGoldDrop(a) {
  var b = game.goldDrops;
  a = b.drops.indexOf(a);
  if (-1 < a) {
    b.drops.splice(a, 1);
  }
}
export function TreasureChest(a, b, c, d, f) {
  this.levelX = a;
  this.levelY = b;
  this.room = c;
  this.opened = false;
  this.closedSpriteName = f ? d.westWallVariants.closed : d.standardVariants.closed;
  this.openedSpriteName = f ? d.westWallVariants.opened : d.standardVariants.opened;
  this.kind = d.kind;
  this.westWall = f;
  this.definition = d;
  this.selected = false;
}
export function setChestOpened(a, b) {
  if (a.opened = b) {
    a.selected = false;
    game.state.party.setTargetTreasureChest(null);
  }
}
export function TreasureRegistry() {
  this.targets = [];
  this.targetByRoomId = {};
  this.targetDefinitions = [];
  this.spawnPointScratch = new Vector2();
}
export function spawnRoomTreasure(a) {
  var b = game.treasure;
    c = 0 < getMonsters().length;
  if (!getRoomTreasure(b, a)) {
    if (3 != a.Yp) {
      if (!c && 2 > a.doorList.length) {
        return;
      }
      c = globalUpgradeDefinitions.treasureChance.currentValue / 100;
      if (Math.random() > c) {
        return;
      }
    }
    var c = b.targetDefinitions[randomInt(b.targetDefinitions.length)],
      d = 0.5 > Math.random(),
      f,
      g;
    f = false;
    for (var h = 0; !f && 10 > h;) {
      g = d ? b.Zw(a) : b.Xw(a);
      if (!(f = canPlaceRoomObject(a, g))) {
        g = null;
      }
      h++;
    }
    if (f = g) {
      g = f.x * game.tileSize;
      f = f.y * game.tileSize;
      if (!c.flushPlacement) {
        if (d) {
          g += game.tileSize;
        } else {
          f += game.tileSize;
        }
      }
      a = new TreasureChest(g, f, a, c, d);
      b.targets.push(a);
      b.targetByRoomId[a.room.roomId] = a;
    } else {
      console.log("failed to find treasure chest location.");
    }
  }
}
export function getRoomTreasure(a, b) {
  return b ? a.targetByRoomId[b.roomId] : null;
}
export function initializeLootTreasure() {
  GoldDrop.prototype.setCollected = function (a) {
    this.collected = a;
  };
  GoldDrop.prototype.setClaimedBy = function (a) {
    this.claimedBy = a;
  };
  GoldDrop.prototype.getClaimDistance = function () {
    return this.claimDistance;
  };
  GoldDrop.prototype.setClaimDistance = function (a) {
    this.claimDistance = a;
  };
  GoldDropRegistry.prototype.releaseClaims = function () {
    var a;
    for (a = 0; a < this.drops.length; a++) {
      this.drops[a].setClaimedBy(null);
      this.drops[a].setClaimDistance(0);
    }
  };
  TreasureRegistry.prototype.Xw = function (a) {
    var b = a.tileRow;
    a = a.tileColumn + randomInt(a.widthInTiles);
    setVector(this.spawnPointScratch, a, b - 1);
    return this.spawnPointScratch;
  };
  TreasureRegistry.prototype.Zw = function (a) {
    var b = a.tileColumn;
    a = a.tileRow + randomInt(a.heightInTiles);
    setVector(this.spawnPointScratch, b - 1, a);
    return this.spawnPointScratch;
  };
}
