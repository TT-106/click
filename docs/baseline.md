# 经典行为基线与差分方法

原版参照是 `archive/original/c2.js`，原始清单/哈希位于 `archive/migration/recovery-manifest.json`。档案保持原字节，仅用于取证与测试，产品不加载它；决策见 [ADR 0001](adr/0001-retain-original-as-test-oracle.md)。

## 测试链

| 检查 | 方法与边界 |
|---|---|
| 单测 | RNG 从原版 ga 提取做位级对照；codec/格式化和独立接口金标准；无需开发服务器 |
| `test:parity` | 双 harness 同载真实 fixture，固定时钟和 Math.random 流，比较 0/1/99/900 回合完整 DTO |
| `test:scenarios` | 真实 fixture 的双端同构变异、场景步骤、必达与独立观察断言；现行数量见 WORKSTATE，定义在 runner 中 |
| `test:e2e` | 产品页实际建队/面板/暂停/导入导出/坏档拒绝/刷新/选择器与布局，不等于双端规则差分 |
| `test:soak` | 8h/24h 等价回合与主动 GC 堆样本，不是真实全天运行 |
| `test:presentation`、`test:map-motion` | classic 像素参照与 clean 显示、动态采样分别测试，不混同证据 |

`tests/engine-harness.html` 的 `?original` 分支加载原版；另一分支加载恢复引擎。harness 固定 Date.now，Math.random 用受控 LCG，load 时重置随机相位；离线测试用 `advanceOffline` 驱动帧循环，直接 advance 会绕过离线结算。失败快照保存在本地 output，复跑命令和退出码才是当前验证。

## 外部契约

经典存档采用 LZ-string 1.3.3 Base64，已初始化 30 顶层键、空白 4 键；真实 fixture 是一个版本，变异数据不算多个真实历史档。数组顺序、RNG、正常回合节拍、DTO 和原 DOM 选择器属于兼容约束。

## 已授权差异与未覆盖

clean 的 DPR/采样、产品布局和原野/桌面是明确的新能力；classic 继续承担原版像素 oracle。R55 名称输出和故障处理增强安全/可恢复性，正常路径仍做经典差分。不能再写“整个产品无合法差异”。

胜利/重开、法术类别、城堡、财宝、农场、掉落和升级已扩展检查，初始九场景的缺口不是当前缺口。当前四条 PARTIAL 与入口分层限制见 [REMAINING-WORK](REMAINING-WORK.md)，判定只在根重构报告附录 A 维护。原野和桌面使用独立专项，不能用经典差分为它们背书。
