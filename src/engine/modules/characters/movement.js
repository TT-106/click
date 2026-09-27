/** 装备槽、坐标、寻路与群体分离。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { Vector2, addVector, assignVector, copyVector, multiplyVector, normalizeVector, setVector, subtractVector, vectorLength } from "../core/math.js";
import { game } from "../runtime/game.js";
import { getAllies, getMonsters } from "../combat/encounters.js";
export function Equipment(a, b) {
  this.characterClass = b;
  this.hw = {};
  this.slotList = a;
  this.Ey = this.fz = null;
  var c;
  for (c = 0; c < a.length; c++) {
    this.hw[a[c]] = null;
  }
}
export function CharacterPosition(a, b) {
  this.velocity = new Vector2();
  this.steeringVector = null;
  this.separationVector = new Vector2();
  this.worldSeparationVector = new Vector2();
  this.separationDelta = new Vector2();
  this.Jw = b;
  this.MC = a;
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
export function clearMovementTarget(a) {
  a.movementTargetCleared = true;
  a.targetDoor = null;
  a.destinationRoom = null;
  a.targetRoom = null;
  a.routeQueue = null;
  a.floorPositionIndex = -1;
}
export function applySeparationForce(a, b, c, d) {
  if (!a.steeringVector) {
    a.steeringVector = new Vector2();
  }
  if (a.levelPosition === c) {
    assignVector(a.steeringVector, a.levelPosition);
    subtractVector(a.steeringVector, b);
    normalizeVector(a.steeringVector);
    multiplyVector(a.steeringVector, d);
  } else {
    assignVector(a.steeringVector, a.levelPosition);
    subtractVector(a.steeringVector, c);
    b = vectorLength(a.steeringVector);
    if (0 !== b) {
      normalizeVector(a.steeringVector);
      multiplyVector(a.steeringVector, d * (1 - b / d));
    }
  }
}
export function setWorldDestination(a, b, c) {
  a.destTileColumn = b;
  a.destTileRow = c;
  setVector(a.worldDestinationPoint, game.world.tileToPixelX(b), game.world.tileToPixelY(c));
}
export function findCheapestNeighbor(a, b) {
  var c = a.getWorldColumn(),
    d = a.getWorldRow(),
    f,
    g,
    h = 1E9,
    l = null,
    n,
    p;
  for (n = -1; 1 >= n; n++) {
    for (p = -1; 1 >= p; p++) {
      if ((0 !== n || 0 !== p) && (f = game.world.getTileAtPixel(c + n, d + p)) && f !== b && (g = f.pathDistanceToDestination, !l || h > g)) {
        l = f;
        h = g;
      }
    }
  }
  if (!l) {
    console.log("failed to find cheapest neighbor");
  }
  return l;
}
export function separateDungeonCharacters(a) {
  setVector(a.separationVector, 0, 0);
  var b,
    c,
    d = false,
    f = getMonsters(),
    g = game.minions.minionList,
    h;
  for (c = 0; c < game.state.adventurers.length; c++) {
    b = game.state.adventurers[c];
    b = b.position;
    if (b === a) {
      break;
    }
    h = a.levelPosition.distanceTo(b.levelPosition);
    if (40 > h) {
      if (0 === h) {
        setVector(a.separationDelta, Math.random(), Math.random());
      } else {
        copyVector(a.separationDelta, a.levelPosition);
        subtractVector(a.separationDelta, b.levelPosition);
      }
      normalizeVector(a.separationDelta);
      addVector(a.separationVector, a.separationDelta);
      d = true;
    }
  }
  for (c = 0; c < g.length; c++) {
    b = g[c];
    b = b.position;
    if (b !== a) {
      h = a.levelPosition.distanceTo(b.levelPosition);
      if (50 > h) {
        if (0 === h) {
          setVector(a.separationDelta, Math.random(), Math.random());
        } else {
          copyVector(a.separationDelta, a.levelPosition);
          subtractVector(a.separationDelta, b.levelPosition);
        }
        normalizeVector(a.separationDelta);
        addVector(a.separationVector, a.separationDelta);
        d = true;
      }
    }
  }
  for (c = 0; c < f.length; c++) {
    b = f[c];
    b = b.position;
    if (b !== a) {
      h = a.levelPosition.distanceTo(b.levelPosition);
      if (50 > h) {
        if (0 === h) {
          setVector(a.separationDelta, Math.random(), Math.random());
        } else {
          copyVector(a.separationDelta, a.levelPosition);
          subtractVector(a.separationDelta, b.levelPosition);
        }
        normalizeVector(a.separationDelta);
        addVector(a.separationVector, a.separationDelta);
        d = true;
      }
    }
  }
  if (d) {
    normalizeVector(a.separationVector);
    multiplyVector(a.separationVector, 0.5);
  }
  return d;
}
export function separateWorldCharacters(a) {
  setVector(a.worldSeparationVector, 0, 0);
  var b,
    c,
    d = false,
    f = getAllies(),
    g;
  for (c = 0; c < f.length; c++) {
    b = f[c];
    b = b.position;
    if (b !== a) {
      g = a.worldPosition.distanceTo(b.worldPosition);
      if (40 > g) {
        if (0 === g) {
          setVector(a.separationDelta, Math.random(), Math.random());
        } else {
          copyVector(a.separationDelta, a.worldPosition);
          subtractVector(a.separationDelta, b.worldPosition);
        }
        normalizeVector(a.separationDelta);
        addVector(a.worldSeparationVector, a.separationDelta);
        d = true;
      }
    }
  }
  if (d) {
    normalizeVector(a.worldSeparationVector);
  }
  return d;
}
export function initializeCharactersMovement() {
  Equipment.prototype.getSlotItem = function (a) {
    return this.hw[a];
  };
  Equipment.prototype.getEffectItem = function () {
    return this.fz;
  };
  Equipment.prototype.equipItem = function (a) {
    this.hw[a.slot] = a;
    if (a.Cw()) {
      this.Ey = a;
    }
    if (1 === a.characteristic) {
      this.fz = a;
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
  CharacterPosition.prototype.et = function (a) {
    this.targetDoor = a;
  };
  CharacterPosition.prototype.setTargetRoom = function (a) {
    this.targetRoom = a;
  };
}
