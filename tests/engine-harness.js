// 仅用于测试：固定随机数与时间，以原发行包作为行为参照。
const {loadGamePanels} = await import('../src/ui/load-panels.js');
document.body.insertAdjacentHTML('afterbegin', await loadGamePanels());
window.requestAnimationFrame = () => 0;
let seed = 123456789;
let fixedNow = 1750000000000;
const resetRandom = () => { seed = 123456789; };
Math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
Date.now = () => fixedNow;
const original = new URLSearchParams(location.search).has('original');
let game, initialize, ready, snapshot, load, advance, isOffline, loopTick;
if (original) {
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'archive/original/c2.js'; script.onload = resolve; script.onerror = reject;
    document.head.append(script);
  });
  game = window.Game;
  initialize = () => game.Hr.Hr();
  ready = () => game.Em;
  snapshot = () => window.lB(game.pg);
  load = text => game.hE(text);
  advance = () => window.pB(15);
  isOffline = () => game.ig === true;
  loopTick = () => game.Hr.Hr();
} else {
  ({ game } = await import('../src/engine/modules/runtime/index.js'));
  const saves = await import('../src/engine/modules/persistence/game-save.js');
  const simulation = await import('../src/engine/modules/simulation/tick.js');
  initialize = () => game.loop.tick();
  ready = () => game.initialized;
  snapshot = () => saves.createSaveState(game.saves);
  load = text => game.importSave(text);
  advance = () => simulation.advanceSimulation(15);
  isOffline = () => game.processingOffline === true;
  loopTick = () => game.loop.tick();
}
game.onLoad();
for (let attempt = 0; !ready() && attempt < 200; attempt++) {
  await new Promise(resolve => setTimeout(resolve, 20));
  initialize();
}
if (!ready()) throw new Error('测试引擎初始化失败');
window.harness = {
  load(text) { resetRandom(); const ok = load(text); resetRandom(); if (!ok) throw new Error('存档载入失败'); return true; },
  snapshot,
  setTime(ms) { fixedNow = ms; },
  advance(turns) { for (let i = 0; i < turns; i++) advance(); return snapshot(); },
  // 离线结算由帧循环驱动（两端 tick 内 1E3 < 帧差 才进入离线分支）：
  // 时间每次前移 2 秒并执行一帧，直到离线处理结束（上限 2000 帧）。
  advanceOffline(maxTicks = 2000) {
    let ticks = 0;
    while (isOffline() && ticks < maxTicks) { fixedNow += 2000; loopTick(); ticks++; }
    return snapshot();
  }
};


