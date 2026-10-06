# 运行入口与调试

本文件说明入口关系；全部 npm 命令以 `package.json` 为准，环境与检查选择见 [DEVELOPMENT](DEVELOPMENT.md)。

## 产品入口

| 入口 | 调用路径与用途 |
|---|---|
| `index.html` | 唯一模块入口 src/app.js，挂载产品 UI、准备记录、boot 引擎 |
| `desktop/main.mjs` | 创建窗口/托盘/本地协议，preload 暴露受限操作；同一产品页使用 desktop-storage |
| `src/engine/adapter.js` | 产品命令校验、显示快照、组队和原野 controller 创建；产品不直接持有 game |
| `src/engine/internal-api.js` | 连接模块级 game、codec、序列化、持久化/故障配置；内部接口 |
| `src/engine/modules/runtime/index.js` | 初始化构造器原型与定义表，最后建立 game；顺序受门禁保护 |
| `game.onLoad()` | 绑定可见性并启动经典循环；图片就绪后首帧恢复记录并挂载视图 |
| `createVillageExplorer()` | 创建独立 OpenWorldSession、Renderer、存储与调度，不消费经典随机流 |

经典序列化使用 `serializeGame(game.saves)`；DTO 使用 `createSaveState(game.saves)`。导入/重置由 adapter 和保存服务编排；胜利后继续的生命周期现由 `game.continueRun()` 驱动，结果视图只提供交互，具体方法名以 runtime/game.js 为准。

## 调试与 harness

开发服务器运行后，可在浏览器 Console 导入模块（只用于开发）：

```js
const { engine } = await import('/src/engine/adapter.js');
engine.snapshot();
```

`tests/engine-harness.html?original` 是原版测试分支，不是产品启动入口。harness 的 load/snapshot/advance/advanceOffline 等方法在 `tests/engine-harness.js` 定义；脚本通过真实 fixture 和场景变异使用它，产品没有 window.Game/lB/pB 全局。

## 排障

| 症状 | 先看 |
|---|---|
| 经典坏档/保存阻断 | services/saves blocked、Worker 校验与 loop 首帧恢复回滚；原文和备份保留 |
| 模拟停止但画面仍调度 | loop.simulationFault 与 fault-port / app 常驻错误；导入或重置解除 |
| 离线未结算 | allowOfflineProgress、已建队且未胜利、间隔超过120秒；后台分支另查 allowBackgroundProgress |
| 图片不就绪 | AssetCatalog/AnimationSheet errors、生成清单与源包一致性；不能用宽泛超时吞错误 |
| 原野坏档/背包变化 | controller 的 saveBlocked、版本/路线校验及姓名 ownerIds；恢复接口尚无 UI |
| 差分失败 | 确认双端同 fixture/随机相位，读取 output 快照和完整日志，不放宽比较 |
| 桌面存档失败 | desktop-storage 合并提交、主进程磁盘提交结果和独立测试目录 |

普通网页/原野/桌面的后台、暂停和退出规则分别见 [time-model](time-model.md)。
