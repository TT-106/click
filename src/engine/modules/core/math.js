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
  const a = seed;
  this.stateSize = 624;
  this.periodOffset = 397;
  this.matrixConstant = 2567483615;
  this.upperMask = 2147483648;
  this.lowerMask = 2147483647;
  this.stateWords = Array(this.stateSize);
  this.stateIndex = this.stateSize + 1;
  this.unitScale = 1 / 4294967296;
  this.stateWords[0] = a & 4294967295;
  for (this.stateIndex = 1; this.stateIndex < this.stateSize; this.stateIndex++) {
    this.stateWords[this.stateIndex] = 1812433253 * (this.stateWords[this.stateIndex - 1] ^ this.stateWords[this.stateIndex - 1] >> 30) + this.stateIndex;
    this.stateWords[this.stateIndex] &= 4294967295;
  }
  this.twistTable = [0, this.matrixConstant];
}
export function randomIntFrom(a, b) {
  return a.random() * b | 0;
}
export function SimplexNoise() {
  this.Im = [[1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0], [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1], [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]];
  this.Wj = [];
  this.HB = Math.sqrt(3);
}
/**
 * [0, a) 随机整数。注意：走全局 Math.random（与 SeededRandom 是两条独立随机源），
 * 战斗/掉落/AI 均消费此流，顺序受差分保护，不可增删调用。
 * @param {number} a 上界（不含）。
 * @returns {number}
 */
export function randomInt(a) {
  return 0 >= a ? 0 : floorNumber(Math.random() * a);
}
export function endsWithText(a, b) {
  return -1 !== a.indexOf(b, a.length - b.length);
}
/**
 * 数量格式化（9999→9999，1 万→.0K，万亿级 T/P/Z/Y），阈值链为原版行为锁定。
 * @param {number} a
 * @returns {string}
 */
