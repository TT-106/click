// @ts-nocheck -- M10 渐进类型化：JSDoc 覆盖后摘除（见 docs/WORKSTATE.md）
/** 帧调度、资源就绪、离线结算与界面初始化。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { nowMilliseconds, recordGameEvent } from "../core/math.js";
import { game } from "../runtime/game.js";
import { advanceSimulation } from "./tick.js";
import { restoreGameState, saveProgress, serializeGame } from "../persistence/game-save.js";
import { PauseView, TabBar, TabState, addTab, mountTabBar } from "../views/navigation.js";
import { PartyCreationView } from "../views/party-creation.js";
import { ExpeditionView } from "../views/expedition.js";
import { CharacterView } from "../views/character.js";
import { MonsterView } from "../views/monsters.js";
import { DungeonsView } from "../views/dungeons.js";
import { CastlesView } from "../views/castles.js";
import { GameOverView, OfflineProgressView } from "../views/results.js";
import { PointsView } from "../views/achievements.js";
import { InformationView } from "../views/information.js";
import { addChildView } from "../views/base.js";
import { persistence } from "../runtime/storage-port.js";
export function GameLoop() {
  this.resourcesReady = false;
  this.lastTickAt = nowMilliseconds();
  this.lastFrameAt = nowMilliseconds();
  this.frameDuration = 1E3 / 60;
  this.turnDuration = 250;
  var a = this;
  this.requestTick = function () {
    a.tick();
  };
  this.fpsElapsed = this.fpsFrameCount = 0;
}
export function initializeSimulationLoop() {
  GameLoop.prototype.tick = function () {
    if (this.resourcesReady) {
      if (game.initialized) {
        var a = nowMilliseconds(),
          b = a - this.lastFrameAt,
          a = Math.max(0, a - this.lastTickAt),
          c;
        this.lastFrameAt = nowMilliseconds();
        if (game.partyCreated && !game.gameWon && !game.paused) {
          if (1E3 < a && game.options.allowBackgroundProgress && (game.processingOffline || (game.processingOffline = true, game.offlineProcessed = 0, game.offlineDuration = 0, game.view.onOfflineStart()), game.offlineDuration += a), game.processingOffline) {
            for (c = 0; 200 > c && game.offlineProcessed < game.offlineDuration && !game.gameWon && game.processingOffline;) {
              advanceSimulation(15);
              game.offlineProcessed += this.turnDuration;
              game.state.aa.fp(this.turnDuration);
              c++;
            }
            if (game.offlineProcessed >= game.offlineDuration) {
              game.finishOfflineProgress();
            }
          } else {
            c = a / this.frameDuration;
            if (0 < c) {
              advanceSimulation(c);
            }
            c = game.camera;
            var d, f, g, h;
            if (game.worldActive) {
              d = game.world.he;
              f = game.world.ie;
            } else {
              d = game.level.Ki;
              f = game.level.Li;
            }
            g = Math.round(d % game.tileSize);
            h = Math.round(f % game.tileSize);
            c.zt = g - h;
            c.At = Math.round((g + h) / 2);
            c.vk = d / game.tileSize | 0;
            c.wk = f / game.tileSize | 0;
          }
        }
        if (game.renderEnabled) {
          try {
            game.view.render();
          } catch (l) {
            console.log("Caught error. name: " + l.name + " message: " + l.message + " exception: " + l);
          }
        }
        this.fpsFrameCount++;
        this.fpsElapsed += b;
        if (60 <= this.fpsFrameCount) {
          game.state.dz = this.fpsFrameCount / (this.fpsElapsed / 1E3) | 0;
          this.fpsElapsed = this.fpsFrameCount = 0;
        }
        if (!game.processingOffline) {
          b = game.saves;
          if (nowMilliseconds() - b.lastSavedAt > b.autoSaveInterval) {
            saveProgress(b);
          }
        }
        if (!(game.paused || game.processingOffline)) {
          game.state.aa.fp(a);
        }
        this.lastTickAt = nowMilliseconds();
      } else {
        game.initializeWorld();
        b = game.saves;
        // 校验过的文件也可能包含引擎不能恢复的引用。失败时保留磁盘原档，
        // 回到已初始化的空白世界，使恢复和导出入口始终可用。
        const initialSave = serializeGame(b);
        try {
          const storedSave = persistence.read();
          if (storedSave && !restoreGameState(b, storedSave)) throw new Error('存档无法恢复');
        } catch (error) {
          restoreGameState(b, initialSave);
          persistence.onLoadError?.(error);
        }
        recordGameEvent("SaveManager", "Load");
        this.lastTickAt = nowMilliseconds();
        b = game.view;
        a = new TabState("创建队伍", true);
        c = new TabState("游戏结束", false);
        d = new TabState("游戏", false);
        f = new TabState("Char0", false);
        g = new TabState("Char1", false);
        h = new TabState("Char2", false);
        var n = new TabState("Char3", false),
          p = new TabState("Char4", false),
          s = new TabState("怪物", false),
          u = new TabState("地牢", false),
          y = new TabState("城堡", false),
          A = new TabState("点数", true),
          C = new TabState("离线", false),
          v = new TabState("信息", true);
        b.Gh.length = 0;
        b.Gh.push(f);
        b.Gh.push(g);
        b.Gh.push(h);
        b.Gh.push(n);
        b.Gh.push(p);
        if (game.partyCreated) {
          if (game.gameWon) {
            c.selected = true;
          } else {
            d.selected = true;
          }
        } else {
          a.selected = true;
        }
        b.tabBar = new TabBar("gameTabMenu");
        var D = new PartyCreationView(a),
          N = new ExpeditionView(d),
          I = new CharacterView(f, "characterTabContent0", 0),
          x = new CharacterView(g, "characterTabContent1", 1),
          z = new CharacterView(h, "characterTabContent2", 2),
          O = new CharacterView(n, "characterTabContent3", 3),
          J = new CharacterView(p, "characterTabContent4", 4),
          la = new MonsterView(s),
          Q = new DungeonsView(u),
          V = new CastlesView(y),
          na = new GameOverView(c),
          K = new PointsView(A),
          H = new OfflineProgressView(C),
          S = new InformationView(v),
          da = new PauseView();
        addTab(b.tabBar, a);
        addTab(b.tabBar, c);
        addTab(b.tabBar, d);
        addTab(b.tabBar, f);
        addTab(b.tabBar, g);
        addTab(b.tabBar, h);
        addTab(b.tabBar, n);
        addTab(b.tabBar, p);
        addTab(b.tabBar, s);
        addTab(b.tabBar, u);
        addTab(b.tabBar, y);
        addTab(b.tabBar, A);
        addTab(b.tabBar, C);
        addTab(b.tabBar, v);
        if (b.Lg) {
          b.Lg.length = 0;
        }
        addChildView(b, b.tabBar);
        addChildView(b, D);
        addChildView(b, I);
        addChildView(b, x);
        addChildView(b, z);
        addChildView(b, O);
        addChildView(b, J);
        addChildView(b, la);
        addChildView(b, Q);
        addChildView(b, V);
        addChildView(b, N);
        addChildView(b, na);
        addChildView(b, K);
        addChildView(b, H);
        addChildView(b, S);
        addChildView(b, da);
        b.panels.push(D);
        b.panels.push(I);
        b.panels.push(x);
        b.panels.push(z);
        b.panels.push(O);
        b.panels.push(J);
        b.panels.push(la);
        b.panels.push(Q);
        b.panels.push(V);
        b.panels.push(N);
        b.panels.push(na);
        b.panels.push(K);
        b.panels.push(H);
        b.panels.push(S);
        if (!game.partyCreated) {
          mountTabBar(b.tabBar);
        }
        if (game.partyCreated) {
          game.view.reset();
        }
        if (game.processingOffline) {
          game.view.onOfflineStart();
        }
        if (game.gameWon) {
          game.view.onGameWon();
        }
      }
    } else {
      this.resourcesReady = game.monsterSprites.cl() && game.terrainSprites.cl() && game.itemSprites.cl() && game.animations.cl();
      this.lastTickAt = nowMilliseconds();
    }
    requestAnimationFrame(this.requestTick);
  };
}
