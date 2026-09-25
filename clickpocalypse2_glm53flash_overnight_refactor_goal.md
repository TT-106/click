# /goal — Clickpocalypse II 全量语义恢复、现代化重构与长期可维护化

> **执行环境假设**：ZCode + GLM-5.3-Flash，使用可用的最高思考档位。  
> **资源策略**：token 按无限处理；允许并鼓励大量使用子智能体、所有可用 Skill、代码搜索、AST、浏览器、测试、性能分析、Git、脚本生成等工具。  
> **工作时长策略**：这是一个长程执行任务。不要因为“已经做了不少工作”“已经给出方案”“已经完成几个模块”而主动停止。只要执行环境仍允许继续，就持续推进、验证、集成、测试和清理。目标是让本次执行可以稳定工作一整夜甚至更久，而不是 30 分钟到 2 小时后提前总结收尾。

---

# 0. 唯一最终目标

你正在接手一个完整的老式浏览器游戏项目 **Clickpocalypse II**。该项目核心 JavaScript 代码体量大，存在大量高度压缩/高混淆的变量名、函数名、原型方法与强耦合全局状态，同时包含游戏模拟、Canvas 渲染、DOM UI、角色、怪物、战斗、地牢、掉落、装备、技能、药水、卷轴、升级、成就、统计、城堡、农场、离线收益、存档、随机数等大量系统。

你的唯一最终目标不是“把代码格式化一下”，也不是“重写一个类似的游戏”，而是：

> **在尽可能保持原始 Clickpocalypse II 行为、数值、随机性、存档、UI、资源和玩法兼容的前提下，对整个代码库进行系统性的语义恢复、去混淆、架构重构、模块拆分、类型恢复、自动化测试建设、性能优化和工程现代化，使其从一个难以理解和维护的遗留项目，变成一个结构清晰、可验证、可持续维护和继续开发的现代代码库。**

最终必须同时满足：

1. 游戏仍然是原来的 Clickpocalypse II，而不是“模仿版”。
2. 原版核心玩法与数值关系不得无证据改变。
3. 原版存档应尽可能继续兼容。
4. 原版随机行为、时间行为、离线处理等不能被随意破坏。
5. 大量混淆符号应被恢复成语义明确的名称。
6. 单体脚本应逐步拆成真实有边界的模块。
7. 核心领域对象应具有明确类型与职责。
8. 核心逻辑应拥有自动化测试与差分验证。
9. 新开发者不需要重新逆向 `c2.js` 才能继续维护。
10. 所有重大重构必须有证据、有测试、有回滚点。

---

# 1. 这不是普通重构：把它当作“软件考古 + 逆向工程 + 行为保持式重写”

请把整个任务理解为以下工作的组合：

- Legacy code archaeology
- Source-level reverse engineering
- Semantic deobfuscation
- Program comprehension
- Call graph / data-flow analysis
- Runtime instrumentation
- Differential testing
- Characterization testing
- Domain modeling
- Architecture recovery
- Strangler-style incremental migration
- Type recovery
- Persistence compatibility engineering
- Deterministic simulation validation
- Performance profiling and optimization
- Documentation reconstruction

绝对禁止把任务简化为：

- Prettier 一遍；
- `var` 换 `let/const`；
- 把文件机械拆开；
- 给函数随便起几个看起来合理的名字；
- 套一层 React/Vue；
- 用 TypeScript 包住旧代码但大量 `any`；
- 把原逻辑删掉重写一个“差不多”的 Idle RPG；
- 只写一堆分析文档但不真正修改项目；
- 只修改 CSS/UI 就宣布“现代化完成”。

如果你这样做，任务视为失败。

---

# 2. 仓库认知：必须把所有文件都当作逆向证据

完整扫描仓库，不要只盯着 `c2.js`。

重点文件包括但不限于：

```text
c2.js
c2-ver=20150918.js
c2.css
c2-ver=20150726.css
index.html
index2.html
chs.js
c2c.user.js
README.md
README-js.md
images/
spritesheet/
```

其中需要特别对待：

## 2.1 `c2.js`

这是当前核心实现，是最重要的 executable specification。

不要假设短变量名等于“无意义”。每一个短变量名都可能隐藏真实领域概念、全局状态、枚举、构造器、缓存、事件、渲染对象或序列化字段。

## 2.2 `c2-ver=20150918.js`

这是重要历史版本。

必须把它作为：

- 结构对齐样本；
- 函数演化样本；
- 常量演化样本；
- 行为差分样本；
- 符号语义交叉证据。

不要仅做文本 `diff`。

优先做：

- AST 级函数匹配；
- 函数体结构哈希；
- 常量序列匹配；
- 字符串引用匹配；
- 属性访问模式匹配；
- caller/callee 关系匹配；
- 控制流轮廓匹配。

## 2.3 `index.html` / `index2.html`

HTML 中的 DOM ID、class、面板层级、按钮命名、角色槽位、升级区域、背包区域等是极高价值语义锚点。

利用它们反向恢复：

- UI controller；
- state → view 映射；
- 用户交互入口；
- 游戏标签页；
- 角色 UI；
- 怪物 UI；
- 药水/卷轴 UI；
- 统计/升级等系统。

## 2.4 `chs.js`

这是自然语言语义数据库。

利用其中英文/中文对应关系恢复：

- 名词；
- 技能；
- 属性；
- 怪物；
- 状态；
- 道具；
- 升级；
- 统计项；
- UI 文案。

## 2.5 `c2c.user.js`

这是一个“站在游戏外部观察游戏”的自动化脚本，非常有价值。

它能暴露：

- 哪些 DOM 元素代表什么；
- 什么状态属于战斗；
- 普通 encounter / boss encounter / difficult encounter 的外部表现；
- 药水使用逻辑；
- 卷轴使用逻辑；
- AP 升级逻辑；
- 技能升级入口；
- 角色状态与按钮行为。

它不是核心实现，但它是业务语义证据。

## 2.6 spritesheet

建立资源索引工具，理解：

- `items.png`
- `monsters.png`
- `terrain.png`
- `SpellFX*`
- `DamageFX.png`

代码中的 sprite 坐标、索引、帧数和资源访问，都可辅助恢复实体与效果含义。

---

# 3. 夜间自治执行协议 —— 这是本提示词的核心

本任务必须设计成可以持续工作一整夜，而不是快速给出“阶段性成果”后停止。

## 3.1 不要主动提前结束

只要还存在以下任意情况，就不能认为任务完成：

- 仍有大量核心符号未知；
- 核心模块还耦合在 `c2.js`；
- 仍有核心玩法没有测试；
- 存档兼容未验证；
- RNG 未确认；
- offline processing 未确认；
- 关键时间逻辑未确认；
- 领域对象还大量使用无语义短名；
- 现代模块只是空壳，实际逻辑仍在旧文件；
- 性能优化没有 baseline；
- 重构版无法完整启动；
- 游戏只能进入开局，无法验证中后期；
- 文档和代码相互矛盾；
- 重构后存在明显功能缺失；
- 旧代码被大量注释掉但没有真正迁移；
- 测试无法证明新旧行为一致。

## 3.2 不要每完成一点就问用户“是否继续”

不要输出：

- “第一阶段完成，要不要继续？”
- “我建议下一步做 X，是否执行？”
- “任务较大，建议分几天完成。”

除非遇到真正无法从代码、历史版本、运行行为、资源、文档中推断的**产品决策冲突**，否则自行决定并继续。

## 3.3 使用完整可用执行预算

如果环境允许长时间运行：

- 持续分析；
- 持续派发子任务；
- 持续合并；
- 持续测试；
- 持续修复；
- 持续补文档；
- 持续减少未知符号；
- 持续提高测试覆盖；
- 持续清理旧架构债务。

目标不是“至少输出多少文字”，而是**让代码库本身持续发生可验证的改善**。

