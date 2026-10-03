# RNG 语义文档（双随机源架构）

> 本文描述 Clickpocalypse II 恢复工程中全部随机性来源、它们的职责边界、确定性保证与消费者清单。
> 已验证事实的权威出处：`docs/reverse-engineering/facts.md` 第 1–4 条（本文件直接引用，不再重复论证）。
> 行号对应当前工作区状态；重命名波次后如行号漂移，以符号名为准重新 grep。

## 1. 双随机源架构

原版引擎有**两个互相独立的随机源**，职责完全不同（facts.md 第 3 条）：

| | 源 A：SeededRandom | 源 B：全局 Math.random |
|---|---|---|
| 算法 | JS 浮点变体 MT19937（见 §2） | 浏览器宿主 PRNG（不可控） |
| 原版符号 | `ga`（构造器），见 docs/symbol-map.json | `k` → `randomInt` |
| 现位置 | `src/engine/modules/core/math.js:5`（构造器）、`math.js:125`（`prototype.random`，由 `initializeCoreMath()` 挂载） | `math.js:29`（`randomInt`）、`math.js:56`（`randomizeScaledValue`） |
| 种子 | 生成时确定（固定常数或按地牢/地形种子） | 无种子，运行期消费 |
| 职责 | **世界与地牢的静态生成**：地形、区域、城堡布局、地牢入口、房间/走廊、房间内宝箱与装饰布置、区域与地牢命名 | **运行期玩法随机**：战斗判定、掉落、宝箱开箱、怪物生成、AI 抖动与闲聊、掉落物散布位置 |
| 可回放性 | 同种子必然同序列（跨机器、跨时间成立） | 原版不可回放；差分测试中由 harness 注入 LCG 变为确定（见 §3.2） |

### 1.1 源 A：SeededRandom 负责什么

MT19937 结构参数全部保留在 `math.js`：624 个状态字（`stateSize`）、397（`periodOffset`）、0x9908b0df=2567483615（`matrixConstant`）、tempering 掩码 2636928640 / 4022730752，输出 `[0,1)` 浮点（`unitScale = 1/4294967296`，`math.js:147`）。

种子实例与消费方式（消费统一走 `randomIntFrom(a, b)` = `a.random() * b | 0`，`math.js:21`）：

- `src/engine/modules/world/terrain.js:13` — `new SeededRandom(a)`：世界地图地形生成（与 SimplexNoise `oa` 配合，`terrain.js:10`）。
- `src/engine/modules/world/initialization.js:43` — `Ga = new SeededRandom(11)`（**固定种子 11**）：世界区域/城堡的名称与位置布置（`initialization.js:66-82`）。
- `src/engine/modules/world/initialization.js:135` — `gb = new SeededRandom(1)`（**固定种子 1**）：世界地块（block）内地牢入口坐标（`initialization.js:157-168`）。
- `src/engine/modules/world/generation.js:137` — `this.wa = new SeededRandom(3)`：DungeonLevel 房间布局主流。
- `src/engine/modules/world/generation.js:151` — `new SeededRandom(a)`：按地牢自身种子的地牢生成流；`generation.js:169` — `new SeededRandom(f.sp)`：按主题种子。
- 间接消费点（`randomIntFrom(实例, n)` / `实例.random()`）：房间尺寸与位置 `world/generation.js:256-271, 468-502`；走廊端点 `generation.js:39-63, 495-502`；地牢名 `world/dungeons.js:35`（`randomIntFrom(a, 11)`）；房间内容（宝箱/武器架/展示柜的放置与朝向，含 `0.2 > b.wa.random()` 的放置门槛）`world/rooms.js:155-179`；区域名内容选取 `world/regions.js:25-54`。

**关键性质**：这一支在"生成完成"后不再增长；同一存档（相同种子集）在任何机器上重建的世界逐格相同。这也是 parity 差分能逐字节成立的前提之一。

### 1.2 源 B：全局 Math.random（randomInt）负责什么

`randomInt(a) = 0 >= a ? 0 : floorNumber(Math.random() * a)`（`math.js:29-31`）。`randomizeScaledValue`（`math.js:56-60`）也直接用 `Math.random()` 做装备属性/金币 ±10% 浮动。

按 grep `randomInt` / `Math.random()` 在 `src/engine` 的调用方分类（完整 file:line 清单见 §4）：

