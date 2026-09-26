# 未解/待办问题清单

> 规范 §33 要求的 unresolved 台账。每项含已知证据与下一步动作。

## U1 — ✅ 已解决并验证关闭：`Da` 三路拆分已落地（2026-09-26）

- 状态：**已解决、落地并通过验证实验关闭**。
- **收尾验证（第六轮）**：?watchDa 观察器在完整多场景历史（long-run 3000→offline×3→potions-active 600）下零类型违例、零意外 null 转换——值流在页面历史状态下亦完全正确，第五轮的场景顺序依赖崩溃确认为当时残留误标（866/285/442 等）所致，已全部修复。最终根因：actions.js:616（createChainAction）与 :682（createReturningAction）的 `a.Da` 读取的是**动作自身的目标字段**（应为 targetCharacter），而非施法角色的 combatTarget——前两轮取证档案将其误标为 Character 所有。修正这两处（并连带修正 285/442/494/866 四处多态入参误标）后，12 场景差分矩阵 + parity + E2E 全绿。
- 现象：按第四轮取证（Character→combatTarget、CombatAction→targetCharacter、Explore 系 Behavior→selectedTarget）落地后，6 个差分场景（potions×2/scrolls/gold/veteran/late-horizon——全部是**存档变异类**）出现 levelCenter/levelSeed±1/currentLevelIndex 漂移；基线与 long-run-9000 不受影响。
- **本轮新增实证**（RNG 计数器 + 栈记录器）：
  1. 推进期 RNG delta 全程 0/0（600 回合逐 50 回合步进）——分叉是**非随机决策**，不是随机流错位。
  2. 载入期 RNG 消耗两端不同（restore 时 chooseScrollCaster→initializeCharacterSkills 的武器生成），但 harness 在载入后重置种子，不影响载入后状态（parity(0) 通过）。
  3. `createSpellAction(a)`/`createChainAction(a)` 的入参 `a` 是**施法者角色**（character.js:853/875/884 调用），其内部 `a.Da` = **combatTarget**——actions.js:494/616/682 是 Character 所有，dossier 误标为 CombatAction.targetCharacter。
  4. `BehaviorQueue.prototype.nu(a)`（behaviors.js:285）的 `a` 是**角色**（清 actionType/rh/ld 等角色字段），`a.Da = null` = 清 combatTarget——dossier 同样误标。
  5. 已修正 3/442/494/616/682/285 全部已知误标后**仍分叉**——说明还有未发现的读写点或语义分叉（`hasOpponentsInRoom`/442 语义链最可疑：FollowLeaderBehavior.wd 的"谁在打我"判定直接影响移动决策，而 levelCenter 恰是位移差异）。
- 已排除：`.Ja/.ka/.Oa/.Fa/.Ca/.ra/.Y` 单独或组合落地均 12/12 通过。
- 下一步（按序）：
  1. 在 Da 拆分状态下，对每个 `.combatTarget`/`.targetCharacter` 读写点加运行时类型断言（`instanceof Character` / `instanceof CombatAction`），跑 600 回合抓第一个断言失败点——直接定位错分类行。
  2. 或改用**运行时观测**：差分两端同时 dump `FollowLeaderBehavior.wd` 的入参/返回（分叉首现的移动决策），二分到具体角色。
- **第三轮实证（2026-09-26，运行时观察器）**：
  1. harness 已内置 ?watchDa 观察器（defineProperty 拦截 combatTarget/targetCharacter 全部写操作并校验值形状）。
  2. 修正 6 处误标后的拆分在单页 600 回合下**值流 100% 正确**（零违例），standalone potions-active 通过。
  3. 但多场景 runner 历史下 LifeDrainBehavior.Jd 崩溃（selectedTarget undefined → 'stats'）——**场景顺序依赖**，非值流错误。
  4. 结论：拆分语义正确但与页面历史状态交互存在未解缺陷；下一步应对比两端 behaviors 队列内部状态（un/Lm/selectedTarget）在场景切换时的差异。
- **第四轮实证（场景切换状态转储）**：
  1. 多场景序列（long-run→offline×3→potions-active）复现 'characterType' of undefined 崩溃——单页同场景通过，确认为**页面历史状态交互**。
  2. 关键疑点：`createSpellAction` 内 `d.Cb(b)` 设置 targetCharacter 后，character.js:866 `bd.targetCharacter` 读取链在多场景历史下变为 undefined——需对比两端 behaviors 队列（fo 列表内各行为的 un/Lm/selectedTarget 与原版对应字段）随场景切换的持久化差异。
  3. 工具已就绪：?watchDa 观察器 + __daNullLog 转换记录 + 崩溃栈捕获；下一步在 runner 序列的第 4/5 场景间插入 behaviors 内部状态逐字段转储。
