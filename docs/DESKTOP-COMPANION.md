# 原野陪伴：Windows 桌面试用版

**R50 更新**：桌面底栏增加角色背包，原野具备自动采集、返程与营地归仓；素材来源、存档兼容和界面验证见 [背包与归仓](EXPEDITION-INVENTORY.md)。下方 R49 实测数字保留为历史，当前源码与本轮检查见 WORKSTATE.md；已有包是历史构建，重打包后才能宣称包含R55/R56。

更新：2026-10-04，R49。定位：工作、学习时放在桌面角落，空闲时看看自动探索的队伍。本阶段验证桌面观赏体验，长周期远征、背包/基地/战斗闭环和二次元角色仍按 `GAME-PRODUCT-TODO.md` 分阶段实现。

## 开始试用

在项目根目录双击 `启动桌面试用.cmd`，或运行 `output/desktop-build/WildernessCompanion-win32-x64/WildernessCompanion.exe`。便携 ZIP 在 `output/desktop-build/make/zip/win32/x64/`：解压后运行其中的 exe，整个解压目录一起保留；无需另起网页服务器或安装 Node。

首次进入先选队伍，可点“使用推荐阵容”再“开始远征”。随后进入观赏小窗；已有桌面队伍会从存档恢复。拖动标题区域移动窗口，拖动边缘缩放。

- **展开 / 小窗**：切换管理界面和观赏界面，两种模式分别记住窗口尺寸和位置。
- **置顶**：自行开启，默认关闭；小窗不主动抢焦点，不发送桌面通知。
- **减号**：最小化到任务栏。**关闭按钮**：收进托盘，应用仍运行，探索继续。
- **托盘**：双击恢复窗口；右键可显示小窗、打开管理、置顶、暂停/继续、打开存档文件夹，以及“保存并退出”。
- **暂停 / 继续**：控制当前观赏探索；暂停时保持世界时钟和位置。
- **保存**：将经典队伍记录与开放世界检查点写入磁盘，成功后才显示“旅途已保存”。

## 采用的现有方案与案例