- **战斗数值**：伤害浮动（`combat/actions.js:305`）、命中（`actions.js:587`）、暴击（`actions.js:590, 602`）、护甲减伤浮动（`actions.js:594, 606`）、多重攻击触发（`actions.js:174-182, 423`）、连击数（`characters/stats.js:102-114`）。
- **怪物与遭遇**：遭遇怪物数量与 boss 概率（`combat/encounters.js:44`）、城堡守卫生成分组与选型（`encounters.js:151-155`）、怪物名前后缀（`encounters.js:298`）、随机目标选取（`ai/targeting.js:144-149`）。
- **掉落与宝箱**：杀怪四类掉落判定（`simulation/characters.js:298-332`）、击杀奖励爆发（`combat/actions.js:372-398`）、宝箱开箱奖励（`characters/character.js:1079-1120`）、宝箱生成概率与位置（`loot/treasure.js:62-67, 121-127`）、物品类型/稀有度/等级/特效（`loot/items.js:148, 169-173, 226-230, 333`）、物品命名（`loot/item-names.js:59-120`）、金币区间（`content/balance.js:8-13 rollGoldDrop`）。
- **表现层与文案**（仍消耗**全局流**，不可删）：伤害/治疗浮动文字偏移（`rendering/floating-text.js:11-13, 49`）、闪电折线偏移（`rendering/scene.js:231-232`）、闲逛目标（`characters/movement.js:108, 125, 143, 174`；`ai/behaviors.js:497`）、目标点抖动（`ai/targeting.js:129-134`）、闲聊文案（`ai/behaviors.js:587, 706`；`simulation/characters.js:201, 332`）、旅行尸体 sprite（`simulation/characters.js:187`）、商店 sprite（`world/dungeons.js:184`）、结算画面怪物 sprite（`views/results.js:103`）、升级提示示例（`views/upgrade-details.js:1235`）。

## 2. JS 浮点变体 MT 与 C 标准的差异（facts.md 第 1 条，直接引用）

**原版 RNG 是"JS 浮点变体 MT19937"，不是 C 标准 MT19937。** 种子循环
`1812433253 * (prev ^ prev>>30) + i`（`math.js:16`）用 **64 位浮点乘法、未做 int32 截断**——乘法和加法先以 double 完成、之后才 `&= 4294967295`（`math.js:17`）。180 亿次级别的整数乘在 double 下精度丢失，导致状态序列与 C 标准（先 uint32 截断再相加）分叉：seed 5489 的首值为 **1859732469**，而标准 MT19937 为 **3499211612**。

> **警告（禁止回退）**：任何"更标准"的 RNG 替换（标准 MT19937、xoshiro、crypto.getRandomValues 等）都会改变随机流位型，从而**破坏回放/差分确定性**，并使旧存档重建的世界布局改变。`tests/unit/rng.test.mjs` 的黄金值测试（`rng.test.mjs:60-69`）就是对这一变体特征的锁死；该测试失败即说明有人"修复"了 RNG，必须回退。

## 3. 测试策略

### 3.1 差分方法：Babel 从原版提取 `ga`（`tests/unit/rng.test.mjs`）

1. **AST 提取**：`@babel/parser` 解析 `archive/original/c2.js`，收集 `id === 'ga'` 的函数声明与所有根标识符为 `ga` 的赋值表达式（原型方法挂载语句），重新 generate 为可执行代码（`rng.test.mjs:15-40`），用 `new Function(...)` 实例化**原版实现本身**（`rng.test.mjs:40`）。这保证对照物不是"我们理解的 MT19937"，而是原版字节级行为。
2. **逐值差分**：6 个种子（0、1、42、5489、123456789、4294967295）× 每个 100,000 个输出值，重构版 `SeededRandom` 与原版 `ga` 逐值 `deepEqual`（`rng.test.mjs:52-58`）。
3. **黄金值**：seed 5489 前三个 32 位输出 = `[1859732469, 3401144660, 1032891371]`，锁死"JS 浮点变体"身份（`rng.test.mjs:60-69`）。
4. **性质测试**：同种子两次实例化流相同；不同种子前 1000 值内必分叉（`rng.test.mjs:71-79`）。

注意：原型方法由 `initializeCoreMath()` 挂载是**恢复工程刻意保留的启动顺序**，单测需先显式调用（`rng.test.mjs:42-43`）。

### 3.2 LCG harness：让 Math.random 变成确定流（`tests/engine-harness.js`）

差分要能逐字节比较，必须让源 B 也确定。harness 在**任何引擎代码运行之前**替换全局函数（`engine-harness.js:5-9`）：

