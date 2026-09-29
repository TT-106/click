/** 从原始组合根独立出的配置数据。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { game } from "../runtime/game.js";
import { Castle, DungeonNameGenerator, RegionLayout, WORLD_BLOCK_COLUMNS, WORLD_BLOCK_ROWS, WorldRegion, chooseAdjacentRegion, generateDungeonName } from "./regions.js";
import { SeededRandom, randomIntFrom } from "../core/math.js";
import { Dungeon, randomDungeonType, resetFarms, resetShops, sortDungeons } from "./dungeons.js";
import { bindAdventurePoints, resetAdventurePoints } from "../progression/points.js";
import { resetAchievements } from "../progression/achievements.js";
import { bindStatistics } from "../progression/statistics.js";
export function initializeRegionsAndCastles() {
  var regionManager = game.regions;
  regionManager.byKey = {};
  regionManager.regionGrid.length = 0;
  var regionGridSpan = regionManager.regionGridSpan,
    columnIndex,
    rowIndex,
    regionColumnList,
    regionColumn,
    regionRow,
    regionKey,
    worldRegion;
  regionColumn = regionManager.regionGridOriginColumn;
  for (columnIndex = 0; columnIndex < regionGridSpan; columnIndex++, regionColumn++) {
    regionColumnList = [];
    regionRow = regionManager.regionGridOriginRow;
    for (rowIndex = 0; rowIndex < regionGridSpan; rowIndex++, regionRow++) {
      regionKey = regionColumn + "_" + regionRow;
      worldRegion = new WorldRegion(regionKey, regionColumn, regionRow);
      regionColumnList.push(worldRegion);
      regionManager.byKey[regionKey] = worldRegion;
    }
    regionManager.regionGrid.push(regionColumnList);
  }
  var castleManager = game.castles;
  castleManager.castleList.length = 0;
  castleManager.attackableCastles.length = 0;
  castleManager.scheduledCastles.length = 0;
  castleManager.castleRegistry = {};
  castleManager.revision = 0;
  castleManager.nextRequiredMonsterLevel = 1;
  var regionLayout = new RegionLayout(),
    castleSeededRandom = new SeededRandom(11),
    castleNameGenerator = new DungeonNameGenerator(castleSeededRandom),
    castleSeedIndex,
    castlePixelX,
    castlePixelY,
    minRegionColumn = regionLayout.minRegionColumn,
    minRegionRow = regionLayout.minRegionRow,
    halfBlockColumns = WORLD_BLOCK_COLUMNS / 2 | 0,
    halfBlockRows = WORLD_BLOCK_ROWS / 2 | 0,
    occupiedRegionKeys = {},
    claimedRegionCount = 0,
    gridSpan = game.regions.regionGridSpan,
    totalRegionCount = gridSpan * gridSpan,
    homeRegionColumn,
    homeRegionRow,
    homeRegionKey,
    regionKeyAttempts,
    castleName,
    castle,
    usedCastleNames = {},
    castleList = [];
  for (castleSeedIndex = 0; 35 > castleSeedIndex; castleSeedIndex++) {
    regionKeyAttempts = 1;
    homeRegionColumn = minRegionColumn + randomIntFrom(castleSeededRandom, gridSpan);
    homeRegionRow = minRegionRow + randomIntFrom(castleSeededRandom, gridSpan);
    for (homeRegionKey = homeRegionColumn + "_" + homeRegionRow; occupiedRegionKeys[homeRegionKey];) {
      regionKeyAttempts++;
      homeRegionColumn = minRegionColumn + randomIntFrom(castleSeededRandom, gridSpan);
      homeRegionRow = minRegionRow + randomIntFrom(castleSeededRandom, gridSpan);
      homeRegionKey = homeRegionColumn + "_" + homeRegionRow;
    }
    occupiedRegionKeys[homeRegionKey] = true;
    for (castleName = generateDungeonName(castleNameGenerator, 11); usedCastleNames[castleName];) {
      castleName = generateDungeonName(castleNameGenerator, 11);
    }
    usedCastleNames[castleName] = true;
    castlePixelX = homeRegionColumn * WORLD_BLOCK_COLUMNS + halfBlockColumns;
    castlePixelY = homeRegionRow * WORLD_BLOCK_ROWS + halfBlockRows;
    castlePixelX += randomIntFrom(castleSeededRandom, 6) - 3;
    castlePixelY += randomIntFrom(castleSeededRandom, 6) - 3;
    castle = new Castle(homeRegionKey, castleName, homeRegionColumn, homeRegionRow, castlePixelX, castlePixelY);
    castleList.push(castle);
    var homeCastle = castle,
      homeRegion = game.regions.byKey[homeRegionKey];
    homeCastle.regions.push(homeRegion);
    homeRegion.castle = homeCastle;
    claimedRegionCount++;
  }
  for (var adjacentRegion, expansionPassCount = 0; claimedRegionCount < totalRegionCount;) {
    for (var castleScanIndex = 0; castleScanIndex < castleList.length; castleScanIndex++) {
      castle = castleList[castleScanIndex];
      a: {
        for (var layout = regionLayout, occupiedKeys = occupiedRegionKeys, regionChoiceRandom = castleSeededRandom, castleRegions = castle.regions, candidateRegion = undefined, castleRegionIndex = undefined, castleRegionIndex = /** @type {any} */ (0); castleRegionIndex < castleRegions.length; castleRegionIndex++) {
          if (candidateRegion = chooseAdjacentRegion(layout, castleRegions[castleRegionIndex], occupiedKeys, regionChoiceRandom)) {
            adjacentRegion = candidateRegion;
            break a;
          }
        }
        adjacentRegion = null;
      }
      if (adjacentRegion) {
        var expandingCastle = castle,
          claimedRegion = adjacentRegion;
        expandingCastle.regions.push(claimedRegion);
        claimedRegion.castle = expandingCastle;
        occupiedRegionKeys[adjacentRegion.regionKey] = true;
        claimedRegionCount++;
      }
    }
    expansionPassCount++;
  }
  castleManager.castleList = castleList;
  var castleIndex, registryRegionIndex, registeredCastle, registeredCastleRegions;
  for (castleIndex = 0; castleIndex < castleManager.castleList.length; castleIndex++) {
    for (registeredCastle = castleManager.castleList[castleIndex], castleManager.castleRegistry[registeredCastle.castleId] && console.log("duplicate castle id: " + registeredCastle.castleId), castleManager.castleRegistry[registeredCastle.castleId] = registeredCastle, registeredCastleRegions = registeredCastle.regions, registryRegionIndex = 0; registryRegionIndex < registeredCastleRegions.length; registryRegionIndex++) {
      if (castleManager.byRegionKey[registeredCastleRegions[registryRegionIndex].regionKey]) {
        console.log("duplicate castle owner: " + registeredCastleRegions[registryRegionIndex].regionKey);
      }
      castleManager.byRegionKey[registeredCastleRegions[registryRegionIndex].regionKey] = registeredCastle;
    }
  }
  var dungeonManager = game.dungeons;
  dungeonManager.dungeonList.length = 0;
  dungeonManager.discovered.length = 0;
  dungeonManager.attackable.length = 0;
  dungeonManager.cleared.length = 0;
  dungeonManager.farms.length = 0;
  dungeonManager.discoveredDungeonCount = 0;
  dungeonManager.farmable.length = 0;
  dungeonManager.pendingFarmKills = 0;
  dungeonManager.dungeonRegistry = {};
  var dungeonId,
    dungeonSeededRandom = new SeededRandom(1),
    dungeonNameGenerator = new DungeonNameGenerator(dungeonSeededRandom),
    allCastles = game.castles.castleList,
    ownerCastle,
    ownerCastleRegions,
    dungeonName,
    dungeonType,
    dungeonLevelCount,
    ownerCastlePixelX,
    ownerCastlePixelY,
    db,
    castleRegionRow,
    dungeonWorldColumn,
    dungeonWorldRow,
    dungeon,
    ownerCastleIndex,
    ownerRegionIndex,
    usedDungeonNames = {},
    generatedDungeons = [];
  for (ownerCastleIndex = 0; ownerCastleIndex < allCastles.length; ownerCastleIndex++) {
    for (ownerCastle = allCastles[ownerCastleIndex], ownerCastleRegions = ownerCastle.regions, ownerCastlePixelX = ownerCastle.worldPixelX, ownerCastlePixelY = ownerCastle.worldPixelY, ownerRegionIndex = 0; ownerRegionIndex < ownerCastleRegions.length; ownerRegionIndex++) {
      if (db = ownerCastleRegions[ownerRegionIndex].regionColumn, castleRegionRow = ownerCastleRegions[ownerRegionIndex].regionRow, !(0.7 < (/** @type {any} */ (dungeonSeededRandom)).random())) {
        dungeonWorldColumn = 1 + db * WORLD_BLOCK_COLUMNS + randomIntFrom(dungeonSeededRandom, WORLD_BLOCK_COLUMNS - 1);
        for (dungeonWorldRow = 1 + castleRegionRow * WORLD_BLOCK_ROWS + randomIntFrom(dungeonSeededRandom, WORLD_BLOCK_ROWS - 1); dungeonWorldColumn === ownerCastlePixelX && dungeonWorldRow === ownerCastlePixelY;) {
          dungeonWorldColumn = 1 + db * WORLD_BLOCK_COLUMNS + randomIntFrom(dungeonSeededRandom, WORLD_BLOCK_COLUMNS - 1);
          dungeonWorldRow = 1 + castleRegionRow * WORLD_BLOCK_ROWS + randomIntFrom(dungeonSeededRandom, WORLD_BLOCK_ROWS - 1);
        }
        dungeonType = randomDungeonType(dungeonSeededRandom);
        for (dungeonName = generateDungeonName(dungeonNameGenerator, dungeonType); usedDungeonNames[dungeonName];) {
          dungeonName = generateDungeonName(dungeonNameGenerator, dungeonType);
        }
        usedDungeonNames[dungeonName] = true;
        dungeonId = db + "_" + castleRegionRow;
        dungeonLevelCount = 3 + randomIntFrom(dungeonSeededRandom, 4);
        dungeon = new Dungeon(dungeonId, dungeonName, dungeonType, dungeonWorldColumn, dungeonWorldRow, db, castleRegionRow, dungeonLevelCount, ownerCastle);
        generatedDungeons.push(dungeon);
        ownerCastle.dungeonList.push(dungeon);
      }
    }
  }
  dungeonManager.dungeonList = generatedDungeons;
  var dungeonIndex, registeredDungeon;
  for (dungeonIndex = 0; dungeonIndex < dungeonManager.dungeonList.length; dungeonIndex++) {
    registeredDungeon = dungeonManager.dungeonList[dungeonIndex];
    dungeonManager.dungeonRegistry[registeredDungeon.dungeonId] = registeredDungeon;
  }
  sortDungeons(dungeonManager, dungeonManager.dungeonList);
  resetFarms();
  resetShops();
  bindAdventurePoints(game.state);
  resetAdventurePoints();
  resetAchievements();
  game.paused = false;
  game.initialized = true;
  bindStatistics(game.state);
}
export function initializeWorldInitialization() {}
