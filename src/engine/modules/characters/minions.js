/** 召唤物集合。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
export function MinionRegistry(readAllies) {
  this.readAllies = readAllies;
  this.minionList = [];
}
export function clearMinions(registry) {
  if (0 < registry.minionList.length) {
    registry.minionList.length = 0;
  }
}
export function initializeCharactersMinions() {
  MinionRegistry.prototype.removeMinion = function (minion) {
    if (minion) {
      let index = this.minionList.indexOf(minion);
      if (-1 < index) {
        this.minionList.splice(index, 1);
      }
      const allies = this.readAllies();
      index = (/** @type {any} */ (allies)).allies.indexOf(minion);
      if (-1 < index) {
        (/** @type {any} */ (allies)).allies.splice(index, 1);
      }
    }
  };
  MinionRegistry.prototype.addMinion = function (minion) {
    this.minionList.push(minion);
    this.readAllies().addAlly(minion);
  };
}