## 3.4 如果环境出现运行时限/上下文压缩/任务中断风险

立即维护一个机器和人都能读懂的：

```text
docs/WORKSTATE.md
```

至少包含：

```text
Current milestone
Current branch / commit
Current runnable state
Tests passing
Tests failing
Recently confirmed symbols
Recently migrated modules
Unresolved high-risk symbols
Known behavioral divergences
Active subagent work
Next 10 concrete actions
Commands needed to resume
Files that must not be reverted
```

任何长时间任务都必须做到：

> 即使上下文被压缩，下一轮也能从 `WORKSTATE.md` 无损续接。

## 3.5 工作循环

持续执行以下闭环，不要只跑一次：

```text
OBSERVE
  ↓
ANALYZE
  ↓
FORM HYPOTHESIS
  ↓
COLLECT EVIDENCE
  ↓
TEST HYPOTHESIS
  ↓
REFACTOR SMALL SLICE
  ↓
RUN DIFFERENTIAL TEST
  ↓
RUN REGRESSION TEST
  ↓
COMMIT / CHECKPOINT
  ↓
UPDATE FACT DATABASE
  ↓
SELECT NEXT HIGHEST-VALUE SLICE
  ↓
REPEAT
```

---

# 4. 子智能体使用策略：大量使用，但不允许失控

你可以并且应该使用大量子智能体，但不要简单地“10 个 Agent 每人读一点然后把结果堆回来”。

必须采用主智能体 + 专业队列模式。

主智能体负责：

- 唯一事实源；
- 架构决策；
- 证据裁决；
- merge；
- regression；
- 风险控制；
- 下一波任务调度。

建议至少建立如下角色：

## Agent A — Bootstrap / Lifecycle Archaeologist

负责：

- 入口；
- 全局变量；
- `window.Game`；
- 初始化顺序；
- main loop；
- pause；
- foreground/background；
- shutdown/reset/prestige。

## Agent B — Persistence / Save / Migration

负责：

- Save；
- Load；
- Import；
- Export；
- localStorage；
- 编码/压缩；
- 版本字段；
- schema inference；
- migration；
- legacy fixtures。

## Agent C — RNG / Time / Offline Simulation

负责：

- PRNG；
- seed；
- RNG state；
- random consumers；
- fixed tick；
- frame timing；
- wall clock；
- offline processing；
- speed modifiers。

## Agent D — Combat / Character / Monster

负责：

- Adventurer；
- Character class；
- Monster；
- HP；
- damage；
- attack；
- defense；
- crit；
- stun；
- death；
- encounter；
- boss；
- skills；
- spells；
- buffs/debuffs。

## Agent E — Items / Loot / Economy

负责：

- items；
- equipment；
- rarity；
- item level；
- loot；
- gold；
- sell；
- inventory；
- treasure；
- drop tables。

## Agent F — Dungeon / World / Castle / Farm

负责：

- dungeon generation；
- room graph；
- navigation；
- encounter placement；
- castle；
- farm；
- world state；
- progression。

## Agent G — Scroll / Potion / Upgrade / Achievement

负责：

- scroll；
- potion；
- AP；
- point upgrades；
- achievement；
- statistics；
- prestige-linked upgrades。

## Agent H — Renderer / Sprite / Animation

负责：

- Canvas；
- sprites；
- terrain；
- animation；
- effects；
- camera；
- clipping；
- z-order；
- draw calls。

## Agent I — DOM / UI / Input

负责：

- DOM contract；
- tabs；
- buttons；
- character panel；
- monster panel；
- tooltips；
- keyboard/mouse；
- UI refresh。

## Agent J — Static Analysis Infrastructure

负责：

- AST parser；
- symbol index；
- call graph；
- property read/write graph；
- CFG；
- function similarity；
- historical matching。

## Agent K — Test / Differential Harness

负责：

- characterization tests；
- replay；
- reference runner；
- state snapshot；
- divergence detector；
- visual smoke tests。

## Agent L — Performance

负责：

- CPU profile；
- frame time；
- GC；
- allocations；
- DOM mutations；
- Canvas draws；
- load/save time；
- offline calculation performance。

### 子智能体硬规则

所有 Agent 必须共享统一事实库：

```text
docs/reverse-engineering/symbol-map.json
docs/reverse-engineering/facts.md
docs/architecture.md
docs/WORKSTATE.md
```

禁止出现各自发明不同命名的情况。

如果两个 Agent 对同一符号判断冲突：

1. 标记 conflict；
2. 收集双方证据；
3. 运行插桩/测试；
4. 主智能体裁决；
5. 再进入 rename。

### 子智能体波次调度

第一波：广泛侦察。  
第二波：针对高价值未知点。  
第三波：具体模块迁移。  
第四波：差分与回归。  
第五波：性能和清理。  
第六波：遗漏扫描。  

当某个 Agent 结束后，不要让资源闲置。自动派发新的未完成高价值任务。

---

# 5. Git 与安全工作纪律

在任何大规模修改前：

1. 确认 Git 状态。
2. 保存 baseline commit / tag。
3. 不覆盖用户已有未提交改动。
4. 不使用危险的全仓库自动替换，除非有 AST 证明和回归测试。
5. 每个阶段保留可回滚 checkpoint。

建议：

```text
baseline/original-runnable
re/recovery
refactor/core
refactor/domain-*
refactor/ui
perf/*
```

但不要为了分支而分支；以环境实际工作流为准。

提交信息必须说明真实变化，例如：

```text
re: identify save pipeline and add legacy fixtures
refactor: extract deterministic RNG service
refactor: migrate combat damage calculation
refactor: split dungeon generation from rendering
perf: cache sprite lookup table after profiling
```

禁止：

```text
update
fix stuff
refactor code
```

这种无意义提交。

---

# 6. Phase 0：冻结原始行为基线 —— 在这之前不要大规模重构

首先确保原始游戏可以运行。

记录：

- 如何启动；
- 需要什么本地服务器；
- script 加载顺序；
- 页面初始化顺序；
- Canvas 创建；
- DOM 创建；
- `window.Game` 何时出现；
- 新游戏如何开始；
- 游戏如何进入主循环；
- 保存与加载如何触发；
- 自动保存周期；
- pause 如何工作；
- tab 切换如何工作。

创建：

```text
docs/baseline.md
docs/runtime-entrypoints.md
```

建立最小 smoke test：

```text
page loads
no fatal console error
new game can be created
main game tab opens
game advances
save can be produced
save can be loaded
```

如果原始项目本身因现代浏览器兼容问题无法运行：

只做最小兼容补丁；

不要借机修改业务逻辑。

---

# 7. 自动静态分析基础设施

不要人工从第 1 行读到第 46980 行。

建立 `tools/analyze/`。

至少生成：

```text
artifacts/functions.json
artifacts/constructors.json
artifacts/prototypes.json
artifacts/callgraph.json
artifacts/reverse-callgraph.json
artifacts/property-reads.json
artifacts/property-writes.json
artifacts/global-symbols.json
artifacts/string-references.json
artifacts/dom-references.json
artifacts/asset-references.json
artifacts/historical-function-matches.json
```

## 7.1 AST symbol inventory

对每个函数记录：

```text
source location
name
syntactic form
parameter count
statement count
cyclomatic complexity
literal strings
numeric constants
properties read
properties written
globals read
globals written
callers
callees
prototype owner
DOM ids referenced
assets referenced
```

## 7.2 函数指纹

给函数建立多种 fingerprint：

- normalized AST hash；
- token shape；
- constants signature；
- property access signature；
- call signature；
- CFG shape。

用于当前版本和历史版本匹配。

## 7.3 聚类

按以下特征聚类：

- mutual calls；
- shared state；
- shared DOM refs；
- shared assets；
- shared strings；
- temporal runtime co-occurrence。

输出初步 domain clusters。

这不是最终架构，只是逆向辅助。

