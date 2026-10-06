# 渲染层（Canvas）— 当前实现与验证边界

R35（2026-10-03）：用户明确要求移除顶部横幅和说明、上移主画面，并保留像素风明显减少杂乱，另报告墙壁与地面闪动。本轮只改 UI 和表现，不改玩法、数值、随机流、存档格式或原版素材文件。

R36（2026-10-03）：用户继续报告“移动时出现条纹，静止没有”。R35 的颜色处理保持不变；这次补上非整数显示缩放下的动态采样修复，不能用之前的静止指纹代替这一检查。

R37（2026-10-03）：用户要求调回最初的颜色。地面、墙壁、树木与装饰改回直接使用原素材的 RGB/alpha，取消降饱和、压低对比和地面 2×2 颜色采样；R36 的屏幕像素绘制、固定重采样、原点对齐与稳定排序保留。

## 1. 产品样式与原版验证路径

- 产品默认 `clean`（清晰像素），见 `src/app.js`；设置里可以切换到 `classic`（原版像素）。偏好单独存在 `C2_PRESENTATION_V1`，不写入游戏存档 JSON。
- `GameCanvasView` 的引擎默认仍为 `classic`，见 `src/engine/modules/rendering/scene.js`。原版差分 harness 不加载产品入口，因此继续验证原版绘制路径；这些指纹不能用来宣称 `clean` 像素与原版一致。
- 产品通过 adapter 的 `setPresentation` 命令切换样式；相同样式不重建缓存，见 `src/engine/modules/rendering/scene.js`。画布恢复时的 `createDomElements` 按已有样式重新创建策略，见 `src/engine/modules/rendering/scene.js`。
- 顶部横幅、远征页大标题/说明、组队页旁注与页尾说明已移除。保存状态、周目、存档管理和设置移到侧栏，原按钮 ID 保留。

## 2. 纯绘制边界

`createMapPresentation` 位于 `src/engine/modules/rendering/presentation.js`，仅依赖纯显示的 `frame.js`，不依赖 game、随机函数、游戏规则或存档。它接收 Canvas 上下文、精灵、坐标与显示数据，处理：

| 内容 | 清晰像素行为 |
|---|---|
| 地面 | 原素材颜色与纹理，基础缓存保留 RGB/alpha，非整数缩放后的地面缓存在透明边缘补一圈邻色像素以消除接缝 |
| 墙壁、树木与装饰 | 原素材颜色与纹理；独立缓存避免混用地面补边处理结果 |
| 角色、掉落物 | 保留原素材与颜色，整数屏幕坐标绘制 |
| 特效 | 保留帧和播放逻辑，绘制时降低透明度；画外精灵/动画剔除 |
| 血条 | 简短低对比色条；非队友满血时不画 |
| 浮动文字 | 显示最后 20 条，同一 42×24 区域最多 3 条并错开基线，柔和颜色和暗色描边 |

地形缓存按归一化 frame 对象分别放在两个 WeakMap；静态精灵与各动画帧都有稳定 frame 身份，动画包装对象不会导致每次绘制重建缓存。`cachedSprites`、`drawnSprites`、`culledSprites` 只作绘制诊断。缓存不会逐帧读像素或改写原图。地形层标记由 `drawWorldTileRow` 和 `drawDungeonTileRow` 显式传入，角色和掉落默认为 actor。

R36 另为角色/动画缓存裁切后的源帧，所有精灵先固定重采样到目标物理像素大小，再在每帧按整数物理像素位置绘制。每个源图只保留最近一个尺寸的重采样缓存，窗口变化不会积累所有历史尺寸；RGBA 读取与地面补边只发生在构建缓存时。

浮动文字的生成、随机偏移、状态更新和到期移除保持原调用链；策略只筛选最终可见文字。闪电折线随机偏移仍调用原函数，见 `src/engine/modules/rendering/scene.js`，不能因其属于表现而删除 RNG 消费。

## 3. 墙地闪动修复

原深度排序按精灵到相机参考点的平面距离排序。两个同等角深度的墙面在相机微移时可以交换排序，产生遮挡跳变。清晰像素改用世界坐标的 `-(worldX + worldY)` 作为等角深度键，保留原命令池、倒序提交与 raised 偏移；原版像素仍使用原距离排序。

清晰像素另外关闭 Canvas 平滑采样，并将目标屏幕坐标取整，避免同一像素格内的亚像素变化造成纹理闪动。地面原投影另外存在格边界不连续：27px 格子配 13px 半格，相机余数取整跨界时让地面反向跳回 1px。清晰像素保留原格子间距，通过连续相机 Y 偏移消除该跳动；只改绘制坐标，不改模拟相机和角色移动。

`DepthSortedRenderer` 与 `ImmediateRenderer` 仍服从已有 `depthSortSprites` 选项。默认旧素材保留原菱形候选窗；新素材超出旧方格范围时，根据图像边界反投影扩展地块候选区，并限制在实际加载的世界区块或地牢内。相机运动、世界/地牢生成与模拟推进不变。