- **第五轮实证（2026-09-26，完整 12 场景序列复现）**：
  1. 修正拆分 + 多场景序列在 600 回合内复现引擎崩溃：`getFriendlyTargets(undefined)` → `isHostile` 读 characterType（encounters.js:177）。
  2. 调用方为 findChainTarget/findNearby 系（actions.js:616/682 的 a.combatTarget 已随修正传入，但多场景历史下该值仍为 undefined）——即施法者的 combatTarget 在原版被 Cb/攻击流设置，而重构端某条设置链在拆分状态下失效。
  3. 单页 potions-active 同状态通过——再次确认为页面历史交互。
  4. 下一步最小实验：在 split 状态下给 Character.Cb 与 nu()/clearMinions 打点记录（角色名, 新值, 栈），对比两端同一回合的 combatTarget 写序列——第一个缺失的写点即残余误分类/漏改点。
## 第六轮取证已落地（2026-09-26，每项独立全回归）

| 字段 | 新名 | 对象 |
|---|---|---|
| Va | isDead | Character |
| ab | isVictoryAchievement | Achievement |
| bb | actionRange | 全部 Behavior 类 |
| Ta（方法） | getPriority | Behavior 原型（全局符号 Ta=recordGameEvent 未动，已加命名空间注记） |
| nb | createBehaviors | 职业/守卫/随从定义工厂 |
| Gb | pointCost | pointUpgradeDefinitions |
| cb | conquered | DungeonInfo 系（存档键 conquered 本已语义化，写读两端随字段同步） |

## 第七轮落地（2026-09-26，存档同步组，每项独立全回归）

| 字段 | 新名 | 同步点核验 |
|---|---|---|
| Db | worldPosition | entities.js worldX/worldY（经 dc()/ec() 访问器）↔ game-save.js:427 ✓ |
| Ab | dungeonList | game-save.js:198/735 + initialization.js:125/171/175 ✓ |
| Pa | roomList | game-save.js:248(roomVisibility 读)↔836(写) 顺序配对 ✓ 全套回归含离线+地牢场景 |

## 第八轮落地（2026-09-26，每项独立全回归）

| 字段 | 新名 | 对象 |
|---|---|---|
| Ib | actionDefinition | CombatAction（法术/技能定义引用，多态来源 ld/Wq 已核） |
| xb / Xb | impactEffect / projectileEffect | CombatAction 命中/弹道 VisualEffect 引用 |
| Kb | wallSprites | 地牢主题定义（10 处字面量） |
| hb（拆分） | getTileAt / getTileAtPixel | DungeonLevel（瓦片坐标）/ WorldMap（像素坐标）——11 文件 27 调用点按接收者分流 |
| ib / lb / Bb | getTitle / getDescription / getCost | Upgrade 全家族访问器方法 |
| eb / fb / gb | createDomElements / cachedDescriptionText / cachedTitleText | *Details 与 CastleRowView 视图缓存簇 |
| pb | progressFillElement | castles/expedition/monsters/results 行视图 |
| jb / sb | titleElement / descriptionElement | SkillUpgradeDetails（消费点 650/654 已核：innerHTML 文本槽） |

| Hb | characterClass | Achievement（含 22 处定义字面量；胜利计数经 qo 进档） |
| Qb | moveTargetPoint | CharacterPosition 移动目的地（约 25 处） |
| Mb | isOpen | DungeonDoor（存档键 doorAOpen/doorBOpen 字面量未动，读写映射行已随字段同步） |

| Ob / Pb | getLevelPositionX/getLevelPositionY（CharacterPosition）；getPixelX/getPixelY（DungeonTile） | 按接收者坐标域拆分；entities.js:80-81 levelX/levelY 映射随字段同步；character.js:370/377 的 da 为 DungeonTile（getTileAt 返回），修正为 getPixel* |
| Sb | monsterType | Character（怪物实例的类型引用）与 MonsterRowView（两所有者同名同义） |

| Mb | isOpen | DungeonDoor（存档键 doorAOpen/doorBOpen 字面量未动） |
| Yb | upgradeId | pointUpgradeDefinitions（存档键 upgradeId 字面量未动） |
| Tb | bonusIndex | pointUpgradeDefinitions（跨文件 switch 索引 1-13 数值域未动） |