```js
let seed = 123456789;
let fixedNow = 1750000000000;
Math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
Date.now = () => fixedNow;
```

即 LCG(1664525, 1013904223)（numerical recipes 常数）+ 固定时钟。`harness.load()` 在载入存档**前后**各 `resetRandom()` 一次（`engine-harness.js:45, 7`），保证每次差分从同一随机相位出发。原版与重构版加载的是**同一个 harness**（`engine-harness.html?original` 仅切换引擎脚本，见 `docs/baseline.md`），因此两端面对的是逐字节相同的 Math.random 序列。

### 3.3 消费顺序为什么不能变

`Math.random` 被替换后是**单一全局共享流**：两端在同一次差分运行中，第 N 次 `Math.random()` 调用拿到的是 LCG 序列的第 N 个值。因此：

1. **任何一处调用顺序的变化都会使整条流错位。** 把某个掉落掷点提前/延后、增删一次调用、或把两个系统内的调用交错顺序对调，都会让后续所有系统的随机取值整体偏移——差分会在几百回合内分叉，而分叉点远晚于改动点，极难定位。
2. **"纯表现层"的随机调用也不能删。** 浮动文字偏移、闲聊文案等虽然不影响玩法语义，但它们消耗全局流；删掉它们等于把后面所有玩法掷点前移（facts.md 第 1 条的警告在消费侧同样成立）。
3. **SeededRandom 各实例同理。** 每个种子实例（如 `DungeonLevel.wa`）是一条独立流，实例内部的调用顺序（如 `world/rooms.js:155` 中 `b.wa.random()` 与多次 `randomIntFrom(b.wa, ...)` 的交错）同样不可改变，否则重建的地牢布局即与原版不同。

推论：重构时只能**重命名**随机调用，不能重排、不能合并、不能"顺手优化"掉任何一次掷点。

## 4. 消费者清单（src/engine，按系统分组）

路径均相对仓库根。标 [S] 的行消费 SeededRandom 实例，标 [M] 的行消费全局 Math.random（含经 `randomInt`/`randomizeScaledValue` 的间接消费）。

### 4.1 世界与地牢生成（确定性，种子驱动）

| 位置 | 内容 |
|---|---|
| `src/engine/modules/core/math.js:5,21,24,125` [S] | SeededRandom 构造器、randomIntFrom、SimplexNoise 构造器、prototype.random |
| `src/engine/modules/world/terrain.js:10,13` [S] | SimplexNoise 实例与地形种子流 |
| `src/engine/modules/world/initialization.js:43,66-82` [S] | 种子 11：区域/城堡布置 |
| `src/engine/modules/world/initialization.js:135,157-168` [S] | 种子 1：世界地块地牢入口 |
| `src/engine/modules/world/generation.js:39-63,137,151,169,256-271,326-327,468-502` [S] | 地牢房间、走廊、入口/出口选点 |
| `src/engine/modules/world/rooms.js:21,155-179` [S] | 房间对象（宝箱/架/柜）放置 |
| `src/engine/modules/world/regions.js:25-54` [S] | 区域名内容选取 |
| `src/engine/modules/world/dungeons.js:35` [S] | 地牢名（`randomIntFrom(a, 11)`） |

### 4.2 战斗判定（全局流）

| 位置 | 内容 |
|---|---|
| `src/engine/modules/combat/actions.js:305` [M] | 近战伤害浮动 `1 + randomInt(d-1)` |
| `src/engine/modules/combat/actions.js:174-182` [M] | 多重/连锁/附加攻击触发概率 |
| `src/engine/modules/combat/actions.js:423` [M] | `performMultiAttack` 的额外攻击次数判定 |
| `src/engine/modules/combat/actions.js:540-543` [M] | AOE 目标偏移 `randomInt(40)` 与 0.5 方向 |
| `src/engine/modules/combat/actions.js:587,590,594` [M] | 命中 `> f/(f+h)`、暴击、护甲减伤浮动 |
| `src/engine/modules/combat/actions.js:602,606` [M] | 法术暴击与减伤浮动 |
| `src/engine/modules/characters/stats.js:107` [M] | 技能触发 `Math.random() < a` |
| `src/engine/modules/characters/stats.js:102-114` [M] | 连击数 `Ir()` 逐段 `Math.random()` |
| `src/engine/modules/combat/encounters.js:44` [M] | boss 遭遇药水效果（`0.2 > Math.random()`） |
| `src/engine/modules/combat/encounters.js:151-155` [M] | 城堡守卫分组（0.5）与选型 |
| `src/engine/modules/combat/encounters.js:298` [M] | 怪物名前/后缀模式 |
| `src/engine/modules/simulation/tick.js:416` [M] | 地面伤害效果掷点 `randomInt(sc+1)` |

