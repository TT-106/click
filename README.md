# Clickpocalypse II 恢复与原野陪伴原型

本项目包含两条共享 JavaScript/Canvas 基础的运行路径：保留原作玩法与旧存档的经典恢复版，以及独立保存的原野自动探索、采集与返程原型。Electron 提供 Windows 观赏小窗和托盘。当前仍是内部试用工程，完整原创游戏和商业发行尚未完成。

## 本地运行

需要 Node.js 22 或更高版本。以下命令在项目根目录的 PowerShell 执行：

```powershell
npm ci
npm run dev
```

打开 [本地网页](http://127.0.0.1:4173)。另一个终端可运行 `npm run desktop:dev`。静态构建使用 `npm run build`；Windows 便携包使用 `npm run desktop:make`。构建产物在 `dist/` 和 `output/desktop-build/`，不作为源码提交。

**当前 Git HEAD 还不包含完整本地原型。** `desktop/`、原野模块、`assets/`、内容工具及生成素材清单等仍有未跟踪文件；上述命令适用于这份完整工作树。仅克隆已提交 HEAD 不能复现当前功能，须先完成源码/资源入库审查。具体状态与本轮检查见 [WORKSTATE](docs/WORKSTATE.md)。

## 已实现与边界

- 经典队伍、战斗、升级、旧 `.c2save` 导入导出与原版差分参照。
- 按全局坐标扩展的原野、七种采集材料、个人背包、逐格返程与营地仓库。
- Windows 小窗、置顶、托盘、磁盘检查点；程序运行时隐藏仍探索，退出或休眠后不补原野收益。
- 60 类物品、53 条配方、8 类三级基地设施仍是准备数据，尚未接入游戏。原野战斗、生产、永久角色身份、一周远征和正式原创美术仍未完成。

经典与原野分别保存；经典 `.c2save` 不包含原野库存。现有代码/内容的发布权利仍需核实，免费测试与原创发行是已记录的规划方向，不代表已具备发布条件。

## 开发入口

阅读顺序：[文档索引](docs/README.md) → [当前状态](docs/WORKSTATE.md) → [开发指南](docs/DEVELOPMENT.md) → [架构](docs/architecture.md)。修改具体系统时再读对应技术参考。

```powershell
npm run check
npm run lint
```

浏览器差分与界面检查需要开发服务器及本机 Chrome；完整验证方式见开发指南。Godot/C# 位于独立分支与工作目录，见 [分支约定](docs/BRANCH-WORKFLOW.md)。
