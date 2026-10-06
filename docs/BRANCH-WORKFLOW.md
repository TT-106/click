# 浏览器主线与 Godot 分支（2026-10-03）

当前优先完善恢复版 `src/`；Godot 开发留待后续。两个工作目录属于同一 Git 仓库，共享提交历史，各自拥有分支、索引和磁盘文件。

| 路线 | 分支 | 本机工作目录 | 当前任务 |
|---|---|---|---|
| 浏览器恢复与现代化 | `main` | `D:\下载\clickpocalypse2-main` | 保持原版行为和旧存档兼容，继续完善 `src/` |
| Godot 与纯 C# 原生产品 | `feature/native-godot-csharp` | `D:\下载\clickpocalypse2-godot` | 保留已有实现、设计与工具链，暂缓功能开发 |

## 主线开发

从 `docs/WORKSTATE.md`、`docs/modernization-status.md`、`docs/REMAINING-WORK.md` 续跑。命名、依赖解耦和类型契约仍未全部完成；验收矩阵中的四条 PARTIAL 继续按实际证据判断。

存档 JSON 键、随机算法与消费顺序、时间节拍、原版素材及外部 DOM 契约继续保持。`archive/original/` 只作验证参照；保留 ADR 0001，因为它也适用于主线。原生专属 ADR 0002–0015、Godot/C#规格、`native/` 和 `scripts/native/` 在 Godot 分支查阅。已提交的历史不重写，主线以新增提交移除专属文件。

```powershell
Set-Location -LiteralPath 'D:\下载\clickpocalypse2-main'
git status --short --branch
npm run dev
```

另一个 PowerShell 窗口在同目录运行 `node scripts/gate-sweep.mjs`。门禁需要开发服务器；未起服务的连接拒绝不能当作行为回归。

## 后续恢复 Godot 开发

```powershell
Set-Location -LiteralPath 'D:\下载\clickpocalypse2-godot'
git status --short --branch
```

在该目录阅读 `AGENTS.md`、`docs/native-build.md`、原生规格与 ADR；按最新明确需求选定后续产品目标。2026-10-03隔离批次没有验证或推进原生功能；当前主线Electron试用不属于Godot/C#原生线。

本地工具链 `.tools/`、试验记录 `.scratch/`、浏览器取证 `.playwright-mcp/` 及 `output/native-*`、`output/windows-*` 已迁到 Godot 工作目录。旧路径生成的 489 个构建文件和 1 个 Python 缓存文件存放在该目录的 `output/branch-isolation-preserved/`；不覆盖新检出的源码，后续构建按新目录重建。

搬迁清单 `output/branch-isolation/move-manifest.json` 在主线本地保存，Godot 目录另有 `output/branch-isolation-preserved/move-manifest.json` 副本；每项记录原路径、目标路径、长度和搬迁前后 SHA256。这些本地记录及构建输出不入库。

## 两条线之间传递改动

固定使用各自目录，避免在同一目录反复切换分支导致缓存串线。主线的改进不会自动进入 Godot 分支；确有需要时只挑选相关提交，审查差异并在目标分支重新验证。

不要将 Godot 分支整体合入主线，也不要将主线的原生方案移除提交挑选进 Godot 分支。Godot 分支里的 `src/` 是分支建立时的参照快照；当前恢复版的权威进展以 `main` 为准。

两个 worktree 的 `git stash` 和分支引用属于同一仓库；清理前先用 `git worktree list` 确认，不直接删除 Godot 目录。以后若要移除该工作目录，使用 `git worktree remove` 并先保留尚未提交的文件和忽略目录。
