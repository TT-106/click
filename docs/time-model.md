# 时间模型语义文档

> 本文区分原版引擎中六种"时间"，并给出离线结算、速度修正与暂停语义的精确定义。
> 离线机制条目直接引用 `docs/reverse-engineering/facts.md` 第 9–12 条（已验证）。
> 所有数值均附 file:line（相对仓库根）；行号漂移时以符号为准重新 grep。

## 1. 六种时间

| # | 名称 | 定义 | 代码位置 |
|---|---|---|---|
| 1 | **wall clock** | `Date.now()` 真实时间。所有取值经 `nowMilliseconds()`（`Date.now` 优先，退化 `new Date().valueOf()`） | `src/engine/modules/core/math.js:49-51` |
| 2 | **frame tick** | `requestAnimationFrame` 驱动的 `GameLoop.prototype.tick`，每帧一次 | `src/engine/modules/simulation/loop.js:33`；入口挂载 `runtime/game.js:200-203` |
| 3 | **render frame** | 渲染假设 60Hz：`frameDuration = 1E3/60`（≈16.667ms） | `simulation/loop.js:24`；同值常量 `FRAME_DURATION_MS` 在 `core/math.js:149` |
| 4 | **frame delta** | 本次 tick 与上次 tick 的墙钟差 `a = now - lastTickAt`（可为 0 或很大）；`b = now - lastFrameAt` 仅用于 FPS 统计 | `simulation/loop.js:36-40, 81-86` |
| 5 | **simulation unit** | 模拟推进的最小单位 = 1 个"60Hz 帧当量"。`advanceSimulation(c)` 的入参 `c = a / frameDuration`（帧差换算成帧数，可为小数） | `simulation/loop.js:53-55`；`advanceSimulation` 本体 `simulation/tick.js:27` |
| 6 | **turn（回合）** | 累计 15 个模拟单位 = 1 回合：`lifecycle.Jo += a; if (15 <= Jo) { turnNumber++; Jo -= 15; }`。15 单位 × 16.667ms = **250ms**，与 `turnDuration = 250` 一致 | `simulation/tick.js:28-32`；`turnDuration` `simulation/loop.js:25`；facts.md 第 4 条 |

### 1.1 wall clock 的全部消费点

| 位置 | 用途 |
|---|---|
| `src/engine/modules/simulation/loop.js:22-23,36,40,89,96,111,220` | lastTickAt/lastFrameAt 更新、帧差计算、自动存档节流 |
| `src/engine/modules/runtime/game.js:131,142` | `lastSavedAt` 初值、`lastActiveAt` 初值 |
| `src/engine/modules/runtime/game.js:499` | 离线时长 = `Date.now() - lastActiveAt` |
| `src/engine/modules/persistence/game-save.js:29,36` | 存档后刷新 `lastSavedAt` |
| `src/engine/modules/persistence/game-save.js:52` | 恢复时 `lastActiveAt = 存档 gameTimestamp`（无则取当前） |
| `src/engine/modules/persistence/game-save.js:704` | 序列化写入 `gameTimestamp = Date.now()`（**当前时刻**，facts.md 第 7 条） |
| `src/engine/modules/world/generation.js:311-314` | 走廊生成失败的耗时日志（不影响语义） |

harness 用 `Date.now = () => fixedNow`（固定 1750000000000）覆盖 wall clock（`tests/engine-harness.js:9,47`），`setTime(ms)` 可任意拨钟——这是离线差分场景的基础。

### 1.2 回合数是游戏内时间的真正单位

所有冷却、持续时间、再生节律、世界重生周期都以 `game.state.turnNumber`（回合数）计量，**与 wall clock 无关**：

