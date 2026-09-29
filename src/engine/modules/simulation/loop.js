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
  var self = this;
  this.requestTick = function () {
    (/** @type {GameLoop & { tick: () => void }} */ (/** @type {unknown} */ (self))).tick();
  };
  this.fpsElapsed = this.fpsFrameCount = 0;
}
export function initializeSimulationLoop() {
  GameLoop.prototype.tick = function () {
    if (this.resourcesReady) {
      if (game.initialized) {
        var a = nowMilliseconds(),
          frameDeltaMs = a - this.lastFrameAt,
          a = Math.max(0, a - this.lastTickAt),
          offlineTurnCount;
        this.lastFrameAt = nowMilliseconds();
        if (game.partyCreated && !game.gameWon && !game.paused) {
          if (1E3 < a && game.options.allowBackgroundProgress && (game.processingOffline || (game.processingOffline = true, game.offlineProcessed = 0, game.offlineDuration = 0, game.view.onOfflineStart()), game.offlineDuration += a), game.processingOffline) {
            for (offlineTurnCount = 0; 200 > offlineTurnCount && game.offlineProcessed < game.offlineDuration && !game.gameWon && game.processingOffline;) {
              advanceSimulation(15);
              game.offlineProcessed += this.turnDuration;
              game.state.statisticsRecorder.recordPlayedMilliseconds(this.turnDuration);
              offlineTurnCount++;
            }
            if (game.offlineProcessed >= game.offlineDuration) {
              game.finishOfflineProgress();
            }
          } else {
            var frameSimulationUnits = a / this.frameDuration;
            if (0 < frameSimulationUnits) {
              advanceSimulation(frameSimulationUnits);
            }
            var camera = game.camera;
            var centerX, centerY, centerRemainderX, centerRemainderY;
            if (game.worldActive) {
              centerX = game.world.worldCenterX;
              centerY = game.world.worldCenterY;
            } else {
              centerX = game.level.centerX;
              centerY = game.level.centerY;
            }
            centerRemainderX = Math.round(centerX % game.tileSize);
            centerRemainderY = Math.round(centerY % game.tileSize);
            camera.viewportOffsetX = centerRemainderX - centerRemainderY;
            camera.viewportOffsetY = Math.round((centerRemainderX + centerRemainderY) / 2);
            camera.tileColumn = centerX / game.tileSize | 0;
            camera.tileRow = centerY / game.tileSize | 0;
          }
        }
        if (game.renderEnabled) {
          try {
            game.view.render();
          } catch (renderError) {
            console.log("Caught error. name: " + renderError.name + " message: " + renderError.message + " exception: " + renderError);
          }
        }
        this.fpsFrameCount++;
        this.fpsElapsed += frameDeltaMs;
        if (60 <= this.fpsFrameCount) {
          game.state.fps = this.fpsFrameCount / (this.fpsElapsed / 1E3) | 0;
          this.fpsElapsed = this.fpsFrameCount = 0;
        }
        if (!game.processingOffline) {
          var saveManager = game.saves;
          if (nowMilliseconds() - saveManager.lastSavedAt > saveManager.autoSaveInterval) {
            saveProgress(saveManager);
          }
        }
        if (!(game.paused || game.processingOffline)) {
          game.state.statisticsRecorder.recordPlayedMilliseconds(a);
        }
        this.lastTickAt = nowMilliseconds();
      } else {
        game.initializeWorld();
        var initialSaveManager = game.saves;
        // 校验过的文件也可能包含引擎不能恢复的引用。失败时保留磁盘原档，
        // 回到已初始化的空白世界，使恢复和导出入口始终可用。
        const initialSave = serializeGame(initialSaveManager);
        try {
          const storedSave = persistence.read();
          if (storedSave && !restoreGameState(initialSaveManager, storedSave)) throw new Error('存档无法恢复');
        } catch (error) {
          restoreGameState(initialSaveManager, initialSave);
          persistence.onLoadError?.(error);
        }
        recordGameEvent("SaveManager", "Load");
        this.lastTickAt = nowMilliseconds();
        var gameView = game.view;
        var createPartyTab = new TabState("创建队伍", true),
          gameOverTab = new TabState("游戏结束", false),
          gameTab = new TabState("游戏", false),
          character0Tab = new TabState("Char0", false),
          character1Tab = new TabState("Char1", false),
          character2Tab = new TabState("Char2", false),
          character3Tab = new TabState("Char3", false),
          character4Tab = new TabState("Char4", false),
          monstersTab = new TabState("怪物", false),
          dungeonsTab = new TabState("地牢", false),
          castlesTab = new TabState("城堡", false),
          pointsTab = new TabState("点数", true),
          offlineTab = new TabState("离线", false),
          informationTab = new TabState("信息", true);
        gameView.tabStates.length = 0;
        gameView.tabStates.push(character0Tab);
        gameView.tabStates.push(character1Tab);
        gameView.tabStates.push(character2Tab);
        gameView.tabStates.push(character3Tab);
        gameView.tabStates.push(character4Tab);
        if (game.partyCreated) {
          if (game.gameWon) {
            gameOverTab.selected = true;
          } else {
            gameTab.selected = true;
          }
        } else {
          createPartyTab.selected = true;
        }
        gameView.tabBar = new TabBar("gameTabMenu");
        var partyCreationView = new PartyCreationView(createPartyTab),
          expeditionView = new ExpeditionView(gameTab),
          charView0 = new CharacterView(character0Tab, "characterTabContent0", 0),
          charView1 = new CharacterView(character1Tab, "characterTabContent1", 1),
          charView2 = new CharacterView(character2Tab, "characterTabContent2", 2),
          charView3 = new CharacterView(character3Tab, "characterTabContent3", 3),
          charView4 = new CharacterView(character4Tab, "characterTabContent4", 4),
          monsterView = new MonsterView(monstersTab),
          dungeonsView = new DungeonsView(dungeonsTab),
          castlesView = new CastlesView(castlesTab),
          gameOverView = new GameOverView(gameOverTab),
          pointsView = new PointsView(pointsTab),
          offlineProgressView = new OfflineProgressView(offlineTab),
          informationView = new InformationView(informationTab),
          pauseView = new PauseView();
        addTab(gameView.tabBar, createPartyTab);
        addTab(gameView.tabBar, gameOverTab);
        addTab(gameView.tabBar, gameTab);
        addTab(gameView.tabBar, character0Tab);
        addTab(gameView.tabBar, character1Tab);
        addTab(gameView.tabBar, character2Tab);
        addTab(gameView.tabBar, character3Tab);
        addTab(gameView.tabBar, character4Tab);
        addTab(gameView.tabBar, monstersTab);
        addTab(gameView.tabBar, dungeonsTab);
        addTab(gameView.tabBar, castlesTab);
        addTab(gameView.tabBar, pointsTab);
        addTab(gameView.tabBar, offlineTab);
        addTab(gameView.tabBar, informationTab);
        if (gameView.childViews) {
          gameView.childViews.length = 0;
        }
        addChildView(gameView, gameView.tabBar);
        addChildView(gameView, partyCreationView);
        addChildView(gameView, charView0);
        addChildView(gameView, charView1);
        addChildView(gameView, charView2);
        addChildView(gameView, charView3);
        addChildView(gameView, charView4);
        addChildView(gameView, monsterView);
        addChildView(gameView, dungeonsView);
        addChildView(gameView, castlesView);
        addChildView(gameView, expeditionView);
        addChildView(gameView, gameOverView);
        addChildView(gameView, pointsView);
        addChildView(gameView, offlineProgressView);
        addChildView(gameView, informationView);
        addChildView(gameView, pauseView);
        gameView.panels.push(partyCreationView);
        gameView.panels.push(charView0);
        gameView.panels.push(charView1);
        gameView.panels.push(charView2);
        gameView.panels.push(charView3);
        gameView.panels.push(charView4);
        gameView.panels.push(monsterView);
        gameView.panels.push(dungeonsView);
        gameView.panels.push(castlesView);
        gameView.panels.push(expeditionView);
        gameView.panels.push(gameOverView);
        gameView.panels.push(pointsView);
        gameView.panels.push(offlineProgressView);
        gameView.panels.push(informationView);
        if (!game.partyCreated) {
          mountTabBar(gameView.tabBar);
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
      this.resourcesReady = game.monsterSprites.isLoaded() && game.terrainSprites.isLoaded() && game.itemSprites.isLoaded() && game.animations.isLoaded();
      this.lastTickAt = nowMilliseconds();
    }
    requestAnimationFrame(this.requestTick);
  };
}