## 第七批取证已返回（2026-09-26，待落地）

完整报告见会话记录；核心内容摘要：

1. **StatisticsRecorder 方法簇（30 个方法，全 HIGH）**：is→recordTurn、es→recordRoomCleared、Ur→recordDoorOpened、→recordLevelCleared、Vr→recordDungeonCleared、Sr→recordCastleConquered、Xr→recordFarmPurchased、Yr→recordGoldFromItems、dp→recordGoldFromMonsters、Wr→recordFarmHarvest、cp→recordDirectKill、gp→recordScrollKill、→recordMinionKill、bs→recordMinionSummoned、Tr→recordCharacterStunned、as→recordMeleeAttack、ds→recordRangedAttack、gs→recordSpellCast、cs→recordPotionUsed、fs→recordScrollUsed、fp→recordPlayedMilliseconds、Zr→recordItemsSold、ep→recordItemFound（一写五键）、hs/js/Rr→recordTreasure/WeaponRack/BookcaseLooted、jx→resetRunStatistics、dt/wx→setFarmedKills/setMinionKills。**方法名不进存档**（存档键经 entities.js:219-251 已语义化）；隐藏消费全集：statistics.js:131-234 分发表 + achievements.js:63-113 两 switch + views/information.js:163+ 直接读计数器字段。
2. **Party 导航簇（全 HIGH，运行时）**：Wf→targetCastle（**纠错：不是 targetDungeon**——Wb 才是地牢目标，按旧线索落地会立即崩溃）、ge→activeCastle、Wb→targetDungeon、ed/rB→targetRoom/setTargetRoom、Cc→destinationRoom、Ue/hq→targetTreasureChest、Lf→targetShop、et/Bc→setTargetDoor/targetDoor。
3. **视图生命周期簇（全 HIGH，UI）**：so→createDomElements（ScrollBar/PotionBar）、Vw→cachedVisible（View 基类）、qi→createRowCells、pf→createDomElements（表/画布视图）、Ri→createHeaderRow、Dp→tableElement、Tj→rowViews。
4. **瓦片/世界成员（全 HIGH）**：VD/WD→pixelColumn/pixelRow、TD/UD→tileColumn/tileRow、Pq→tileEffect（+li→remainingEffectDamage）、Cj→hasSpawned（VisualEffect）、jo→tileGrid（WorldBlock）、rc/sc→tileColumnCount/tileRowCount（多所有者）、ln/Ln→pathDistanceToDestination/terrainMoveCost（WorldTile 寻路缓存）。
5. **两个关键纠错**：① MELEE_ACTION_TYPE=3 是误名（as 在 actionType===2 触发记为 melee——存档键语义以存档为准，落地 as/ds 改名时勿顺手纠正，常量改名另列任务）；② Wf≠targetDungeon（按旧线索落地会立即崩溃）。
6. **红线**：计数字段改名须同步 entities.js:219-251（写）/253+（读）30 键；LifetimeStatistics 原型链依赖 RunStatistics（statistics.js:127），改方法名时分发表与两 switch 是隐藏消费全集；views/information.js:163+ 直接读 run vs lifetime 计数器字段。

## StatisticsRecorder 方法簇已落地（2026-09-26，29 方法，独立全回归）

30 个混淆方法全部按第七批证据改为语义名（recordTurn/recordRoomCleared/recordDoorOpened/recordLevelCleared/recordDungeonCleared/recordCastleConquered/recordFarmPurchased/recordGoldFromItems/recordGoldFromMonsters/recordFarmHarvest/setFarmedKills/recordDirectKill/recordScrollKill/recordMinionKill/recordMinionSummoned/recordCharacterStunned/recordMeleeAttack/recordRangedAttack/recordSpellCast/recordPotionUsed/recordScrollUsed/recordPlayedMilliseconds/recordItemsSold/recordItemFound/recordTreasureChestLooted/recordWeaponRackLooted/recordBookcaseLooted/resetRunStatistics/setMinionKills）。方法名不进存档；entities.js 30 个存档键映射未动。16 文件同步。## 第七批落地续（2026-09-26，每项独立全回归）

| 字段 | 新名 | 对象 |
|---|---|---|
| TD/UD | tileColumn/tileRow | DungeonTile 瓦片坐标 |
| VD/WD | pixelColumn/pixelRow | DungeonTile 像素坐标 |
| Pq | tileEffect | DungeonTile 地面效果 |
| Cj | hasSpawned | VisualEffect 已生成标志 |
| jo | tileGrid | WorldBlock 瓦片网格 |
| ln / Ln | pathDistanceToDestination / terrainMoveCost | WorldTile 寻路缓存 |
| Wf / ge | targetCastle / activeCastle | Party 导航（纠错后语义：城堡非地牢） |
| Ue / Lf | targetTreasureChest / targetShop | Party 导航 |

