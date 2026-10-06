# 开发指南

适用 Windows / PowerShell 的浏览器与 Electron 主线。项目定位见根 README；当前版本、指标和验证结果只在 [WORKSTATE](WORKSTATE.md) 更新。历史任务书不授予新任务权限。

## 准备与运行

```powershell
git status --short --branch
git log -6 --oneline
git worktree list
npm ci
npm run dev
```

当前工作树有大量既有未提交改动，开工保存目标文件 diff 与文件清单；完成后只归属本轮新增差异。端口 4173 已占用时先核对服务器目录，不终止来源不明的进程。`PORT` 可指定独立工具服务端口。

桌面运行、打包和隔离测试见 [DESKTOP-COMPANION](DESKTOP-COMPANION.md)；素材导入的唯一教程是 [assets/README](../assets/README.md)。依赖和全部命令以 `package.json`、锁文件及脚本源码为准。

## 契约与改动范围

以下约束用于经典恢复路径；原野新增规则按其设计和版本独立维护。既有授权的产品表现调整、名称输出安全和故障处理已经实现，不能用旧任务书的“保留缺陷”要求回退它们。

| 编号 | 契约 |
|---|---|
| R1 | 保持经典数值、概率、曲线和正常节拍；产品 UI/表现与经典像素 oracle 分别验收。 |
| R2 | 保持旧经典 JSON 键、codec、字段顺序；运行时改名同步读写映射。原野格式变更需要独立版本与迁移。 |
| R3 | 保持经典 RNG 算法、消费顺序、参与索引/权重的内容数组顺序；原野随机源与其隔离。 |
| R4 | 经典差分中的原版怪癖按既定兼容口径保留；发现错误先证明输入可达和设计目标，再决定修法。原野姓名身份缺口不是原版行为契约。 |
| R5 | 保留 `archive/original/`、真实 fixture、固定 vendor codec、符号映射和逆向取证证据；历史记录采用追加纠正，不重置原证据。 |
| R6 | 保留既有未提交工作；不以全仓回退/清理处理单个文件或字段，不把未跟踪等同于垃圾。 |
| R7 | 验收矩阵依据实际覆盖；PARTIAL 升级需新增有效证据，全绿不能代替功能/真机/历史样本验证。 |

字段命名先确定接收者、读写侧和存档键；异主的同名字母不能仅凭字面映射写入 `symbol-map.json`。初始化顺序、原型挂载、短路求值和缓存写入时间属于运行契约。数据对象会被整体替换时使用取现值函数，避免捕获旧统计/世界对象。

## 验证选择

| 改动 | 必做检查 |
|---|---|
| 文档 | 下方文档检查、链接检查、`git diff --check`；逐条核对主张和证据，不改测试基线掩盖漂移 |
| 经典逻辑/存档/初始化 | `check`、`lint`、`build`、parity、scenarios、初始化顺序；相关 UI/渲染浏览器检查 |
| 渲染/素材 | `check:assets`、`audit:asset-refs`、`test:assets`、`test:presentation`、`test:map-motion`、经典差分 |
| 原野/背包 | 相关单测、`test:village`、`test:expedition`、经典隔离和刷新/坏档恢复 |
| 桌面桥接/存储 | `test:desktop`、`test:expedition:desktop`、独立测试目录的真实 exe 复核 |
| 准备数据/工具 | `validate.mjs all/negative`、准备层语义测试、成本展开；预览改动加真实浏览器验收 |

```powershell
npm run audit:doc-counts
npm run audit:doc-mappings
npm run audit:doc-snippets
npm run audit:doc-refs
npm run audit:doc-anchors
npm run lint
git diff --check
```

完整游戏回归在开发服务器运行时执行 `npm run gate:sweep`。脚本逐项保存退出码与日志，但当前没有包含全部 Electron、背包专项和内容准备测试，按改动补跑。`--quick` 实际只跳过标记 slow 的 soak/perf-frames，仍会运行 CPU perf；以脚本 gates 列表为准。

PowerShell 定向场景示例（完成后恢复该终端先前的环境值）：

```powershell
$previousFilter = $env:SCENARIO_FILTER
try {
  $env:SCENARIO_FILTER = 'offline-1h,castle-victory'
  npm run test:scenarios
  $scenarioExit = $LASTEXITCODE
  Write-Output "scenarios exit=$scenarioExit"
} finally { $env:SCENARIO_FILTER = $previousFilter }
```

命令失败时保存完整 stdout/stderr，立即读取 `$LASTEXITCODE`，不要用末端管道命令的成功替代测试退出码。新增关键行为断言应在隔离副本做破坏/恢复验证，确认不是空路径通过。性能优化需同口径基线和多轮 A/B；headless 帧间隔、加速回合和推算工期分别注明，不能冒充真机或实际等待。

## 文档维护

现状改动更新 WORKSTATE 与对应实现指南；设计变更更新设计稿，落地后明确哪些部分实现。任务完成从当前待办移除，必要的否决理由、事故和决策留在历史/ADR。文档治理的事实层级与分类规则见 [文档索引](README.md)。提交、对外发布和付费操作按用户当前授权，旧任务书的自动提交要求不是当前授权。
