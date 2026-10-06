# 当前类型债务

`tsconfig.json` 使用 allowJs/checkJs/noEmit，`strict:false`、`noImplicitThis:true`。入口限于 codec、core 和 persistence，再经导入图传递；不是全 src、桌面或工具目录的严格类型化。模块总数和实际加载数见 [WORKSTATE](WORKSTATE.md)。

## 实测与口径

本轮 `npm run typecheck` 通过。`npm run lint` 对 engine/modules 精确报告 `@type {any}` 转换数和含 unknown 的行数；当前分别为 **28 处、147 行**。它们与全文搜索 any 字符串、unknown 类型语义并不等价；零 tsc 错误也不证明类型完备。

原型后挂载、恢复期变量跨分支复用、跨类容器及宽泛 Object 仍需要人工约束。零整文件豁免不等于所有新模块被 tsc 纳入。

## 已接线与剩余

`persistence/save-dto.js` 的 SaveData/SaveDataUninitialized 被序列化返回值和恢复解析值引用，角色、属性组件、世界、法术状态、怪物、地牢、点数等已具名。`audit-save-schema.mjs` 核对顶层/空白档键与部分嵌套样本；法术状态缺 fixture 样本，保留这个证据限制。

统计、城堡、商店等仍有宽泛 Object。每层应逐项核对真实 DTO、序列化和恢复点，再加具名 typedef 与错误键反向验证。已有结果/远征/怪物视图的类型交叉接口已经消除了部分 cast，旧台账的“下一步先消远征七处”不再适用。

## 收窄方式

1. 对实际存在的后挂载方法定义小型交叉接口，避免为类型方便补字段/改原型和行为。
2. 变量承担多个语义时按分支拆名，先确认短路、调用和随机消费顺序。
3. 被整体替换的状态用 getter，不把旧引用当稳定类型契约。
4. 运行 `typecheck`、`lint` 和改动对应的行为/保存/界面检查；类型断言不能代替运行时校验。

历轮接线、JS 参数标注的收窄限制及负向验证细节见 [历史类型台账](history/type-debt-before-governance.md)。
