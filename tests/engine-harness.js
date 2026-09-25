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
let game, initialize, ready, snapshot, load, advance, isOffline, loopTick, restart, reset, syncLoopClock;
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
  restart = () => game.OA();
  reset = () => game.gE();
  syncLoopClock = () => { game.Hr.Os = fixedNow; game.Hr.XA = fixedNow; };
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
  restart = () => game.restartRun();
  reset = () => game.resetGame();
  syncLoopClock = () => { game.loop.lastTickAt = fixedNow; game.loop.lastFrameAt = fixedNow; };
  // U1 调试（?watchDa 开启）：类型观察器——combatTarget/targetCharacter 的所有写操作经 setter 校验值形状，
  // 违例（把角色塞给动作字段或反之）记入 window.__daAssert，用于定位 Da 拆分的残留误分类行。
  if (new URLSearchParams(location.search).has('watchDa')) {
    const { Character } = await import('../src/engine/modules/characters/character.js');
    const { CombatAction } = await import('../src/engine/modules/combat/actions.js');
    window.__daAssert = [];
    const watch = (ctor, prop, validate) => {
      const p = ctor.prototype;
      Object.defineProperty(p, prop, {
        configurable: true,
        get() { return this['__' + prop]; },
      set(v) {
        if (v != null && !validate(v)) window.__daAssert.push(prop + ' ← ' + (v.constructor && v.constructor.name));
        // U1：非空→空转换记录（提前清空 combatTarget 的误分类写点定位）
        if (prop === 'combatTarget' && v === null && this['__' + prop] != null && window.__daNullLog !== undefined) {
          const st = (new Error().stack || '').split('\n').filter(l => l.includes('/src/') || l.includes('c2.js')).slice(0, 3).map(l => l.replace(/^.*modules\//, '').replace(/^.*archive\//, '').replace(/:\d+:\d+\)?/, '')).join(' < ');
          window.__daNullLog.push(st.slice(0, 220));
          if (window.__daNullLog.length > 12) window.__daNullLog.shift();
        }
        this['__' + prop] = v;
      },
      });
    };
    const isCharacter = v => v.stats !== undefined && v.position !== undefined && v.effects !== undefined;
    const isAction = v => v.attacker !== undefined && v.xb !== undefined;
    // 语义：CombatAction.targetCharacter 的值是被瞄准的 Character（与 combatTarget 同形）
    watch(Character, 'combatTarget', isCharacter);
    watch(CombatAction, 'targetCharacter', isCharacter);
    // U1 第五轮：捕获"把活怪物写入冒险者 combatTarget"的调用栈（原版此路径写的是 MonsterType）
    window.__ct2Stacks = [];
    const origSet = Object.getOwnPropertyDescriptor(Character.prototype, 'combatTarget').set;
    Object.defineProperty(Character.prototype, 'combatTarget', {
      configurable: true,
      get: Object.getOwnPropertyDescriptor(Character.prototype, 'combatTarget').get,
      set(v) {
        if (v && v.characterType === 2 && this.characterType !== 2) {
          const st = (new Error().stack || '').split('\n').filter(l => l.includes('/src/')).slice(0, 3).map(l => l.replace(/^.*modules\//, '').replace(/:\d+:\d+\)?/, '')).join(' < ');
          window.__ct2Stacks.push((this.adventurerName || '?') + ' ← ' + st.slice(0, 200));
          if (window.__ct2Stacks.length > 6) window.__ct2Stacks.shift();
        }
        origSet.call(this, v);
      },
    });
  }
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
  setTime(ms) {
    fixedNow = ms;
    // 时钟跳变后必须重置循环簿记，否则首帧帧差含历史偏移，
    // 会让离线结算的回合数因测试顺序不同而漂移（引擎逻辑本身不受影响）。
    syncLoopClock();
  },
  advance(turns) { for (let i = 0; i < turns; i++) advance(); return snapshot(); },
  // 离线结算由帧循环驱动（两端 tick 内 1E3 < 帧差 才进入离线分支）：
  // 时间每次前移 2 秒并执行一帧，直到离线处理结束（上限 2000 帧）。
  advanceOffline(maxTicks = 2000) {
    let ticks = 0;
    while (isOffline() && ticks < maxTicks) { fixedNow += 2000; loopTick(); ticks++; }
    return snapshot();
  },
  // 胜利重置（保留统计，开启新一轮）
  restart() { restart(); return snapshot(); },
  // 完全重置（回到开局）
  reset() { reset(); return snapshot(); },
  // 空转：经真实帧循环推进时间（无队伍时循环只待机）——用于重置后的守卫路径
  idle(count) { for (let i = 0; i < count; i++) { fixedNow += 250; loopTick(); } return snapshot(); },
  // U1 诊断：统一角色列表访问（原版 w.i.D / 重构 game.state.adventurers）
  characters() { return original ? window.Game.i.D : game.state.adventurers; }
};


