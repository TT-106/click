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
let game, initialize, ready, snapshot, load, advance, isOffline, loopTick, restart, reset, syncLoopClock, upgradeCollections;
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
  ({ upgradeCollections } = await import('../src/engine/modules/content/balance.js'));
  // 引擎不直接碰 localStorage（宿主注入端口）。差分要比对"自动保存真正落盘的字节"，
  // 这里按 src/services/saves.js 的同一套键与备份语义注入端口。
  {
    const { configurePersistence } = await import('../src/engine/modules/runtime/storage-port.js');
    const { SAVE_KEY } = await import('../src/services/save-validation.js');
    configurePersistence({
      read: () => localStorage.getItem(SAVE_KEY),
      write: (value) => {
        const previous = localStorage.getItem(SAVE_KEY);
        if (previous && previous !== value) localStorage.setItem(SAVE_KEY + '_backup', previous);
        localStorage.setItem(SAVE_KEY, value);
      },
      remove: () => localStorage.removeItem(SAVE_KEY),
    });
  }
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
  offlineDuration() { return original ? game.jf : game.offlineDuration; },
  setTime(ms) {
    fixedNow = ms;
    // 时钟跳变后必须重置循环簿记，否则首帧帧差含历史偏移，
    // 会让离线结算的回合数因测试顺序不同而漂移（引擎逻辑本身不受影响）。
    syncLoopClock();
  },
  advance(turns) { for (let i = 0; i < turns; i++) advance(); return snapshot(); },
  advanceRaw(turns) { for (let i = 0; i < turns; i++) advance(); },
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
  characters() { return original ? window.Game.i.D : game.state.adventurers; },
  // U4 直接观察：逐帧扫描"活怪物"的瞬态效果队列，统计某类状态效果被施加的次数。
  // 队列不入存档，因此这是唯一能在两端各自计数再对账的入口；扫描只读数组，不消耗随机数。
  // 原版：w.Gf.Og 列表、角色效果容器 Ja.of、效果类型字段 X；重构版对应 effects.of / statusEffectTypeId。
  countEffectApplications(turns, typeId) {
    const monsterList = () => (original ? window.Game.Gf.Og : game.monsters.Og);
    const effectList = m => {
      const holder = original ? m.Ja : m.effects;
      return holder && holder.of;
    };
    const effectType = original ? (e => e.X) : (e => e.statusEffectTypeId);
    let applications = 0;
    const carrying = new Set();
    for (let i = 0; i < turns; i++) {
      advance();
      const list = monsterList();
      if (!Array.isArray(list)) throw new Error('活怪物列表访问失败');
      for (const monster of list) {
        const effects = effectList(monster);
        const has = Array.isArray(effects) && effects.some(e => effectType(e) === typeId);
        if (has) {
          if (!carrying.has(monster)) { carrying.add(monster); applications++; }
        } else {
          carrying.delete(monster);
        }
      }
    }
    return { applications, snapshot: snapshot() };
  },
  // U7：驱动"升级购买"这条只有视图层会触发的路径。视图里按钮的处理就是
  // `if (upgrade.canPurchaseNow()) upgrade.purchase()`，这里按同一条判断驱动引擎侧对象。
  // 不走 DOM：可购行是否渲染成 .upgradeButton 取决于排序后的可见槽位——实测 7 个 canPurchase
  // 为真的升级对应的 558 个按钮全部是 disabledUpgradeButton，DOM 路线不稳定且只能覆盖一侧。
  purchaseUpgrades({ turns = 0, limit = 8 } = {}) {
    for (let i = 0; i < turns; i++) advance();
    const collections = original ? window.Nx : upgradeCollections;
    if (!Array.isArray(collections)) throw new Error('升级集合访问失败');
    // 技能树不在 upgradeCollections 里，而是挂在每个角色身上（原版 ei/fi/gi/hi，
    // 见 c2.js:21558；重构版 skillTree1..4），要覆盖 CharacterSkillUpgrade 必须单独遍历。
    const groups = [];
    for (const collection of collections) {
      groups.push(...(original ? collection.HC : collection.upgradeRows));
    }
    for (const character of (original ? window.Game.i.D : game.state.adventurers)) {
      const trees = original
        ? [character.ei, character.fi, character.gi, character.hi]
        : [character.skillTree1, character.skillTree2, character.skillTree3, character.skillTree4];
      for (const tree of trees) if (tree) groups.push(...(original ? tree.HC : tree.upgradeRows));
    }
    let purchased = 0;
    for (const group of groups) {
      for (const upgrade of group) {
        if (purchased >= limit) break;
        const ready = original ? upgrade.qc() : upgrade.canPurchaseNow();
        if (ready) {
          if (original) upgrade.Qc(); else upgrade.purchase();
          purchased++;
        }
      }
    }
    return { purchased, snapshot: snapshot() };
  },
  // 冒险点升级不在 upgradeCollections 内，而在 PartyState 的点数管理器中。
  purchasePointUpgrades({ turns = 0, limit = 1 } = {}) {
    for (let i = 0; i < turns; i++) advance();
    const upgrades = original ? window.Game.i.ae.tl : game.state.adventurePoints.pointUpgrades;
    if (!Array.isArray(upgrades)) throw new Error('冒险点升级表访问失败');
    let purchased = 0;
    let readyCount = 0;
    for (const upgrade of upgrades) {
      if (purchased >= limit) break;
      // 原版点数面板 update 会经 UpgradeCollection 刷新 Cd；harness 无需打开面板也要走同一前置。
      upgrade.Cd();
      if (original ? upgrade.qc() : upgrade.canPurchaseNow()) {
        readyCount++;
        if (original) upgrade.Qc(); else upgrade.purchase();
        purchased++;
      }
    }
    return { purchased, readyCount, availablePoints: original ? window.Game.i.ae.Dd : game.state.adventurePoints.availablePoints, snapshot: snapshot() };
  },
  claimAchievement({ turns = 0 } = {}) {
    for (let i = 0; i < turns; i++) advance();
    const collections = original ? window.Nx : upgradeCollections;
    const rows = collections.flatMap(collection => original ? collection.HC : collection.upgradeRows).flat();
    let claimed = 0;
    for (const upgrade of rows) {
      if ((original ? upgrade.Na() : upgrade.getUpgradeType()) !== 14) continue;
      upgrade.Cd(); // 与升级面板刷新可购状态相同
      if (original ? upgrade.qc() : upgrade.canPurchaseNow()) {
        if (original) upgrade.Qc(); else upgrade.purchase();
        claimed++;
        break;
      }
    }
    return { claimed, snapshot: snapshot() };
  },
  equipBestItems({ turns = 0 } = {}) {
    for (let i = 0; i < turns; i++) advance();
    const collections = original ? window.Nx : upgradeCollections;
    const rows = collections.flatMap(collection => original ? collection.HC : collection.upgradeRows).flat();
    let equipped = 0;
    for (const upgrade of rows) {
      if ((original ? upgrade.Na() : upgrade.getUpgradeType()) !== 4) continue;
      upgrade.Cd();
      if (original ? upgrade.qc() : upgrade.canPurchaseNow()) {
        if (original) upgrade.Qc(); else upgrade.purchase();
        equipped++;
        break;
      }
    }
    return { equipped, snapshot: snapshot() };
  },
  // U7：药水激活也没有非视图入口（Potion.aw 只由药水按钮调用），激活会在存档里
  // 记 statistics.potionsUsed，因此两端各自断言计数增长，再照常做完整存档差分。
  // aw / 库存数组字段 re 两端同名（尚未重命名），只有 Game 上的容器字段不同名。
  activatePotions({ turns = 0, limit = 3 } = {}) {
    for (let i = 0; i < turns; i++) advance();
    const inventory = original ? window.Game.Yj : game.potions;
    const list = inventory && inventory.re;
    if (!Array.isArray(list)) throw new Error('药水库存访问失败');
    let attempted = 0;
    for (const potion of list) {
      if (attempted >= limit) break;
      potion.aw();
      attempted++;
    }
    return { attempted, snapshot: snapshot() };
  },
  // 渲染面观察（完全引擎无关，只看 DOM 画布）：不透明像素数。
  // 用于证明真实绘制确实发生——存档差分看不见画布，而渲染异常会被 loop.js 的
  // try/catch 吞成 console.log("Caught error. …")，所以这里配合 runner 侧的
  // console 监听才有意义。
  canvasInk() {
    let ink = 0;
    let spriteInk = 0;
    let pixelsHash = 0;
    const canvases = [...document.querySelectorAll('canvas')];
    for (const canvas of canvases) {
      try {
        const context = canvas.getContext('2d');
        const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
        const base = [data[0], data[1], data[2], data[3]];
        let painted = 0;
        let aboveBackground = 0;
        let hash = 2166136261;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] !== 0) painted++;
          if (data[i] !== base[0] || data[i + 1] !== base[1] || data[i + 2] !== base[2] || data[i + 3] !== base[3]) aboveBackground++;
          // 位置敏感的像素指纹：同一像素序列在两版必须得到同一个数（FNV-1a 逐字节）
          for (const channel of [data[i], data[i + 1], data[i + 2], data[i + 3]]) {
            hash = Math.imul(hash ^ channel, 16777619) >>> 0;
          }
        }
        ink += painted;
        spriteInk += aboveBackground;
        pixelsHash = (Math.imul(pixelsHash ^ hash, 16777619) + canvas.width * 31 + canvas.height * 17) >>> 0;
      } catch {
        // 无 2d 上下文或被污染的画布：不计入
      }
    }
    return { ink, nonBackgroundInk: spriteInk, pixelsHash, canvasCount: canvases.length };
  }
};


