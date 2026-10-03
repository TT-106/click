/** 装备槽、坐标、寻路与群体分离。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { Vector2, addVector, assignVector, copyVector, multiplyVector, normalizeVector, setVector, subtractVector, vectorLength } from "../core/math.js";
import { getAllies, getMonsters } from "../combat/encounters.js";
export function Equipment(slotList, characterClass) {
  this.characterClass = characterClass;
  this.slotItems = {};
  this.slotList = slotList;
  this.projectileWeapon = this.effectItem = null;
  var slotIndex;
  for (slotIndex = 0; slotIndex < slotList.length; slotIndex++) {
    this.slotItems[slotList[slotIndex]] = null;
  }
}
export function CharacterPosition(worldWalkSpeed, dungeonWalkSpeed) {
  this.velocity = new Vector2();
  this.steeringVector = null;
  this.separationVector = new Vector2();
  this.worldSeparationVector = new Vector2();
  this.separationDelta = new Vector2();
  this.dungeonWalkSpeed = dungeonWalkSpeed;
  this.worldWalkSpeed = worldWalkSpeed;
  this.levelPosition = new Vector2();
  this.worldPosition = new Vector2();
  this.room = this.currentHallway = null;
  this.worldDestinationPoint = new Vector2();
  this.destTileRow = this.destTileColumn = 0;
  this.moveTargetPoint = new Vector2();
  this.routeQueue = null;
  this.movementTargetCleared = false;
  this.targetRoom = this.destinationRoom = this.targetDoor = null;
  this.floorPositionIndex = -1;
  this.nextWorldTile = this.previousWorldTile = this.currentWorldTile = null;
}
export function clearMovementTarget(characterPosition) {
  characterPosition.movementTargetCleared = true;
  characterPosition.targetDoor = null;
  characterPosition.destinationRoom = null;
  characterPosition.targetRoom = null;
  characterPosition.routeQueue = null;
  characterPosition.floorPositionIndex = -1;
}
export function applySeparationForce(characterPosition, attackerLevelPosition, blastCenterLevelPosition, blastRadius) {
  if (!characterPosition.steeringVector) {
    characterPosition.steeringVector = new Vector2();
  }
  if (characterPosition.levelPosition === blastCenterLevelPosition) {
    assignVector(characterPosition.steeringVector, characterPosition.levelPosition);
    subtractVector(characterPosition.steeringVector, attackerLevelPosition);
    normalizeVector(characterPosition.steeringVector);
    multiplyVector(characterPosition.steeringVector, blastRadius);
  } else {
    assignVector(characterPosition.steeringVector, characterPosition.levelPosition);
    subtractVector(characterPosition.steeringVector, blastCenterLevelPosition);
    var distanceFromBlastCenter = vectorLength(characterPosition.steeringVector);
    if (0 !== distanceFromBlastCenter) {
      normalizeVector(characterPosition.steeringVector);
      multiplyVector(characterPosition.steeringVector, blastRadius * (1 - distanceFromBlastCenter / blastRadius));
    }
  }
}
/** 移动模块的三个依赖由组合根注入。前两个绑容器对象本身：game.state 与 game.minions 在 src/ 内没有任何
 *  整对象重赋值（判据见 docs/reverse-engineering/facts.md 的"哪些 game 字段会被整体重赋值"一节）。
 *  第三个必须是"取现值"的回调而不是引用：game.world 在两条重置路径上被整体换成 new WorldMap()
 *  （runtime/game.js:394、455），按引用绑会让移动逻辑一直朝旧地图走，而字段级差分看不见这件事。
 *  未绑定就用到一律立刻抛。 */