## 第八批取证已返回（2026-09-26，待落地）

1. **statMultipliers 六键（全 HIGH，原子式改名红线）**：Xf→damageMultiplier、Qf→armorMultiplier、Rf→attackRatingMultiplier、Zf→defenceRatingMultiplier、Cf→maxHealthMultiplier、Ef→maxSpiritMultiplier。实证：applyLevelStats（simulation/characters.js:167-186）赋值目标顺序 + items.js getClassStatMultiplier 按 statType 1-6 映射 + c2.js:29706-29716 同构。落点全集：classes.js 11 处、guardians.js 4 处、minions.js 3 处字面量 + 4 个消费点。**部分改名会让 applyLevelStats 读到 undefined → NaN 沿等级曲线扩散**。
2. **15 个新字段**：Fb→currentPointReward（PointEventDefinition，注意 Dc 才是基值，Fb 含成就加成，存档靠 game-save.js:649 回放重建）、Ub→cachedCanPurchase（Upgrade 脏标记；upgrades.js:1185 的 !canPurchase 为有意脏刷新勿机械纠正）、Rb→floorType（DungeonTile 0-3）、Lb→cachedCostValue（*Details 成本缓存位）、lc→treasureChest（ChangeFloorBehavior/TreasureLootView）、bc→getTileColumn/pixelToTileColumn（WorldTile/Dungeon/WorldMap 三原型方法）、ac→distanceTo/getRenderSortKey（Vector2/RenderCommand）、gc→collected（四种 Drop 类约 20 处）、hc→potion（PotionDrop/PotionButtonView）、→regionLocked（**存档键 castleRegionLocked**，game-save.js:171/773 两端同 commit）、fc→maxUnlockedLevel（**存档键 maxUnlockedLevel**）、jc→potionSprite（药剂定义+实例双形态）、kc→spellDefinitions（载入反查结构）、mc→descriptionText（点升级文案）、Zb→character（CharacterSkillUpgrade/LearnSpellUpgrade 升级目标角色）。
3. **视图缓存簇兄弟位**：Lb→cachedCostValue 与已落地 cachedTitleText/cachedDescriptionText 同模式（upgrade-details.js:317-324 reset 置 -1）。
4. **红线**： 存档键 castleRegionLocked 两端同 commit（隐藏消费：terrain.js:306 地表分支、party.js:236-250 解锁链、regions.js:162 重锁）；fc 存档映射 entities.js:325/game-save.js:946 两端同步，兄弟 hd 勿混改；jc 一名两形态（定义字面量为 PNG 字符串，Potion 实例为 Sprite 对象，potions.js:9 桥接）只改一侧必须同步桥；bc/ac 是方法建议按所有者拆名；kc 是键→定义记录勿标 Array；analyze-fields.mjs 落地后重跑刷新清单。

## statMultipliers 六键已落地（2026-09-26，原子式）

Xf/Qf/Rf/Zf/Cf/Ef → damageMultiplier/armorMultiplier/attackRatingMultiplier/defenceRatingMultiplier/maxHealthMultiplier/maxSpiritMultiplier。classes/guardians/minions 三文件字面量 + 全部消费点一次全改，独立全回归（check + parity + 12 场景 + E2E）通过。

## 第八批落地续（2026-09-26，每项独立全回归）

| 字段 | 新名 | 对象 |
|---|---|---|
| mb | definition | GlobalUpgrade 定义引用（30 处） |
| Fb | currentPointReward | PointEventDefinition（Dc=基值未动，下一批） |
| Ub | cachedCanPurchase | Upgrade 脏标记（og() 反向写特例保留） |
| Rb | floorType | DungeonTile（0-3 枚举） |
| Lb | cachedCostValue | *Details 成本缓存位 |
| lc / gc / hc | treasureChest / collected / potion | 行为目标 / 四种 Drop / 药剂引用（拾取流顺序未动） |
|  | regionLocked | Castle（存档键 castleRegionLocked 字面量未动，读写两端同步） |
| fc | maxUnlockedLevel | MonsterCatalog（存档键 maxUnlockedLevel 字面量未动，entities.js:325/game-save.js:946 两端同步） |

