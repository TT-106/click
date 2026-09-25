/** 从原始组合根独立出的配置数据。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import monstersAtlas from "../../../data/monsters-atlas.js";
export var monsterSpriteDefinitions;
export function initializeCoreBootstrapData() {
  'use strict';
  monsterSpriteDefinitions = monstersAtlas;
}
