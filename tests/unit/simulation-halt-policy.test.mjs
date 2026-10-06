// 模拟停机策略（R55 阶段 0-B）。
//
// 切片前：GameLoop.prototype.tick 只给 game.view.render() 挂了 try/catch。模拟推进
// （advanceSimulation）一旦抛错，异常会逃出 tick，末尾的 requestAnimationFrame 永远
// 不会执行——循环静默死亡，而且没有任何提示。R54 已指出这一点。
//
// 切片后：模拟推进单独纳入 try/catch。故障即记录到 loop.simulationFault、上报宿主，
// 并且此后不再推进模拟、不再自动保存、不再累计游玩时长（避免用损坏状态覆盖最后有效
// 存档），但帧调度继续，resetRun / importSave 可以解除停机让循环恢复。
//
// 覆盖四件事：
//   1) 故障被记录并上报宿主，而不是静默死亡；
//   2) 停机后不再进入模拟（不无限续排已损坏的模拟）；
//   3) 停机后不再自动保存（最后有效记录不被覆盖）；
//   4) resetRun / importSave 解除停机，模拟恢复推进。
import test from 'node:test';
import assert from 'node:assert/strict';

// 组合根会装配素材加载，node 里没有 DOM：先铺最小桩再动态导入引擎模块。
globalThis.requestAnimationFrame = () => 0;
globalThis.Image = class {
  constructor() { this.width = 0; this.height = 0; this.complete = true; }
  set src(value) { this._src = value; }
  get src() { return this._src || ''; }
  addEventListener() {}
  removeEventListener() {}
  decode() { return Promise.resolve(); }
};
globalThis.document = {
  createElement: () => ({ getContext: () => null, width: 0, height: 0, style: {}, appendChild() {}, toDataURL: () => '' }),
  getElementById: () => null,
  addEventListener() {},
  removeEventListener() {},
};

const { GameLoop, initializeSimulationLoop } = await import('../../src/engine/modules/simulation/loop.js');
// game 由组合根 runtime/index.js 装配并导出；直接从 game.js 导入拿到的是未赋值的 var。
const { game } = await import('../../src/engine/modules/runtime/index.js');
const { configurePersistence } = await import('../../src/engine/modules/runtime/storage-port.js');
const { configureFaults, faults } = await import('../../src/engine/modules/runtime/fault-port.js');
const { nowMilliseconds } = await import('../../src/engine/modules/core/math.js');

assert.ok(game, '组合根未装配出 game 单例');
initializeSimulationLoop();

// tick() 末尾会调 requestAnimationFrame；node 没有它。
globalThis.requestAnimationFrame = () => 0;

function primeTickableGame() {
  game.initialized = true;
  game.partyCreated = true;
  game.gameWon = false;
  game.paused = false;
  game.processingOffline = false;
  game.renderEnabled = false;
  game.worldActive = false;
  game.level = { centerX: 0, centerY: 0 };
  game.camera = { viewportOffsetX: 0, viewportOffsetY: 0, tileColumn: 0, tileRow: 0 };
  // 真实 StatisticsRecorder 依赖尚未装配的内部状态；这里换成只记录不抛错的桩，
  // 好让"未停机"的帧能正常走完统计那一行（停机帧本来就该跳过它）。
  game.state.statisticsRecorder = { recordPlayedMilliseconds() {} };
  game.saves.lastSavedAt = 0;
  game.saves.autoSaveInterval = 1;
}

// 统计 advanceSimulation 被进入的次数：它每次进入都会先读 game.lifecycle。
function countingLifecycle() {
  const counter = { entries: 0, throwOnRead: false };
  return {
    counter,
    install() {
      Object.defineProperty(game, 'lifecycle', {
        configurable: true,
        get() {
          counter.entries++;
          if (counter.throwOnRead) throw new Error('模拟推进故障（注入）');
          return { turnTimeAccumulator: 0, regenTurnCounter: 0, regenIntervalTurns: 1e9 };
        },
      });
    },
  };
}

function makeLoop() {
  const loop = new GameLoop();
  loop.resourcesReady = true;
  loop.lastTickAt = 0;
  loop.lastFrameAt = 0;
  return loop;
}

test('模拟推进抛错：故障被记录并上报宿主，而不是静默死亡', () => {
  primeTickableGame();
  const lifecycle = countingLifecycle();
  lifecycle.install();
  lifecycle.counter.throwOnRead = true;
  const reported = [];
  configureFaults({ onSimulationFault: error => reported.push(error) });
  const loop = makeLoop();

  // 切片前这里会把异常抛给调用方（帧循环随即死掉）；切片后 tick 自己吞下并上报。
  loop.tick();

  assert.ok(loop.simulationFault, '故障未被记录');
  assert.equal(loop.simulationFault.name, 'Error');
  assert.equal(loop.simulationFault.message, '模拟推进故障（注入）');
  assert.equal(typeof loop.simulationFault.recordedAtMilliseconds, 'number');
  assert.equal(reported.length, 1, '宿主未收到故障上报');
  assert.equal(reported[0].message, '模拟推进故障（注入）');
  configureFaults({});
  assert.deepEqual(faults, {});
});