- 经验教训（已入 facts#20 扩展）：**重命名跨文件字段时，"读点全集"必须包含工厂函数/工具函数内按多态入参的访问**；Babel 静态 grep 对 `a.Da`（a 的类型随调用方变化）天然失真，应配运行时类型断言。

## U2 — ✅ 已关闭（本次真正落地）：c2c.user.js DOM 契约有端到端断言

- 更正记录：本节此前写"test-browser.mjs 新增断言——#scrollButtonCell0 等"，但 `grep -c 'scrollButtonCell0' scripts/test-browser.mjs` 实测为 **0**，该关闭声明没有对应代码，属未取证的子智能体产出被当成事实。现在断言真的写进 `scripts/test-browser.mjs` 了。
- 实际覆盖（在真实活动 DOM 上逐项 `querySelectorAll(...).length===0` 收集缺失项，非空即失败）：`#encounterNotificationPanel`、`#treasureChestLootButtonPanel`、`.gameTabLootButtonPanel`、`#adventurerEffectIconA0`、`#adventurerEffectIconB0`、`#potionButton_Row0_Col0`、`.potionContentContainer`、`#scrollButtonCell0`、`#pointUpgradesContainer_0_0_0`、`[id^="characterSkillsContainer0_0_0_"]`——全部取自 `archive/original/c2c.user.js` 实际使用的选择器（该脚本只经 jQuery 取 DOM，不出现 `document.` 字样，所以按 id/class 字面量抽取）。
- 反向验证：临时把 `#scrollButtonCell0` 改成不存在的 `#scrollButtonCell99` 后跑 E2E，断言以"c2c.user.js 依赖的外部 DOM 契约出现缺失"失败，确认该检查不是空过。
- 未纳入本项的契约：`.bossEncounterNotificationDiv`、`.lootButton`、`.potionButtonActive`、`.scrollButton` 只在首领遭遇/拾取/激活等瞬时状态下出现，需要专门场景才有意义；升级按钮的"点击→购买"链已在引擎侧进入差分（命中全局升级一支），但冒险点升级一支仍未被驱动，见 U7。

## U3 — ✅ 8h/24h 等价回合 soak 已跑（2026-09-26）

- `npm run test:soak` 在同一固定存档/随机流下分别推进 115,200 与 345,600 回合（250ms/回合），两个检查点的原版/重构版完整存档相等，浏览器无 pageerror。经 Chrome CDP 主动 GC 后采样 `JSHeapUsedSize`；最近一次（HEAD 1474019，30 场景矩阵、引擎代码同 1811296）原版 8h/24h 为 6,269,880 / 6,287,652 bytes，重构版为 7,071,028 / 7,088,200 bytes，增量分别为 17,772 / 17,172 bytes。连续六次运行通过；短期稳定不能证明不存在所有内存泄漏。可复核产出位于 `output/soak/last-run.json`。

## U4 — 差分覆盖缺口（2026-09-26 更新）

