/** 金币掉落、宝箱生成和拾取。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { game } from "../runtime/game.js";
import { Vector2, randomInt, setVector } from "../core/math.js";
import { getMonsters } from "../combat/encounters.js";
import { globalUpgradeDefinitions } from "../content/balance.js";
import { canPlaceRoomObject } from "../world/rooms.js";
export function GoldDrop(a, b, c, d) {
  this.Xl = a;
  this.Xo = b;
  this.Yo = c;
  this.vD = d;
  this.collected = false;
  this.claimedBy = null;
  this.claimDistance = 0;
}
export function GoldDropRegistry() {
  this.pe = [];
  this.xw = this.xw = this.Sz = null;
}
export function removeGoldDrop(a) {
  var b = game.goldDrops;
  a = b.pe.indexOf(a);
  if (-1 < a) {
    b.pe.splice(a, 1);
  }
}
export function TreasureChest(a, b, c, d, f) {
  this.zq = a;
  this.Aq = b;
  this.room = c;
  this.opened = false;
  this.closedSpriteName = f ? d.xh.closed : d.hh.closed;
  this.openedSpriteName = f ? d.xh.opened : d.hh.opened;
  this.kind = d.kind;
  this.VE = f;
  this.BC = d;
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
  this.ve = [];
  this.yh = new Vector2();
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
    var c = b.ve[randomInt(b.ve.length)],
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
      if (!c.jh) {
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
  GoldDrop.prototype.oh = function (a) {
    this.collected = a;
  };
  GoldDrop.prototype.Re = function (a) {
    this.claimedBy = a;
  };
  GoldDrop.prototype.getClaimDistance = function () {
    return this.claimDistance;
  };
  GoldDrop.prototype.setClaimDistance = function (a) {
    this.claimDistance = a;
  };
  GoldDropRegistry.prototype.zl = function () {
    var a;
    for (a = 0; a < this.pe.length; a++) {
      this.pe[a].Re(null);
      this.pe[a].setClaimDistance(0);
    }
  };
  TreasureRegistry.prototype.Xw = function (a) {
    var b = a.tileRow;
    a = a.tileColumn + randomInt(a.widthInTiles);
    setVector(this.yh, a, b - 1);
    return this.yh;
  };
  TreasureRegistry.prototype.Zw = function (a) {
    var b = a.tileColumn;
    a = a.tileRow + randomInt(a.heightInTiles);
    setVector(this.yh, b - 1, a);
    return this.yh;
  };
}