| 来源 | 实际采用或借鉴 |
|---|---|
| [Electron 自定义窗口与 Fiddle](https://www.electronjs.org/docs/latest/tutorial/custom-window-styles) | BrowserWindow 无边框、可拖动标题区域、系统窗口缩放。没有自写窗口引擎 |
| [Electron 托盘范例](https://www.electronjs.org/docs/latest/tutorial/tray) | Tray + Menu，关闭收起、恢复与显式退出 |
| [Electron 本地协议范例](https://www.electronjs.org/docs/latest/api/protocol) | 通过标准本地协议加载静态 ESM、素材和校验 Worker；无需开放本地服务端口 |
| [Electron Forge 既有项目接入](https://www.electronforge.io/import-existing-project) | 官方打包流程与 ZIP Maker，生成 Windows x64 便携包 |
| [electron-store](https://github.com/sindresorhus/electron-store) | 主进程原子写入窗口偏好和当前检查点，复用成熟存储库 |
| [Rusty's Retirement](https://store.steampowered.com/app/2666510/Rustys_Retirement/) | 桌面伴随玩法和按需观察的产品形态参考；本项目选择可移动小窗 |
| [Spirit City: Lofi Sessions](https://store.steampowered.com/app/2113850/Spirit_City_Lofi_Sessions/) | 专注时陪伴的定位参考；本轮没有引入其素材或复制内容 |

Electron 自带 Chromium，便于复现现有浏览器画面。Tauri 同样可以复用 JS，优势在较小包体，但引入 Rust 与系统 WebView 验证；当前优先验证现有游戏的桌面体验。Godot 继续按 `BRANCH-WORKFLOW.md` 独立保留。Canvas 暂够用，没有同时更换渲染器、UI 框架或构建器。

## 实现职责

- `desktop/main.mjs`：窗口、托盘、生命周期、磁盘存储与受限本地资源协议；`preload.cjs` 只暴露确定的操作。产品页面不获得 Node 或任意文件读写。
- `desktop/forge.config.cjs`：只带产品入口、静态构建和运行依赖；原版档案、测试、开发记录不进包。素材库存保留在项目，包内位图由生成资源清单自动筛选；许可与描述文件保留。
- `src/services/desktop-storage.js`：为已有存档接口提供同步内存读写、异步合并检查点和失败重试。桌面与网页有真实不同的存储实现，游戏规则无需判断 Electron。
- `src/ui/desktop-companion.js`：小窗 UI、桌面可见性和现有页面的编排；资源、坐标与遮挡仍由现有 Renderer 负责。
- 开放世界 controller：桌面模式约 30 次/秒更新和绘图，UI 约 5 次/秒更新；隐藏时只以约一秒间隔推进小步模拟，不绘图。显式读取系统窗口可见性，避免禁用 Chromium 限频后的 document.hidden 差异。
- 经典模拟在观赏时暂停，经典绘图在观赏/隐藏时关闭；桌面启动先暂停经典模拟，防止恢复小窗前暗中推进。普通网页的后台与离线规则保持原有路径。

## 存档与恢复

默认目录为 `%APPDATA%\ClickpocalypseCompanion`，第一次运行自动建立。`adventure.json` 保存版本 1 的经典记录、备份、开放世界记录和画面偏好；旧经典 Base64 和世界 JSON 原文不改字段。`adventure.json.bak` 保留上一检查点，窗口信息单独在 `window-settings.json`。可以从托盘打开该目录，完全退出后备份这两个 adventure 文件。

磁盘检查点总量上限 12 MiB，单条经典记录上限 2 MiB。未持久化的更新通常在 500ms 后合并提交；托盘收起、暂停/主动保存、休眠通知和退出会要求保存。读取失败时保持原文件并显示错误；磁盘提交失败不报告主动保存成功，正常退出会等待提交。

桌面记录与浏览器记录独立。管理页可导入已有 `.c2save` 的经典队伍，开放世界暂未提供网页/桌面的统一迁移入口。原野工具栏已有“恢复备份”；小窗检测到原野坏档/保存错误时显示“恢复记录”，点击展开管理界面。恢复前提示收获可能回退，当前原文另存 C2_OPEN_WORLD_V1_before_recovery，可用备份保留；恢复/新世界等磁盘确认才显示成功，拒写不切换会话。备份和留档键已纳入桌面保存白名单。统一迁移、稳定身份、长途回顾和分块数据库仍未完成。

electron-store 适合当前有界试用检查点。它每次写整个 JSON，不能作为未来无限动态世界的数据库；地图动态状态、背包与长期事件规模增长时应采用分块持久化/SQLite，保留同一个产品存储接口。

## 时间语义与本阶段限制

本阶段：程序运行时，窗口隐藏/最小化仍探索；用户暂停或电脑休眠时不推进；彻底退出后的时间不结算为开放世界进度。调度停顿最多补一秒，不能把短测试写成真实一周稳定运行。

现有经典战斗仍属于经典远征。原野已有资源拾取、个人背包、返程与归仓；原野遭遇战、制作/基地和一周远征闭环尚未实现。专属背包面板已落地，技能/基地面板、新角色、配音与剧情仍待开发。

无边框小窗采用不透明底色，避免透明窗口与缩放的兼容限制。本阶段没有桌面壁纸模式、鼠标穿透、开机启动、自动更新、商店发布或代码签名。收费与原代码/内容授权核实仍见产品 TODO。

Electron 基础内存与包体开销真实存在；首次采样的 CPU 百分比为零不构成低耗证明，进程 working set 也包含共享页，不能简单相加当作准确物理占用。当前验证说明“隐藏停止绘制且探索继续”，长期功耗、温度、内存增长和休眠唤醒需专项实测。

## 开发和验证

```powershell
npm run desktop:dev
npm run desktop:make
npm run test:desktop
node scripts/test-desktop.mjs --packaged=output/desktop-build/WildernessCompanion-win32-x64/WildernessCompanion.exe
```

网络无法访问 GitHub 下载站时，本次使用 npmmirror 的 Electron 镜像，并由下载器校验其校验和；只在安装/打包进程设置 `ELECTRON_MIRROR` 和 `electron_use_remote_checksums`，没有把镜像地址写入游戏运行逻辑。

桌面验证使用独立临时用户目录，通过 Playwright 的 Electron 支持启动真实 Windows 程序，不使用模拟窗口。验证首次不存在的存档目录、组队后进入小窗、置顶、展开/缩放、隐藏停止绘图但模拟继续、暂停不前进、原野/经典隔离、保存并退出、从磁盘恢复同一半步路线和窗口尺寸、系统关闭收进托盘、损坏文件拒绝覆盖。截图/结果在 `output/playwright/desktop/`；预期的损坏文件错误单独记录，不混作正常启动无错误。

短探索/拾取/背包/返程循环已经形成；下一步先完善稳定身份、恢复和最小制作消费者，并做长时间低耗验证；美术扩充、正式 UI、离线与一周目标依次推进。