---

# 8. 语义恢复数据库

创建并持续维护：

```text
docs/reverse-engineering/symbol-map.json
```

每个重要符号至少记录：

```json
{
  "original": "Ic",
  "semanticName": "...",
  "kind": "function | constructor | field | global | enum | constant",
  "source": "c2.js:...",
  "moduleCandidate": "...",
  "callers": [],
  "callees": [],
  "reads": [],
  "writes": [],
  "domRefs": [],
  "stringRefs": [],
  "assetRefs": [],
  "historicalMatch": null,
  "runtimeEvidence": [],
  "saveEvidence": [],
  "hypothesesRejected": [],
  "confidence": "HIGH | MEDIUM | LOW",
  "notes": ""
}
```

## 8.1 HIGH

至少有多种独立证据互相支持。

## 8.2 MEDIUM

大部分证据一致，但缺少关键运行验证。

## 8.3 LOW

主要来自结构推测。

### Rename Rule

- HIGH：允许进入生产代码语义 rename。
- MEDIUM：通常先保留 alias / 注释或局部名称，继续取证。
- LOW：禁止全局重命名。

不要把“模型觉得像”当证据。

---

# 9. 多证据语义推断顺序

遇到未知符号，按以下证据链逐步求解：

```text
local syntax
↓
data flow
↓
property read/write pattern
↓
call graph
↓
DOM references
↓
strings / chs.js
↓
sprite/assets
↓
historical version
↓
save participation
↓
runtime instrumentation
↓
controlled experiment
↓
differential replay
```

不要因为一个字符串就立刻定名。

不要因为某个函数被某个怪物代码调用就立即把它叫 `MonsterManager`。

名称必须和真实职责匹配。

---

# 10. 运行时插桩系统

静态分析不足时，建立可开关的 debug instrumentation。

可以记录：

```text
function id
semantic candidate
timestamp/tick
arguments
return value
caller
state reads
state writes
object creations
DOM writes
RNG calls
```

必须可关闭，不能永久拖慢正式版本。

创建：

```text
tools/runtime-trace/
```

并避免日志爆炸：

- sampling；
- filter；
- whitelist；
- aggregation；
- event counters。

对高频函数优先统计行为，不要每帧全部打印。

---

# 11. GameState 完整恢复

重点追踪最终暴露到全局的 Game 对象及相关状态。

必须回答：

- Game 的真实构造入口；
- 哪些对象是 singleton；
- party 在哪里；
- adventurer 在哪里；
- monsters 在哪里；
- current encounter 在哪里；
- dungeon 在哪里；
- current room 在哪里；
- inventory 在哪里；
- gold / XP / kills / AP 在哪里；
- scroll/potion 在哪里；
- upgrade 在哪里；
- achievement/statistics 在哪里；
- castle/farm 在哪里；
- RNG state 在哪里；
- offline timestamp 在哪里；
- UI cache 在哪里；
- animation state 在哪里。

输出：

```text
docs/game-state-schema.md
```

要求它不仅描述“有哪些字段”，还要描述：

```text
ownership
lifecycle
persistence
mutation points
invariants
derived values
runtime-only cache
serialization behavior
```

---

# 12. 存档系统：最高风险区域之一

把 save pipeline 当成独立项目逆向。

完整追踪：

```text
GameState
→ serialization
→ encoding/compression
→ storage/export
```

以及：

```text
storage/import
→ decoding
→ validation
→ migration
→ reconstruction
→ GameState
```

必须确认：

- localStorage key；
- save version；
- 自动保存；
- 手动保存；
- export/import；
- offline timestamp；
- RNG 是否持久化；
- 哪些 transient state 不保存；
- 构造器如何恢复；
- 老版本兼容；
- 异常存档如何处理。

创建真实 fixtures：

```text
tests/fixtures/saves/new-game.*
tests/fixtures/saves/early-game.*
tests/fixtures/saves/mid-game.*
tests/fixtures/saves/combat.*
tests/fixtures/saves/items.*
tests/fixtures/saves/potions-scrolls.*
tests/fixtures/saves/dungeon.*
tests/fixtures/saves/castle-farm.*
tests/fixtures/saves/prestige.*
```

不要在没有迁移方案的情况下修改持久化 schema。

如果现代化结构和原 save schema 不一致，可以使用：

```text
legacy codec
↕
modern domain state
```

通过 adapter 保持兼容，而不是粗暴丢弃旧格式。

---

# 13. RNG：不可随便动

必须找出所有随机源。

确认：

- 自定义 PRNG 或原生随机；
- seed；
- state；
- 消费顺序；
- 地牢生成；
- 怪物生成；
- 掉落；
- item rarity；
- encounter；
- treasure；
- castle/world generation。

最危险的错误之一是：

> 数学分布没变，但调用 RNG 的顺序变了，导致之后整个游戏轨迹不同。

因此建立：

```text
RNG call trace
```

在 deterministic scenario 中比较：

```text
seed
call count
consumer
result
```

不要未经验证改为 `Math.random()`。

也不要因为现代 RNG “更好”就替换算法。

---

# 14. 时间、60Hz、暂停与离线模拟

完整区分：

- wall clock；
- simulation tick；
- render frame；
- fixed timestep；
- animation time；
- cooldown time；
- effect duration；
- offline elapsed time；
- speed multiplier。

如果旧实现暗含 60Hz 假设，不允许直接改成普通 `deltaTime` 然后认为更现代。

需要验证：

- attack speed；
- walking speed；
- regen；
- DoT；
- stun duration；
- spell cooldown；
- potion duration；
- scroll behavior；
- farming；
- offline gains。

如果改为 fixed timestep + decoupled render，必须通过差分测试证明宏观行为不变。

---

# 15. Characterization Test：先记录原版“实际上做什么”

在大规模重构前建立 characterization tests。

不要一开始根据“游戏应该怎么设计”写测试。

测试应以原版可观察行为为准。

至少覆盖：

## 15.1 Bootstrap

- 页面启动；
- 新游戏；
- 初始状态；
- tab；
- pause。

## 15.2 Character

- 创建角色；
- 等级；
- XP；
- HP；
- 属性；
- 技能；
- 装备；
- 死亡/恢复。

## 15.3 Combat

- 普攻；
- damage；
- miss；
- crit；
- stun；
- skill；
- spell；
- buff；
- debuff；
- monster death；
- party death；
- encounter completion。

## 15.4 Loot

- gold drop；
- item drop；
- rarity；
- scroll；
- potion；
- treasure chest；
- inventory change。

## 15.5 Dungeon

- generation；
- room transition；
- path selection；
- encounter；
- boss；
- clear condition。

## 15.6 Progression

- XP；
- upgrades；
- AP；
- character skill；
- monster upgrades；
- achievements；
- statistics；
- prestige/reset。

## 15.7 Persistence

- save/load roundtrip；
- legacy save；
- import/export；
- offline resume。

---

# 16. Differential Runner —— 最重要的正确性武器

创建：

```text
tools/differential-runner/
```

目标：

同一个 scenario 同时驱动：

```text
Original Runtime
Refactored Runtime
```

提供完全一致：

```text
initial save
seed / RNG stream
time stream
input actions
```

然后每 N ticks 比较 normalized state。

至少比较：

```text
party
HP
XP
levels
monster states
encounter
room
dungeon
gold
kills
items
equipment
scrolls
potions
upgrades
statistics
achievements
RNG state/call position
```

任何 divergence 都应报告：

```text
first divergent tick
first divergent field
original value
refactored value
recent inputs
recent RNG calls
related stack / module
```

不要等到最后状态不同才说“似乎有 bug”。

要定位**第一次分叉**。

---

# 17. Replay 系统

建立输入记录格式：

```json
[
  {"tick":100,"action":"open_tab","target":"character0"},
  {"tick":140,"action":"use_scroll","index":2},
  {"tick":210,"action":"equip","itemId":"..."}
]
```