### 4.3 目标与移动（全局流，含表现层）

| 位置 | 内容 |
|---|---|
| `src/engine/modules/ai/targeting.js:144-149` [M] | 随机友方目标选取 |
| `src/engine/modules/ai/targeting.js:164-176` [M] | 目标点抖动（半格内 + 0.5 方向） |
| `src/engine/modules/ai/targeting.js:350` [M] | 追踪特效目标点 |
| `src/engine/modules/ai/behaviors.js:316` [M] | 游走目标位置 |
| `src/engine/modules/ai/behaviors.js:410` [M] | 跟随行为偏移 `randomInt(3)` |
| `src/engine/modules/ai/behaviors.js:497` [M] | 闲逛目标 `Math.random()` 坐标 |
| `src/engine/modules/ai/behaviors.js:587,706` [M] | 闲聊文案 `randomInt(8)` |
| `src/engine/modules/characters/movement.js:108,125,143,174` [M] | 闲逛目标向量 `Wc` |
| `src/engine/modules/characters/character.js:935` [M] | 技能升级选项随机抽取 |
| `src/engine/modules/characters/character.js:631` [M] | 范围地砖效果 0.5 概率铺撒 |

### 4.4 掉落、宝箱与经济（全局流）

| 位置 | 内容 |
|---|---|
| `src/engine/modules/content/balance.js:8-13` [M] | `rollGoldDrop`：金币区间 `a + randomInt(b)` |
| `src/engine/modules/simulation/characters.js:298-309` [M] | 金币掉落判定（升级项 `Lr`） |
| `src/engine/modules/simulation/characters.js:309-316` [M] | 卷轴掉落判定（`$s`） |
| `src/engine/modules/simulation/characters.js:315-316` [M] | 药水掉落判定（`Ns`，`100*Math.random()`） |
| `src/engine/modules/simulation/characters.js:320-326` [M] | 物品掉落判定（`itemDropChance`） |
| `src/engine/modules/simulation/characters.js:332` [M] | 死亡闲聊 0.15 概率 |
| `src/engine/modules/combat/actions.js:372-398` [M] | 击杀奖励爆发（金 10+rand10 / 物 7+rand8 / 卷 2+rand5 / 药 rand2） |
| `src/engine/modules/characters/character.js:1079-1120` [M] | 宝箱开箱奖励（金/物/卷/药四分支） |
| `src/engine/modules/loot/items.js:148,273-275` [M] | 物品类型槽位选取、随机持有者 |
| `src/engine/modules/loot/items.js:167-173` [M] | 属性/金币 ±10% 浮动、武器特效触发与强度 |
| `src/engine/modules/loot/items.js:226-230,333` [M] | 物品等级 ±1 浮动、质量掷点 |
| `src/engine/modules/loot/item-names.js:59-120` [M] | 物品名前/后缀/称号组合 |
| `src/engine/modules/loot/treasure.js:62-67,121-127` [M] | 宝箱生成概率、朝向、格位 |

### 4.5 生成位置散布与视图（全局流）

| 位置 | 内容 |
|---|---|
| `src/engine/modules/simulation/characters.js:63-64,124-125,243,253` [M] | 角色/掉落物生成散布 `tickCharacterTurn`/`updateCharacterFrames` |
| `src/engine/modules/simulation/characters.js:187,201` [M] | 旅行尸体 sprite（`randomInt(3)`）与地牢闲聊（`randomInt(16)`） |
| `src/engine/modules/rendering/floating-text.js:11-13,49` [M] | 浮动文字偏移与方向 |
| `src/engine/modules/rendering/scene.js:231-232` [M] | 闪电折线偏移 |
| `src/engine/modules/world/dungeons.js:184` [M] | 商店 sprite `randomShopSprite` |
| `src/engine/modules/views/results.js:103` [M] | 结算画面随机怪物 sprite |
| `src/engine/modules/views/upgrade-details.js:1235` [M] | 升级详情示例选取 |
| `src/engine/modules/core/math.js:29-31,56-60` [M] | randomInt 与 randomizeScaledValue 本体 |