| 机制 | 单位与数值 | 代码位置 |
|---|---|---|
| 攻击冷却 | 回合；`baseAttackCooldown = 12`，下限 4（`Math.max(4, base - reduction [+ bonus])`） | `characters/stats.js:22, 40-43` |
| 法术/卷轴冷却 | 回合 `La`；初始 `mq = turnNumber - 3*La`（视为久已就绪）；就绪判定 `turnNumber - mq >= La` | `combat/scrolls.js:23-34` |
| **药水持续时间** | **回合数 800**：`V = 800 + potionDurationBonus.t`。激活时 `activationTurn = game.state.turnNumber`（存档键 `activeStartTurn`）；过期判定 `turnNumber - activationTurn >= V` | `simulation/tick.js:112,121`；`combat/potions.js:14,242`；存档写出/读回 `persistence/game-save.js:879,678` |
| 药水延时升级 | `potionDurationBonus` 每级 +120 回合（`lf: 120`）；药水"持续时间+50%"（`potionDurationModifier`）生效期间**每 3 回合把 activationTurn 回拨 1**（`z = 0 === turnNumber % 3`） | `content/balance.js:157-161`；`simulation/tick.js:107,117-120` |
| 随从寿命 | 回合 `lifetimeTurns`，`turnNumber - summonedAtTurn > lifetimeTurns` 时消散 | `simulation/tick.js:65-77` |
| 生命/精神再生 | 每 3 回合一次（`zD = 3`） | `simulation/characters.js:37`；`simulation/tick.js:33-51` |
| 地牢再感染 | 每 2 回合检查（`gD = 2`）；清剿后 **1500 回合**重新出现 | `simulation/characters.js:38`；`simulation/tick.js:143-159,197` |
| 自动卷轴施放 | 每 2 回合一发（`TC = 2`，`bu` 计数） | `simulation/characters.js:42`；`simulation/tick.js:130-142` |

### 1.3 速度修正：像素/帧（60Hz 假设下即像素/秒 = 值 × 60）

移动位移发生在 `advanceSimulation` 内部，入参 `a`（帧当量，可小数）直接作为距离系数传给 `updateCharacter(角色, a)`（`simulation/tick.js:267,270`）：

- 基础速度：`CharacterPosition` 以 `(worldSpeed, dungeonSpeed)` 构造——`new CharacterPosition(WORLD_WALK_SPEED, DUNGEON_WALK_SPEED)`（`characters/character.js:56`；字段 `MC`=世界、`Jw`=地牢，`characters/movement.js:17-24`）。
- 具体值：`DUNGEON_WALK_SPEED = 1.3`（`content/balance.js:118`）、`WORLD_WALK_SPEED = 1.5`（`content/balance.js:119`）。
- 修正链（世界地图，队长/队员同式）：`位移 = 帧数 × MC × walkingSpeedBonus.t × walkingSpeedModifier.t`（`characters/character.js:192,232`）。
- 修正链（地牢内）：冒险者/随从乘修正，怪物不乘——`isAdventurerOrMinion(a) ? b * p.Jw * bonus * modifier : p.Jw * b`（`characters/character.js:258`）。
- `walkingSpeedBonus`：升级加成，`t` 初值 1、每级 +0.1（`lf: 0.1`）（`content/balance.js:127-131`）。
- `walkingSpeedModifier`：药水"快速行走"，1 → 1.25（`nc: 1.25`）（`content/balance.js:208-212`）。
- 动画计时（渲染侧）：`EFFECT_FRAME_DURATION_MS = 170`、`PROJECTILE_FRAME_DURATION_MS = 60`（`content/balance.js:468-469`）。

## 2. 离线结算的时间语义（facts.md 第 9–12 条，直接引用）

9. **触发**：restore 末尾 `allowOfflineProgress && lastActiveAt && elapsed > 120000ms` → `beginOfflineProgress`（上限 `432e5 + offlineTimeBonus.t` = 12 小时 + 加成）。
   - 落点：`runtime/game.js:498-503`（`offlineDuration = Date.now() - lastActiveAt`，阈值 `12E4`ms）；`beginOfflineProgress` 钳制 `Math.min(offlineDuration, 432E5 + offlineTimeBonus.t)`（`game.js:469-475`）；`offlineTimeBonus` 每级 +72E5ms=2h（`content/balance.js:167-171`）。前置条件 `!game.gameWon && game.partyCreated`（`game.js:470`）。
10. **结算由帧循环驱动**：`loop.tick()` 在 `processingOffline` 时每帧最多 200 回合（每回合 `advanceSimulation(15)`、`offlineProcessed += 250`），完成时 `finishOfflineProgress`。直连 `advanceSimulation` 会**绕过**离线结算——harness 必须用 `advanceOffline()`（每帧 +2000ms 虚拟时钟，因为分支条件为 `1E3 < 帧差`）。
    - 落点：`simulation/loop.js:42-51`（分支条件、`c < 200` 循环、`offlineProcessed += this.turnDuration`、统计 `aa.fp(turnDuration)`、完成判定）；`game.js:476-481`（finish）；harness `tests/engine-harness.js:51-55`。