可以：

- record original；
- replay original；
- replay refactored；
- compare snapshots。

Replay 必须尽量剥离真实人工操作依赖。

---

# 18. 架构恢复之后再设计现代架构

不要一开始凭模板决定架构。

先恢复真实 domain boundaries，然后设计目标结构。

可以参考：

```text
src/
  app/
    bootstrap/
    lifecycle/

  core/
    time/
    rng/
    events/
    math/

  domain/
    game/
    party/
    characters/
    combat/
    monsters/
    dungeon/
    world/
    items/
    skills/
    effects/
    potions/
    scrolls/
    progression/
    achievements/
    statistics/
    economy/
    castle/
    farming/

  persistence/
    save/
    codecs/
    migrations/
    storage/

  rendering/
    canvas/
    sprites/
    effects/
    camera/

  ui/
    dom/
    tabs/
    panels/
    controls/

  data/
    monsters/
    items/
    skills/
    upgrades/
    sprites/

  legacy/
    adapters/
```

但如果证据说明真实边界不同，应调整。

架构目标是：

```text
Domain simulation
    ↓ emits/returns state
Presentation adapters
    ↓
Canvas + DOM
```

而不是让 DOM 到处直接修改游戏内核。

---

# 19. 使用“绞杀者模式”迁移，而不是 Big Bang Rewrite

不要把 `c2.js` 删掉，然后花几小时写一个新游戏。

采用 incremental extraction：

```text
Legacy system
   ↓ introduce seam
Adapter / Facade
   ↓
Modern module
```

一次迁移一个可验证 vertical slice。

例如：

```text
RNG
→ Save Codec
→ Game Clock
→ Static Data
→ Inventory
→ Item calculations
→ Combat damage
→ Effects
→ Dungeon generation
→ Rendering helpers
...
```

每迁移一个 slice：

1. 原版 characterization test 通过；
2. 新模块单元测试通过；
3. differential test 通过；
4. 集成运行通过；
5. 再删除旧实现。

没有测试保护时，不要批量删除旧代码。

---

# 20. 命名恢复规则

最终代码应消灭核心路径上的高混淆命名。

但不要机械把所有 `a` 改成一个猜测名称。

优先顺序：

## Tier 1 — Public/Core

- constructors；
- managers/services；
- persistent fields；
- GameState；
- domain APIs。

必须高置信度。

## Tier 2 — Module internal

- calculation helpers；
- entity fields；
- domain predicates。

## Tier 3 — Local algorithm variables

最后处理。

推荐名称表达业务意义，例如：

```text
currentEncounter
adventurers
monsterDefinitions
itemDropChance
activePotionEffects
offlineElapsedMs
rngState
```

而不是：

```text
thing
handler2
dataManager
processStuff
util
helperA
```

“长名字”不等于“好名字”。

---

# 21. 类型恢复

先恢复语义，再迁移类型。

允许：

- JSDoc；
- TypeScript declaration；
- 渐进 TypeScript；
- schema validators。

不要一开始把全部 JS 改 `.ts` 然后塞满：

```ts
any
unknown as Foo
Record<string, any>
```

这属于伪现代化。

优先建立真实 domain types：

```text
GameState
Party
Adventurer
CharacterClass
Monster
Encounter
Dungeon
Room
ItemDefinition
ItemInstance
Equipment
Skill
Spell
StatusEffect
Potion
Scroll
Upgrade
Achievement
Statistic
SaveData
RngState
```

明确区分：

```text
Definition
Instance
RuntimeState
PersistentState
DerivedViewModel
```

---

# 22. 静态数据抽离

识别硬编码在主文件中的：

- monster definitions；
- item definitions；
- skill definitions；
- potion definitions；
- scroll definitions；
- upgrade tables；
- sprite metadata；
- balance constants；
- textual metadata。

抽离到 `src/data/` 时必须保持：

- 数值；
- 顺序；
- index；
- ID；
- default values；
- RNG consumption order。

特别警惕：

> 看似只是数组顺序，实际上索引参与 save 或 sprite lookup。

如果索引具有持久化意义，不要随便重新排序。

---

# 23. Combat 迁移规范

战斗系统必须建立公式文档：

```text
docs/formulas/combat.md
```

记录：

- damage；
- defense；
- attack rate；
- crit；
- miss；
- status；
- stun；
- skill scaling；
- spell cost；
- healing；
- target selection；
- encounter completion。

所有公式来自代码证据，而不是设计常识。

对公式建立 table-driven tests。

对浮点运算要注意：

- 运算顺序；
- rounding；
- floor/ceil；
- integer coercion；
- bitwise coercion。

现代化后不要因为“数学等价”就随便改变 JavaScript 运算顺序，因为浮点结果可能不同。

---

# 24. Dungeon / World 迁移规范

完整恢复：

- room data structure；
- graph/topology；
- procedural generation；
- tile mapping；
- encounter placement；
- treasure placement；
- boss placement；
- exploration；
- path/movement；
- room clear；
- dungeon completion。

为生成器建立：

```text
seeded snapshot tests
invariant tests
```

检查：

- 不可达房间；
- 非法边；
- 越界坐标；
- boss/treasure 规则；
- same seed stability。

---

# 25. Item / Equipment 迁移规范

区分：

```text
ItemDefinition
ItemRoll
ItemInstance
EquippedItem
InventoryEntry
```

确认：

- level；
- rarity；
- affix/stat；
- equip restrictions；
- comparison；
- sell value；
- auto equip behavior；
- inventory cap；
- drop generation。

不要把“显示出来的最终值”和“存储的基础值”混在一起。

---

# 26. Potion / Scroll / Effect 系统

这些系统特别容易因为时间和状态逻辑而回归。

恢复：

- effect id；
- activation condition；
- duration；
- stacking；
- mutual exclusion；
- charges/count；
- auto fire；
- infinite behavior；
- encounter dependency；
- boss immunity；
- UI state。

使用 `c2c.user.js` 作为额外行为证据，但以核心游戏实现为最终事实来源。

---

# 27. UI / DOM 现代化

不要把 UI 重写成“更漂亮”的新设计。

当前目标是维护性，而不是 redesign。

先保持：

- 原布局；
- 原交互；
- 原 DOM 契约；
- 原 CSS 表现；
- 原按钮状态；
- 原 tab；
- 原 tooltip；
- 原 sprite。

然后逐步将：

```text
state mutation
DOM manipulation
```

解耦成：

```text
Domain action
→ state change
→ view update
```

如果引入现代 UI 框架会显著增加行为漂移风险，就暂时不要引入。

“现代化”不等于“必须 React”。

---

# 28. Canvas Renderer 现代化

建立明确 renderer 边界。

区分：

- simulation update；
- animation state；
- render state；
- sprite lookup；
- draw ordering；
- camera；
- FX；
- UI overlay。

禁止 renderer 随意修改 domain state。

如果旧代码确实依赖 render 时机触发模拟逻辑：

先记录并写 characterization test，之后再安全解耦。

---

# 29. 性能优化：必须由数据驱动

在优化前生成：

```text
docs/performance-baseline.md
```

测试至少包含：

- idle；
- 普通战斗；
- 大量怪物；
- spell FX；
- 大 inventory；
- dungeon transition；
- save；
- load；
- offline resume。

记录：

```text
average frame time
P95 frame time
P99 frame time
long tasks
CPU hotspots
allocation rate
GC pauses
DOM mutations
layout/style recalc
Canvas draw calls
save duration
load duration
offline calculation duration
memory growth
```

然后优化真正热点。

可能的热点包括但不限于：

- 每帧创建临时对象；
- 高频 `Array.filter/map/reduce`；
- 重复全表扫描；
- 重复 DOM query；
- 重复 layout read/write；
- sprite lookup 线性搜索；
- 高频字符串构造；
- Canvas state change；
- 每帧无意义 UI refresh；
- 重复排序；
- 过度计时器；
- 大量闭包分配。

