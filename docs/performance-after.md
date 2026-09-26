# 性能复测（真实浏览器帧时间）— performance-after

> 复现：`npm run dev` 后 `npm run perf:frames`（原始脚本 `scripts/measure-frames.mjs`，采样数由 `FRAME_SAMPLES` 控制）。
> 与 `docs/performance-baseline.md`（harness 操作耗时）互补：本脚本测 headless Chrome 的 `requestAnimationFrame` 回调间隔，含浏览器调度，不直接等于绘制执行时间。

## 1. 实测（2026-09-26，Chrome headless，1440×1000，同一台机器）

| 状态 | 帧数 | 平均 | P50 | P95 | P99 | 最差 | >50ms 掉帧 |
|---|---|---|---|---|---|---|---|
| 远征视图（地牢渲染 + DOM 面板） | 599 | 4.19 ms | 4.20 | 4.50 | 5.50 | 8.50 | 0 |
| 冒险点面板（数百行 DOM 刷新） | 599 | 4.23 ms | 4.20 | 4.80 | 7.50 | 13.10 | 0 |

同一次运行内被 `simulation/loop.js:76` 的 try/catch 吞掉的渲染异常（`console.log("Caught error. …")`）：**0 条**。

## 2. 结论与口径边界

- 本次 headless 样本中最差 rAF 间隔 13.1ms，**没有一次超过 50ms**；这只描述被测两种状态和设备。
- **headless Chrome 不受 vsync 约束**；rAF 间隔包含调度与页面工作，是间接代理，不能拆出 Canvas/DOM 的纯执行时间，也不能当作真机 60/120Hz 掉帧率。
- 两种状态的均值 4.19/4.23ms 接近，但 P99 为 5.5/7.5ms；当前样本不足以排除 DOM 峰值成本，需要更细粒度 tracing 才能定位热点。

## 3. 未测与不宣称

1. **没有原版页面的同口径基线**：`archive/original/index.html` 的开局流程未被测试自动化（原版没有新 UI 壳的建队按钮路径），因此本报告**不宣称**"重构版帧时间与原版持平"，只宣称绝对工作量。CPU 口径的原版对比在 `docs/performance-baseline.md`。
2. 未测：真机（有 vsync）、法术特效密集期、几百件背包、地牢切换瞬间、低端设备。
3. 本阶段**没有任何优化提交**：按规范 §29 的纪律，没有热点证据就不动手。若将来优化，验收门槛是"假设 + 基线 + 改动 + 新测量 + parity/当前场景矩阵全绿"（规范 §84）。
