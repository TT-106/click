/** 精灵图、动画帧、方向和视觉效果。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { FRAME_DURATION_MS, Vector2, assignVector, copyVector, floorNumber, normalizeVector, subtractVector } from "../core/math.js";
import { game } from "../runtime/game.js";
import { EFFECT_FRAME_DURATION_MS, PROJECTILE_FRAME_DURATION_MS } from "../content/balance.js";
export var TARGETED_EFFECT, directionScratchVector;
export function Sprite(a, b, c, d) {
  this.Ad = a;
  this.sourceX = b;
  this.sourceY = c;
  this.name = d;
}
export function SpriteSheet(a, b, c) {
  this.loaded = false;
  this.spriteSize = b;
  this.Yh = {};
  var d = this;
  this.Il = new Image();
  this.Il.onload = function () {
    d.$w(c);
    d.loaded = true;
  };
  this.Il.src = a;
}
export function SpriteAnimation(a, b, c, d, f, g, h, l) {
  this.Ad = a;
  this.animationName = b;
  this.zc = l;
  a = [];
  var n, p, s;
  b = 0;
  var u;
  l = this.Ad.spriteSize;
  for (n = d; n <= g; n++) {
    for (s = n * l, u = n < g ? h : Math.min(f, h), d = c; d <= u; d++) {
      p = d * l;
      a.push(new AnimationFrame(b++, p, s));
    }
  }
  this.frames = a;
}
export function AnimationFrame(a, b, c) {
  this.oc = a;
  this.frameSourceX = b;
  this.frameSourceY = c;
}
export function AnimationSheet(a, b, c, d) {
  this.loaded = false;
  this.fileName = a;
  this.spriteSize = b;
  this.Yh = {};
  this.FB = [];
  var f = this;
  this.Il = new Image();
  this.Il.onload = function () {
    f.$w(c, d);
    f.loaded = true;
  };
  this.Il.src = a;
}
export function AnimationCatalog(a) {
  this.Yh = null;
  this.Zt = a;
}
export function VisualEffect(a, b, c, d, f) {
  this.ca = a;
  this.Io = f;
  this.ew = this.ud = null;
  this.li = 0;
  if (d) {
    f = new Vector2();
    copyVector(f, b);
  } else {
    if (f === TARGETED_EFFECT) {
      f = new Vector2();
      copyVector(f, c);
    } else {
      f = c;
    }
  }
  this.iD = b;
  this.wm = f;
  this.xi = c;
  this.Pk = false;
  this.Xb = d;
  this.bg = this.Cj = this.Gs = false;
  this.nd = a ? game.animations.Zg(a) : null;
  if (a && !this.nd) {
    console.log("Failed to find animated sprite: " + a);
  }
  this.De = this.nd ? this.nd.To() : 0;
  this.bx = -1;
  this.oc = 0;
  if (this.nd && this.nd.zc) {
    this.oc = getEffectDirection(this);
  }
  this.yi = 0;
  this.uA = false;
}
export function getEffectDirection(a) {
  assignVector(directionScratchVector, a.xi);
  subtractVector(directionScratchVector, a.wm);
  normalizeVector(directionScratchVector);
  a = directionScratchVector.T;
  var b = directionScratchVector.U,
    c = 180 * -Math.atan2(b, a) / Math.PI;
  if (0 > c) {
    c += 360;
  }
  if (337.5 <= c || 22.5 > c) {
    return 3;
  }
  if (22.5 <= c && 67.5 > c) {
    return 2;
  }
  if (67.5 <= c && 112.5 > c) {
    return 1;
  }
  if (112.5 <= c && 157.5 > c) {
    return 0;
  }
  if (157.5 <= c && 202.5 > c) {
    return 7;
  }
  if (202.5 <= c && 247.5 > c) {
    return 6;
  }
  if (247.5 <= c && 292.5 > c) {
    return 5;
  }
  if (292.5 <= c && 337.5 > c) {
    return 4;
  }
  console.log("direction fail x=" + a + " y=" + b + " angle=" + c);
}
export function advanceEffectFrame(a, b) {
  a.yi += b * FRAME_DURATION_MS;
  var c = a.Xb ? PROJECTILE_FRAME_DURATION_MS : EFFECT_FRAME_DURATION_MS;
  a.bx = a.oc;
  if (a.yi >= c) {
    var d = Math.min(1, floorNumber(a.yi / c));
    a.yi = Math.max(0, floorNumber(a.yi % c));
    a.oc += d;
    if (a.oc >= a.De) {
      if (a.uA) {
        if (a.ud.Ja.Kf) {
          a.oc = 0;
        } else {
          a.bg = true;
        }
      } else {
        if (a.Xb) {
          a.oc = 0;
        } else {
          a.bg = true;
        }
      }
    }
  }
}
export function clearVisualEffects() {
  var a = game.effects;
  if (0 < a.Wg.length) {
    var b;
    for (b = 0; b < a.Wg.length; b++) {
      var c = a.Wg[b];
      c.bg = true;
      c.Pk = true;
    }
    a.Wg.length = 0;
  }
}
export function addVisualEffect(a, b) {
  if (b) {
    a.Wg.push(b);
  }
}
export function initializeRenderingSprites() {
  Sprite.prototype.getName = function () {
    return this.name;
  };
  Sprite.prototype.Hj = function () {
    return this.Ad.Hj();
  };
  SpriteSheet.prototype.$w = function (a) {
    var b, c;
    for (b = 0; b < a.length; b++) {
      c = a[b];
      this.Yh[c.a] = new Sprite(this, c.b.x, c.b.y, c.a);
    }
  };
  SpriteSheet.prototype.v = function (a) {
    return this.Yh[a];
  };
  SpriteSheet.prototype.Hj = function () {
    return this.Il;
  };
  SpriteSheet.prototype.cl = function () {
    return this.loaded;
  };
  SpriteAnimation.prototype.Hj = function () {
    return this.Ad.Hj();
  };
  SpriteAnimation.prototype.To = function () {
    return this.frames.length;
  };
  AnimationSheet.prototype.$w = function (a, b) {
    var c, d;
    for (c = 0; c < a.length; c++) {
      d = a[c];
      this.FB.push(d.animationName);
      this.Yh[d.animationName] = new SpriteAnimation(this, d.animationName, d.O, d.P, d.M, d.N, b, d.zc);
    }
  };
  AnimationSheet.prototype.Zg = function (a) {
    return this.Yh[a];
  };
  AnimationSheet.prototype.Hj = function () {
    return this.Il;
  };
  AnimationSheet.prototype.cl = function () {
    return this.loaded;
  };
  AnimationCatalog.prototype.Zg = function (a) {
    var b = this.Yh[a];
    return b ? b.Zg(a) : null;
  };
  AnimationCatalog.prototype.cl = function () {
    var a;
    for (a = 0; a < this.Zt.length; a++) {
      if (!this.Zt[a].cl()) {
        return false;
      }
    }
    if (!this.Yh) {
      a = this.Zt;
      var b,
        c,
        d,
        f,
        g = {};
      for (b = 0; b < a.length; b++) {
        for (d = a[b], f = d.FB, c = 0; c < f.length; c++) {
          if (g[f[c]]) {
            console.log("effect name already defined: " + f[c]);
          }
          g[f[c]] = d;
        }
      }
      this.Yh = g;
    }
    return true;
  };
  TARGETED_EFFECT = 3;
  directionScratchVector = new Vector2();
  VisualEffect.prototype.Zg = function () {
    return this.nd;
  };
  VisualEffect.prototype.qB = function (a) {
    this.li = a;
  };
  VisualEffect.prototype.bl = function () {
    return this.bg || this.Pk;
  };
  VisualEffect.prototype.To = function () {
    return this.De;
  };
}
