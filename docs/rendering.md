# 渲染层（Canvas）— 实现实况

> 本文只写代码里真实存在的东西，每条都带 `file:line`。渲染层不参与存档，因此它的正确性只能靠"跑起来不报错 + 与原版逐像素一致"两类证据，见 §6。

## 1. 入口与门控

- 唯一驱动点是帧循环：`simulation/loop.js:74-78`

```js
if (game.renderEnabled) {
  try {
    game.view.render();
  } catch (l) {
    console.log("Caught error. name: " + l.name + " message: " + l.message + " exception: " + l);
  }
}
```

- `game.renderEnabled` 初值 `true`（`runtime/game.js:145`），并由可见性切换：`runtime/game.js:194` `game.renderEnabled = !document.hidden;`
- **渲染异常被吞成 `console.log`**，不会冒泡成 `pageerror`。任何只听 `pageerror` 的测试都看不到渲染崩溃——差分矩阵因此额外监听 console（`scripts/test-scenarios.mjs`），过滤掉 harness 页自发的 `/favicon.ico` 404（浏览器行为，与引擎无关）。

## 2. 两套绘制策略

`DepthSortedRenderer`（`rendering/scene.js:47`）与 `ImmediateRenderer`（`:67`）实现同一组绘制接口，由选项切换：`scene.js:350`

```js
a.se = game.options.depthSortSprites ? a.uE : a.DD;
```

- 深度排序版把每帧的绘制请求收进**命令池** `Hl`（计数 `Bn`），帧首 `hB()` 逐个 `resetRenderCommand` 复用，避免每帧新建对象；提交时 `hx()`（`:297-305`）：

```js
DepthSortedRenderer.prototype.hx = function () {
  if (!(2 > this.Bn)) {
    this.Hl.sort(this.FE);
  }
  var a;
  for (a = this.Bn - 1; 0 <= a; a--) {
    this.Hl[a].If(this.context);
  }
};
```

  即：元素数 ≥2 才排序，然后**倒序**绘制（距离相机焦点最远的先画）。
- 即时版不排序，拿到命令立刻 `If(context)`。
- `gx/fx` 与 `dk/fB` 的差别只有一行：`c.vr = 0.1;`（高亮/描边层，随后再画一次本体）。

## 3. 相机与等距投影

`DepthSortedRenderer.hB()` 每帧计算一个"焦点" `ko`，世界与地牢共用同一式子，只是像素原点不同（`scene.js:252-266`）：

```js
var b = game.viewportWidth / 2,
  c = 2 * game.viewportHeight;
a = game.world.he + (0.5 * (b - game.viewportHalfWidth) + (c - game.viewportHalfHeight)) | 0;
b = game.world.ie + (c - game.viewportHalfHeight - 0.5 * (b - game.viewportHalfWidth)) | 0;
setVector(this.ko, a, b);
```

- 每个精灵的深度 = 到焦点的平面距离：`distanceToPoint(this.ko, x, y)`（`:270`）。这就是排序键，不是 z 层号。
- 世界与地牢的像素原点分别是 `game.world.he/ie` 与 `game.level.Ki/Li`。

## 4. 一帧的绘制顺序

`GameCanvasView.prototype.update`（`scene.js:348` 起）按固定顺序发射命令，世界地图分支：

1. `fillStyle = "#000000"; fillRect(...)` 清屏；
2. **36 次 `drawWorldTileRow(a, 行, 起始列, 结束列)`**（`scene.js:356-391`）—— 起止列是硬编码的菱形窗（`b-5..b-3` 递增到 `b-20..b+12` 再收回），首行取相机所在行 `-18`；
3. `drawWorldCharacters(a, game.minions.eh)` → `drawWorldCharacters(a, game.state.adventurers)`（随从先画，冒险者后画）；
4. `if (game.options.showCombatText) drawFloatingText(a)`；
5. `a.se.hx()` 提交并按深度绘制；
6. 之后是 `showMapOverlay` 等覆盖层。

地牢分支同构：`drawDungeonTileRow` 枚举 36 行，随后 `drawDungeonCharacters(a, game.minions.eh)` → `drawDungeonCharacters(a, game.state.adventurers)`（`scene.js:619-620`）→ `drawCharacterEffects(a, getMonsters())`（`:621`）→ 高亮层 `drawCharacterHighlights`。

> 结论：可见窗不是"裁剪后画全部"，而是**按菱形窗的行枚举固定列区间**（世界与地牢各 36 行调用）。改这些常数会直接改变画面构成，逐像素指纹会变（见 §6）。

## 5. 精灵与动画查找

- `SpriteSheet.prototype.getSprite = function (a) { return this.Yh[a]; }`（`sprites.js:193-195`）—— 纯字典查表，**未命中返回 `undefined`**，不报错；把 `undefined` 交给绘制路径就会在 §1 的 try/catch 里变成一条 `Caught error.` 日志。
- 动画表未命中会打印：`sprites.js:90` `console.log("Failed to find animated sprite: " + a);`
- 帧序列由 `content/animations.js` 的静态表驱动（`AnimationSheet(sheetFile, cellSize, rows)`），条目字段已语义化为 `firstFrameColumn / firstFrameRow / lastRowFrameCount / lastFrameRow`，外加 `isDirectional`（`zc` 的原名）：为真时特效改为"转向朝向"而非逐帧推进（`simulation/tick.js` 的分支）。
- `SpriteAnimation` 的播放游标在 `sprites.js` 与 `RenderCommand` 中仍叫 `oc`（同字母双主，见 `docs/reverse-engineering/semantic-map.md` 第十二轮"刻意未做"）。

## 6. 渲染的验证手段（现状）

| 手段 | 位置 | 能证明什么 | 不能证明什么 |
|---|---|---|---|
| 逐像素指纹差分 | `tests/engine-harness.js` `canvasInk()` + `scripts/test-scenarios.mjs` 的 `rendered-scene` / `autosave-payload` | 同一状态下两版引擎在 1,300 真实帧后画布**完全一致**（FNV-1a 指纹相同，例：非背景像素 203,763、指纹 1853346327） | 只有一条场景、一种视口；不是全量像素回归基线 |
| 反向验证 | 手工把 `scene.js:341` 的 `drawImage` 目标横移 2 像素 | 指纹立刻分叉、场景失败 —— 检查有牙齿 | — |
| console 捕获 | `test-scenarios.mjs` 的 console 监听 | 被吞掉的渲染异常会让矩阵失败 | 只在真正执行绘制的步骤里有效（多数场景走 `advanceSimulation`，不绘制；`frames` 步骤才走 `loop.tick`） |
| E2E 截图 | `scripts/test-browser.mjs` | 页面确实出图、三种视口不溢出 | 截图未做基线比对 |

真实帧时间/掉帧分布见 `docs/performance-baseline.md` 与 `docs/performance-after.md`。
