/** 会话组合根、世界初始化和周目生命周期。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { SpriteSheet, clearVisualEffects } from "../rendering/sprites.js";
import { monsterSpriteDefinitions } from "../core/bootstrap-data.js";
import { createAnimationCatalog } from "../content/animations.js";
import { CharacterLifecycle } from "../simulation/characters.js";
import { WorldMap } from "../world/terrain.js";
import { AllyRegistry, EncounterState, MonsterNameGenerator, MonsterRegistry, clearMonsters, resetEncounter } from "../combat/encounters.js";
import { MinionRegistry, clearMinions } from "../characters/minions.js";
import { DungeonRegistry, FarmRegistry, ShopRegistry, resetDungeons, resetFarms, resetShops } from "../world/dungeons.js";
import { WORLD_ORIGIN_COLUMN, WORLD_ORIGIN_ROW, resetCastles } from "../world/regions.js";
import { DungeonDecorationGenerator, DungeonLevel } from "../world/generation.js";
import { GameLoop } from "../simulation/loop.js";
import { GameView } from "../views/navigation.js";
import { GoldDropRegistry, TreasureRegistry } from "../loot/treasure.js";
import { ScrollDropRegistry, ScrollInventory, clearScrollTargets, resetScrollInventory, resetSpellCooldown } from "../combat/scrolls.js";
import { PotionDropRegistry, PotionInventory, resetPotionInventory } from "../combat/potions.js";
import { ItemDropRegistry, ItemGenerator, clearItemDrops } from "../loot/items.js";
import { InventoryRegistry } from "../loot/inventory.js";
import { CombatQueue, clearCombatQueue } from "../combat/actions.js";
import { FloatingTextLayer } from "../rendering/floating-text.js";
import { nowMilliseconds, recordGameEvent } from "../core/math.js";
import { MonsterSaveAdapter, StatisticsSaveAdapter } from "../persistence/entities.js";
import { PartyState } from "../characters/party.js";
import { pointUpgradeDefinitions, resetAdventurePoints } from "../progression/points.js";
import { AdventurePointUpgrade, resetUpgradeCollection, restoreUpgradeCollection } from "../progression/upgrades.js";
import { Achievement, achievementDefinitions, resetAchievements } from "../progression/achievements.js";
import { LifetimeStatistics, RunStatistics, StatisticsRecorder, bindStatistics } from "../progression/statistics.js";
import { monsterDefinitions } from "../content/monsters.js";
import { initializeItemCatalog } from "../content/equipment.js";
import { initializeRegionsAndCastles } from "../world/initialization.js";
import { offlineTimeBonus, upgradeCollections } from "../content/balance.js";
import { getAttackCooldown } from "../characters/stats.js";
import { recalculateCharacterSkills } from "../combat/skill-effects.js";
import { deleteStoredSave, restoreGameState, saveProgress } from "../persistence/game-save.js";
import terrainAtlas from "../../../data/terrain-atlas.js";
import itemsAtlas from "../../../data/items-atlas.js";
export var game;
export function initializeRuntimeGame() {
  game = {
    tileSize: 27,
    halfTileSize: 13,
    viewportWidth: 740,
    viewportHeight: 450,
    viewportHalfWidth: 370,
    viewportHalfHeight: 225,
    monsterSprites: new SpriteSheet("spritesheet/monsters.png", 54, monsterSpriteDefinitions),
    terrainSprites: new SpriteSheet("spritesheet/terrain.png", 54, terrainAtlas),
    itemSprites: new SpriteSheet("spritesheet/items.png", 32, itemsAtlas),
    animations: createAnimationCatalog(),
    camera: new function () {
      this.At = this.zt = this.tileRow = this.tileColumn = 0;
    }(),
    lifecycle: new CharacterLifecycle(),
    world: new WorldMap(),
    monsters: new MonsterRegistry(),
    minions: new MinionRegistry(),
    allies: new AllyRegistry(),
    dungeons: new DungeonRegistry(),
    regions: new function () {
      var a = WORLD_ORIGIN_COLUMN,
        b = WORLD_ORIGIN_ROW;
      this.regionGridSpan = 16;
      this.regionGridOriginColumn = a;
      this.regionGridOriginRow = b;
      this.byKey = {};
      this.Mr = [];
    }(),
    castles: new function () {
      this.castleList = [];
      this.attackableCastles = [];
      this.scheduledCastles = [];
      this.bm = {};
      this.Ny = "L2_Terrain087.PNG";
      this.ju = {};
      this.nextRequiredMonsterLevel = 1;
      this.cm = 0;
      this.GE = function (a, b) {
        return a.requiredMonsterLevel < b.requiredMonsterLevel ? -1 : 1;
      };
    }(),
    farms: new FarmRegistry(),
    shops: new ShopRegistry(),
    level: new DungeonLevel(),
    currentDungeon: null,
    currentCastle: null,
    loop: new GameLoop(),
    view: new GameView(),
    options: new function () {
      this.showFps = this.allowBackgroundProgress = this.allowOfflineProgress = this.depthSortSprites = this.showMapOverlay = this.showSpellEffects = this.showCombatText = true;
    }(),
    pathfinder: new function () {}(),
    decorations: new DungeonDecorationGenerator(),
    monsterCatalog: new function () {
      this.n = [];
      this.maxUnlockedLevel = this.minUnlockedLevel = 1;
      this.en = {};
      this.HE = function (a, b) {
        var c = a.getName(),
          d = b.getName();
        return c < d ? -1 : c > d ? 1 : 0;
      };
    }(),
    goldDrops: new GoldDropRegistry(),
    scrollDrops: new ScrollDropRegistry(),
    potionDrops: new PotionDropRegistry(),
    treasure: new TreasureRegistry(),
    itemGenerator: new ItemGenerator(),
    itemDrops: new ItemDropRegistry(),
    inventories: new InventoryRegistry(),
    scrolls: new ScrollInventory(),
    potions: new PotionInventory(),
    scrollTargets: new function () {
      this.yl = [];
    }(),
    monsterNames: new function () {
      this.dn = new MonsterNameGenerator();
    }(),
    effects: new function () {
      this.pool = [];
    }(),
    combatQueue: new CombatQueue(),
    upgradeRegistry: new function () {
      this.Wq = null;
    }(),
    floatingText: new FloatingTextLayer(),
    extensions: new function () {}(),
    saves: new function () {
      this.saveKey = "C2_V1_001";
      this.lastSavedAt = nowMilliseconds();
      this.autoSaveInterval = 3E5;
      this.statisticsAdapter = new StatisticsSaveAdapter();
      this.monsterAdapter = new MonsterSaveAdapter();
    }(),
    initialized: false,
    partyCreated: false,
    gameWon: false,
    paused: false,
    worldActive: true,
    processingOffline: false,
    lastActiveAt: Date.now(),
    offlineDuration: 0,
    offlineProcessed: 0,
    renderEnabled: true,
    state: {
      turnNumber: 0,
      frameNumber: 0,
      dz: 0,
      encounter: new EncounterState(),
      party: new PartyState(),
      adventurers: [],
      leader: null,
      scrollCaster: null,
      adventurePoints: new function () {
        this.spentPoints = this.availablePoints = 0;
        this.pointsByEventType = {};
        this.countsByEventType = {};
        var a,
          b = [];
        for (a = 0; a < pointUpgradeDefinitions.length; a++) {
          b.push(new AdventurePointUpgrade(pointUpgradeDefinitions[a]));
        }
        this.pointUpgrades = b;
      }(),
      achievements: new function () {
        this.achievementList = [];
        this.Lt = {};
        this.obtainedList = [];
        this.claimQueue = [];
        var a, b;
        for (a = 0; a < achievementDefinitions.length; a++) {
          b = new Achievement(achievementDefinitions[a]);
          this.achievementList.push(b);
          if (this.Lt[b.id]) {
            console.log("Error. Duplicate achievement id: " + b.id);
          }
          this.Lt[b.id] = b;
        }
      }(),
      runStatistics: new RunStatistics(),
      lifetimeStatistics: new LifetimeStatistics(),
      statisticsRecorder: new StatisticsRecorder(),
      victoryStatistics: new function () {
        this.vn = this.mm = this.Xm = this.kn = this.jn = this.hn = 0;
        this.qo = {};
        this.lq = {};
        this.nm = 0;
      }(),
      victoryCount: 0
    },
    handleVisibility: function () {
      if ("undefined" !== typeof document.hidden) {
        game.renderEnabled = !document.hidden;
      }
    },
    bindVisibility: function () {
      document.addEventListener("visibilitychange", game.handleVisibility, false);
    },
    onLoad: function () {
      game.bindVisibility();
      game.loop.tick();
    },
    initializeWorld: function () {
      var a = game.monsterCatalog;
      a.en = {};
      a.minUnlockedLevel = 1;
      a.maxUnlockedLevel = 1;
      a.n.length = 0;
      a.n.push(...monsterDefinitions);
      initializeItemCatalog();
      var qa = game.goldDrops;
      qa.Sz = game.itemSprites.getSprite("CoinsGoldSmall.PNG");
      qa.xw = game.itemSprites.getSprite("CoinsGoldMedium.PNG");
      qa.wD = game.itemSprites.getSprite("CoinsGoldLarge.PNG");
      resetScrollInventory();
      resetPotionInventory();
      var ta = game.treasure;
      ta.targetDefinitions.push({
        settingsId: "chest1",
        kind: 1,
        flushPlacement: false,
        westWallVariants: {
          opened: game.terrainSprites.getSprite("L2_Chest02.PNG"),
          closed: game.terrainSprites.getSprite("L2_Chest01.PNG")
        },
        standardVariants: {
          opened: game.terrainSprites.getSprite("L2_Chest04.PNG"),
          closed: game.terrainSprites.getSprite("L2_Chest03.PNG")
        }
      });
      ta.targetDefinitions.push({
        settingsId: "chest2",
        kind: 1,
        flushPlacement: false,
        westWallVariants: {
          opened: game.terrainSprites.getSprite("L2_Chest06.PNG"),
          closed: game.terrainSprites.getSprite("L2_Chest05.PNG")
        },
        standardVariants: {
          opened: game.terrainSprites.getSprite("L2_Chest08.PNG"),
          closed: game.terrainSprites.getSprite("L2_Chest07.PNG")
        }
      });
      ta.targetDefinitions.push({
        settingsId: "chest3",
        kind: 1,
        flushPlacement: false,
        westWallVariants: {
          opened: game.terrainSprites.getSprite("L2_Chest10.PNG"),
          closed: game.terrainSprites.getSprite("L2_Chest09.PNG")
        },
        standardVariants: {
          opened: game.terrainSprites.getSprite("L2_Chest12.PNG"),
          closed: game.terrainSprites.getSprite("L2_Chest11.PNG")
        }
      });
      ta.targetDefinitions.push({
        settingsId: "chest4",
        kind: 1,
        flushPlacement: false,
        westWallVariants: {
          opened: game.terrainSprites.getSprite("L2_Chest14.PNG"),
          closed: game.terrainSprites.getSprite("L2_Chest13.PNG")
        },
        standardVariants: {
          opened: game.terrainSprites.getSprite("L2_Chest16.PNG"),
          closed: game.terrainSprites.getSprite("L2_Chest15.PNG")
        }
      });
      ta.targetDefinitions.push({
        settingsId: "rack1",
        kind: 2,
        flushPlacement: true,
        westWallVariants: {
          opened: game.terrainSprites.getSprite("L3_Wall_WeapRack1_EW.PNG"),
          closed: game.terrainSprites.getSprite("L3_Wall_WeapRack2_EW.PNG")
        },
        standardVariants: {
          opened: game.terrainSprites.getSprite("L3_Wall_WeapRack1_NS.PNG"),
          closed: game.terrainSprites.getSprite("L3_Wall_WeapRack2_NS.PNG")
        }
      });
      ta.targetDefinitions.push({
        settingsId: "rack2",
        kind: 2,
        flushPlacement: true,
        westWallVariants: {
          opened: game.terrainSprites.getSprite("L3_Wall_WeapRack1_EW.PNG"),
          closed: game.terrainSprites.getSprite("L3_Wall_WeapRack3_EW.PNG")
        },
        standardVariants: {
          opened: game.terrainSprites.getSprite("L3_Wall_WeapRack1_NS.PNG"),
          closed: game.terrainSprites.getSprite("L3_Wall_WeapRack3_NS.PNG")
        }
      });
      ta.targetDefinitions.push({
        settingsId: "rack3",
        kind: 2,
        flushPlacement: true,
        westWallVariants: {
          opened: game.terrainSprites.getSprite("L3_Wall_WeapRack1_EW.PNG"),
          closed: game.terrainSprites.getSprite("L3_Wall_WeapRack4_EW.PNG")
        },
        standardVariants: {
          opened: game.terrainSprites.getSprite("L3_Wall_WeapRack1_NS.PNG"),
          closed: game.terrainSprites.getSprite("L3_Wall_WeapRack4_NS.PNG")
        }
      });
      ta.targetDefinitions.push({
        settingsId: "rack4",
        kind: 2,
        flushPlacement: true,
        westWallVariants: {
          opened: game.terrainSprites.getSprite("L3_Wall_WeapRack5_EW.PNG"),
          closed: game.terrainSprites.getSprite("L3_Wall_WeapRack6_EW.PNG")
        },
        standardVariants: {
          opened: game.terrainSprites.getSprite("L3_Wall_WeapRack5_NS.PNG"),
          closed: game.terrainSprites.getSprite("L3_Wall_WeapRack6_NS.PNG")
        }
      });
      ta.targetDefinitions.push({
        settingsId: "case1",
        kind: 3,
        flushPlacement: true,
        westWallVariants: {
          opened: game.terrainSprites.getSprite("L3_WallDeco04.PNG"),
          closed: game.terrainSprites.getSprite("L3_WallDeco04.PNG")
        },
        standardVariants: {
          opened: game.terrainSprites.getSprite("L3_WallDeco03.PNG"),
          closed: game.terrainSprites.getSprite("L3_WallDeco03.PNG")
        }
      });
      ta.targetDefinitions.push({
        settingsId: "case2",
        kind: 3,
        flushPlacement: true,
        westWallVariants: {
          opened: game.terrainSprites.getSprite("L3_WallDeco14.PNG"),
          closed: game.terrainSprites.getSprite("L3_WallDeco14.PNG")
        },
        standardVariants: {
          opened: game.terrainSprites.getSprite("L3_WallDeco13.PNG"),
          closed: game.terrainSprites.getSprite("L3_WallDeco13.PNG")
        }
      });
      initializeRegionsAndCastles();
    },
    resetRun: function (a) {
      game.state.turnNumber = 0;
      resetEncounter();
      game.state.party = new PartyState();
      game.state.adventurers.length = 0;
      game.state.leader = null;
      game.state.scrollCaster = null;
      game.partyCreated = false;
      game.gameWon = false;
      if (a) {
        game.state.runStatistics = new RunStatistics();
        game.state.lifetimeStatistics = new LifetimeStatistics();
        bindStatistics();
        var b = game.state.victoryStatistics;
        b.hn = 0;
        b.jn = 0;
        b.kn = 0;
        b.Xm = 0;
        b.mm = 0;
        b.vn = 0;
        b.qo = {};
        b.lq = {};
        b.nm = 0;
        resetAdventurePoints();
        resetAchievements();
      }
      game.state.runStatistics.resetRunStatistics();
      game.paused = false;
      game.worldActive = true;
      game.world = new WorldMap();
      game.level = new DungeonLevel();
      game.currentDungeon = null;
      game.currentCastle = null;
      clearItemDrops();
      b = game.inventories;
      if (0 < b.list.length) {
        b.list.length = 0;
      }
      resetScrollInventory();
      resetPotionInventory();
      clearScrollTargets();
      resetDungeons();
      resetCastles();
      resetFarms();
      resetShops();
      clearCombatQueue();
      clearVisualEffects();
      for (b = 0; b < upgradeCollections.length; b++) {
        resetUpgradeCollection(upgradeCollections[b]);
      }
      for (var c, b = /** @type {any} */ (0); b < game.state.adventurers.length; b++) {
        c = game.state.adventurers[b];
        resetUpgradeCollection(c.skillTree1);
        resetUpgradeCollection(c.skillTree2);
        resetUpgradeCollection(c.skillTree3);
        resetUpgradeCollection(c.skillTree4);
      }
      game.allies.allies.length = 0;
      clearMonsters();
      clearMinions();
      b = game.monsterCatalog;
      b.minUnlockedLevel = 1;
      b.maxUnlockedLevel = 1;
      b.en = {};
      if (a) {
        game.state.victoryCount = 0;
      }
    },
    resetContinuation: function () {
      game.state.turnNumber = 0;
      resetEncounter();
      var a = game.state.party;
      a.targetDungeon = null;
      a.activeCastle = null;
      a.targetShop = null;
      a.targetCastle = null;
      a.targetTreasureChest = null;
      a.destinationRoom = null;
      a.targetDoor = null;
      a.targetRoom = null;
      a.Ks = false;
      a.gn = null;
      a.Mp = false;
      a.hp = false;
      a.Nm = 0;
      a.Om = 0;
      game.gameWon = false;
      game.state.runStatistics.resetRunStatistics();
      game.paused = false;
      game.worldActive = true;
      game.world = new WorldMap();
      game.level = new DungeonLevel();
      game.currentDungeon = null;
      game.currentCastle = null;
      resetPotionInventory();
      clearItemDrops();
      clearScrollTargets();
      a = game.dungeons.farms.length;
      resetDungeons();
      game.dungeons.discoveredDungeonCount = a;
      a = game.castles.nextRequiredMonsterLevel;
      resetCastles();
      game.castles.nextRequiredMonsterLevel = a;
      resetFarms();
      resetShops();
      clearCombatQueue();
      clearVisualEffects();
      game.allies.allies.length = 0;
      clearMonsters();
      clearMinions();
      for (var b, a = /** @type {any} */ (0); a < game.state.adventurers.length; a++) {
        if (b = game.state.adventurers[a], b.summonedMinions = null, b.companion = null, b.combatTarget = null, b.targetGoldDrop = null, b.targetScrollDrop = null, b.targetPotionDrop = null, b.targetItemDrop = null, b.targetTreasureChest = null, b.spellToCast = null, b.au = -3 * getAttackCooldown(b.stats, true), b.spells && 0 < b.spells.length) {
          for (var c = 0; c < b.spells.length; c++) {
            resetSpellCooldown(b.spells[c]);
          }
        }
      }
    },
    beginOfflineProgress: function () {
      if (!game.gameWon && game.partyCreated) {
        game.offlineDuration = Math.min(game.offlineDuration, 432E5 + offlineTimeBonus.currentValue);
        game.processingOffline = true;
        game.offlineProcessed = 0;
      }
    },
    finishOfflineProgress: function () {
      game.processingOffline = false;
      game.offlineProcessed = 0;
      game.offlineDuration = 0;
      game.view.onOfflineFinish();
    },
    restoreRuntimeState: function () {
      var a;
      for (a = 0; a < upgradeCollections.length; a++) {
        restoreUpgradeCollection(upgradeCollections[a]);
      }
      var b;
      for (a = 0; a < game.state.adventurers.length; a++) {
        b = game.state.adventurers[a];
        restoreUpgradeCollection(b.skillTree1);
        restoreUpgradeCollection(b.skillTree2);
        restoreUpgradeCollection(b.skillTree3);
        restoreUpgradeCollection(b.skillTree4);
      }
      for (a = 0; a < game.state.adventurers.length; a++) {
        recalculateCharacterSkills(game.state.adventurers[a]);
      }
      if (game.options.allowOfflineProgress && game.lastActiveAt) {
        game.offlineDuration = Date.now() - game.lastActiveAt;
        if (12E4 < game.offlineDuration) {
          game.beginOfflineProgress();
        }
      }
    },
    importSave: function (a) {
      var b = game.saves;
      recordGameEvent("SaveManager", "Import");
      return restoreGameState(b, a) ? (game.partyCreated && game.view.reset(), game.processingOffline && game.view.onOfflineStart(), game.gameWon && game.view.onGameWon(), saveProgress(game.saves), true) : false;
    },
    saveNow: function () {
      saveProgress(game.saves);
    },
    restartRun: function () {
      game.state.victoryStatistics.nm = 0;
      game.state.victoryStatistics.mm = 0;
      game.resetRun(false);
      deleteStoredSave();
      saveProgress(game.saves);
      game.view.Js();
    },
    resetGame: function () {
      game.resetRun(true);
      deleteStoredSave();
      saveProgress(game.saves);
      game.view.Js();
    }
  };
}
