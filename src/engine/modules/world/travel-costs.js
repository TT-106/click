/** 大地图通行代价计算。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { game } from "../runtime/game.js";
export function WorldPathfinder() {
  this.VC = 1E8;
}
export function calculateWorldCosts(a, b, c) {
  a = a.VC;
  var d = game.world.worldBlocks,
    f,
    g,
    h;
  for (h = 0; 3 > h; h++) {
    for (f = d[h], g = 0; 3 > g; g++) {
      for (var l = f[g], n = a, p = 0, s = undefined, u = undefined; p < l.jo.length; p++) {
        for (u = l.jo[p], s = 0; s < u.length; s++) {
          u[s].ln = n;
        }
      }
    }
  }
  if (c = game.world.getTileAtPixel(b, c)) {
    for (b = [], c.ln = 0, b.push(c), c = [null, null, null, null]; 0 < b.length;) {
      for (g = b.shift(), a = g.ln, d = c, f = g.bc(), g = g.cc(), d[0] = game.world.getTileAtPixel(f, g - 1), d[1] = game.world.getTileAtPixel(f - 1, g), d[2] = game.world.getTileAtPixel(f + 1, g), d[3] = game.world.getTileAtPixel(f, g + 1), g = 0; g < c.length; g++) {
        if (d = c[g]) {
          f = a + d.Ln + 1;
          if (f < d.ln) {
            d.ln = f;
            b.push(d);
          }
        }
      }
    }
  } else {
    console.log("error: destination is not on grid!!!");
  }
}
export function initializeWorldTravelCosts() {}