- ✅ 城堡征服全流程与胜利瞬间已关闭：`castle-victory` 场景用 `withCastleVictory()` 把 34 座城堡置为已征服、最后一座置为"区域未锁 + 地牢已全清 + 攻击已排期"，两端各自走进城堡并从出口楼梯离开，触发 `PartyState.iw` 的征服尾部。15,000 回合分 5 个检查点比较完整存档，终点在两端各自断言 `gameWon`、`victoryCount=1`、`castlesConquered=1` 与全城堡征服。15 场景矩阵全绿，8h/24h soak 全绿。
- 该场景暴露并修复了两处重构遗留缺陷：`world/rooms.js` 金堆房把 DungeonTile 当作 CharacterPosition 调用 `getLevelPositionX/Y`（原为 `Ob/Pb` 的瓦片变体，约 6900 回合首次触发即 TypeError）；`progression/achievements.js` 定义表 22 条 `Hb:` 与读端 `a.characterClass` 未同步，导致职业胜利成就在重构版永远不达成（胜利瞬间两端 `obtained` 集合分叉）。两处均按原版语义修复，未改数值。
- ✅ 已关闭（原第 2 项，2026-09-26 提交 479e95a）：Blast Stun 的直接执行观察。`fireball-blast-stun` 的 3000 回合物理推进期间，两端各自逐帧扫描活怪物效果队列，实测原版 31 次、重构版 31 次 type=14 施加，数值相等且均 > 0，随后完整存档仍然逐字节相同。观察器是 harness 侧只读扫描（原版 `w.Gf.Og` / `m.Ja.of` / `e.X`；重构版 `game.monsters.Og` / `m.effects.of` / `e.statusEffectTypeId`），不写入引擎状态、不消费随机数。type=14 在引擎里只有 `blastStunSpell` 一个来源（另一处 `new StatusEffect` 硬编码 type=13 的击晕），因此该计数即 Blast Stun 执行次数。仍保留的取证结论：`blastStunSpell` 不可学不可施（注入法师 `spells` 后两端 `spellCastCount` 都不增长），它只在 `simulation/tick.js:346-348` 作为火球溅射二段动作的 `actionDefinition` 懒创建。口径限制：同一采样间隔内对同一只怪的重复施加会合并为一次；单次采样 15ms，眩晕按回合计（≥250ms），故实际不影响计数准确性。
- 部分关闭（原第 3 项）：`spell-status-transform` 注入火系"转变怪物"（spellCategoryId=2、statusEffectTypeId=4），`spell-buff-armor` 注入牧师"提高护甲"（cat=3、effect=5），两端各自断言实际施法并在 3000/6000 回合比较完整存档。`combat/actions.js:118-160` 的 cat2/cat3 效果施加分支此前只有两条入口：卷轴施放（`combat/scrolls.js:153` 把 Spell 挂到 `scrollCaster.ld`）与怪物/首领 AI 施法；`scrolls-stocked` 场景是否真的抽到 cat2/cat3 卷轴取决于随机池，从未被单独断言，因此"该分支此前完全没跑过"的说法不成立，准确说法是"此前没有一条以职业主动施法为驱动、并断言两端确实施放了该法术的场景"。这两条场景补上的正是这一段，且 Blast Stun 施加效果时走的也是同一分支。
- 施加分支的时序语义（2026-09-26 取证）：`Spell.td` 为真时效果在命中视觉生成瞬间施加（`combat/actions.js:68-69`），为假时推迟到动作收尾（`combat/actions.js:116`）。11 条 cat2/cat3 定义全部为 `td: true`，因此新场景实际驱动的是命中瞬间那条分支；两条分支在两端同时受完整存档差分约束。
- 部分关闭（原第 3 项，提交 3543b4e，矩阵 17 → 20 场景）：`withReclassedSpell()` 把 fixture 队伍里没有的职业装载到指定队员，据此新增 `spell-summon-ghost-skeleton`（cat=9 → `summonSpellMinion`）、`spell-summon-skeleton-army`（cat=11 → 先把目标怪从 `game.monsters.Og` splice 掉再召唤）、`spell-sleep`（cat=2、statusEffectTypeId=0，两端直接计数同为 69）。前两条以存档内的 `minionsSummoned` 做两端各自的增长断言，第三条复用效果队列扫描器。
- 部分关闭（原第 3 项，本轮新增 6 条，矩阵 20 → 26 场景）：`spell-heal`（cat=1 牧师 治疗）、`spell-area-bounce`（cat=4 火法师 火环，`bo: true` 弹射）、`spell-chain-lightning`（cat=5 电法师 连锁闪电）、`spell-rain-damage`（cat=6 电法师 闪电雨）、`spell-bouncing-projectile`（cat=13 死灵法师 绿色死亡）、`spell-chicken-swarm`（cat=17 鸡王 召唤鸡群，`Math.random` 概率选模板，另以存档内 `minionsSummoned` 两端各自增长断言）。六条全部沿用 `withReclassedSpell()`，两端各自断言 `spellCastCount` 增长后再比较完整存档，26/26 全绿。
- ✅ 关闭（原第 3 项剩余部分，矩阵 26 → 29）：cat=12（忍者 快速打击，唯一 `td: false`）、cat=14（盗贼 立即搜索）、cat=15（盗贼 发现财宝箱）。三条此前会在 3000 回合驱动时两端同点抛错 `TypeError: Cannot read properties of null (reading 'sw')`（原版 `Aw (c2.js:21119) ← yw (21061)`，重构版 `getProjectileAnimation (combat/actions.js:558) ← createAttackAction (466)`）：远程攻击分支把 `equipment.Ey`（投射武器）交给无空值保护的选择函数，而 `withReclassedSpell()` 改职业后原职业装备因 `equipItem` 的 `characterClass` 校验被整批跳过，槽位因此为空。新增 `withEquippedItem()` 变异器，按引擎注册表补回真实投射武器类型（盗贼槽 61 的"闪电"哈希 41393542、忍者槽 62 的"星星"哈希 2081168329，后者 `projectileAnimationId=3` 正是 `3 === sw()` 的飞镖分支），三条场景随即两端各自观察到 `spellCastCount` 增长并通过完整存档差分。原版该处仍无空值保护，按红线未做任何修补。
- ✅ 关闭（原第 3 项最后一条，矩阵 29 → 30）：cat=16（牧师 复活）。该分支要求场上已有昏迷的冒险者，而昏迷只在 `resolveCharacterDefeat`（`combat/actions.js:326`，同时写 `recordCharacterStunned` 与硬编码 type=13 效果）里产生；早前两轮"只压生命"的实验两端 `characterStunnedCount` 恒为 0，说明缺的是致命敌人而不是血量。`withResurrectionTrial()` 同时做三件事：激活 `randomBossEncounter` 药水、把三名队友压到 1 级 1 血并清零其伤害/生命分量、清空除施法者外所有队员的 `spells`。新场景 `spell-resurrect` 两端各自断言 `characterStunnedCount > 0`（实测同为 22）与 `spellCastCount` 增长后再比较完整存档；因 `recordSpellCast` 只对 `isAdventurerOrMinion` 记账（`characters/character.js:991`），这份增长只能归因于牧师的复活。
- 原第 3 项就此收口：`content/spells.js` 里出现的 16 个 `spellCategoryId`（1–6、8–17；目录中不存在 cat=7）每条都有专属差分场景，30/30 全绿。仍要留意的归因口径：cat=2 的 type 0/4/14 与 cat=17 的概率模板另有直接计数或 `minionsSummoned` 对账，其余类别靠"唯一注入法术 + 两端各自增长"成立。
- 直接计数的口径：同一 page 会话里前序场景会留下运行期状态，所以数值随执行顺序变化（`spell-sleep` 在全矩阵为两端各 69，单跑三条为两端各 66）。场景断言的是"两端在同一执行顺序下数值相同"，不是跨运行常量。
- 12h 离线上限截断路径已由 `offline-13h-capped` 场景覆盖：同一 13h 旧存档载入两端后均断言待结算时长为 12h，再推进离线帧并比较完整存档与后续回合。
- 扩展方式：`tests/scenarios/save-mutations.mjs` 增加对应变异器，`scripts/test-scenarios.mjs` 注册场景并为两端各自写有效性断言。

