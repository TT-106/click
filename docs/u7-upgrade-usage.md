# U7 升级实现使用入口清单（views/upgrade-details.js 相关 19 类）

> U133 彻夜会话交付。来源：`progression/upgrades.js`（19 个具体升级类）与
> `views/upgrade-details.js`（渲染分派 switch）。"使用入口"= 玩家/自动化实际触达该实现的路径；
> "差分证据"= 差分场景或探针对该实现的直接驱动记录（截至 2026-09-28 U133）。

| 升级实现（upgrades.js） | 真实使用入口 | 差分证据 |
|---|---|---|
| GlobalUpgrade（全局设置类） | 升级面板 quickUpgradeCollection；harness `purchaseUpgrades` | `upgrades-purchased`（settingsPurchased + 完整差分） |
| **PurchaseItemUpgrade（type 13）＝攻击城堡计划（U133 甄别：类名为恢复期暂定误名）** | castleUpgrades/itemPurchaseUpgrades 行；getTitle「攻击城堡」，purchase 写 `attackScheduled`（upgrades.js） | ✅ `castle-attack-planned`（attackScheduled 翻转 + 反向探针）——**并非商店道具购买**；引擎中不存在"商店道具购买"型升级实现 |
| EquipBestItemUpgrade（自动装备，type 4） | 同上 | `auto-equipped`（装备槽变化 + 事件计数） |
| **EquipItemUpgrade（type 3，"装备背包散件"）— U134 已闭合（拾取先行）** | equipmentUpgrades 行（inventoryIndex 0-4，itemCountThreshold 5）；canPurchase = `inventories.list.length ≤ 5 && > inventoryIndex`（tick.js 每 tick 重建候选列表，仅含"优于已装备"的散件） | ✅ `equip-item-upgrade-pickup-first`（U134）：清空背包（withEmptyBackpacks）→ 各自 generateItem 造远古掉落 → AI 拾取建立背链 → 驱动 type 3 行；两端各 2 次购买（自然拾取的「恐惧之可贵的护盾」入游侠护盾槽 + 种子远古剑入战士武器槽），装备槽摘要两端同变 + 反向验证（重构侧 purchase 改空操作 → DTO 分叉红）。**U133 误判勘误**：当时归因为"恢复路径未建 item.inventory 背链"——已取证否定（恢复路径两端都经 addInventoryItem 建背链：game-save.js ↔ c2.js）；真实根因是 fixture 背包塞满使候选列表 ≈60 项，`≤5` 购买门永不满足 |
| LevelUpUpgrade（角色升级） | characterLevelUpgrades 行 | `upgrades-purchased`（characterLeveled） |
| UnlockMonsterLevelUpgrade（怪物解锁） | monsterLevelUpgrades 行 | `monster-level-unlocked` |
| RetireMonsterLevelUpgrade（怪物退休） | 同上 | `monster-level-retired` |
| CharacterSkillUpgrade（type 5，技能树） | 角色四棵技能树；U133 harness `purchaseCharacterSkill`（前置链顺序购买） | `upgrades-purchased` + U133 七条技能场景（30/10/2/6/26/8/7/3/4/5/9/16/11-15 族探针与差分，见 docs/p1-skill-consumption.md） |
| LearnSpellUpgrade（type 6，学法术） | 技能树/法术学习 | `upgrades-purchased`（type=6 购买 + spells 增长）；U133 各技能场景链式附带 |
| PurchaseDungeonUpgrade（type 8，买农场） | farmAndDungeonUpgrades 行 | `dungeon-farm-purchased` |
| CollectFarmUpgrade（type 9，收获农场） | 同上 | `dungeon-farm-harvested` / `dungeon-farm-cycle-long-term` |
| AttackCastleUpgrade（type 13，计划攻击城堡） | castleUpgrades 行 | `castle-attack-planned` |
| PurchaseCastleUpgrade（type 13 同体？） | 与 AttackCastle 同一实现族（upgrades.js） | 同上 |
| AutoPurchaseDungeonUpgrade（自动收获） | farmAndDungeonUpgrades 行 | `dungeon-farm-harvested` |
| ScrollUpgrade（type 12，卷轴解锁/升级） | scrollUpgrades 行（quickUpgradeCollection 内） | **U133 新增 `scroll-upgrades-purchased`**：解锁全卷轴 + 等级 99 + 金币，5 次 type=12 购买，upgradeCount 增长 + 反向验证（注释 upgradeCount++ → 红）。取证：shockScroll maxCharges=0 原版即不可升级 |
| ClaimAchievementUpgrade（成就领取槽） | achievementClaimUpgrades 行 | `achievement-claimed` |
| AchievementUpgrade（type 14，成就奖励升级） | 同上 | `achievements-multiple` / `achievement-claimed` |
| AdventurePointUpgrade（冒险点升级） | pointsTab 冒险点面板；harness `purchasePointUpgrades` | `adventure-points-spent` / `point-upgrades-multiple` |
| Upgrade（基类，抽象） | — | 不适用 |

**仍缺（如实，U134 更新）**：19 个实现全部至少有一条端到端差分或探针。EquipItemUpgrade 的
**道具效果级**断言已由 `equip-item-upgrade-pickup-first` 闭合（装备槽摘要真实变化 + 反向验证）；
PurchaseItemUpgrade 的道具效果级断言由 `castle-attack-planned` 承担（attackScheduled 翻转——
其本质是攻击城堡计划而非商店道具购买，引擎中不存在"商店道具购买"型升级实现）。
升级面板 DOM 点击路线已实测不可行（按钮全为 disabledUpgradeButton 且矩形 0×0，
见 unresolved.md U7），harness 驱动是唯一稳定入口。