var boundMovementState = null;
var boundMovementMinions = null;
var boundWorldProvider = null;
export function bindCharacterMovement(state, minions, worldProvider) {
  boundMovementState = state;
  boundMovementMinions = minions;
  boundWorldProvider = worldProvider;
}
function movementState() {
  if (!boundMovementState) {
    throw new Error('移动逻辑尚未绑定会话状态：请在组合根调用 bindCharacterMovement(game.state, game.minions, () => game.world)');
  }
  return boundMovementState;
}
function movementMinions() {
  if (!boundMovementMinions) {
    throw new Error('移动逻辑尚未绑定随从集合：请在组合根调用 bindCharacterMovement(game.state, game.minions, () => game.world)');
  }
  return boundMovementMinions;
}
function movementWorld() {
  if (!boundWorldProvider) {
    throw new Error('移动逻辑尚未绑定世界提供者：请在组合根调用 bindCharacterMovement(game.state, game.minions, () => game.world)');
  }
  return boundWorldProvider();
}
export function setWorldDestination(characterPosition, destinationColumn, destinationRow) {
  characterPosition.destTileColumn = destinationColumn;
  characterPosition.destTileRow = destinationRow;
  setVector(characterPosition.worldDestinationPoint, movementWorld().tileToPixelX(destinationColumn), movementWorld().tileToPixelY(destinationRow));
}
export function findCheapestNeighbor(originTile, excludedTile) {
  var originWorldColumn = originTile.getWorldColumn(),
    originWorldRow = originTile.getWorldRow(),
    neighborTile,
    neighborPathDistance,
    cheapestPathDistance = 1E9,
    cheapestNeighborTile = null,
    columnOffset,
    rowOffset;
  for (columnOffset = -1; 1 >= columnOffset; columnOffset++) {
    for (rowOffset = -1; 1 >= rowOffset; rowOffset++) {
      if ((0 !== columnOffset || 0 !== rowOffset) && (neighborTile = movementWorld().getTileAtPixel(originWorldColumn + columnOffset, originWorldRow + rowOffset)) && neighborTile !== excludedTile && (neighborPathDistance = neighborTile.pathDistanceToDestination, !cheapestNeighborTile || cheapestPathDistance > neighborPathDistance)) {
        cheapestNeighborTile = neighborTile;
        cheapestPathDistance = neighborPathDistance;
      }
    }
  }
  if (!cheapestNeighborTile) {
    console.log("failed to find cheapest neighbor");
  }
  return cheapestNeighborTile;
}
export function separateDungeonCharacters(characterPosition) {
  setVector(characterPosition.separationVector, 0, 0);
  var otherCharacter, otherCharacterPosition,
    characterIndex,
    hasSeparationVector = false,
    monsterList = getMonsters(),
    minionList = movementMinions().minionList,
    levelDistance;
  for (characterIndex = 0; characterIndex < movementState().adventurers.length; characterIndex++) {
    otherCharacter = movementState().adventurers[characterIndex];
    otherCharacterPosition = otherCharacter.position;
    if (otherCharacterPosition === characterPosition) {
      break;
    }
    levelDistance = characterPosition.levelPosition.distanceTo(otherCharacterPosition.levelPosition);
    if (40 > levelDistance) {
      if (0 === levelDistance) {
        setVector(characterPosition.separationDelta, Math.random(), Math.random());
      } else {
        copyVector(characterPosition.separationDelta, characterPosition.levelPosition);
        subtractVector(characterPosition.separationDelta, otherCharacterPosition.levelPosition);
      }
      normalizeVector(characterPosition.separationDelta);
      addVector(characterPosition.separationVector, characterPosition.separationDelta);
      hasSeparationVector = true;
    }
  }
  for (characterIndex = 0; characterIndex < minionList.length; characterIndex++) {
    otherCharacter = minionList[characterIndex];
    otherCharacterPosition = otherCharacter.position;
    if (otherCharacterPosition !== characterPosition) {
      levelDistance = characterPosition.levelPosition.distanceTo(otherCharacterPosition.levelPosition);
      if (50 > levelDistance) {
        if (0 === levelDistance) {
          setVector(characterPosition.separationDelta, Math.random(), Math.random());
        } else {
          copyVector(characterPosition.separationDelta, characterPosition.levelPosition);
          subtractVector(characterPosition.separationDelta, otherCharacterPosition.levelPosition);
        }
        normalizeVector(characterPosition.separationDelta);
        addVector(characterPosition.separationVector, characterPosition.separationDelta);
        hasSeparationVector = true;
      }
    }
  }
  for (characterIndex = 0; characterIndex < monsterList.length; characterIndex++) {
    otherCharacter = monsterList[characterIndex];
    otherCharacterPosition = otherCharacter.position;
    if (otherCharacterPosition !== characterPosition) {
      levelDistance = characterPosition.levelPosition.distanceTo(otherCharacterPosition.levelPosition);
      if (50 > levelDistance) {
        if (0 === levelDistance) {
          setVector(characterPosition.separationDelta, Math.random(), Math.random());
        } else {
          copyVector(characterPosition.separationDelta, characterPosition.levelPosition);
          subtractVector(characterPosition.separationDelta, otherCharacterPosition.levelPosition);
        }
        normalizeVector(characterPosition.separationDelta);
        addVector(characterPosition.separationVector, characterPosition.separationDelta);
        hasSeparationVector = true;
      }
    }
  }
  if (hasSeparationVector) {
    normalizeVector(characterPosition.separationVector);
    multiplyVector(characterPosition.separationVector, 0.5);
  }
  return hasSeparationVector;
}
export function separateWorldCharacters(characterPosition) {
  setVector(characterPosition.worldSeparationVector, 0, 0);
  var otherCharacter, otherCharacterPosition,
    characterIndex,
    hasSeparationVector = false,
    allyList = getAllies(),
    worldDistance;
  for (characterIndex = 0; characterIndex < allyList.length; characterIndex++) {
    otherCharacter = allyList[characterIndex];
    otherCharacterPosition = otherCharacter.position;
    if (otherCharacterPosition !== characterPosition) {
      worldDistance = characterPosition.worldPosition.distanceTo(otherCharacterPosition.worldPosition);
      if (40 > worldDistance) {
        if (0 === worldDistance) {
          setVector(characterPosition.separationDelta, Math.random(), Math.random());
        } else {
          copyVector(characterPosition.separationDelta, characterPosition.worldPosition);
          subtractVector(characterPosition.separationDelta, otherCharacterPosition.worldPosition);
        }
        normalizeVector(characterPosition.separationDelta);
        addVector(characterPosition.worldSeparationVector, characterPosition.separationDelta);
        hasSeparationVector = true;
      }
    }
  }
  if (hasSeparationVector) {
    normalizeVector(characterPosition.worldSeparationVector);
  }
  return hasSeparationVector;
}
export function initializeCharactersMovement() {
  Equipment.prototype.getSlotItem = function (slot) {
    return this.slotItems[slot];
  };
  Equipment.prototype.getEffectItem = function () {
    return this.effectItem;
  };
  Equipment.prototype.equipItem = function (item) {
    this.slotItems[item.slot] = item;
    if (item.isProjectileWeapon()) {
      this.projectileWeapon = item;
    }
    if (1 === item.characteristic) {
      this.effectItem = item;
    }
  };
  CharacterPosition.prototype.getWorldPositionX = function () {
    return this.worldPosition.x;
  };
  CharacterPosition.prototype.getWorldPositionY = function () {
    return this.worldPosition.y;
  };
  CharacterPosition.prototype.getLevelPositionX = function () {
    return this.levelPosition.x;
  };
  CharacterPosition.prototype.getLevelPositionY = function () {
    return this.levelPosition.y;
  };
  CharacterPosition.prototype.setTargetDoor = function (targetDoor) {
    this.targetDoor = targetDoor;
  };
  CharacterPosition.prototype.setTargetRoom = function (targetRoom) {
    this.targetRoom = targetRoom;
  };
}
