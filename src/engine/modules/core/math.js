/** 随机数、数量格式、成长曲线与向量运算。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
export var FRAME_DURATION_MS;
export function SeededRandom(a) {
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
export function randomInt(a) {
  return 0 >= a ? 0 : floorNumber(Math.random() * a);
}
export function endsWithText(a, b) {
  return -1 !== a.indexOf(b, a.length - b.length);
}
export function formatPositiveAmount(a) {
  return 1E4 > a ? "" + floorNumber(a) : 1E5 > a ? (a / 1E3).toFixed(1) + "K" : 1E6 > a ? floorNumber(a / 1E3) + "K" : 1E7 > a ? (a / 1E6).toFixed(2) + "M" : 1E8 > a ? (a / 1E6).toFixed(1) + "M" : 1E9 > a ? floorNumber(a / 1E6) + "M" : 1E10 > a ? (a / 1E9).toFixed(2) + "B" : 1E11 > a ? (a / 1E9).toFixed(1) + "B" : 1E12 > a ? floorNumber(a / 1E9) + "B" : 1E13 > a ? (a / 1E12).toFixed(2) + "T" : 1E14 > a ? (a / 1E12).toFixed(1) + "T" : 1E15 > a ? floorNumber(a / 1E12) + "T" : 1E16 > a ? (a / 1E15).toFixed(2) + "P" : 1E17 > a ? (a / 1E15).toFixed(1) + "P" : 1E18 > a ? floorNumber(a / 1E15) + "P" : 1E19 > a ? (a / 1E18).toFixed(2) + "P" : 1E20 > a ? (a / 1E18).toFixed(1) + "P" : 1E21 > a ? floorNumber(a / 1E18) + "P" : 1E22 > a ? (a / 1E21).toFixed(2) + "Z" : 9.999999999999999E22 > a ? (a / 1E21).toFixed(1) + "Z" : 1E24 > a ? floorNumber(a / 1E21) + "Z" : 1E25 > a ? (a / 1E24).toFixed(2) + "Y" : 1E26 > a ? (a / 1E24).toFixed(1) + "Y" : 1E27 > a ? floorNumber(a / 1E24) + "Y" : a.toFixed(0);
}
export function formatAmount(a) {
  return 0 <= a ? formatPositiveAmount(a) : "-" + formatPositiveAmount(-a);
}
export function formatGroupedAmount(a) {
  var b = parseInt(Math.abs(+a || 0)) + "",
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
export function Vector2() {
  this.U = this.T = 0;
}
export function copyVector(a, b) {
  a.T = b.T;
  a.U = b.U;
}
export function setVector(a, b, c) {
  a.T = b;
  a.U = c;
}
export function assignVector(a, b) {
  a.T = b.T;
  a.U = b.U;
}
export function addVector(a, b) {
  a.T += b.T;
  a.U += b.U;
}
export function subtractVector(a, b) {
  a.T -= b.T;
  a.U -= b.U;
}
export function distanceToPoint(a, b, c) {
  b = a.T - b;
  a = a.U - c;
  return Math.sqrt(b * b + a * a);
}
export function distanceSquaredToPoint(a, b, c) {
  b = a.T - b;
  a = a.U - c;
  return b * b + a * a;
}
export function vectorLength(a) {
  return Math.sqrt(a.T * a.T + a.U * a.U);
}
export function normalizeVector(a) {
  var b = a.T * a.T + a.U * a.U;
  if (0 < b) {
    b = 1 / Math.sqrt(b);
    a.T *= b;
    a.U *= b;
  }
}
export function multiplyVector(a, b) {
  a.T *= b;
  a.U *= b;
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
  Vector2.prototype.ac = function (a) {
    var b = this.T - a.T;
    a = this.U - a.U;
    return Math.sqrt(b * b + a * a);
  };
  Vector2.prototype.Ud = function (a) {
    var b = this.T - a.T;
    a = this.U - a.U;
    return b * b + a * a;
  };
  Vector2.prototype.toString = function () {
    return "(" + this.T + ", " + this.U + ")";
  };
}
