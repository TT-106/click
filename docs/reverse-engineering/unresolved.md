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

- 经验教训（已入 facts#20 扩展）：**重命名跨文件字段时，"读点全集"必须包含工厂函数/工具函数内按多态入参的访问**；Babel 静态 grep 对 `a.Da`（a 的类型随调用方变化）天然失真，应配运行时类型断言。

## U2 — 外部自动化脚本（c2c.user.js）DOM 契约未实测

- `archive/original/c2c.user.js` 依赖的 DOM 结构已随 legacy-dom.html 保留，但未实际运行该脚本验证。
- 下一步：在浏览器 E2E 中加载 userscript 模拟其核心选择器读取。

## U3 — 长时 wall-clock soak 未跑

- 8h/24h 加速等价场景 + 内存采样。差分 harness 已具备能力，待加 performance.memory 采样。

## U4 — 差分覆盖缺口

- 胜利瞬间（城堡征服全流程）、部分法术分支（blastStun 系）、12h 离线上限截断路径。
- 扩展方式：`tests/scenarios/save-mutations.mjs` 增加对应变异器。

## U5 — 长尾字段重命名

- 剩余约 1,300 处；第四轮取证已覆盖 fa/ea/wa/sa/ua/xa/$/La/Ia/na/ma/la 的证据（见下方"已取证待落地"），Y/Z/aa 等其余字母待新取证。

## 已取证待落地

（第四轮 B 组九项 + 第五轮七项均已落地；剩余长尾见 artifacts/obfuscated-fields.json 高频清单——aa 之外的前列：$/Ea/Ga/Ma/Na/Wa/Qa 均已完成后，下一批为 bb/cc/dd 等字母，需新取证。）