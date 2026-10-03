/** 随机数、数量格式、成长曲线与向量运算。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
/** 60Hz 渲染帧时长（毫秒）；由 initializeCoreMath() 赋值，模拟按帧差换算回合。 @type {number} */
export var FRAME_DURATION_MS;
/**
 * Mersenne Twister（MT19937）——JS 浮点乘法变体：种子循环不做 int32 截断，
 * 位型与 C 标准 MT19937 不同（seed 5489 首值 1859732469）。禁止替换为其他实现，
 * 否则破坏回放/差分确定性（见 tests/unit/rng.test.mjs 与 docs/reverse-engineering/facts.md #1）。
 * @constructor
 * @param {number} seed 32 位种子。
 */
export function SeededRandom(seed) {
  const seedValue = seed;
  this.stateSize = 624;
  this.periodOffset = 397;
  this.matrixConstant = 2567483615;
  this.upperMask = 2147483648;
  this.lowerMask = 2147483647;
  this.stateWords = Array(this.stateSize);
  this.stateIndex = this.stateSize + 1;
  this.unitScale = 1 / 4294967296;
  this.stateWords[0] = seedValue & 4294967295;
  for (this.stateIndex = 1; this.stateIndex < this.stateSize; this.stateIndex++) {
    this.stateWords[this.stateIndex] = 1812433253 * (this.stateWords[this.stateIndex - 1] ^ this.stateWords[this.stateIndex - 1] >> 30) + this.stateIndex;
    this.stateWords[this.stateIndex] &= 4294967295;
  }
  this.twistTable = [0, this.matrixConstant];
}
export function randomIntFrom(seededRandom, upperBound) {
  return seededRandom.random() * upperBound | 0;
}
export function SimplexNoise() {
  this.gradients = [[1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0], [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1], [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]];
  this.permutation = [];
  this.sqrt3 = Math.sqrt(3);
}
/**
 * [0, upperBound) 随机整数。注意：走全局 Math.random（与 SeededRandom 是两条独立随机源），
 * 战斗/掉落/AI 均消费此流，顺序受差分保护，不可增删调用。
 * @param {number} upperBound 上界（不含）。
 * @returns {number}
 */
export function randomInt(upperBound) {
  return 0 >= upperBound ? 0 : floorNumber(Math.random() * upperBound);
}
export function endsWithText(text, suffix) {
  return -1 !== text.indexOf(suffix, text.length - suffix.length);
}
/**
 * 数量格式化（9999→9999，1 万→.0K，万亿级 T/P/Z/Y），阈值链为原版行为锁定。
 * @param {number} amount
 * @returns {string}
 */
export function formatPositiveAmount(amount) {
  return 1E4 > amount ? "" + floorNumber(amount) : 1E5 > amount ? (amount / 1E3).toFixed(1) + "K" : 1E6 > amount ? floorNumber(amount / 1E3) + "K" : 1E7 > amount ? (amount / 1E6).toFixed(2) + "M" : 1E8 > amount ? (amount / 1E6).toFixed(1) + "M" : 1E9 > amount ? floorNumber(amount / 1E6) + "M" : 1E10 > amount ? (amount / 1E9).toFixed(2) + "B" : 1E11 > amount ? (amount / 1E9).toFixed(1) + "B" : 1E12 > amount ? floorNumber(amount / 1E9) + "B" : 1E13 > amount ? (amount / 1E12).toFixed(2) + "T" : 1E14 > amount ? (amount / 1E12).toFixed(1) + "T" : 1E15 > amount ? floorNumber(amount / 1E12) + "T" : 1E16 > amount ? (amount / 1E15).toFixed(2) + "P" : 1E17 > amount ? (amount / 1E15).toFixed(1) + "P" : 1E18 > amount ? floorNumber(amount / 1E15) + "P" : 1E19 > amount ? (amount / 1E18).toFixed(2) + "P" : 1E20 > amount ? (amount / 1E18).toFixed(1) + "P" : 1E21 > amount ? floorNumber(amount / 1E18) + "P" : 1E22 > amount ? (amount / 1E21).toFixed(2) + "Z" : 9.999999999999999E22 > amount ? (amount / 1E21).toFixed(1) + "Z" : 1E24 > amount ? floorNumber(amount / 1E21) + "Z" : 1E25 > amount ? (amount / 1E24).toFixed(2) + "Y" : 1E26 > amount ? (amount / 1E24).toFixed(1) + "Y" : 1E27 > amount ? floorNumber(amount / 1E24) + "Y" : amount.toFixed(0);
}
export function formatAmount(amount) {
  return 0 <= amount ? formatPositiveAmount(amount) : "-" + formatPositiveAmount(-amount);
}
export function formatGroupedAmount(amount) {
  var digits = parseInt(String(Math.abs(+amount || 0))) + "", // String() 与原隐式 ToString 强转语义一致
    firstGroupLength = 3 < digits.length ? digits.length % 3 : 0;
  return (0 > amount ? "-" : "") + (firstGroupLength ? digits.substr(0, firstGroupLength) + "," : "") + digits.substr(firstGroupLength).replace(/(\d{3})(?=\d)/g, "$1,");
}
export function floorNumber(value) {
  return 2147483648 > value ? value | 0 : Math.floor(value);
}
export function nowMilliseconds() {
  return Date.now ? Date.now() : new Date().valueOf();
}
export function scaleByLevel(level, curve, multiplier) {
  level = Math.max(0, level - 1);
  return floorNumber(multiplier * (curve.base + curve.coefficient * Math.pow(level, curve.power) * Math.pow(curve.growth, level)));
}
export function randomizeScaledValue(level, curve, multiplier) {
  var scaledValue = scaleByLevel(level, curve, multiplier);
  var jitterFactor = 1.1 - 0.2 * Math.random();
  return floorNumber(scaledValue * jitterFactor);
}
export function hashCoordinates(hash, row, levelIndex) {
  hash = (hash << 5) - hash + row;
  hash &= hash;
  hash = (hash << 5) - hash + levelIndex;
  return hash & hash;
}
// 宿主可订阅领域事件；引擎不调用分析服务或发送网络请求。
const eventListeners = new Set();
export function subscribeGameEvents(listener) {
  eventListeners.add(listener);
  return () => eventListeners.delete(listener);
}
export function recordGameEvent(category, action) {
  for (const listener of eventListeners) listener({category, action});
}
/**
 * 二维向量（原字段 T/U，2026-09 重命名为 x/y）。
 * @constructor
 * @property {number} x
 * @property {number} y
 */
