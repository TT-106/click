// @ts-nocheck -- M10 渐进类型化：JSDoc 覆盖后摘除（见 docs/WORKSTATE.md）
/** 存档 DTO 的类型化 schema（与原版存档格式一一对应）。
 *
 * 事实来源：tests/fixtures/original.c2save 解码实测（4,477 键全语义化）+ game-save.js 序列化/恢复两侧。
 * 兼容契约：这些键名是**存档 JSON 格式本身**，任何情况下不得改名；
 * 运行时字段名与此处的差异由 game-save.js 的恢复/序列化映射行承担（见 docs/persistence.md）。
 *
 * @typedef {Object} SaveItemEffect
 * @property {number} itemEffectType
 * @property {number} itemEffectAmount
 * @property {string} itemEffectDescription
 * @property {string} itemEffectName
 *
 * @typedef {Object} SaveItem
 * @property {string} itemTypeId
 * @property {string} itemSlot
 * @property {number} characterClass
 * @property {string} itemName
 * @property {number} itemRarity
 * @property {number} itemLevel
 * @property {number} itemGold
 * @property {number} itemValue
 * @property {number} itemCharacteristic 1=伤害 2=护甲 3=攻击等级 4=防御等级 5=生命 6=精神
 * @property {SaveItemEffect|null} itemEffect
 *
 * @typedef {Object} SavePosition
 * @property {number} levelX
 * @property {number} levelY
 * @property {number} worldX
 * @property {number} worldY
 * @property {number} roomId -1 表示无
 * @property {number} floorPositionIndex
 * @property {number} hallwayId
 *
 * @typedef {Object} SaveAdventurer
 * @property {string} adventurerName
 * @property {number} characterClass
 * @property {number} characterType
 * @property {string} spriteName
 * @property {Object} characteristicsComponent
 * @property {SavePosition} positionComponent
 * @property {Array} spells
 * @property {Array<SaveItem>} inventory
 * @property {Array<SaveItem>} equippedItemCollection
 * @property {number} skillPoints
 * @property {number} initialSpellSkillPoint
 * @property {Object} upgrades1 技能树 1（键=技能/法术 id，值=布尔）
 * @property {Object} upgrades2
 * @property {Object} upgrades3
 * @property {Object} upgrades4
 *
 * @typedef {Object} SavePotion
 * @property {string} potionId
 * @property {boolean} active
 * @property {number} activeStartTurn
 *
 * @typedef {Object} SaveScroll
 * @property {string} scrollId
 * @property {number} count
 * @property {boolean} locked
 * @property {number} upgradeCount
 *
 * @typedef {Object} SaveAchievement
 * @property {string} achievementId
 * @property {boolean} obtained
 * @property {boolean} applied
 *
 * @typedef {Object} SaveGameOptions
 * @property {boolean} infoTextVisible
 * @property {boolean} spellEffectsVisible
 * @property {boolean} mapOverlayVisible
 * @property {boolean} offlineProcessingEnabled
 * @property {boolean} inactiveTabProcessingEnabled
 * @property {boolean} spriteRenderOrderEnabled
 * @property {boolean} fpsVisible
 *
 * @typedef {Object} SaveData
 * @property {string} saveKey 固定 "C2_V1_001"（localStorage 键同值）
 * @property {number} gameTimestamp 序列化时刻；载入时作为 lastActiveAt 参与离线判定
 * @property {boolean} gameInitialized
 * @property {number} turnNumber
 * @property {number} frameNumber
 * @property {boolean} worldActive
 * @property {boolean} partyCreated
 * @property {boolean} gameWon
 * @property {number} victoryCount
 * @property {Object} world worldCenterX/Y、blockShiftCol/Row
 * @property {SaveGameOptions} gameOptions
 * @property {Object} dungeonManagerState
 * @property {Object} shopManager
 * @property {Object} castleManager
 * @property {Array} farms
 * @property {Object|null} currentDungeon
 * @property {Object|null} currentCastle
 * @property {Object|null} level
 * @property {Object} treasureChestManager
 * @property {Array<SaveScroll>} scrollInventory
 * @property {Array<SavePotion>} potionInventory
 * @property {{gold: number, kills: number, experiencePoints: number}} party
 * @property {Object} statistics 本周目统计
 * @property {Object} totalStatistics 历次累计统计
 * @property {Object} victoryStatistics 胜利相关统计（veteran 解锁门槛）
 * @property {Array<SaveAdventurer>} adventurers
 * @property {Object} monsterTypes 怪物等级状态（name/sprite/kills）
 * @property {{upgrades: Object<string, number>}} settings 全局升级 settingId→已购级数
 * @property {Object} pointManagerState 冒险点（spentAdventurePoints/pointUpgrades/pointsByType）
 * @property {{achievements: Array<SaveAchievement>}} achievementManager
 */

/** 存档 DTO 顶层键集合（与 SaveData 一致，用于校验/文档单一来源）。 */
export const SAVE_TOP_LEVEL_KEYS = Object.freeze([
  'saveKey', 'gameTimestamp', 'gameInitialized', 'turnNumber', 'frameNumber',
  'worldActive', 'partyCreated', 'gameWon', 'victoryCount', 'world',
  'gameOptions', 'dungeonManagerState', 'shopManager', 'castleManager', 'farms',
  'currentDungeon', 'currentCastle', 'level', 'treasureChestManager',
  'scrollInventory', 'potionInventory', 'party', 'statistics', 'totalStatistics',
  'victoryStatistics', 'adventurers', 'monsterTypes', 'settings',
  'pointManagerState', 'achievementManager',
]);