R35 仍把 740×450 后备画布拉伸到产品容器宽度（例如 924px），并且整数“逻辑”坐标不能保证整数屏幕像素。移动时最近邻采样相位变化，表现为纹理宽窄交替的条纹。R36 的产品 adapter 根据容器宽度和 `devicePixelRatio` 同步后备画布、CSS 尺寸与屏幕像素原点；窗口 resize 和产品定时刷新会重算，尺寸相同时不清空画布。clean 的 CSS 显示指定 `crisp-edges` 最近邻，并从地图容器位置计算稳定 translate 对齐屏幕原点；原 Canvas 图像平滑仍关闭。引擎保留 740×450 逻辑坐标，clean 绘制将世界地块锚点和共用相机偏移分别吸附物理像素，使静态地形整层刚性平移。classic 恢复原后备尺寸与绘制逻辑，继续供 oracle 验证。

## 4. 验证与范围

执行 `npm run test:presentation`，需要开发服务器运行在 4173（也可用 `TEST_URL`）。测试使用独立浏览器上下文和原版 fixture 的临时副本，仅刷新副本时间戳以排除离线结算；原 fixture 不修改。

- 墙面排序反例：相机参考点 ±0.25，原路径排序翻转、1,542 个 RGBA 通道变化；修复后顺序相同、变化为 0。修复前清晰路径曾失败，记录在 `output/playwright/presentation-red.log`。
- 实际 `drawWorldTileRow` 格边界反例：相机跨过边界前后，原版地面 Y 为 224 → 225（反向跳动），清晰像素为 225 → 225；修复前该断言失败，见 `output/playwright/presentation-boundary-red.log`。
- 地形采样反例：位置 10.1 → 10.3，原路径 1,592 个通道变化，清晰路径为 0。
- 60 次重复绘制不重建缓存，画外精灵被剔除；锁定时间后连续切换样式，完整存档逐字节不变。
- 实际大地图与自然进入地牢后的画面均走地形缓存，检查验证绘制缓存接线；另外在原生尺寸逐像素核对地面/装饰与原素材 RGBA 完全一致，不再要求画面变暗。
- 1440×1000、1280×720、375×812 布局：地图顶部小于 100px、无横向溢出，存档/设置入口可用，风格偏好在刷新后保留；捕获 pageerror 以及被引擎吞入 console 的渲染异常。
- 当前截图与诊断位于 `output/playwright/presentation/`；完整回归结果由 `docs/WORKSTATE.md` 登记。

另执行 `npm run test:map-motion`：实际产品页面恢复 fixture，暂停模拟，只移动相机；检查大地图纹理和自然进入地牢后的实际墙体。四档 DPR（1 / 1.25 / 1.5 / 2）各取 8 帧，扣除相机平移后纹理 RGB 差异必须严格为 0，同时要求区域确有纹理。恢复旧后备尺寸作反向控制，必须触发非零差异。再将窗口缩到 1280px 和 375px，验证物理画布尺寸更新及墙体移动仍无变化。浏览器截图用固定物理像素裁切，防止元素截图在分数 CSS 边界扩边、重采样而污染测量；画布原始帧也保存以便定位。输出 `output/playwright/map-motion/metrics.json` 和各帧 PNG。此检查接入完整门禁，覆盖 Chrome 的上述缩放条件，不代表用户显示器或所有浏览器已经验收。

当前 91 场景中的 7 条 Canvas 指纹仍验证 `classic` 与原版 oracle，包括多视口、spellstorm 与 farm。新清晰画面为有意差异，未建立覆盖所有视口/场景组合的像素基线；跨浏览器、真机低端帧时间和用户设备上的所有闪动仍未验证。验收矩阵 Canvas 行继续保持 PARTIAL。

帧循环仍在 `src/engine/modules/simulation/loop.js` 的 try/catch 中绘制。异常会以 `Caught error.` 日志出现，因此只监听 pageerror 不足以验证渲染。

## 5. 语义素材、地图几何与动画（2026-10-04）

本轮解除的是“场景和 UI 直接解释图集像素”的耦合，旧 sprite sheet 保留为资源层的兼容输入。现在显示路径为：世界/实体语义 → `AssetCatalog` → 归一帧/动画 clip → `frame.js` → Canvas 或 UI 预览。新增包与具体配置见 [素材包导入](../assets/README.md)。

