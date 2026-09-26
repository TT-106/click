/** 从原始组合根独立出的配置数据。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { game } from "../runtime/game.js";
import { Castle, DungeonNameGenerator, RegionLayout, WORLD_BLOCK_COLUMNS, WORLD_BLOCK_ROWS, WorldRegion, chooseAdjacentRegion, generateDungeonName } from "./regions.js";
import { SeededRandom, randomIntFrom } from "../core/math.js";
import { Dungeon, randomDungeonType, resetFarms, resetShops, sortDungeons } from "./dungeons.js";
import { resetAdventurePoints } from "../progression/points.js";
import { resetAchievements } from "../progression/achievements.js";
import { bindStatistics } from "../progression/statistics.js";
export function initializeRegionsAndCastles() {
  var eb = game.regions;
  eb.sk = {};
  eb.Mr.length = 0;
  var Gb = eb.Eh,
    Da,
    ub,
    mb,
    Ea,
    La,
    wa,
    Fa;
  Ea = eb.Rh;
  for (Da = 0; Da < Gb; Da++, Ea++) {
    mb = [];
    La = eb.Sh;
    for (ub = 0; ub < Gb; ub++, La++) {
      wa = Ea + "_" + La;
      Fa = new WorldRegion(wa, Ea, La);
      mb.push(Fa);
      eb.sk[wa] = Fa;
    }
    eb.Mr.push(mb);
  }
  var ha = game.castles;
  ha.castleList.length = 0;
  ha.attackableCastles.length = 0;
  ha.scheduledCastles.length = 0;
  ha.bm = {};
  ha.cm = 0;
  ha.Uj = 1;
  var ja = new RegionLayout(),
    Ga = new SeededRandom(11),
    bb = new DungeonNameGenerator(Ga),
    za,
    nb,
    fb,
    cb = ja.BA,
    Ua = ja.EA,
    Va = WORLD_BLOCK_COLUMNS / 2 | 0,
    mc = WORLD_BLOCK_ROWS / 2 | 0,
    vb = {},
    Sb = 0,
    Ma = game.regions.Eh,
    zb = Ma * Ma,
    Hb,
    ac,
    ob,
    pb,
    Ha,
    jb,
    Ab = {},
    Bb = [];
  for (za = 0; 35 > za; za++) {
    pb = 1;
    Hb = cb + randomIntFrom(Ga, Ma);
    ac = Ua + randomIntFrom(Ga, Ma);
    for (ob = Hb + "_" + ac; vb[ob];) {
      pb++;
      Hb = cb + randomIntFrom(Ga, Ma);
      ac = Ua + randomIntFrom(Ga, Ma);
      ob = Hb + "_" + ac;
    }
    vb[ob] = true;
    for (Ha = generateDungeonName(bb, 11); Ab[Ha];) {
      Ha = generateDungeonName(bb, 11);
    }
    Ab[Ha] = true;
    nb = Hb * WORLD_BLOCK_COLUMNS + Va;
    fb = ac * WORLD_BLOCK_ROWS + mc;
    nb += randomIntFrom(Ga, 6) - 3;
    fb += randomIntFrom(Ga, 6) - 3;
    jb = new Castle(ob, Ha, Hb, ac, nb, fb);
    Bb.push(jb);
    var qb = jb,
      wb = game.regions.sk[ob];
    qb.ck.push(wb);
    wb.cu = qb;
    Sb++;
  }
  for (var Ib, Ec = 0; Sb < zb;) {
    for (za = 0; za < Bb.length; za++) {
      jb = Bb[za];
      a: {
        for (var bc = ja, Wa = vb, cc = Ga, Qa = jb.ck, nc = undefined, sa = undefined, sa = /** @type {any} */ (0); sa < Qa.length; sa++) {
          if (nc = chooseAdjacentRegion(bc, Qa[sa], Wa, cc)) {
            Ib = nc;
            break a;
          }
        }
        Ib = null;
      }
      if (Ib) {
        var Tb = jb,
          qc = Ib;
        Tb.ck.push(qc);
        qc.cu = Tb;
        vb[Ib.io] = true;
        Sb++;
      }
    }
    Ec++;
  }
  ha.castleList = Bb;
  var Fc, Cb, kb, Ra;
  for (Fc = 0; Fc < ha.castleList.length; Fc++) {
    for (kb = ha.castleList[Fc], ha.bm[kb.castleId] && console.log("duplicate castle id: " + kb.castleId), ha.bm[kb.castleId] = kb, Ra = kb.ck, Cb = 0; Cb < Ra.length; Cb++) {
      if (ha.ju[Ra[Cb].io]) {
        console.log("duplicate castle owner: " + Ra[Cb].io);
      }
      ha.ju[Ra[Cb].io] = kb;
    }
  }
  var Ja = game.dungeons;
  Ja.dungeonList.length = 0;
  Ja.discovered.length = 0;
  Ja.attackable.length = 0;
  Ja.cleared.length = 0;
  Ja.farms.length = 0;
  Ja.Mk = 0;
  Ja.farmable.length = 0;
  Ja.Sd = 0;
  Ja.Do = {};
  var Db,
    gb = new SeededRandom(1),
    rb = new DungeonNameGenerator(gb),
    dc = game.castles.castleList,
    Ka,
    Xa,
    hb,
    lb,
    rc,
    sc,
    Aa,
    db,
    Mc,
    ec,
    Ub,
    sb,
    ka,
    Eb,
    xb = {},
    Na = [];
  for (ka = 0; ka < dc.length; ka++) {
    for (Ka = dc[ka], Xa = Ka.ck, sc = Ka.dm, Aa = Ka.em, Eb = 0; Eb < Xa.length; Eb++) {
      if (db = Xa[Eb].regionColumn, Mc = Xa[Eb].regionRow, !(0.7 < (/** @type {any} */ (gb)).random())) {
        ec = 1 + db * WORLD_BLOCK_COLUMNS + randomIntFrom(gb, WORLD_BLOCK_COLUMNS - 1);
        for (Ub = 1 + Mc * WORLD_BLOCK_ROWS + randomIntFrom(gb, WORLD_BLOCK_ROWS - 1); ec === sc && Ub === Aa;) {
          ec = 1 + db * WORLD_BLOCK_COLUMNS + randomIntFrom(gb, WORLD_BLOCK_COLUMNS - 1);
          Ub = 1 + Mc * WORLD_BLOCK_ROWS + randomIntFrom(gb, WORLD_BLOCK_ROWS - 1);
        }
        lb = randomDungeonType(gb);
        for (hb = generateDungeonName(rb, lb); xb[hb];) {
          hb = generateDungeonName(rb, lb);
        }
        xb[hb] = true;
        Db = db + "_" + Mc;
        rc = 3 + randomIntFrom(gb, 4);
        sb = new Dungeon(Db, hb, lb, ec, Ub, db, Mc, rc, Ka);
        Na.push(sb);
        Ka.dungeonList.push(sb);
      }
    }
  }
  Ja.dungeonList = Na;
  var Ya, tc;
  for (Ya = 0; Ya < Ja.dungeonList.length; Ya++) {
    tc = Ja.dungeonList[Ya];
    Ja.Do[tc.dungeonId] = tc;
  }
  sortDungeons(Ja, Ja.dungeonList);
  resetFarms();
  resetShops();
  resetAdventurePoints();
  resetAchievements();
  game.paused = false;
  game.initialized = true;
  bindStatistics();
}
export function initializeWorldInitialization() {}