test('停机后不再进入模拟（不无限续排已损坏的模拟）', () => {
  primeTickableGame();
  const lifecycle = countingLifecycle();
  lifecycle.install();
  const loop = makeLoop();

  // 健康路径先证明计数器真的在数（否则本用例是空断言）。
  loop.tick();
  const healthyEntries = lifecycle.counter.entries;
  assert.ok(healthyEntries > 0, '健康路径没有进入模拟，计数器无效');

  lifecycle.counter.throwOnRead = true;
  loop.tick();
  const entriesAfterFault = lifecycle.counter.entries;
  assert.ok(loop.simulationFault, '预期进入停机状态');

  // 故障之后再 tick 若干次：模拟不得被再次进入。
  for (let index = 0; index < 5; index++) loop.tick();
  assert.equal(lifecycle.counter.entries, entriesAfterFault, '停机后仍在续排模拟');
});

test('停机后不再自动保存，最后有效记录不被覆盖', () => {
  primeTickableGame();
  const lifecycle = countingLifecycle();
  lifecycle.install();

  // 直接探测自动保存分支是否被进入：saveManager.autoSaveInterval 只在守卫内部被读取。
  // 间隔返回极大值让保存"始终不到期"：分支照样进入、getter 照样被读，但不会真的调用
  // saveProgress——那条路要先过 serializeGame，在本用例的最小游戏状态下会因与本用例
  // 无关的缺失字段抛错。不用 persistence.write 计数做断言也是同一个原因：用它断言会
  // 变成空断言（反向验证已抓到过一次）。
  const originalAutoSaveInterval = game.saves.autoSaveInterval;
  let autosaveBranchReads = 0;
  Object.defineProperty(game.saves, 'autoSaveInterval', {
    configurable: true,
    get() { autosaveBranchReads++; return Number.MAX_SAFE_INTEGER; },
    set() {},
  });
  let writes = 0;
  configurePersistence({ read: () => null, write: () => { writes++; }, remove: () => {} });
  try {
    const loop = makeLoop();

    // 对照：暂停时不推进模拟（避免深层模拟在最小状态下抛无关错），但自动保存分支
    // 只受停机与离线进度约束，因此仍会到达——这证明探针真的会数。
    game.paused = true;
    loop.tick();
    assert.equal(loop.simulationFault, null, '对照帧不应进入停机');
    assert.ok(autosaveBranchReads > 0, '健康路径没有进入自动保存分支，探针无效');
    const healthyReads = autosaveBranchReads;
    const healthyWrites = writes;

    // 注入故障。lastTickAt 要取一个**小时间差**而不是 0：
    //   - 取 0 → tickDeltaMs 巨大 → 走离线分支 → 它把 game.processingOffline 置 true，
    //     于是自动保存分支被 !game.processingOffline 挡住，本用例会变成空断言；
    //   - 沿用上一帧的时间戳 → tickDeltaMs≈0 → 模拟根本没被进入，也不会产生故障。
    // 取 16ms（<1E3，不进离线分支；/frameDuration 后 >0，正常进入模拟）。
    game.paused = false;
    loop.lastTickAt = nowMilliseconds() - 16;
    lifecycle.counter.throwOnRead = true;
    loop.tick();
    assert.equal(game.processingOffline, false, '本用例不应走离线分支，否则自动保存断言失效');
    assert.ok(loop.simulationFault, '预期进入停机状态');
    assert.equal(autosaveBranchReads, healthyReads, '停机当帧仍进入了自动保存分支');

    // 继续 tick：自动保存分支始终不被进入。
    for (let index = 0; index < 5; index++) loop.tick();
    assert.equal(autosaveBranchReads, healthyReads, '停机后仍进入自动保存分支');
    assert.equal(writes, healthyWrites, '停机后仍写入存档');
    assert.equal(game.saves.lastSavedAt, 0, '停机后仍更新 lastSavedAt');
  } finally {
    Object.defineProperty(game.saves, 'autoSaveInterval', {
      configurable: true, writable: true, value: originalAutoSaveInterval,
    });
    configurePersistence({ read: () => null, write: () => {}, remove: () => {} });
  }
});

test('resetRun 解除停机，模拟恢复推进', () => {
  primeTickableGame();
  const lifecycle = countingLifecycle();
  lifecycle.install();
  lifecycle.counter.throwOnRead = true;

  // 用真实引擎持有的 loop 实例走停机路径（宿主 rAF 已被打桩，由测试直接驱动 tick）。
  game.loop.resourcesReady = true;
  game.loop.lastTickAt = 0;
  game.loop.lastFrameAt = 0;
  game.loop.tick();
  assert.ok(game.loop.simulationFault, '预期 game.loop 进入停机状态');

  // 恢复路径：真实代码由 resetRun（restartRun / resetGame 共用）解除停机。
  lifecycle.counter.throwOnRead = false;
  game.resetRun(false);
  assert.equal(game.loop.simulationFault, null, 'resetRun 未解除停机');

  // resetRun 同时把队伍重置掉了（无队伍时本就不推进模拟），所以重新置为可推进状态：
  // 这样"恢复推进"只能由停机标记被解除来解释，而不是游戏状态。
  game.partyCreated = true;
  game.paused = false;
  const before = lifecycle.counter.entries;
  game.loop.tick();
  assert.ok(lifecycle.counter.entries > before, '解除停机后模拟未恢复推进');
});