每项性能提交必须写：

```text
hypothesis
baseline
change
new measurement
behavioral validation
```

没有数据，不允许声称性能提升。

---

# 30. 自动生成“逆向价值排行榜”

不要平均分配时间给所有未知符号。

给未知符号计算优先级，可综合：

```text
call centrality
write centrality
save participation
RNG participation
runtime frequency
module fan-out
DOM exposure
complexity
```

例如：

```text
ReverseEngineeringValue =
  3*saveImpact +
  3*rngImpact +
  2*stateWriteCentrality +
  callCentrality +
  runtimeFrequency +
  complexity
```

具体权重可以调整。

持续优先攻克高价值未知点。

---

# 31. Runtime Inspector

如果环境允许，建立开发调试面板或独立工具：

```text
Game
├─ Party
├─ Characters
├─ Encounter
├─ Monsters
├─ Dungeon
├─ Inventory
├─ Equipment
├─ Potions
├─ Scrolls
├─ Upgrades
├─ Economy
├─ RNG
└─ Statistics
```

能够查看：

- 当前值；
- 上一 tick；
- 最近修改来源；
- 原始符号；
- 现代符号；
- persistent/runtime 标记。

这不仅是调试工具，也是逆向工具。

---

# 32. Sprite Atlas Inspector

为 spritesheet 建工具。

显示每一个 cell：

```text
sheet
x
y
width
height
frame/index
possible code references
```

如果 sprite metadata 不是固定网格，则读取真实代码中的坐标定义。

不要自己假设格子尺寸。

---

# 33. 文档体系

最终至少维护：

```text
docs/
  WORKSTATE.md
  baseline.md
  architecture.md
  runtime-entrypoints.md
  game-state-schema.md
  persistence.md
  rng.md
  time-model.md
  rendering.md
  performance-baseline.md
  performance-after.md
  formulas/
    combat.md
    items.md
    progression.md
  reverse-engineering/
    facts.md
    semantic-map.md
    symbol-map.json
    unresolved.md
```

文档不能变成“写完就过时”的废纸。

每个大改动都同步更新。

---

# 34. 架构文档必须回答的具体问题

`docs/architecture.md` 至少回答：

1. 页面从加载到进入游戏经过哪些步骤？
2. GameState 的所有者是谁？
3. 主循环在哪里？
4. simulation 与 render 如何耦合？
5. UI 如何读取/修改 state？
6. encounter 如何开始？
7. combat 如何推进？
8. monster 如何生成？
9. item 如何生成？
10. dungeon 如何生成？
11. save 如何编码？
12. offline progress 如何恢复？
13. RNG 如何传播？
14. achievement/statistics 如何更新？
15. prestige/reset 如何重建 state？

至少附：

- startup sequence；
- main-loop sequence；
- combat sequence；
- save/load sequence；
- offline-resume sequence；
- module dependency graph。

可用 Mermaid。

---

# 35. 测试层次

不要只有单元测试。

建立多层：

## L1 — Pure unit

针对纯函数/公式。

## L2 — Domain module

例如 Combat、Inventory、Dungeon。

## L3 — Characterization

证明旧版真实行为。

## L4 — Differential

原版 vs 新版。

## L5 — Integration

多个模块组合。

## L6 — Browser E2E

实际页面交互。

## L7 — Soak

长时间运行、长期状态推进。

---

# 36. Soak Test：夜间任务非常适合顺便做

建立可加速的长时间模拟。

场景示例：

```text
30 minutes equivalent
2 hours equivalent
8 hours equivalent
24 hours equivalent
```

观察：

- memory leak；
- state drift；
- timer accumulation；
- NaN/Infinity；
- inventory corruption；
- RNG divergence；
- save growth；
- UI stale state；
- performance degradation。

如果可以同时运行 original/refactor，则比较长期关键统计量。

---

# 37. 现代工程设施

在不破坏项目简单运行能力的情况下逐步建立：

- package manager metadata；
- formatter；
- linter；
- tests；
- type check；
- local dev server；
- build；
- CI-friendly commands。

最终应尽量有类似：

```text
npm run dev
npm run test
npm run test:unit
npm run test:differential
npm run test:e2e
npm run lint
npm run typecheck
npm run build
npm run analyze
```

具体技术栈由项目兼容性决定，不要为了“现代”引入巨大依赖树。

---

# 38. 对依赖的态度

可以使用成熟工具完成：

- AST 解析；
- 测试；
- 浏览器自动化；
- benchmark；
- bundling；
- lint；
- formatting。

但不要用第三方库直接替代游戏本身的核心机制，然后假装完成逆向。

例如可以用 AST parser 分析代码，但不能拿另一个 Idle RPG engine 重写全部逻辑。

---

# 39. 兼容性边界

现代化的优先级：

```text
行为正确
>
存档兼容
>
可测试
>
可维护
>
类型安全
>
性能
>
技术栈时髦程度
```

如果某个现代化方案会显著增加兼容风险，优先选择渐进方案。

---

# 40. 不得擅自做的“改善”

不要因为你认为更合理而：

- 改暴击概率；
- 改掉率；
- 改 XP 曲线；
- 改移动速度；
- 改药水持续时间；
- 改技能平衡；
- 改怪物属性；
- 改装备算法；
- 改地牢生成分布；
- 改 AP 价格；
- 改离线收益；
- 改 UI 尺寸；
- 改游戏节奏。

这些属于产品变更，不属于本轮重构。

发现原版 bug 时：

1. 先写 reproduction；
2. 标记 `legacy behavior`；
3. 默认保持；
4. 除非 bug 会阻塞现代浏览器运行或用户明确要求修复。

---

# 41. 每次迁移前必须写 Migration Card

对于高风险模块，建立短记录：

```text
Module:
Original symbols:
Known behavior:
Unknown behavior:
Persistence impact:
RNG impact:
Timing impact:
UI impact:
Tests protecting it:
Migration strategy:
Rollback plan:
```

迁移完成再记录：

```text
Differential result:
Regression result:
Remaining legacy dependencies:
```

---

# 42. “删除旧代码”的门槛

旧逻辑只有在以下全部满足后才能删除：

- 语义已确认；
- 新模块已实现；
- 单元测试通过；
- characterization 通过；
- differential 通过；
- browser smoke 通过；
- save 兼容无回归；
- 没有其他未知调用者。

否则保留 adapter。

---

# 43. 循环依赖处理

遗留代码可能有大量循环依赖。

不要简单把循环依赖“复制”到 ES modules。

识别真正原因：

- shared mutable state；
- singleton；
- utility dumping ground；
- UI/domain coupling；
- constructor cross-reference。

优先通过：

- domain services；
- explicit dependency injection；
- events；
- command/query separation；
- state owner；

解除。

但不要为了架构纯洁引入过度设计。

---

# 44. 全局状态治理

列出所有 globals。

分类：

```text
constant
definition table
mutable game state
runtime service
UI singleton
cache
legacy compatibility
```

逐步收敛到明确 owner。

最终不应存在大量任何模块都能随意写的全局字段。

---

# 45. Event / Side Effect 盘点

识别：

- DOM writes；
- Canvas draws；
- storage writes；
- timer scheduling；
- audio（若有）；
- RNG consumption；
- global mutations。

对核心函数标记 purity：

```text
pure
stateful deterministic
stateful random
I/O side effect
render side effect
```

这有助于决定测试与迁移顺序。

---

# 46. 数值与边界保护

主动搜索：

- `NaN` 风险；
- `Infinity`；
- undefined arithmetic；
- negative count；
- divide by zero；
- integer overflow-like coercion；
- bitwise 32-bit conversion；
- floating drift。

但：

不要修复会改变 legacy 行为的边界，除非验证它是明显不可达 bug 或阻塞问题。