| 职责 | 当前实现 |
|---|---|
| 资源身份与替换 | `asset-catalog.js` 的 actors/terrain/items 目录；显式 `replace` 保持旧名称，图片全部加载成功才发布替换 |
| 图片来源 | `frame.js` 统一接受独图或 atlas 区域；旧 sourceX/sourceY 与固定方格只在兼容适配器中解释 |
| 尺寸与位置 | frame 独立记录 width/height、anchor、origin、offset；图片高度不改变世界坐标，角色和地形共享 `{27,40}` 兼容参考点 |
| 地块显示 | tile 保存 backgroundAssetId/decorationAssetId/cachedBackgroundAssetId；旧 Sprite 属性是晚解析访问器，替换素材后已生成地图也取新资源 |
| 额外物件 | world/level.sceneObjects 的 visualId、position、footprint/elevation；显示物件不改变规则，不进入存档 |
| 动画选择 | `entity-visual.js` 的 idle/walk/attack/death 与四/八方向；hurt/cast/interact 可由显示状态与 token 驱动；静态地块和场景物件支持 idle |
| 动画时间 | `(turnNumber × 15 + turnTimeAccumulator) × FRAME_DURATION_MS`；暂停不推进，播放器不消耗 RNG、不写实体或存档 |
| UI | `preview.js` 负责旧裁切窗口与新矩形预览，界面不再读取 atlas 坐标 |

实际逻辑地图是正交二维网格，每格 27 个模拟单位。地图投影由 `projection.js` 统一定义：令 `dx=x-centerX`、`dy=y-centerY`，则 `screenX=370+dx-dy`，`screenY=225+(dx+dy)×13/27-elevation`。每格基向量为 `(27,13)` 与 `(-27,13)`，对应约 54×26 的菱形 dimetric，轴线倾角约 25.7°。旧人物连续投影每格 Y 为 13.5，旧地图每格为 13；经典兼容分支保留这一历史差异，新归一帧实体和额外场景物件采用地图统一投影。清晰像素的地块基点和相机平移仍分开吸附物理像素，保留移动稳定性。

清晰像素按世界脚点 `-(x+y)` 排序。`depthOffset` 显式修正脚点，`footprint` 可将多格对象排序到占地前沿；图片的高宽与屏幕 Y 不参与规则深度。`layer` 只在相同深度打破平局，`overlay` 也不强制覆盖所有世界对象。人物从墙后移到墙前会改变世界深度，新人物血条按实际帧矩形顶部中心定位。

这仍是单脚点 painter 排序，不能处理一个长斜墙两端分别与角色前后交叉的所有情况。此类墙或大型建筑应拆成独立显示段；后续需要视觉部件/偏序遮挡。footprint 当前只描述显示前沿，未实现 2×2 Boss 的碰撞或寻路占地；sceneObjects 也没有地图编辑器、持久化或生成规则适配器。旧地块仍保留三个兼容显示槽，旧特效的推进帧数仍参与战斗时长，不能把角色装饰动画直接接进该规则链。

经典候选窗（`drawExpandedTiles` 返回 false 时的固定回退）已从 scene.js 里**两处各展开 35 行**的 `draw{World,Dungeon}TileRow` 调用，提为 `rendering/map-window.js` 的 `MAP_WINDOW_ROWS` 单一数据来源 + `drawClassicTileWindow`。该窗口不是可公式化的对称菱形（左缘在第 16→20 行之间跳变、右缘在 19–21 行持平），因此保持为**数据**；公式化会改变绘制调用序列、进而改变 classic 逐像素输出。窗口形状由 `tests/unit/map-window.test.mjs` 的金标准逐行锁定（等价于重构前展开序列），像素输出仍由 `npm run test:presentation` 的 7 条指纹保护。

验证入口为 `npm run test:assets`、`npm run test:presentation`、`npm run test:map-motion` 与原版 parity/scenarios。地图单测另覆盖负坐标逆变换、高图片基点出窗、世界脚点与多格前沿、真实命令遮挡顺序、空命令池排序与地块热替换；实际新增/替换、矩形图片及多帧角色/静态动画由浏览器素材验证覆盖。

## 6. 自然开放世界的全局坐标与视口缓存（R47）

“原野探索”使用独立世界/会话和原有语义资源层。32×32 区块、3×3 导航窗口、25 区块上限缓存；world.originX/originY 是窗口左上角的全局格坐标，不是相机坐标。导航和地表轮廓必须用全局坐标取格，越界返回 undefined，不能串到下一行。相机脚点仍经统一菱形投影，视觉锚点和多格占地排序不变。

Renderer 缓存当前视口加 120 CSS 像素边缘的地表图，缓存按 DPR 和 zoom 建立；相机平移只移动缓存图，离开安全边缘或已知格/室内/活动窗口/尺寸改变时重建。小地图单独缓存并限制宽度 120px；画外物件剔除。天然河岸、道路和生境曲线仍只连接已知格，纹理固定在世界坐标。连续世界水色不随窗口原点改变。树冠挡住已经绘制的队伍时淡化，房屋遮挡继续服从占地规则。

新浏览器验收 `scripts/test-village.mjs` 覆盖真实跨区探索与刷新恢复，并比较缓存地表和同一姿态强制重建的完整像素。`output/playwright/open-world/` 的生境图是完全探明的视口夹具，live-exploration/live-surroundings 才是实际入口的迷雾进度。重复绘制耗时只衡量缓存命中，不当成自动探索帧率或跨设备性能保证。
