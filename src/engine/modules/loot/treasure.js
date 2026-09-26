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
  this.Zc = null;
  this.ph = 0;
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
  this.Nn = c;
  this.Kg = false;
  this.Vy = f ? d.xh.closed : d.hh.closed;
  this.PA = f ? d.xh.Ec : d.hh.Ec;
  this.Mf = d.Mf;
  this.VE = f;
  this.BC = d;
  this.el = false;
}
export function setChestOpened(a, b) {
  if (a.Kg = b) {
    a.el = false;
    game.state.party.hq(null);
  }
}
export function TreasureRegistry() {
  this.Mn = [];
  this.Dt = {};
  this.ve = [];
  this.yh = new Vector2();
}
export function spawnRoomTreasure(a) {
  var b = game.treasure;
    c = 0 < getMonsters().length;
  if (!getRoomTreasure(b, a)) {
    if (3 != a.Yp) {
      if (!c && 2 > a.Nc.length) {
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
      b.Mn.push(a);
      b.Dt[a.Nn.roomId] = a;
    } else {
      console.log("failed to find treasure chest location.");
    }
  }
}
export function getRoomTreasure(a, b) {
  return b ? a.Dt[b.roomId] : null;
}
export function initializeLootTreasure() {
  GoldDrop.prototype.oh = function (a) {
    this.collected = a;
  };
  GoldDrop.prototype.Re = function (a) {
    this.Zc = a;
  };
  GoldDrop.prototype.Ud = function () {
    return this.ph;
  };
  GoldDrop.prototype.Se = function (a) {
    this.ph = a;
  };
  GoldDropRegistry.prototype.zl = function () {
    var a;
    for (a = 0; a < this.pe.length; a++) {
      this.pe[a].Re(null);
      this.pe[a].Se(0);
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