先记录，再决定。

---

# 47. 代码风格目标

现代化后的代码应倾向：

- 小而明确的模块；
- 高内聚；
- 低耦合；
- explicit state ownership；
- clear names；
- minimal hidden mutation；
- domain-driven naming；
- testable pure functions；
- adapters around I/O；
- comments explaining **why**，not obvious **what**。

不要把每个函数都拆成 3 行。

不要为了“SOLID”生成几十层毫无价值的 abstraction。

---

# 48. 复杂函数治理

对于高复杂度函数：

1. 先理解；
2. 写 characterization；
3. 标出基本块；
4. 恢复变量意义；
5. 抽取纯计算；
6. 再拆 control flow。

不要在没理解时直接“AI 重写”。

特别是：

- save codec；
- dungeon generator；
- combat loop；
- offline calculation；
- RNG consumer。

---

# 49. 旧浏览器技巧与现代 JS 语义差异

注意老代码可能依赖：

- function hoisting；
- `this` binding；
- prototype mutation；
- implicit globals；
- loose equality；
- integer coercion；
- falsy semantics；
- property enumeration order；
- old event behavior。

不要机械改箭头函数、class、strict mode。

每个这种变更都应考虑语义差异。

---

# 50. 最终目录不要求“一步到位”

允许长期存在：

```text
src/modern/*
legacy/c2.js
```

只要 legacy 面积在持续缩小，且现代模块已经承担真实功能。

不要为了视觉上的“没有旧文件”而做高风险 Big Bang。

---

# 51. 里程碑与 Gate

## M0 — Original Baseline

必须完成：

- 原版可运行；
- baseline 文档；
- smoke test；
- Git checkpoint。

Gate：无法稳定运行原版，不进入大规模重构。

## M1 — Static Map

必须完成：

- symbol inventory；
- call graph；
- property graph；
- historical matching 初版。

Gate：核心调用链未知时，不允许大规模 rename。

## M2 — Core Runtime Recovered

确认：

- bootstrap；
- GameState；
- main loop；
- time；
- RNG；
- save/load。

Gate：Persistence/RNG/Time 仍未知时，不迁移大领域系统。

## M3 — Behavioral Harness

完成：

- characterization tests；
- snapshot；
- replay 基础；
- differential runner 基础。

Gate：没有测试保护，不进行大面积删旧逻辑。

## M4 — High-Confidence Semantic Rename

核心符号恢复语义。

Gate：必须测试全绿。

## M5 — Foundation Extraction

迁移：

- RNG；
- clock；
- persistence codec；
- static definitions；
- shared math。

## M6 — Domain Extraction Wave 1

迁移：

- items；
- inventory；
- upgrades；
- effects。

## M7 — Domain Extraction Wave 2

迁移：

- characters；
- monsters；
- combat；
- skills/spells。

## M8 — Domain Extraction Wave 3

迁移：

- dungeon；
- world；
- castle；
- farming；
- progression。

## M9 — Presentation Separation

迁移：

- renderer；
- UI controllers；
- DOM；
- sprite metadata。

## M10 — Type Hardening

- 类型；
- schema；
- lint；
- compile/typecheck。

## M11 — Performance

- baseline；
- hotspots；
- measured optimization。

## M12 — Legacy Reduction

- 删除已无调用的旧路径；
- 收敛 adapter；
- eliminate dead code。

## M13 — Final Regression

必须：

- unit；
- characterization；
- differential；
- E2E；
- save compatibility；
- soak；
- build；
- lint；
- typecheck。

---

# 52. 每个里程碑完成后不要停止

完成一个 Milestone 后：

1. 更新 `WORKSTATE.md`；
2. commit；
3. 跑必要回归；
4. 立即选择下一个 Milestone；
5. 继续。

只有 M13 的完成标准全部满足，才允许进入最终清理与总结。

---

# 53. 每 1~2 个实质工作循环做一次自审

自审问题：

```text
我是在真正减少技术债，还是只增加包装？
我今天确认了多少未知语义？
我迁移了多少真实逻辑？
legacy 依赖数量下降了吗？
测试保护范围扩大了吗？
是否出现行为 divergence？
是否存在“看起来现代但其实仍调用旧代码”的 façade？
哪些子智能体产出没有证据？
下一项最高价值工作是什么？
```

如果发现偏离目标，立刻纠正。

---

# 54. 进度指标

持续维护量化指标，例如：

```text
unknown core symbols
HIGH-confidence symbols
MEDIUM symbols
legacy functions remaining
modern modules
characterization tests
unit tests
differential scenarios
legacy save fixtures
known divergences
unresolved divergences
circular dependencies
mutable globals
any/unknown usages
lint errors
type errors
```

不要用“完成 80%”这种没有定义的百分比。

---

# 55. 反“伪完成”检查器

最终自查以下情况。

任何一项为真都不能宣布完成：

- `c2.js` 仍然承载绝大多数真实逻辑；
- 新模块只是 wrapper；
- 核心变量仍大量叫 `a/b/c/Ic/...`；
- 没有 symbol map；
- 没有 architecture doc；
- 没有 legacy save test；
- 没有 RNG test；
- 没有 offline test；
- 没有 differential test；
- 没有浏览器真实运行；
- 没有性能数据；
- TypeScript 大量 `any`；
- old/new 两套逻辑同时运行且无人知道哪套是真实来源；
- 删除了功能；
- 游戏只能开局，无法完成长期推进；
- 通过手动点几下就宣布兼容。

---

# 56. 最终验收矩阵

最终至少对以下系统给出 `PASS / FAIL / PARTIAL`，并附证据：

```text
Bootstrap
Party creation
Character classes
Character leveling
Character skills
Character stats
Inventory
Equipment
Auto equip
Monster definitions
Monster upgrades
Combat
Critical hit
Stun/status
Skills
Spells
Damage FX
Spell FX
Normal encounters
Difficult encounters
Boss encounters
Loot
Gold
Items
Scrolls
Potions
Treasure rooms
Dungeon generation
Dungeon navigation
Castle
Farming
Adventure Points
Point upgrades
Achievements
Statistics
Pause
Background behavior
Offline progression
Auto save
Manual save
Load
Import
Export
Legacy save compatibility
Prestige/reset
Game over / end progression
RNG determinism
Long-running stability
UI tabs
Canvas rendering
Sprite lookup
```

PARTIAL 必须说明缺什么。

不能把 PARTIAL 写成 PASS。

---

# 57. 最终交付物

最终代码之外必须提供：

```text
REFACTOR_REPORT.md
ARCHITECTURE.md or docs/architecture.md
MIGRATION_MAP.md
PERFORMANCE_REPORT.md
COMPATIBILITY_REPORT.md
```

`REFACTOR_REPORT.md` 至少包含：

- 原始问题；
- 恢复出的架构；
- 新架构；
- 模块迁移映射；
- 关键语义恢复；
- 测试；
- compatibility；
- performance；
- 剩余风险；
- 后续开发方式。

---

# 58. 最终代码质量目标

最终理想状态是：

一个新的开发者进入项目后，可以：

1. `npm install` / 等价初始化；
2. 一条命令运行；
3. 一条命令测试；
4. 查 docs 理解系统；
5. 在 `src/domain/combat` 找到战斗；
6. 在 `src/domain/items` 找到物品；
7. 在 `src/persistence` 找到存档；
8. 在 `src/core/rng` 找到随机；
9. 在 `src/rendering` 找到 Canvas；
10. 修改一个系统而不必重新阅读 4 万多行混淆脚本。

---

# 59. 如果一整夜仍无法全部完成

注意：这不是允许你提前停止。

如果受环境硬限制导致一次执行无法达到 M13，则你必须把**当前可完成的工作做到最大化**，并确保项目处于可持续续跑状态。

必须留下：

```text
docs/WORKSTATE.md
```

其中精确记录：