export function Vector2() {
  this.y = this.x = 0;
}
export function copyVector(targetVector, sourceVector) {
  targetVector.x = sourceVector.x;
  targetVector.y = sourceVector.y;
}
export function setVector(targetVector, positionX, positionY) {
  targetVector.x = positionX;
  targetVector.y = positionY;
}
export function assignVector(targetVector, sourceVector) {
  targetVector.x = sourceVector.x;
  targetVector.y = sourceVector.y;
}
export function addVector(targetVector, otherVector) {
  targetVector.x += otherVector.x;
  targetVector.y += otherVector.y;
}
export function subtractVector(targetVector, otherVector) {
  targetVector.x -= otherVector.x;
  targetVector.y -= otherVector.y;
}
export function distanceToPoint(point, targetX, targetY) {
  var deltaX = point.x - targetX;
  var deltaY = point.y - targetY;
  return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
}
export function distanceSquaredToPoint(point, targetX, targetY) {
  var deltaX = point.x - targetX;
  var deltaY = point.y - targetY;
  return deltaX * deltaX + deltaY * deltaY;
}
export function vectorLength(vector) {
  return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
}
export function normalizeVector(vector) {
  var lengthSquared = vector.x * vector.x + vector.y * vector.y;
  if (0 < lengthSquared) {
    var inverseLength = 1 / Math.sqrt(lengthSquared);
    vector.x *= inverseLength;
    vector.y *= inverseLength;
  }
}
export function multiplyVector(targetVector, scale) {
  targetVector.x *= scale;
  targetVector.y *= scale;
}
export function initializeCoreMath() {
  SeededRandom.prototype.random = function () {
    var twistValue;
    this.twistTable[0] = 0;
    this.twistTable[1] = this.matrixConstant;
    if (this.stateIndex >= this.stateSize) {
      var wordIndex;
      for (wordIndex = 0; wordIndex < this.stateSize - this.periodOffset; wordIndex++) {
        twistValue = this.stateWords[wordIndex] & this.upperMask | this.stateWords[wordIndex + 1] & this.lowerMask;
        this.stateWords[wordIndex] = this.stateWords[wordIndex + this.periodOffset] ^ twistValue >>> 1 ^ this.twistTable[twistValue & 1];
      }
      for (; wordIndex < this.stateSize - 1; wordIndex++) {
        twistValue = this.stateWords[wordIndex] & this.upperMask | this.stateWords[wordIndex + 1] & this.lowerMask;
        this.stateWords[wordIndex] = this.stateWords[wordIndex + (this.periodOffset - this.stateSize)] ^ twistValue >>> 1 ^ this.twistTable[twistValue & 1];
      }
      twistValue = this.stateWords[this.stateSize - 1] & this.upperMask | this.stateWords[0] & this.lowerMask;
      this.stateWords[this.stateSize - 1] = this.stateWords[this.periodOffset - 1] ^ twistValue >>> 1 ^ this.twistTable[twistValue & 1];
      this.stateIndex = 0;
    }
    var outputWord = this.stateWords[this.stateIndex++];
    outputWord ^= outputWord >>> 11;
    outputWord ^= outputWord << 7 & 2636928640;
    outputWord ^= outputWord << 15 & 4022730752;
    return ((outputWord ^ outputWord >>> 18) >>> 0) * this.unitScale;
  };
  FRAME_DURATION_MS = 1E3 / 60;
  Vector2.prototype.distanceTo = function (otherVector) {
    var deltaX = this.x - otherVector.x;
    var deltaY = this.y - otherVector.y;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  };
  Vector2.prototype.squaredDistanceTo = function (otherVector) {
    var deltaX = this.x - otherVector.x;
    var deltaY = this.y - otherVector.y;
    return deltaX * deltaX + deltaY * deltaY;
  };
  Vector2.prototype.toString = function () {
    return "(" + this.x + ", " + this.y + ")";
  };
}