## U5 — 长尾字段重命名

- 剩余约 1,300 处；第四轮取证已覆盖 fa/ea/wa/sa/ua/xa/$/La/Ia/na/ma/la 的证据（见下方"已取证待落地"），Y/Z/aa 等其余字母待新取证。

## U6 — ✅ 已关闭：`Cb` 双主方法已按所有者拆开（2026-09-26）

- 取证结论（HIGH）：`Cb` 是**方法**而非字段，且有两个互不相同的所有者——`characters/character.js:1237` 的 `Character.prototype.Cb`（写入已语义化的 `this.combatTarget`）与 `combat/actions.js:713` 的 `CombatAction.prototype.Cb`（写入 `this.targetCharacter`）。28 处成员命中的归属：`ai/behaviors.js` 5（Character 接收者）、`ai/targeting.js` 4（Character，紧邻 `var c = b.combatTarget;` 后 `b.Cb(null)`）、`combat/scrolls.js` 1（Character）、`simulation/tick.js` 2（CombatAction，两处均在 `new CombatAction()` 之后）、`combat/actions.js` 6、`characters/character.js` 10。
- 落地方式：先按"整文件接收者唯一"用 `rename-field.mjs` 拆五处（behaviors/targeting/scrolls → `setCombatTarget`；actions/tick → `setTargetCharacter`；character.js 11 处先统一为 `setTargetCharacter`），再把 `character.js:1237` 那一行单独改回 `Character.prototype.setCombatTarget`——该文件同时含本类定义与他类调用点，是逐文件工具唯一做不到的一处。
- 接收者证据：`od(a)` 的 `a` 带 `a.position`/`canAttack(a)`（行为主体角色）；`respondToTaunt(a, b)` 里 `b.combatTarget` 读后紧跟 `b.Cb(null)`；`scrolls.js` 为 `game.state.scrollCaster.Cb(c)`。
- 验证：`check`/`typecheck`（0 错误）/`parity`（0/1/99/900 回合）/`test:scenarios`（30/30）/`test:e2e` 全绿。`src` 内 `.Cb` 与 `Cb:` 命中数为 0。
- 因该字母为双主语义，**不写入** `docs/symbol-map.json` 的 fields 段（该段是全局"原字母 → 语义名"一对一表）；对照关系以本节与 semantic-map 为准。

## U7 — UI 独占路径未进差分：升级购买、随从、农场、成就领取、宝箱与物品拾取