- 当前已完成的 Milestone；
- 正在执行的 Milestone；
- 最新 commit；
- 当前测试状态；
- 当前行为 divergence；
- 未合并子智能体成果；
- 下一步具体命令；
- 下一个最高优先级问题。

不要只写：

> “由于时间有限，建议后续继续重构。”

这种总结毫无价值。

必须做到**下一轮可直接继续执行**。

---

# 60. 开始执行时的第一批动作

收到本 Goal 后，不要先回复一篇长篇计划然后停止。

立即实际执行：

1. 扫描整个仓库和文件树。
2. 检查 Git 状态。
3. 建立 baseline checkpoint。
4. 确定原版启动方式并运行。
5. 记录 console error/warning。
6. 确认新游戏流程。
7. 定位 `window.Game`。
8. 定位 main loop。
9. 定位 save/load/import/export。
10. 定位 RNG。
11. 定位 offline processing。
12. 分析当前版与历史版。
13. 建 AST 分析工具。
14. 生成第一版函数/调用图/属性图。
15. 建 `symbol-map.json`。
16. 建 `WORKSTATE.md`。
17. 派发第一波子智能体。
18. 建最小 characterization tests。
19. 对第一批 HIGH-confidence 核心符号恢复语义。
20. 开始第一个低风险 vertical slice 迁移。

做完以上 20 项后，不要停。

自动进入下一轮最高价值任务。

---

# 61. 决策优先级

任何时候不知道“应该先做什么”，按以下优先级：

```text
P0  原版无法运行 / 数据丢失 / 存档损坏
P1  GameState / Save / RNG / Time 未知
P2  无法建立 differential validation
P3  高中心度核心符号未知
P4  核心 domain 未迁移
P5  UI/render coupling
P6  类型与依赖治理
P7  性能热点
P8  文档与清理
```

不要在 P1 未解决时花数小时美化 CSS。

---

# 62. 推理纪律

GLM-5.3-Flash 当前使用最高思考档位，因此：

- 对高风险判断使用充分推理；
- 不要为了速度牺牲证据；
- 遇到混淆代码时主动建立假设并验证；
- 不要只靠函数名；
- 不要只靠自然语言猜测；
- 优先写小工具批量获取证据；
- 让机器做索引，让模型做语义综合；
- 对关键改动先证明，再修改。

但是：

> 高思考 ≠ 无休止分析。

一旦证据足够，就进入实际修改和验证。

任务必须始终在：

```text
理解 → 修改 → 验证
```

之间循环，而不是只理解不修改，也不是只修改不验证。

---

# 63. Skill 使用原则

你可以使用所有 Skill。

主动寻找能帮助完成以下工作的 Skill：

- code analysis；
- Git；
- browser automation；
- testing；
- profiling；
- documentation；
- refactoring；
- visualization。

如果某个 Skill 能明显提高可靠性，直接使用，不要因为“手写也可以”而回避。

但 Skill 产出仍必须由主 Agent 验证。

---

# 64. 最终定义：什么才叫“完成”

“完成”不是：

> 代码看着比以前整齐。

也不是：

> 已经成功拆成很多文件。

也不是：

> 可以进入游戏。

真正完成必须达到：

> **Clickpocalypse II 的核心实现已经被我们从高混淆遗留代码中恢复出真实语义；关键玩法行为有自动化证据保护；存档、RNG、时间和离线机制得到兼容验证；真实业务逻辑已经迁移到清晰的现代模块；旧代码不再是唯一真相来源；代码库可以被普通开发者理解、测试、修改和继续开发，并且这些改善是通过运行与差分证明，而不是通过主观判断得出的。**

---

# 65. 最后的执行命令

现在开始。

不要向我解释“这个任务很大”。

不要只生成计划。

不要询问是否继续。

不要因为完成了一个漂亮的阶段报告而停下。

不要在第一轮重构后就宣布成功。

**把所有可用 token、最高思考能力、子智能体和 Skill 用在真正的代码理解、实际迁移、测试、验证与优化上。**

持续工作，持续减少未知，持续迁移真实逻辑，持续跑测试，持续修复 divergence，持续更新事实库。

如果当前环境允许你连续执行一整夜，就把这整夜用于推进仓库，而不是提前收尾。

最终只有一个标准：

> **不是“我认为我已经重构好了”，而是“我能够用代码、测试、差分结果、兼容性结果和文档证明，这个 Clickpocalypse II 已经从高混淆遗留项目转变成一个现代、清晰、可维护、可继续开发，同时仍保持原游戏核心行为的工程”。**

---

# 66. 防止“高思考模式陷入分析循环”的 Anti-Stall Protocol

最高思考档位容易出现另一种失败：分析越来越详细，但仓库实际变化很少。

因此实行 Anti-Stall Protocol。

如果连续 3 个工作循环中：

- 没有新增 HIGH-confidence symbol；
- 没有新增测试；
- 没有修复 divergence；
- 没有迁移真实逻辑；
- 没有减少 legacy dependency；

则认为当前方法停滞。

必须切换方法，例如：

```text
静态阅读停滞
→ 写 AST 工具

AST 停滞
→ runtime trace

runtime trace 太多
→ controlled experiment

符号意义模糊
→ historical diff

历史版仍模糊
→ DOM/string/asset triangulation

模块迁移反复失败
→ 缩小 vertical slice

差分难定位
→ 提高 snapshot 频率

性能优化不明显
→ 重新 profile
```

不能连续数小时重复同一种无效方法。

---

# 67. Context Compression / 长上下文恢复协议

如果 ZCode 或模型进行上下文压缩：

压缩前必须优先保证以下信息已经写入仓库，而不是只存在于对话记忆：

```text
docs/WORKSTATE.md
docs/reverse-engineering/facts.md
docs/reverse-engineering/symbol-map.json
docs/reverse-engineering/unresolved.md
```

每个重要判断都要落盘。

禁止依赖：

> “我记得之前某个子 Agent 好像说过……”

恢复上下文时，先读取：

1. `WORKSTATE.md`
2. Git log
3. 当前 tests
4. symbol map
5. unresolved list
6. 当前 branch diff

再继续。

不要重新从头分析整个项目。

---

# 68. 子智能体产出验收模板

每个子 Agent 返回结果时，主 Agent 不应直接相信。

必须要求/检查：

```text
Scope investigated:
Files inspected:
Symbols identified:
Evidence:
Runtime verification:
Tests added:
Code changed:
Behavioral risk:
Persistence impact:
RNG impact:
Timing impact:
Confidence:
Open questions:
Recommended next action:
```

如果只有：

> “我分析后认为 a 是 MonsterManager。”

没有证据，不进入事实库。

---

# 69. 高价值实验方法

当无法理解复杂函数时，可以设计小型实验。

例如：

## Combat

固定：

```text
character stats
monster stats
RNG sequence
```

只改变一个变量，观察输出。

## Item

固定 seed，生成大量 item，分析：

```text
level
rarity
stat distribution
```

## Dungeon

固定 seed，比较地图结构。

## Offline

固定 save：

```text
elapsed=1m
elapsed=10m
elapsed=1h
```

观察状态变化。

## Potion

记录激活前后：

```text
stats
timers
flags
UI
```

Controlled experiment 的目标不是重新设计游戏，而是反推旧实现。

---

# 70. 建立 Semantic Query 工具

如果条件允许，为大型 symbol map 建简单查询工具。

支持：

```text
find callers <symbol>
find writers <property>
find readers <property>
find dom <id>
find string <text>
find sprite <index>
find save-field <field>
show module <name>
show unresolved --priority high
```

减少反复人工 grep。

---

# 71. Dead Code 判定标准

老代码中可能存在无引用逻辑。

但“搜索不到调用”不等于 dead code。

必须检查：

- string-based lookup；
- prototype dispatch；
- DOM callbacks；
- dynamic property access；
- timers；
- event handlers；
- serialization restore；
- globals accessed externally。