11. **后台标签页**（`allowBackgroundProgress` + 帧差 > 1s）走同一离线分支并累加 `offlineDuration`——落点 `simulation/loop.js:42`（`1E3 < a && allowBackgroundProgress` → `offlineDuration += a`）。rAF 在后台被浏览器节流，帧差因此超过 1s。
12. **差分验证**：offline-1h/8h 场景两端金币/击杀实际增长且逐字段相等；offline-disabled 无增长（`scripts/test-scenarios.mjs:23-40`，场景有效性钩子 `:107-112,131-137`）。

补充语义：序列化在离线结算过程中**仍写当前时刻**（`game-save.js:704`），所以离线结算完成后 `gameTimestamp` 必然晚于 harness 固定时钟——差分场景对此做了显式断言（`test-scenarios.mjs:107-112`）。离线期间自动存档被跳过（`loop.js:87` 的 `!game.processingOffline` 条件）。

## 3. 暂停语义与后台标签页处理

### 3.1 暂停检查的位置

`GameLoop.prototype.tick` 的模拟闸门是**一个条件**（`simulation/loop.js:41`）：

```js
if (game.partyCreated && !game.gameWon && !game.paused) { ...推进模拟... }
```

即：未建队、已通关、暂停中三者任一成立时，`advanceSimulation` 完全不被调用。关键推论：

- **持续运行的手动暂停不会积累待补回合**：每次 tick 末尾仍刷新 `lastTickAt`（`loop.js:97`），恢复时只按最近一次 tick 的帧差推进。仅当 tick 实际被节流或停止后，下一次 tick 才可能看到大时间间隙，并按后台进度开关进入对应分支。
- 渲染不受暂停影响（`loop.js:74-80`），自动存档节流也不受影响（`loop.js:87-92`）。
- 玩法时间统计在暂停/离线时冻结：`if (!(game.paused || game.processingOffline)) game.state.aa.fp(a)`（`loop.js:93-95`）。

### 3.2 paused 的写入口

| 位置 | 动作 |
|---|---|
| `src/engine/modules/views/navigation.js:16,24` | PauseView 初始化读当前态、点击取反（原版 UI 语义，新壳复用） |
| `src/engine/adapter.js:132-133` | 新 UI 命令入口 `pause(value = !game.paused)` |
| `src/engine/modules/runtime/game.js:378,439` | `resetRun`/`resetContinuation` 复位为 false |
| `src/engine/adapter.js:69,75` | 快照导出 `paused` 字段供新 UI 显示 |

E2E 覆盖：点击暂停后 700ms 内 turn 不变（`scripts/test-browser.mjs:25-28`）、空格键解除暂停（`scripts/test-browser.mjs:70-73`）。

### 3.3 后台标签页

- 可见性只关**渲染**：`visibilitychange` → `renderEnabled = !document.hidden`（`runtime/game.js:192-199`），渲染跳过点在 `loop.js:74`。模拟不会被显式暂停。
- 后台时 rAF 节流 → 帧差变大：
  - 帧差 ≤ 1s：回到前台后按帧数一次性补推进（§3.1 的补推进语义）。
  - 帧差 > 1s 且 `allowBackgroundProgress` 开启：直接进入离线分支（§2 第 11 条），按离线节奏补结算。
- 两开关默认全开：`gameOptions` 的 `allowOfflineProgress`/`allowBackgroundProgress` 初值 true（`runtime/game.js:91`）。

## 4. 换算速查

```
1 wall second（前台，60Hz） ≈ 60 frame ≈ 60 simulation units ≈ 4 turns（每回合 250ms）
1 turn = 15 units = 250ms（loop.turnDuration）
药水一管 = 800 回合（+升级） ≈ 3 分 20 秒（wall，60Hz 满帧）
离线阈值 = 120s；离线上限 = 12h（432E5ms）+ offlineTimeBonus×2h
后台判定阈值 = 帧差 1E3ms
自动存档间隔 = 3E5ms = 5 分钟（runtime/game.js:141-145）
```

注意"≈"：前台帧差是墙钟实值换算（`a / frameDuration`），掉帧时模拟按帧当量补齐，turn 与 wall time 的对应在长窗口下才成立；**离线/后台补结算一律按每回合 250ms 计**（`offlineProcessed += turnDuration`），与真实帧率无关。
