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
 * @typedef {Object} SaveStatComponent
 * @property {number} itemValue
 * @property {number} levelValue
 * @property {number} spellBonusPercent
 * @property {number} skillBonusPercent
 *
 * @typedef {Object} SaveCharacterStats
 * @property {number} characterLevel
 * @property {number} characterHealth
 * @property {number} characterSpirit
 * @property {number} kills
 * @property {SaveStatComponent|null} damageComponent
 * @property {SaveStatComponent|null} armorComponent
 * @property {SaveStatComponent|null} attackRatingComponent
 * @property {SaveStatComponent|null} defenceRatingComponent
 * @property {SaveStatComponent|null} maxHealthComponent
 * @property {SaveStatComponent|null} maxSpiritComponent
 * @property {number} stunCount
 * @property {number} minionKills
 * @property {number} damageGiven
 * @property {number} damageReceived
 *
 * @typedef {Object} SaveSpellState
 * 法术名由 entities.js 序列化，game-save.js 按名称恢复；不添加新存档键。
 * @property {string} spellName
 *
 * @typedef {Object} SaveWorld
 * @property {number} worldCenterX
 * @property {number} worldCenterY
 * @property {number} blockShiftCol
 * @property {number} blockShiftRow
 *
 * @typedef {Object} SaveAdventurer
 * @property {string} adventurerName
 * @property {number} characterClass
 * @property {number} characterType
 * @property {string} spriteName
 * @property {SaveCharacterStats} characteristicsComponent
 * @property {SavePosition} positionComponent
 * @property {Array<SaveSpellState>} spells
 * @property {Array<SaveItem>} inventory
 * @property {Array<SaveItem>} equippedItemCollection
 * @property {number} skillPoints
 * @property {number} initialSpellSkillPoint
 * @property {Object<string, boolean>} upgrades1 技能树 1（键=技能/法术 id，值=布尔）
 * @property {Object<string, boolean>} upgrades2
 * @property {Object<string, boolean>} upgrades3
 * @property {Object<string, boolean>} upgrades4
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
 * @typedef {Object} SavePointEventCount
 * 冒险点事件累计行（points = 事件奖励 × count，领取成就后随奖励抬升）。
 * @property {number} pointEventType
 * @property {number} points
 * @property {number} count
 *
 * @typedef {Object} SavePointUpgrade
 * @property {string} upgradeId
 * @property {boolean} upgradePurchased
 *
 * @typedef {Object} SavePointManagerState
 * @property {number} spentAdventurePoints
 * @property {Array<SavePointEventCount>} pointsByType
 * @property {Array<SavePointUpgrade>} pointUpgrades
 *
 * @typedef {Object} SaveDungeonState
 * 地牢状态条目（game-save.js 序列化循环逐键写出；fixture 实测 dungeonId 为 "列_行" 坐标键）。
 * @property {string} dungeonId
 * @property {boolean} discovered
 * @property {boolean} conquered
 * @property {boolean} cleared
 * @property {number} clearedTurn
 * @property {boolean} dungeonFarm
 * @property {number} farmStartTurn
 * @property {number} dungeonFarmCost
 * @property {number} dungeonType
 * @property {number} levelCount
 *
 * @typedef {Object} SaveDungeonManagerState
 * @property {number} farmedKills 待收获击杀池（收获升级消费后清零）
 * @property {number} dungeonCostLevel
 * @property {Array<SaveDungeonState>} dungeonStates
 *
 * @typedef {Object} SaveMonsterTypeEntry
 * 怪物种类行（每级的每种怪物；kills 参与 monsterUnlock 价格判定与怪物表渲染，
 * restoreMonsterType 实读 name/sprite/kills——entities.js:343）。
 * @property {string} name
 * @property {string} sprite
 * @property {number} kills
 *
 * @typedef {Object} SaveMonsterTypeState
 * 每个怪物等级一行；monsterTypes 与该等级的可遭遇怪物一一对应（serializeMonsterLevel 写出）。
 * @property {number} level
 * @property {Array<SaveMonsterTypeEntry>} monsterTypes
 *
 * @typedef {Object} SaveMonsterTypesState
 * 怪物等级目录（restoreMonsterTypes 实读三个键——entities.js:322-336；
 * 序列化器 game-save.js:955-962 按同一形状写出）。
 * @property {number} minUnlockedLevel
 * @property {number} maxUnlockedLevel
 * @property {Array<SaveMonsterTypeState>} monsterLevelStates
 *
 * @typedef {Object} SaveDataUninitialized
 * 未开局（game.initialized 为假）时 createSaveState 只写这 4 个键——原版就是这样：
 * 空白档与已开局档是**两种形态**，因此 SaveData 不能无条件当作"任何存档"的类型。
 * @property {string} saveKey
 * @property {boolean} gameInitialized 恒 false
 * @property {boolean} partyCreated 恒 false
 * @property {boolean} gameWon 恒 false
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
 * @property {SaveWorld} world worldCenterX/Y、blockShiftCol/Row
 * @property {SaveGameOptions} gameOptions
 * @property {SaveDungeonManagerState} dungeonManagerState
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
 * @property {SaveMonsterTypesState} monsterTypes 怪物等级状态（minUnlockedLevel/maxUnlockedLevel/monsterLevelStates）
 * @property {{upgrades: Object<string, number>}} settings 全局升级 settingId→已购级数
 * @property {SavePointManagerState} pointManagerState 冒险点（spentAdventurePoints/pointUpgrades/pointsByType）
 * @property {{achievements: Array<SaveAchievement>}} achievementManager
 */

/** 空白档（未初始化）的顶层键集合，供 `scripts/audit-save-schema.mjs` 与运行时校验使用。 */
export const SAVE_BLANK_TOP_LEVEL_KEYS = Object.freeze([
  'saveKey', 'gameInitialized', 'partyCreated', 'gameWon',
]);

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