只有静态 + 动态证据都支持时才删除。

删除前记录：

```text
symbol
reason believed dead
static evidence
runtime evidence
tests
```

---

# 72. 外部 API / DOM Contract 兼容

除了内部游戏逻辑，也检查是否有外部脚本依赖：

- `window.Game`；
- DOM IDs；
- CSS classes；
- global functions；
- localStorage keys。

`c2c.user.js` 就证明外部自动化可能依赖 DOM contract。

现代化时可建立 compatibility façade。

不要无意间破坏这些外部契约。

---

# 73. 浏览器自动化测试场景

至少实现下列 E2E 场景中的可行部分：

## Scenario A — Fresh Start

```text
open page
start new party
enter game
wait simulation ticks
inspect currency
open character tab
```

## Scenario B — Save Reload

```text
play
save
capture state
reload page
load
compare state
```

## Scenario C — Inventory

```text
obtain/load item fixture
open inventory
equip
verify stats/UI
unequip
```

## Scenario D — Combat

```text
load combat fixture
run until encounter resolution
record snapshots
```

## Scenario E — Potion / Scroll

```text
load fixture
activate item
verify timer/effect/UI
```

## Scenario F — Offline

```text
save timestamp T0
simulate future time T1
load
verify offline processing
```

---

# 74. UI 回归检查

即使目标主要是架构重构，也必须避免 UI 悄悄坏掉。

对关键页面建立截图或结构快照：

- party creation；
- main game；
- monster tab；
- each character tab；
- inventory；
- upgrades；
- statistics；
- game over/offline 页面。

不要求为了像素级完全相同而阻碍内部重构，但明显布局/元素缺失属于 regression。

---

# 75. CSS 处理规范

不要第一晚就花大量时间“现代化 CSS”。

优先：

- 移除确认无效/重复规则；
- 对真实模块建立样式边界；
- 保持原视觉；
- 记录固定尺寸依赖；
- 避免因为 class rename 破坏 UI。

CSS 大规模设计升级属于另一个任务，不是本 Goal 的核心。

---

# 76. Source Map / Legacy Mapping

重构后保留原始符号映射能力。

例如：

```text
legacy: Ic.prototype.X
modern: DungeonGenerator.generateRoom
```

维护：

```text
MIGRATION_MAP.md
```

这样未来发现旧版 bug 时还能回查。

---

# 77. 模块依赖规则

最终架构尽量满足：

```text
core ← domain ← application ← UI/render
        ↑
   persistence adapters
```

避免：

```text
combat imports DOM
item generation imports renderer
dungeon generator writes HTML
save codec calls UI buttons
```

但迁移过程中允许通过 temporary adapter 过渡。

Temporary adapter 必须加 TODO/issue marker，并记录移除条件。

---

# 78. Domain Event 使用边界

可以使用 domain event 解耦，例如：

```text
MonsterKilled
ItemDropped
EncounterStarted
EncounterEnded
CharacterLeveled
PotionActivated
DungeonCompleted
```

但不要把所有函数调用都改成 event bus。

事件适用于真正的一对多副作用。

直接领域计算仍优先直接调用。

---

# 79. Save Schema 与 Domain Model 分离

现代 domain model 不一定要被旧 save schema 绑死。

推荐：

```text
LegacySaveDTO
    ↓ decode
SaveMigration
    ↓
CanonicalSaveDTO
    ↓
DomainHydrator
    ↓
GameState
```

保存时反向。

这样可以同时获得：

- legacy compatibility；
- modern domain naming；
- 明确 migration boundaries。

但只有确认旧 save 行为后才能实现。

---

# 80. 测试随机性的正确方式

随机系统测试不要只断言“结果在某个范围”。

同时准备：

### Deterministic tests

注入固定 RNG stream，断言准确结果。

### Distribution tests

大量样本检测明显分布错误，但注意避免 flaky。

### Consumption tests

确保关键流程 RNG 调用数量和顺序没有意外改变。

---

# 81. Snapshot 的使用边界

Snapshot 适合：

- normalized GameState；
- dungeon graph；
- save DTO；
- DOM structure。

不适合把整个巨大对象随便 snapshot 后每次人工批准。

Snapshot 改变时必须知道原因。

---

# 82. Error Handling 现代化

识别老代码的 silent failure。

现代化后可以增加：

- explicit invariant errors；
- development assertions；
- save validation；
- structured diagnostics。

但生产路径不要因为新增过度严格校验而拒绝原本合法的 legacy save。

Development-only assertions 与用户行为分开。

---

# 83. 日志体系

建立可分级 debug logger：

```text
trace
debug
info
warn
error
```

模块标签：

```text
SAVE
RNG
TIME
COMBAT
DUNGEON
ITEM
UI
RENDER
```

默认生产不输出高频日志。

日志用于重构验证，不要污染帧循环。

---

# 84. 性能优化后的正确性复验

任何 performance optimization 都必须重新跑：

```text
unit
characterization
differential
E2E relevant scenario
```

尤其警惕：

- memoization 缓存失效；
- object pooling 残留状态；
- batch update 改变顺序；
- UI throttling 改变业务逻辑；
- loop fusion 改 RNG 顺序。

性能不能以行为漂移为代价。

---

# 85. Dependency Upgrade 原则

如果引入 npm 工程：

不要顺手升级/重写所有旧资源处理方式。

新依赖必须回答：

```text
Why needed?
What problem does it solve?
Runtime or dev-only?
Can it alter game behavior?
Is it maintained?
```

能用 dev dependency 完成的，不塞进 runtime bundle。

---

# 86. Build 输出验证

如果从“直接 script”迁移到 bundler：

必须比较：

- global exposure；
- script execution order；
- asset paths；
- CSS paths；
- localStorage；
- strict mode differences；
- initialization timing。

构建成功不代表游戏正确。

---

# 87. 每晚工作结束前的 Exhaustion Pass

在准备最终总结前，执行一次 Exhaustion Pass：

搜索：

```text
TODO
FIXME
HACK
unknown
legacy
any
@ts-ignore
eslint-disable
console.log
```

逐个判断：

- 合理保留；
- 必须修；
- 必须记录后续风险。

再搜索：

- 未使用文件；
- 未使用 export；
- 重复实现；
- 临时 adapter；
- commented-out old implementation。

清理能安全清理的内容。

---

# 88. 最终 Regression Sweep

最终完整跑：

```text
clean install
build
lint
typecheck
unit tests
characterization tests
differential tests
E2E smoke
legacy save fixtures
offline test
soak test/permitted accelerated equivalent
```

然后实际人工/浏览器体验一轮主要流程。

任何 fail 都不能被“多数测试通过”掩盖。

---

# 89. 最终报告禁止夸大

最终报告中明确区分：

```text
VERIFIED
HIGH CONFIDENCE
PARTIALLY VERIFIED
UNRESOLVED
```

不要写：

> “所有行为完全兼容”

除非确实有足够测试证明。

对尚未覆盖的中后期内容明确写出。

---

# 90. 继续执行的最高原则，再重复一次

这是一次长程自治重构，不是问答题。

你拥有高思考档位、充足 token、子智能体和 Skill，应该把这些资源用于：

```text
更多证据
更多自动化分析
更多真实代码迁移
更多测试
更多 differential validation
更多可维护性改进
```

而不是用于生成越来越长的解释文本。

用户需要的不是一份“如何重构 Clickpocalypse II”的论文。

用户需要的是：

> **你真正把 Clickpocalypse II 重构掉。**

因此在执行期间：

- 少做无意义汇报；
- 多修改仓库；
- 多跑命令；
- 多写测试；
- 多验证；
- 多提交可恢复 checkpoint；
- 自动继续下一步。

除非任务真正达到最终 Gate，或者执行环境硬性终止，否则不要主动结束。

