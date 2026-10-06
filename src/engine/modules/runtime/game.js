/** 会话组合根、世界初始化和周目生命周期。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { AnimationCatalog, AnimationSheet, SpriteSheet, bindEffectAnimations, clearVisualEffects } from "../rendering/sprites.js";
import { createAssetCatalog } from '../rendering/asset-catalog.js';
import { bindAssetPreviews } from '../rendering/preview.js';
import assetDefinitions from '../../../data/assets.generated.js';
import { HALF_TILE_SIZE, TILE_SIZE, VIEWPORT_HALF_HEIGHT, VIEWPORT_HALF_WIDTH, VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from "../core/screen-layout.js";
import { monsterSpriteDefinitions } from "../core/bootstrap-data.js";
import { createAnimationCatalog } from "../content/animations.js";
import { CharacterLifecycle } from "../simulation/characters.js";
import { WorldMap, placePartyInWorld } from "../world/terrain.js";
import { AllyRegistry, EncounterState, MonsterNameGenerator, MonsterRegistry, clearMonsters, resetEncounter } from "../combat/encounters.js";
import { MinionRegistry, clearMinions } from "../characters/minions.js";
import { DungeonRegistry, FarmRegistry, ShopRegistry, resetDungeons, resetFarms, resetShops } from "../world/dungeons.js";
import { WORLD_ORIGIN_COLUMN, WORLD_ORIGIN_ROW, resetCastles, unlockStartingRegion } from "../world/regions.js";
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
import { bindAdventurePoints, pointUpgradeDefinitions, resetAdventurePoints } from "../progression/points.js";
import { AdventurePointUpgrade, resetUpgradeCollection, restoreUpgradeCollection } from "../progression/upgrades.js";
import { Achievement, achievementDefinitions, bindAchievementProgress, resetAchievements } from "../progression/achievements.js";
import { LifetimeStatistics, RunStatistics, StatisticsRecorder, bindStatistics } from "../progression/statistics.js";
import { monsterDefinitions } from "../content/monsters.js";
import { initializeItemCatalog } from "../content/equipment.js";
import { initializeRegionsAndCastles } from "../world/initialization.js";
import { BASE_HIGHER_ITEM_CHANCE, LOWER_ITEM_LEVEL_CHANCE, globalUpgradeDefinitions, itemGoldCurve, itemGoldModifier, itemRarityProbabilities, itemRarityTiers, itemStatCurve, offlineTimeBonus, upgradeCollections } from "../content/balance.js";
import { getAttackCooldown } from "../characters/stats.js";
import { recalculateCharacterSkills } from "../combat/skill-effects.js";
import { deleteStoredSave, restoreGameState, saveProgress } from "../persistence/game-save.js";
import terrainAtlas from "../../../data/terrain-atlas.js";
import itemsAtlas from "../../../data/items-atlas.js";
import { bindAchievementViews } from "../views/achievements.js";
export var game;
export function initializeRuntimeGame() {
  const assets = createAssetCatalog({
    legacyGroups: {
      actors: new SpriteSheet('spritesheet/monsters.png', 54, monsterSpriteDefinitions),
      terrain: new SpriteSheet('spritesheet/terrain.png', 54, terrainAtlas),
      items: new SpriteSheet('spritesheet/items.png', 32, itemsAtlas)
    },
    definitions: assetDefinitions
  });
  bindAssetPreviews(assets);
  game = {
    tileSize: TILE_SIZE,
    halfTileSize: HALF_TILE_SIZE,
    viewportWidth: VIEWPORT_WIDTH,
    viewportHeight: VIEWPORT_HEIGHT,
    viewportHalfWidth: VIEWPORT_HALF_WIDTH,
    viewportHalfHeight: VIEWPORT_HALF_HEIGHT,
    assets,
    monsterSprites: assets.group('actors'),
    terrainSprites: assets.group('terrain'),
    itemSprites: assets.group('items'),
    animations: createAnimationCatalog({ AnimationCatalog, AnimationSheet }),
    camera: new function () {
      this.viewportOffsetY = this.viewportOffsetX = this.tileRow = this.tileColumn = 0;
    }(),
    lifecycle: new CharacterLifecycle(),
    world: new WorldMap(),
    monsters: new MonsterRegistry(),
    minions: new MinionRegistry(() => game.allies),
    allies: new AllyRegistry(),
    dungeons: new DungeonRegistry(),
    regions: new function () {
      var originColumn = WORLD_ORIGIN_COLUMN,
        originRow = WORLD_ORIGIN_ROW;
      this.regionGridSpan = 16;
      this.regionGridOriginColumn = originColumn;
      this.regionGridOriginRow = originRow;
      this.byKey = {};
      this.regionGrid = [];
    }(),
    castles: new function () {
      this.castleList = [];
      this.attackableCastles = [];
      this.scheduledCastles = [];
      this.castleRegistry = {};
      this.castleSpriteName = "L2_Terrain087.PNG";
      this.byRegionKey = {};
      this.nextRequiredMonsterLevel = 1;
      this.revision = 0;
      this.compareCastles = function (leftCastle, rightCastle) {
        return leftCastle.requiredMonsterLevel < rightCastle.requiredMonsterLevel ? -1 : 1;
      };
    }(),
    farms: new FarmRegistry(),
    shops: new ShopRegistry(),
    level: new DungeonLevel(),
    currentDungeon: null,
    currentCastle: null,
    loop: new GameLoop(),
    view: new GameView(() => game.state.adventurers, () => !game.gameWon && game.partyCreated),
    options: new function () {
      this.showFps = this.allowBackgroundProgress = this.allowOfflineProgress = this.depthSortSprites = this.showMapOverlay = this.showSpellEffects = this.showCombatText = true;
    }(),
    pathfinder: new function () {}(),
    decorations: new DungeonDecorationGenerator(),
    monsterCatalog: new function () {
      this.monsterTemplates = [];
      this.maxUnlockedLevel = this.minUnlockedLevel = 1;
      this.monsterTypesByLevelCache = {};
      this.compareMonsterTypes = function (leftMonsterType, rightMonsterType) {
        var leftName = leftMonsterType.getName(),
          rightName = rightMonsterType.getName();
        return leftName < rightName ? -1 : leftName > rightName ? 1 : 0;
      };
    }(),
    goldDrops: new GoldDropRegistry(),
    scrollDrops: new ScrollDropRegistry(),
    potionDrops: new PotionDropRegistry(),
    treasure: new TreasureRegistry(),
    itemGenerator: new ItemGenerator({
      baseHigherItemChance: BASE_HIGHER_ITEM_CHANCE,
      lowerItemLevelChance: LOWER_ITEM_LEVEL_CHANCE,
      globalUpgradeDefinitions,
      itemGoldCurve,
      itemGoldModifier,
      itemRarityProbabilities,
      itemRarityTiers,
      itemStatCurve
    }),
    itemDrops: new ItemDropRegistry(),
    inventories: new InventoryRegistry(),
    scrolls: new ScrollInventory(),
    potions: new PotionInventory(),
    scrollTargets: new function () {
      this.recentTargets = [];
    }(),
    monsterNames: new function () {
      this.nameGenerator = new MonsterNameGenerator();
    }(),
    effects: new function () {
      this.pool = [];
    }(),
    combatQueue: new CombatQueue(),
    spellCaches: new function () {
      this.blastStunSpellCache = null;
    }(),
    floatingText: new FloatingTextLayer(),
    unusedPlaceholder: new function () {}(),
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
      fps: 0,
      encounter: new EncounterState(),
      party: new PartyState(),
      adventurers: [],
      leader: null,
      scrollCaster: null,
      adventurePoints: new function () {
        this.spentPoints = this.availablePoints = 0;
        this.pointsByEventType = {};
        this.countsByEventType = {};
        var definitionIndex,
          pointUpgrades = [];
        for (definitionIndex = 0; definitionIndex < pointUpgradeDefinitions.length; definitionIndex++) {
          pointUpgrades.push(new AdventurePointUpgrade(pointUpgradeDefinitions[definitionIndex]));
        }
        this.pointUpgrades = pointUpgrades;
      }(),
      achievements: new function () {
        this.achievementList = [];
        this.byId = {};
        this.obtainedList = [];
        this.claimQueue = [];
        var definitionIndex, achievement;
        for (definitionIndex = 0; definitionIndex < achievementDefinitions.length; definitionIndex++) {
          achievement = new Achievement(achievementDefinitions[definitionIndex]);
          this.achievementList.push(achievement);
          if (this.byId[achievement.id]) {
            console.log("Error. Duplicate achievement id: " + achievement.id);
          }
          this.byId[achievement.id] = achievement;
        }
      }(),
      runStatistics: new RunStatistics(),
      lifetimeStatistics: new LifetimeStatistics(),
      statisticsRecorder: new StatisticsRecorder(),
      victoryStatistics: new function () {
        this.singleClassVictories = this.currentContinuationVictories = this.maxContinuationVictories = this.partySize3Victories = this.partySize2Victories = this.partySize1Victories = 0;
        this.classVictories = {};
        this.soloClassVictories = {};
        this.currentContinueCount = 0;
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
      var monsterCatalog = game.monsterCatalog;
      monsterCatalog.monsterTypesByLevelCache = {};
      monsterCatalog.minUnlockedLevel = 1;
      monsterCatalog.maxUnlockedLevel = 1;
      monsterCatalog.monsterTemplates.length = 0;
      monsterCatalog.monsterTemplates.push(...monsterDefinitions);
      initializeItemCatalog(game.itemGenerator, game.itemSprites);
      var goldDrops = game.goldDrops;
      goldDrops.smallGoldSprite = game.itemSprites.getSprite("CoinsGoldSmall.PNG");
      goldDrops.mediumGoldSprite = game.itemSprites.getSprite("CoinsGoldMedium.PNG");
      goldDrops.largeGoldSprite = game.itemSprites.getSprite("CoinsGoldLarge.PNG");
      resetScrollInventory();
      resetPotionInventory(game.potions);
      var treasure = game.treasure;
      treasure.targetDefinitions.push({
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
      treasure.targetDefinitions.push({
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
      treasure.targetDefinitions.push({
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
      treasure.targetDefinitions.push({
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
      treasure.targetDefinitions.push({
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
      treasure.targetDefinitions.push({
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
      treasure.targetDefinitions.push({
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
      treasure.targetDefinitions.push({
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
      treasure.targetDefinitions.push({
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
      treasure.targetDefinitions.push({
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
    resetRun: function (isFullReset) {
      game.loop.simulationFault = null;
      game.state.turnNumber = 0;
      resetEncounter();
      game.state.party = new PartyState();
      game.state.adventurers.length = 0;
      game.state.leader = null;
      game.state.scrollCaster = null;
      game.partyCreated = false;
      game.gameWon = false;
      if (isFullReset) {
        game.state.runStatistics = new RunStatistics();
        game.state.lifetimeStatistics = new LifetimeStatistics();
        bindStatistics(game.state);
        bindAdventurePoints(game.state);
        bindAchievementProgress(game.state);
        bindAchievementViews(game.state);
        var victoryStatistics = game.state.victoryStatistics;
        victoryStatistics.partySize1Victories = 0;
        victoryStatistics.partySize2Victories = 0;
        victoryStatistics.partySize3Victories = 0;
        victoryStatistics.maxContinuationVictories = 0;
        victoryStatistics.currentContinuationVictories = 0;
        victoryStatistics.singleClassVictories = 0;
        victoryStatistics.classVictories = {};
        victoryStatistics.soloClassVictories = {};
        victoryStatistics.currentContinueCount = 0;
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
      clearItemDrops(game.itemDrops);
      var inventories = game.inventories;
      if (0 < inventories.list.length) {
        inventories.list.length = 0;
      }
      resetScrollInventory();
      resetPotionInventory(game.potions);
      clearScrollTargets();
      resetDungeons();
      resetCastles();
      resetFarms();
      resetShops();
      clearCombatQueue();
      clearVisualEffects(game.effects);
      for (var collectionIndex = 0; collectionIndex < upgradeCollections.length; collectionIndex++) {
        resetUpgradeCollection(upgradeCollections[collectionIndex]);
      }
      for (var adventurer, adventurerIndex = /** @type {any} */ (0); adventurerIndex < game.state.adventurers.length; adventurerIndex++) {
        adventurer = game.state.adventurers[adventurerIndex];
        resetUpgradeCollection(adventurer.skillTree1);
        resetUpgradeCollection(adventurer.skillTree2);
        resetUpgradeCollection(adventurer.skillTree3);
        resetUpgradeCollection(adventurer.skillTree4);
      }
      game.allies.allies.length = 0;
      clearMonsters();
      clearMinions(game.minions);
      var monsterCatalog = game.monsterCatalog;
      monsterCatalog.minUnlockedLevel = 1;
      monsterCatalog.maxUnlockedLevel = 1;
      monsterCatalog.monsterTypesByLevelCache = {};
      if (isFullReset) {
        game.state.victoryCount = 0;
      }
    },
    resetContinuation: function () {
      game.state.turnNumber = 0;
      resetEncounter();
      var party = game.state.party;
      party.targetDungeon = null;
      party.activeCastle = null;
      party.targetShop = null;
      party.targetCastle = null;
      party.targetTreasureChest = null;
      party.destinationRoom = null;
      party.targetDoor = null;
      party.targetRoom = null;
      party.forcedTravelActive = false;
      party.forcedDestinationRoom = null;
      party.travellingToDisabledAlly = false;
      party.destinationOffWorld = false;
      party.worldDestColumn = 0;
      party.worldDestRow = 0;
      game.gameWon = false;
      game.state.runStatistics.resetRunStatistics();
      game.paused = false;
      game.worldActive = true;
      game.world = new WorldMap();
      game.level = new DungeonLevel();
      game.currentDungeon = null;
      game.currentCastle = null;
      resetPotionInventory(game.potions);
      clearItemDrops(game.itemDrops);
      clearScrollTargets();
      var preservedDiscoveredDungeonCount = game.dungeons.farms.length;
      resetDungeons();
      game.dungeons.discoveredDungeonCount = preservedDiscoveredDungeonCount;
      var preservedNextRequiredMonsterLevel = game.castles.nextRequiredMonsterLevel;
      resetCastles();
      game.castles.nextRequiredMonsterLevel = preservedNextRequiredMonsterLevel;
      resetFarms();
      resetShops();
      clearCombatQueue();
      clearVisualEffects(game.effects);
      game.allies.allies.length = 0;
      clearMonsters();
      clearMinions(game.minions);
      for (var adventurer, adventurerIndex = /** @type {any} */ (0); adventurerIndex < game.state.adventurers.length; adventurerIndex++) {
        if (adventurer = game.state.adventurers[adventurerIndex], adventurer.summonedMinions = null, adventurer.companion = null, adventurer.combatTarget = null, adventurer.targetGoldDrop = null, adventurer.targetScrollDrop = null, adventurer.targetPotionDrop = null, adventurer.targetItemDrop = null, adventurer.targetTreasureChest = null, adventurer.spellToCast = null, adventurer.lastAttackTurn = -3 * getAttackCooldown(adventurer.stats, true), adventurer.spells && 0 < adventurer.spells.length) {
          for (var spellIndex = 0; spellIndex < adventurer.spells.length; spellIndex++) {
            resetSpellCooldown(adventurer.spells[spellIndex]);
          }
        }
      }
    },
    continueRun: function () {
      game.gameWon = false;
      recordGameEvent("Victory", "Decision: Continue");
      game.resetContinuation();
      game.state.victoryStatistics.currentContinueCount++;
      placePartyInWorld();
      unlockStartingRegion();
      game.allies.reset();
      game.view.reset();
      saveProgress(game.saves);
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
      var collectionIndex;
      for (collectionIndex = 0; collectionIndex < upgradeCollections.length; collectionIndex++) {
        restoreUpgradeCollection(upgradeCollections[collectionIndex]);
      }
      var adventurer;
      for (var adventurerIndex = 0; adventurerIndex < game.state.adventurers.length; adventurerIndex++) {
        adventurer = game.state.adventurers[adventurerIndex];
        restoreUpgradeCollection(adventurer.skillTree1);
        restoreUpgradeCollection(adventurer.skillTree2);
        restoreUpgradeCollection(adventurer.skillTree3);
        restoreUpgradeCollection(adventurer.skillTree4);
      }
      for (adventurerIndex = 0; adventurerIndex < game.state.adventurers.length; adventurerIndex++) {
        recalculateCharacterSkills(game.state.adventurers[adventurerIndex]);
      }
      if (game.options.allowOfflineProgress && game.lastActiveAt) {
        game.offlineDuration = Date.now() - game.lastActiveAt;
        if (12E4 < game.offlineDuration) {
          game.beginOfflineProgress();
        }
      }
    },
    importSave: function (saveText) {
      game.loop.simulationFault = null;
      var saveManager = game.saves;
      recordGameEvent("SaveManager", "Import");
      return restoreGameState(saveManager, saveText) ? (game.partyCreated && game.view.reset(), game.processingOffline && game.view.onOfflineStart(), game.gameWon && game.view.onGameWon(), saveProgress(game.saves), true) : false;
    },
    saveNow: function () {
      saveProgress(game.saves);
    },
    restartRun: function () {
      game.state.victoryStatistics.currentContinueCount = 0;
      game.state.victoryStatistics.currentContinuationVictories = 0;
      game.resetRun(false);
      deleteStoredSave();
      saveProgress(game.saves);
      game.view.resetTabs();
    },
    resetGame: function () {
      game.resetRun(true);
      deleteStoredSave();
      saveProgress(game.saves);
      game.view.resetTabs();
    }
  };
  bindEffectAnimations(game.animations);
}