export function formatPositiveAmount(a) {
  return 1E4 > a ? "" + floorNumber(a) : 1E5 > a ? (a / 1E3).toFixed(1) + "K" : 1E6 > a ? floorNumber(a / 1E3) + "K" : 1E7 > a ? (a / 1E6).toFixed(2) + "M" : 1E8 > a ? (a / 1E6).toFixed(1) + "M" : 1E9 > a ? floorNumber(a / 1E6) + "M" : 1E10 > a ? (a / 1E9).toFixed(2) + "B" : 1E11 > a ? (a / 1E9).toFixed(1) + "B" : 1E12 > a ? floorNumber(a / 1E9) + "B" : 1E13 > a ? (a / 1E12).toFixed(2) + "T" : 1E14 > a ? (a / 1E12).toFixed(1) + "T" : 1E15 > a ? floorNumber(a / 1E12) + "T" : 1E16 > a ? (a / 1E15).toFixed(2) + "P" : 1E17 > a ? (a / 1E15).toFixed(1) + "P" : 1E18 > a ? floorNumber(a / 1E15) + "P" : 1E19 > a ? (a / 1E18).toFixed(2) + "P" : 1E20 > a ? (a / 1E18).toFixed(1) + "P" : 1E21 > a ? floorNumber(a / 1E18) + "P" : 1E22 > a ? (a / 1E21).toFixed(2) + "Z" : 9.999999999999999E22 > a ? (a / 1E21).toFixed(1) + "Z" : 1E24 > a ? floorNumber(a / 1E21) + "Z" : 1E25 > a ? (a / 1E24).toFixed(2) + "Y" : 1E26 > a ? (a / 1E24).toFixed(1) + "Y" : 1E27 > a ? floorNumber(a / 1E24) + "Y" : a.toFixed(0);
}
export function formatAmount(a) {
  return 0 <= a ? formatPositiveAmount(a) : "-" + formatPositiveAmount(-a);
}
export function formatGroupedAmount(a) {
  var b = parseInt(String(Math.abs(+a || 0))) + "", // String() 与原隐式 ToString 强转语义一致
    c = 3 < b.length ? b.length % 3 : 0;
  return (0 > a ? "-" : "") + (c ? b.substr(0, c) + "," : "") + b.substr(c).replace(/(\d{3})(?=\d)/g, "$1,");
}
export function floorNumber(a) {
  return 2147483648 > a ? a | 0 : Math.floor(a);
}
export function nowMilliseconds() {
  return Date.now ? Date.now() : new Date().valueOf();
}
export function scaleByLevel(a, b, c) {
  a = Math.max(0, a - 1);
  return floorNumber(c * (b.base + b.coefficient * Math.pow(a, b.power) * Math.pow(b.growth, a)));
}
export function randomizeScaledValue(a, b, c) {
  a = scaleByLevel(a, b, c);
  b = 1.1 - 0.2 * Math.random();
  return floorNumber(a * b);
}
export function hashCoordinates(a, b, c) {
  a = (a << 5) - a + b;
  a &= a;
  a = (a << 5) - a + c;
  return a & a;
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
export function copyVector(a, b) {
  a.x = b.x;
  a.y = b.y;
}
export function setVector(a, b, c) {
  a.x = b;
  a.y = c;
}
export function assignVector(a, b) {
  a.x = b.x;
  a.y = b.y;
}
export function addVector(a, b) {
  a.x += b.x;
  a.y += b.y;
}
export function subtractVector(a, b) {
  a.x -= b.x;
  a.y -= b.y;
}
export function distanceToPoint(a, b, c) {
  b = a.x - b;
  a = a.y - c;
  return Math.sqrt(b * b + a * a);
}
export function distanceSquaredToPoint(a, b, c) {
  b = a.x - b;
  a = a.y - c;
  return b * b + a * a;
}
export function vectorLength(a) {
  return Math.sqrt(a.x * a.x + a.y * a.y);
}
export function normalizeVector(a) {
  var b = a.x * a.x + a.y * a.y;
  if (0 < b) {
    b = 1 / Math.sqrt(b);
    a.x *= b;
    a.y *= b;
  }
}
export function multiplyVector(a, b) {
  a.x *= b;
  a.y *= b;
}
export function initializeCoreMath() {
  SeededRandom.prototype.random = function () {
    var a;
    this.twistTable[0] = 0;
    this.twistTable[1] = this.matrixConstant;
    if (this.stateIndex >= this.stateSize) {
      var b;
      for (b = 0; b < this.stateSize - this.periodOffset; b++) {
        a = this.stateWords[b] & this.upperMask | this.stateWords[b + 1] & this.lowerMask;
        this.stateWords[b] = this.stateWords[b + this.periodOffset] ^ a >>> 1 ^ this.twistTable[a & 1];
      }
      for (; b < this.stateSize - 1; b++) {
        a = this.stateWords[b] & this.upperMask | this.stateWords[b + 1] & this.lowerMask;
        this.stateWords[b] = this.stateWords[b + (this.periodOffset - this.stateSize)] ^ a >>> 1 ^ this.twistTable[a & 1];
      }
      a = this.stateWords[this.stateSize - 1] & this.upperMask | this.stateWords[0] & this.lowerMask;
      this.stateWords[this.stateSize - 1] = this.stateWords[this.periodOffset - 1] ^ a >>> 1 ^ this.twistTable[a & 1];
      this.stateIndex = 0;
    }
    a = this.stateWords[this.stateIndex++];
    a ^= a >>> 11;
    a ^= a << 7 & 2636928640;
    a ^= a << 15 & 4022730752;
    return ((a ^ a >>> 18) >>> 0) * this.unitScale;
  };
  FRAME_DURATION_MS = 1E3 / 60;
  Vector2.prototype.distanceTo = function (a) {
    var b = this.x - a.x;
    a = this.y - a.y;
    return Math.sqrt(b * b + a * a);
  };
  Vector2.prototype.Ud = function (a) {
    var b = this.x - a.x;
    a = this.y - a.y;
    return b * b + a * a;
  };
  Vector2.prototype.toString = function () {
    return "(" + this.x + ", " + this.y + ")";
  };
}