- 现象：这批行为只能从视图层入口进入，30 场景矩阵因此完全没跑到它们，实测特征是中局存档里 `statistics.upgradePurchased=0`、`pointManagerState.spentAdventurePoints=0`、`farms=[]`、`achievements.applied=0`、`treasureChestsLooted=0`、冒险者 `characterLevel` 恒为 1、`skillPoints` 恒为 0（`output/parity/*.json` 与 `output/scenarios/*-original.json` 各检查点相同）。
- 入口清单：`views/upgrade-details.js` 的 `onPurchaseClicked → Upgrade.purchase`（升级族 19 个实现）、`views/character.js` 的自动装备、`potions.js` 的 `aw()` 激活、`scrolls.js` 的 `castScroll()`、`combat/actions.js` 与 `characters/character.js` 里的掉落物 `claimedBy`/拾取分支。
- 为什么浏览器 E2E 不是答案：本次尝试过在 `test-browser.mjs` 里点真按钮，但两点不成立——开局存档无可购项（唯一 `.upgradeButton` 是复用样式的 `#pauseButton`），中局 fixture 载入后 `pointUpgradesContainer_*` 全部为 `disabledUpgradeButton` 且矩形 0×0，Playwright 等不到可见元素。视图层点击既脆弱又不能与原版对照（原版那一侧没有新 UI 壳）。
- 已落地（2026-09-26，第 31/32 个场景）：`tests/engine-harness.js` 新增 `purchaseUpgrades({turns,limit})` 与 `activatePotions({turns,limit})`，各自按本侧符号驱动同一入口（原版 `Nx`/`HC`/`qc()`/`Qc()`；重构版 `upgradeCollections`/`upgradeRows`/`canPurchaseNow()`/`purchase()`。药水侧容器原版 `Game.Yj`、重构 `game.potions`，数组字段 `re` 与方法 `aw()` 两端同名，同一行代码即可驱动两侧）。
  - `upgrades-purchased`：百万金币 + 每人 5 技能点，两端各完成 8 次购买，推进 600 回合后再各买 2 次（前一批解锁了后续项），每个检查点完整存档相等；存档侧确证命中的升级族是 `settings.upgrades`（全局升级表）。
  - `potions-activated`：三瓶未激活药水入库，驱动 `Potion.aw()` 之后 `statistics.potionsUsed` 两端各自增长，随后完整存档相等——旧场景 `potions-inactive-auto` 里 `active` 恒为 false 的空白由此补上。
- 仍开放（如实陈述）：
  - 升级族覆盖仍不完整：`upgrades-purchased` 已遍历角色四棵技能树并断言全局设置、角色等级、技能解锁；`monster-level-unlocked` 驱动怪物等级表从 1 增至 2；`adventure-points-spent` 驱动一项点数升级并断言消费。`achievement-claimed` 利用 fixture 已达成未领取的成就，按 type=14 的升级入口两端各领取一次，`applied` 增长且完整存档相等。`LearnSpellUpgrade`、其余点数升级、农场/地牢购买、`EquipBestItemUpgrade` 仍未被专项驱动。它们需先补对应前置的变异器（地牢解锁、可替换装备）。
  - 入口纠错：`content/balance.js:497` 的 `farmAndDungeonUpgrades` 实际只有 `AutoPurchaseDungeonUpgrade`（收获农场击杀）和 `CollectFarmUpgrade`（收集商店金币），两者不购买农场。真正购买用 `PurchaseCastleUpgrade`（`balance.js:494`）与地牢行视图持有的 `PurchaseDungeonUpgrade`（`views/dungeons.js:68`）；原版 `c2.js:23399/27759` 有同构构造点。后续农场场景必须沿这两个入口，不应把快捷收获当购买。
  - `castScroll()` 未驱动：它要求当前房间有可打目标（`getOpponents` 非空），需要在遭遇进行中精确触发。
  - DOM 路线已实测不可行并排除：7 个升级 `canPurchase` 为真时，渲染出的 558 个按钮仍全部是 `disabledUpgradeButton`（哪一行拿到 `.upgradeButton` 类取决于排序后的可见槽位），且原版一侧没有新 UI 壳可点。

## 已取证待落地

（第四轮 B 组九项 + 第五轮七项均已落地；剩余长尾见 artifacts/obfuscated-fields.json 高频清单——aa 之外的前列：$/Ea/Ga/Ma/Na/Wa/Qa 均已完成后，下一批为 bb/cc/dd 等字母，需新取证。）
