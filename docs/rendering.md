# 渲染层（Canvas）— 当前实现与验证边界

R35（2026-10-03）：用户明确要求移除顶部横幅和说明、上移主画面，并保留像素风明显减少杂乱，另报告墙壁与地面闪动。本轮只改 UI 和表现，不改玩法、数值、随机流、存档格式或原版素材文件。

## 1. 产品样式与原版验证路径

- 产品默认 `clean`（清晰像素），见 `src/app.js:25`；设置里可以切换到 `classic`（原版像素）。偏好单独存在 `C2_PRESENTATION_V1`，不写入游戏存档 JSON。
- `GameCanvasView` 的引擎默认仍为 `classic`，见 `src/engine/modules/rendering/scene.js:238`。原版差分 harness 不加载产品入口，因此继续验证原版绘制路径；这些指纹不能用来宣称 `clean` 像素与原版一致。
- 产品通过 adapter 的 `setPresentation` 命令切换样式；相同样式不重建缓存，见 `src/engine/modules/rendering/scene.js:766`。画布恢复时的 `createDomElements` 按已有样式重新创建策略，见 `src/engine/modules/rendering/scene.js:747`。
- 顶部横幅、远征页大标题/说明、组队页旁注与页尾说明已移除。保存状态、周目、存档管理和设置移到侧栏，原按钮 ID 保留。

## 2. 纯绘制边界

`createMapPresentation` 位于 `src/engine/modules/rendering/presentation.js`，没有 game、随机函数、存储或游戏模块依赖。它接收 Canvas 上下文、精灵、坐标与显示数据，处理：

| 内容 | 清晰像素行为 |
|---|---|
| 地面 | 同一精灵首次绘制时降低纹理对比，2×2 采样弱化细碎高频纹理；逐像素 alpha 原样保留 |
| 墙壁、树木与装饰 | 保留轮廓，降低饱和度与纹理对比；独立缓存避免混用地面处理结果 |
| 角色、掉落物 | 保留原素材与颜色，整数屏幕坐标绘制 |
| 特效 | 保留帧和播放逻辑，绘制时降低透明度；画外精灵/动画剔除 |
| 血条 | 简短低对比色条；非队友满血时不画 |
| 浮动文字 | 显示最后 20 条，同一 42×24 区域最多 3 条并错开基线，柔和颜色和暗色描边 |

地形缓存按 sprite 对象分别放在两个 WeakMap；`cachedSprites`、`drawnSprites`、`culledSprites` 只作绘制诊断。缓存不会逐帧读像素或改写原图。地形层标记由 `drawWorldTileRow` 和 `drawDungeonTileRow` 显式传入，角色和掉落默认为 actor。

浮动文字的生成、随机偏移、状态更新和到期移除保持原调用链；策略只筛选最终可见文字。闪电折线随机偏移仍调用原函数，见 `src/engine/modules/rendering/scene.js:231-232`，不能因其属于表现而删除 RNG 消费。

## 3. 墙地闪动修复

原深度排序按精灵到相机参考点的平面距离排序。两个同等角深度的墙面在相机微移时可以交换排序，产生遮挡跳变。清晰像素改用世界坐标的 `-(worldX + worldY)` 作为等角深度键，保留原命令池、倒序提交与 raised 偏移；原版像素仍使用原距离排序。

清晰像素另外关闭 Canvas 平滑采样，并将目标屏幕坐标取整，避免同一像素格内的亚像素变化造成纹理闪动。地面原投影另外存在格边界不连续：27px 格子配 13px 半格，相机余数取整跨界时让地面反向跳回 1px。清晰像素保留原格子间距，通过连续相机 Y 偏移消除该跳动；只改绘制坐标，不改模拟相机和角色移动。

`DepthSortedRenderer` 与 `ImmediateRenderer` 仍服从已有 `depthSortSprites` 选项。地图的菱形可见窗、相机运动、世界/地牢生成与模拟推进不变。

## 4. 验证与范围

执行 `npm run test:presentation`，需要开发服务器运行在 4173（也可用 `TEST_URL`）。测试使用独立浏览器上下文和原版 fixture 的临时副本，仅刷新副本时间戳以排除离线结算；原 fixture 不修改。

- 墙面排序反例：相机参考点 ±0.25，原路径排序翻转、1,542 个 RGBA 通道变化；修复后顺序相同、变化为 0。修复前清晰路径曾失败，记录在 `output/playwright/presentation-red.log`。
- 实际 `drawWorldTileRow` 格边界反例：相机跨过边界前后，原版地面 Y 为 224 → 225（反向跳动），清晰像素为 225 → 225；修复前该断言失败，见 `output/playwright/presentation-boundary-red.log`。
- 地形采样反例：位置 10.1 → 10.3，原路径 1,592 个通道变化，清晰路径为 0。
- 60 次重复绘制不重建缓存，画外精灵被剔除；锁定时间后连续切换样式，完整存档逐字节不变。
- 实际大地图与自然进入地牢后的画面均走地形缓存，清晰画面亮度低于对应原版画面；该检查验证接线，不把亮度当成美观评分。
- 1440×1000、1280×720、375×812 布局：地图顶部小于 100px、无横向溢出，存档/设置入口可用，风格偏好在刷新后保留；捕获 pageerror 以及被引擎吞入 console 的渲染异常。
- 当前截图与诊断位于 `output/playwright/presentation/`；完整回归结果由 `docs/WORKSTATE.md` 登记。

既有 89 场景中的 7 条 Canvas 指纹仍验证 `classic` 与原版 oracle，包括多视口、spellstorm 与 farm。新清晰画面为有意差异，未建立覆盖所有视口/场景组合的像素基线；跨浏览器、真机低端帧时间和用户设备上的所有闪动仍未验证。验收矩阵 Canvas 行继续保持 PARTIAL。

帧循环仍在 `src/engine/modules/simulation/loop.js:75-79` 的 try/catch 中绘制。异常会以 `Caught error.` 日志出现，因此只监听 pageerror 不足以验证渲染。
