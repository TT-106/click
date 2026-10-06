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
let game, initialize, ready, snapshot, load, advance, isOffline, loopTick, restart, reset, syncLoopClock, upgradeCollections, castScroll, PurchaseDungeonUpgrade, generateItem, ItemDrop, getAttackCooldown, getSpellSpiritCost, statValue, subscribeGameEvents;
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
  ({ castScroll } = await import('../src/engine/modules/combat/scrolls.js'));
  ({ PurchaseDungeonUpgrade } = await import('../src/engine/modules/progression/upgrades.js'));
  ({ generateItem, ItemDrop } = await import('../src/engine/modules/loot/items.js'));
  ({ getAttackCooldown, getSpellSpiritCost, statValue } = await import('../src/engine/modules/characters/stats.js'));
  // 继续征程事件取证：重构端有事件总线，原版没有——原版侧不插桩（保持只读、无侵入）。
  ({ subscribeGameEvents } = await import('../src/engine/modules/core/math.js'));
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
  clock() { return fixedNow; },
  __dbgFarmable2() {
    const f = game.dungeons.farmable;
    const bad = f.filter(d => !d.region);
    return { len: f.length, bad: bad.length, badIds: bad.slice(0, 3).map(d => d.dungeonId),
      ctor: f[0] ? f[0].constructor.name : '?' };
  },
  __dbgFarmable() {
    const f = original ? window.Game.Aa.bk : game.dungeons.farmable;
    return f.slice(0, 6).map(d => original
      ? { zj: !!d.zj, conquered: d.zj ? d.zj.conquered : null, isFarm: d.isFarm }
      : { region: !!d.region, conquered: d.region ? d.region.conquered : null, isFarm: d.isFarm });
  },
  // frames 场景用：把"距上次保存"拨回 310s，使 325s 的帧窗口确定性跨过 300s 自动保存阈值
  //（lastSavedAt 可能被载入写入钉在场景顺序相关的累积时钟上）。原版 qc 无此字段名，pg.qs 即上次保存时刻。
  rewindAutosaveTimer() {
    if (original) window.Game.pg.qs = fixedNow - 310000;
    else game.saves.lastSavedAt = fixedNow - 310000;
  },
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
  advanceFrameGap(gapMs = 5000) {
    const beforeTurn = snapshot().turnNumber;
    fixedNow += gapMs;
    loopTick();
    const snap = snapshot();
    return { gapMs, turnDelta: snap.turnNumber - beforeTurn, snapshot: snap };
  },
  // 胜利重置（保留统计，开启新一轮）
  restart() { restart(); return snapshot(); },
  // 完全重置（回到开局）
  reset() { reset(); return snapshot(); },
  // 空转：经真实帧循环推进时间（无队伍时循环只待机）——用于重置后的守卫路径
  idle(count) { for (let i = 0; i < count; i++) { fixedNow += 250; loopTick(); } return snapshot(); },
  // frames 场景诊断：自动保存未触发时输出保存管理器与时钟状态（仅诊断用，不入断言）
  autosaveDiagnostics() {
    // 原版保存管理器是 w.pg（qs=lastSavedAt、UC=interval），重构版是 game.saves
    const saves = original ? window.Game.pg : game.saves;
    const lastSavedAt = original ? saves.qs : saves.lastSavedAt;
    const autoSaveInterval = original ? saves.UC : saves.autoSaveInterval;
    return { lastSavedAt, fixedNow, autoSaveInterval, now: Date.now() };
  },
  // U1 诊断：统一角色列表访问（原版 w.i.D / 重构 game.state.adventurers）
  characters() { return original ? window.Game.i.D : game.state.adventurers; },
  // U4 直接观察：逐帧扫描"活怪物"的瞬态效果队列，统计某类状态效果被施加的次数。
  // 队列不入存档，因此这是唯一能在两端各自计数再对账的入口；扫描只读数组，不消耗随机数。
  // 原版：w.Gf.Og 列表、角色效果容器 Ja.of、效果类型字段 X；重构版对应 effects.activeEffects / statusEffectTypeId（of 已改名 activeEffects）。
  countEffectApplications(turns, typeId) {
    const monsterList = () => (original ? window.Game.Gf.Og : game.monsters.defeatedMonsters);
    const effectList = m => {
      const holder = original ? m.Ja : m.effects;
      return holder && (original ? holder.of : holder.activeEffects);
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
  // 盟友侧状态效果直接计数：cat=3（提高护甲）这类**增益落在施法者队伍**身上，而上面那个
  // countEffectApplications 只扫活怪物队列（原版 `w.Gf.Og`），对盟友增益恒为 0。故单列一个扫
  // 全体冒险者的入口；同样只读数组、不消耗随机数。原版 `w.i.D` = 冒险者列表（见 characters()）。
  countAllyEffectApplications(turns, typeId) {
    const allyList = () => (original ? window.Game.i.D : game.state.adventurers);
    const effectList = m => {
      const holder = original ? m.Ja : m.effects;
      return holder && (original ? holder.of : holder.activeEffects);
    };
    const effectType = original ? (e => e.X) : (e => e.statusEffectTypeId);
    let applications = 0;
    const carrying = new Set();
    for (let i = 0; i < turns; i++) {
      advance();
      const list = allyList();
      if (!Array.isArray(list)) throw new Error('盟友列表访问失败');
      for (const ally of list) {
        const effects = effectList(ally);
        const has = Array.isArray(effects) && effects.some(e => effectType(e) === typeId);
        if (has) {
          if (!carrying.has(ally)) { carrying.add(ally); applications++; }
        } else {
          carrying.delete(ally);
        }
      }
    }
    return { applications, snapshot: snapshot() };
  },
  // 采样浮动战斗文字（用于暴击、首领击杀、伤害数字、治疗、免疫等瞬时视觉的直接计数对账）。
  countFloatingText({ turns = 0, text, pattern } = {}) {
    const list = () => (original ? window.Game.pc.al : game.floatingText.texts);
    let count = 0;
    let sum = 0;
    const seen = new Set();
    const texts = [];
    const matcher = text !== undefined
      ? (t => t === text)
      : pattern ? (t => new RegExp(pattern).test(t)) : (() => true);
    for (let i = 0; i < turns; i++) {
      advance();
      const current = list();
      if (Array.isArray(current)) {
        for (const item of current) {
          if (matcher(item.text) && !seen.has(item)) {
            seen.add(item);
            count++;
            texts.push(item.text);
            if (typeof item.text === 'string' && /^[+-]?\d+$/.test(item.text)) {
              sum += parseInt(item.text, 10);
            }
          }
        }
      }
    }
    return { count, sum, texts, snapshot: snapshot() };
  },
  // 法术/攻击视觉特效直接对账：特效池（原版 Game.df.Wg / 重构版 game.effects.pool）不入存档 DTO，
  // 渲染帧每帧消费池内 VisualEffect（sprites.js:164 清空标记 bg/Pk）。逐帧差分采样新入池特效的
  // impactEffectName 序列（创建次序即战斗事件次序），返回各类名称计数、总数与顺序列表。
  countVisualEffects({ turns = 0 } = {}) {
    const pool = () => (original ? window.Game.df.Wg : game.effects.pool);
    // 特效名字段：原版 Zb 构造器存 this.ca（c2.js:7184），重构版已语义化为 impactEffectName
    const nameOf = effect => (original ? effect.ca : effect.impactEffectName);
    const namesByType = {};
    const namesInOrder = [];
    let total = 0;
    for (let i = 0; i < turns; i++) {
      advance();
      const current = pool();
      if (Array.isArray(current)) {
        for (const effect of current) {
          const name = effect && nameOf(effect);
          if (typeof name === 'string') {
            namesByType[name] = (namesByType[name] ?? 0) + 1;
            namesInOrder.push(name);
            total++;
          }
        }
      }
    }
    return { total, namesByType, namesInOrder, snapshot: snapshot() };
  },
  // 采样首领遭遇（用于首领遭遇进入、首领怪物存活、首领击杀文字与遭遇命名的直接对账）。
  trackBossEncounter({ turns = 0 } = {}) {
    const isOriginal = original;
    const getEncounter = () => (isOriginal ? window.Game.i.Xg : game.state.encounter);
    const getMonsters = () => (isOriginal ? window.Game.Gf.Pi : game.monsters.activeMonsters);
    const getFloating = () => (isOriginal ? window.Game.pc.al : game.floatingText.texts);
    let bossEncounterTurns = 0;
    let bossSeenTurns = 0;
    let bossKills = 0;
    const bossNames = [];
    const seenKillTexts = new Set();
    for (let i = 0; i < turns; i++) {
      advance();
      const enc = getEncounter();
      if (enc && (isOriginal ? enc.du : enc.isBossEncounter)) {
        bossEncounterTurns++;
        const bossName = isOriginal ? enc.fw : enc.encounterName;
        if (bossName && !bossNames.includes(bossName)) bossNames.push(bossName);
      }
      const monsters = getMonsters();
      if (Array.isArray(monsters)) {
        if (monsters.some(m => (isOriginal ? m.zb === 4 : m.characterType === 4))) {
          bossSeenTurns++;
        }
      }
      const floats = getFloating();
      if (Array.isArray(floats)) {
        for (const item of floats) {
          if (item.text === '击杀首领!' && !seenKillTexts.has(item)) {
            seenKillTexts.add(item);
            bossKills++;
          }
        }
      }
    }
    return {
      bossEncounterTurns,
      bossSeenTurns,
      bossKills,
      bossNames,
      snapshot: snapshot(),
    };
  },
  // 直接观察胜利终局面板：GameOverView.onGameWon 启用并选中 gameOverTabContent 的 TabState，
  // 帧渲染后该面板在 legacy DOM 中 display !== none。返回可见性与面板文本（两端内容一致性对账）。
  observeVictoryPanel() {
    const el = document.getElementById('gameOverTabContent');
    const style = el ? window.getComputedStyle(el) : null;
    return {
      gameOverVisible: !!el && !!style && style.display !== 'none',
      gameOverText: el ? (el.innerText || '').slice(0, 400) : '',
      runNumber: snapshot().victoryCount,
      // 带上即时 DTO：让"胜利面板挂载"这一步也能作为后续步骤的 previous 基线，
      // 避免下一步（真实继续点击）在分叉诊断里读到 undefined.turnNumber。
      snapshot: snapshot(),
    };
  },
  // 真实"继续征程"按钮：在各自页面内查找唯一按钮并触发其真实 onclick，证明继续路径
  // 确实经由产品界面接线（而不是测试直接调底层复位）。返回即时 DTO、落盘原文与结构判定；
  // Continue 事件顺序只对重构端取证（原版无事件总线，不插桩）。
  clickContinueRun() {
    const label = '继续 - 用你当前的队伍征服新的城堡.';
    const buttons = [...document.querySelectorAll('.upgradeButton')]
      .filter(el => (el.innerHTML || '').indexOf(label) === 0);
    if (buttons.length !== 1) throw new Error(`继续按钮应唯一存在，实际找到 ${buttons.length} 个`);
    const button = buttons[0];
    if (typeof button.onclick !== 'function') throw new Error('继续按钮缺少 onclick 处理器');
    const worldBefore = original ? window.Game.S : game.world;
    const levelBefore = original ? window.Game.Ba : game.level;
    const dungeonFarms = original ? window.Game.Aa.dg : game.dungeons.farms;
    const before = snapshot();
    const events = [];
    let eventProbe = null;
    let unsubscribe = null;
    if (!original) {
      unsubscribe = subscribeGameEvents(event => {
        events.push(`${event.category}:${event.action}`);
        if (event.category === 'Victory' && event.action === 'Decision: Continue') {
          // 事件发生瞬间的只读探针：胜利标记应已清除、世界尚未替换
          eventProbe = { gameWon: game.gameWon, worldReplaced: game.world !== worldBefore };
        }
      });
    }
    try {
      button.onclick();
    } finally {
      if (unsubscribe) unsubscribe();
    }
    const after = snapshot();
    const worldAfter = original ? window.Game.S : game.world;
    const levelAfter = original ? window.Game.Ba : game.level;
    const allies = original ? window.Game.$h.Pf : game.allies.allies;
    const startBlock = original ? worldAfter.q[1][1] : worldAfter.worldBlocks[1][1];
    const startRegionKey = original
      ? startBlock.Hd + '_' + startBlock.Id
      : startBlock.regionColumn + '_' + startBlock.regionRow;
    const startCastle = original ? window.Game.kb.ju[startRegionKey] : game.castles.byRegionKey[startRegionKey];
    return {
      buttonCount: buttons.length,
      before,
      snapshot: after,
      savedText: localStorage.getItem('C2_V1_001'),
      eventOrder: original ? null : events,
      eventProbe,
      worldReplaced: worldAfter !== worldBefore,
      levelReplaced: levelAfter !== levelBefore,
      dungeonFarmCountBefore: dungeonFarms.length,
      allyNames: allies.map(a => (original ? a.Xt : a.adventurerName)),
      startingRegionUnlocked: Boolean(startCastle)
        && (original ? startCastle.$b === false : startCastle.regionLocked === false),
    };
  },
  // 再次进入：合法导入一份已胜利存档 → 挂载面板 → 点击真实继续按钮。
  // 用于证明继续入口每次读取"当前状态"，而不是绑定期缓存的状态子对象。
  reloadAndContinue({ text, idleFrames = 30 } = {}) {
    const ok = this.load(text);
    if (!ok) throw new Error('重载已胜利存档失败');
    for (let i = 0; i < idleFrames; i++) { fixedNow += 250; loopTick(); }
    return this.clickContinueRun();
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
    const purchasedByType = {};
    for (const group of groups) {
      for (const upgrade of group) {
        if (purchased >= limit) break;
        // 视图刷新路径先刷新可购状态再判断（type 13"攻击城堡"等只在刷新时计算 canPurchase）
        if (original) upgrade.Cd(); else upgrade.refreshAvailabilityState();
        const ready = original ? upgrade.qc() : upgrade.canPurchaseNow();
        if (ready) {
          const type = original ? upgrade.Na() : upgrade.getUpgradeType();
          if (original) upgrade.Qc(); else upgrade.purchase();
          purchased++;
          purchasedByType[type] = (purchasedByType[type] ?? 0) + 1;
        }
      }
    }
    return { purchased, purchasedByType, snapshot: snapshot() };
  },
  // 手动装备（装备交换）：引擎无独立"卸下"动作——把背包道具装进占用槽位时，
  // equipItem 自动把旧装备送回背包（removeInventoryItemAt 仅存在于出售路径与装备交换）。
  // 两侧入口同名：Character.prototype.Qk（原版 e.Qk → $w + Kd(21)，重构版 → equipItem + awardAdventurePoints(21)）。
  // 原版背包字段 Ld.items / 重构版 inventory.items；道具名字段原版 Ew、重构版 itemName（M12 已语义化）。
  equipFromInventory({ charIndex = 0, itemName = '', turns = 0 } = {}) {
    for (let i = 0; i < turns; i++) advance();
    const chars = original ? window.Game.i.D : game.state.adventurers;
    const c = chars[charIndex];
    const inv = original ? c.Ld : c.inventory;
    const nameField = original ? 'Ew' : 'itemName';
    const item = inv.items.find(x => x[nameField] === itemName);
    if (!item) throw new Error('inventory missing item: ' + itemName);
    if (original) c.Qk(item); else c.equipItem(item);
    return { equippedItemName: itemName, snapshot: snapshot() };
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
      if (original) upgrade.Cd(); else upgrade.refreshAvailabilityState();
      if (original ? upgrade.qc() : upgrade.canPurchaseNow()) {
        readyCount++;
        if (original) upgrade.Qc(); else upgrade.purchase();
        purchased++;
      }
    }
    return { purchased, readyCount, availablePoints: original ? window.Game.i.ae.Dd : game.state.adventurePoints.availablePoints, snapshot: snapshot() };
  },
  claimAchievement({ turns = 0, limit = 1 } = {}) {
    for (let i = 0; i < turns; i++) advance();
    const collections = original ? window.Nx : upgradeCollections;
    const rows = collections.flatMap(collection => original ? collection.HC : collection.upgradeRows).flat();
    const slots = rows.filter(upgrade => (original ? upgrade.Na() : upgrade.getUpgradeType()) === 14);
    let claimed = 0;
    // 领取槽只有 4 个但成就队列可能更长：每轮刷新后逐槽领取，直到领满或队列排空
    for (let pass = 0; pass < 20 && claimed < limit; pass++) {
      let progress = 0;
      for (const upgrade of slots) {
        if (claimed >= limit) break;
        if (original) upgrade.Cd(); else upgrade.refreshAvailabilityState(); // 与升级面板刷新可购状态相同
        if (original ? upgrade.qc() : upgrade.canPurchaseNow()) {
          if (original) upgrade.Qc(); else upgrade.purchase();
          claimed++;
          progress++;
        }
      }
      if (progress === 0) break;
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
      if (original) upgrade.Cd(); else upgrade.refreshAvailabilityState();
      if (original ? upgrade.qc() : upgrade.canPurchaseNow()) {
        if (original) upgrade.Qc(); else upgrade.purchase();
        equipped++;
        break;
      }
    }
    return { equipped, snapshot: snapshot() };
  },
  // U7：EquipItemUpgrade（type 3「装备背包散件」）定向驱动——与视图同一条
  // refresh → canPurchaseNow → purchase 链（同上 type 4 驱动器的 type 3 版）。
  // 取证（upgrades.js:490-495）：purchase 经 item.inventory（= owner 角色）调 Character.equipItem；
  // 背链由 generateItem（items.js:203 `b.inventory = c`）与 AI 拾取路径 addInventoryItem
  // （character.js:1033 → inventory.js:15 `b.inventory = a.owner`）建立；候选列表
  // game.inventories.list 由 tick.js:490-508 在任一 inventory.dirty 时重建（仅含"优于已装备"的散件，
  // 按 itemGold 降序）。本驱动不写装备槽、不伪造背链；返回购买前后装备槽摘要，
  // 供场景断言"购买真的把散件装进了槽位"而非仅"purchase 被调用"。
  purchaseEquipItemUpgrades({ turns = 0, limit = 5 } = {}) {
    for (let i = 0; i < turns; i++) advance();
    const digest = s => (s.adventurers ?? []).map(a => (a.equippedItemCollection ?? []).map(e => e.itemName).sort().join('|'));
    const before = snapshot();
    const collections = original ? window.Nx : upgradeCollections;
    const rows = collections.flatMap(collection => original ? collection.HC : collection.upgradeRows).flat();
    let purchased = 0;
    for (const upgrade of rows) {
      if (purchased >= limit) break;
      if ((original ? upgrade.Na() : upgrade.getUpgradeType()) !== 3) continue;
      if (original) upgrade.Cd(); else upgrade.refreshAvailabilityState();
      if (original ? upgrade.qc() : upgrade.canPurchaseNow()) {
        if (original) upgrade.Qc(); else upgrade.purchase();
        purchased++;
      }
    }
    const after = snapshot();
    return {
      purchased,
      equipmentBefore: digest(before),
      equipmentAfter: digest(after),
      snapshot: after,
    };
  },
  castScrollDuringCombat({ maxTurns = 3000, scrollId } = {}) {
    const scroll = (original
      ? window.Game.nh.at.find(s => !s.Qe && s.mh > 0 && (!scrollId || s.qg === scrollId))
      : game.scrolls.scrollList.find(s => !s.locked && s.quantity > 0 && (!scrollId || s.scrollId === scrollId)));
    if (!scroll) throw new Error(`没有已解锁且有库存的卷轴 (${scrollId || 'any'})`);
    const before = snapshot().statistics.scrollsUsed;
    let attempts = 0;
    for (let i = 0; i < maxTurns; i++) {
      advance();
      if ((original ? window.Game.Gf.Og : game.monsters.defeatedMonsters).length === 0) continue;
      attempts++;
      if (original) window.Hq(scroll, false); else castScroll(scroll, false);
      if (snapshot().statistics.scrollsUsed > before) break;
    }
    const currentId = original ? scroll.qg : scroll.scrollId;
    return { attempts, cast: snapshot().statistics.scrollsUsed - before, scrollId: currentId, snapshot: snapshot() };
  },
  purchaseDungeonFarm({ turns = 0 } = {}) {
    for (let i = 0; i < turns; i++) advance();
    const collections = original ? window.Nx : upgradeCollections;
    const rows = collections.flatMap(collection => original ? collection.HC : collection.upgradeRows).flat();
    let purchased = 0;
    for (const upgrade of rows) {
      if ((original ? upgrade.Na() : upgrade.getUpgradeType()) !== 8) continue;
      if (original) upgrade.Cd(); else upgrade.refreshAvailabilityState();
      if (original ? upgrade.qc() : upgrade.canPurchaseNow()) {
        if (original) upgrade.Qc(); else upgrade.purchase();
        purchased++;
        break;
      }
    }
    return { purchased, snapshot: snapshot() };
  },
  purchaseDungeonRowFarm({ turns = 0 } = {}) {
    for (let i = 0; i < turns; i++) advance();
    const dungeon = (original ? window.Game.Aa.bk : game.dungeons.farmable)[0];
    if (!dungeon) throw new Error('没有可购买的地牢行');
    const upgrade = original ? new window.Es(dungeon) : new PurchaseDungeonUpgrade(dungeon);
    if (original) upgrade.Cd(); else upgrade.refreshAvailabilityState();
    const purchased = original ? upgrade.qc() : upgrade.canPurchaseNow();
    if (purchased) {
      if (original) upgrade.Qc(); else upgrade.purchase();
    }
    return { purchased: Number(purchased), snapshot: snapshot() };
  },
  harvestFarmKills({ turns = 0 } = {}) {
    for (let i = 0; i < turns; i++) advance();
    const collections = original ? window.Nx : upgradeCollections;
    const rows = collections.flatMap(collection => original ? collection.HC : collection.upgradeRows).flat();
    let harvested = 0;
    let killsHarvested = 0;
    for (const upgrade of rows) {
      if ((original ? upgrade.Na() : upgrade.getUpgradeType()) !== 9) continue;
      if (original) upgrade.Cd(); else upgrade.refreshAvailabilityState();
      if (original ? upgrade.qc() : upgrade.canPurchaseNow()) {
        const pendingKills = original ? window.Game.Aa.Sd : game.dungeons.pendingFarmKills;
        killsHarvested = pendingKills;
        if (original) upgrade.Qc(); else upgrade.purchase();
        harvested++;
        break;
      }
    }
    return { harvested, killsHarvested, snapshot: snapshot() };
  },
  lootTreasureDuringExplore({ maxTurns = 15000, kind = 1 } = {}) {
    const registry = original ? window.Game.th : game.treasure;
    const party = original ? window.Game.i.da : game.state.party;
    const adventurers = original ? window.Game.i.D : game.state.adventurers;
    const statKey = { 1: 'treasureChestsLooted', 2: 'weaponRacksLooted', 3: 'bookcasesLooted' }[kind];
    if (!statKey) throw new Error(`不支持的宝物类型: ${kind}`);
    const before = snapshot().statistics[statKey];
    let selected = 0;
    let spawned = 0;
    for (let i = 0; i < maxTurns; i++) {
      advance();
      // 目标物字段：原版 Mn/Kg/Mf/Nn/el/hq，重构版已语义化为 targets/opened/kind/room/selected/setTargetTreasureChest
      const targets = original ? registry.Mn : registry.targets;
      spawned = Math.max(spawned, targets.length);
      if (i % 10 === 0 && snapshot().statistics[statKey] > before) break;
      // 与财宝房按钮相同：只选择角色所在房间、尚未搜索的目标物。
      const openedKey = original ? 'Kg' : 'opened';
      const kindKey = original ? 'Mf' : 'kind';
      const roomKey = original ? 'Nn' : 'room';
      const selectedKey = original ? 'el' : 'selected';
      const chest = targets.find(chest => !chest[openedKey] && chest[kindKey] === kind && adventurers.some(a =>
        (original ? a.p.w : a.position.room) === chest[roomKey]));
      if (chest && !chest[selectedKey]) {
        chest[selectedKey] = true;
        if (original) party.hq(chest); else party.setTargetTreasureChest(chest);
        selected++;
      }
    }
    return { selected, spawned, looted: snapshot().statistics[statKey] - before, snapshot: snapshot() };
  },
  // P-3 远古稀有度：用**各自引擎自己的** generateItem 构造一件合法的指定稀有度物品，
  // 作为真实 ItemDrop 放进某队员所在房间的脚下，随后完全交给原版 AI 的
  // 认领→行走→拾取路径（TravelWorldBehavior → targetItemDrop → actionType 6 →
  // character.js 拾取分支里的 recordItemFound）。测试的唯一干预是"掉落物位置 + 稀有度"：
  // 不改掉落概率、不碰固定 LCG、不直接写统计字段。
  // 字段对照：重构 position.levelPosition/.room/.slotList ↔ 原版 p.u/.w/.Z；
  // 重构 generateItem/ItemDrop/itemDrops.drops ↔ 原版 Nv/zv/dh.yf（c2.js:20619/20453/18614）。
  // 掉落是否被拾取直接读 drop 的 collected 旗标（不入存档、每帧可读、不消耗随机数）。
  seedAncientItemDrop({ maxTurns = 4000, rarity = 4, slotIndex = 0 } = {}) {
    const adventurers = () => (original ? window.Game.i.D : game.state.adventurers);
    const roomOf = a => (original ? a.p.w : a.position.room);
    // fixture 队伍从世界地图出发（roomId=-1）：先推进到有人进入地牢房间再放置
    let waited = 0;
    while (waited < maxTurns && !adventurers().some(roomOf)) {
      advance();
      waited++;
    }
    const anchor = adventurers().find(roomOf);
    if (!anchor) throw new Error('推进 ' + maxTurns + ' 回合内没有队员进入任何房间，无法放置掉落物');
    const position = original ? anchor.p : anchor.position;
    const levelPosition = original ? position.u : position.levelPosition;
    // 原版 Vector2（Za）的字段是 T/U；重构版已语义化为 x/y（见 c2.js:7014）
    const levelX = original ? levelPosition.T : levelPosition.x;
    const levelY = original ? levelPosition.U : levelPosition.y;
    const slotList = original ? anchor.Z : anchor.slotList;
    const slot = slotList[slotIndex % slotList.length];
    const generator = original ? window.Game.Sm : game.itemGenerator;
    const item = original
      ? window.Nv(generator, slot, anchor, 1, rarity)
      : generateItem(generator, slot, anchor, 1, rarity);
    if (!item) throw new Error('generateItem 未产出物品（该槽位没有物品类型?）');
    const drops = original ? window.Game.dh.yf : game.itemDrops.drops;
    const drop = original
      ? new window.zv(item, levelX, levelY, position.w)
      : new ItemDrop(item, levelX, levelY, position.room);
    drops.push(drop);
    let turns = 0;
    while (turns < maxTurns && !(original ? drop.gc : drop.collected)) {
      advance();
      turns++;
    }
    return {
      seeded: true,
      collected: Boolean(original ? drop.gc : drop.collected),
      itemName: original ? item.Ew : item.itemName,
      waited,
      turns,
      snapshot: snapshot(),
    };
  },
  // P-2 cat=15（发现财宝箱）直接可观测量：财宝目标的 selected 旗标（原版 el）全库只有
  // 两个写点——本法术（actions.js:721 ↔ c2.js:20955）与财宝房 UI 按钮（c2.js:27719，
  // 场景从不驱动按钮）。且该法术的 AI 行为评分（behaviors.js getFinalScore）只在
  // "所在房间有未开启、未选中的财宝目标"时非零，因此施法成功 ⟺ selected 置真。
  // 注意不能只看终态计数：setChestOpened(treasure.js:41) 在开箱时会把 selected 清回 false
  // （AI 会自然开箱，实测 4 次施法后终态为 0），所以必须逐帧统计 false→true 的跳变次数。
  // selected 不入存档（运行时字段），存档差分看不见它——这正是本观察器的价值。
  // 只读、不消耗随机数。
  countSelectedTreasure({ turns = 0 } = {}) {
    const targets = () => (original ? window.Game.th.Mn : game.treasure.targets);
    const isSelected = t => Boolean(original ? t.el : t.selected);
    const previous = new Map();
    let selections = 0;
    for (let i = 0; i < turns; i++) {
      advance();
      const current = targets();
      if (!Array.isArray(current)) throw new Error('财宝目标注册表访问失败');
      for (const t of current) {
        const now = isSelected(t);
        if (now && previous.get(t) === false) selections++;
        previous.set(t, now);
      }
    }
    return { selections, snapshot: snapshot() };
  },
  // 差分原版正常开局路径（U132 补课）：reset 到两端一致的空白态后，用**镜像字段写入**
  // 驱动各自的原生开局闭包，再对创建结果做完整 DTO 差分。原版侧取证（c2.js）：
  // 控制器 Az（26306-26312）F="partyCreationTabContent"、Vb=selectedCharacters（元素 {Qy:classIndex, za:defaultName}）、
  // Ww=validParty、$i=startButton（DOM id "startQuestButton"）；onclick 闭包 26363-26414
  // （守卫 `1 > a.Vb.length || !a.Ww`，"Party Creation" 串 @26410 定位创建体）；
  // 视图宿主 w.Ee（gameFields: Ee→view；44293 `Ee: new ay`、23492 ay、23497 panels 数组 Tc）。
  async createPartyFromBlank({ members, turns = 0, mode = 'legacy' } = {}) {
    if (!Array.isArray(members) || !members.length) throw new Error('members 不能为空');
    reset();
    const controller = () => (original
      ? window.Game.Ee.Tc.find(t => t.F === 'partyCreationTabContent')
      : game.view.panels.find(t => t.elementId === 'partyCreationTabContent'));
    const startButtonOf = c => (original ? c.$i : c.startButton);
    let waited = 0;
    while (waited < 600) {
      const c = controller();
      if (c && startButtonOf(c)) break;
      fixedNow += 250;
      loopTick();
      waited++;
    }
    const c = controller();
    if (!c || !startButtonOf(c)) throw new Error('reset 后组队面板未重新挂载（startButton 为空），无法驱动原分开局路径');
    if (original) {
      // 原版没有产品入口，mode 仅对重构端有意义：原版永远走遗留按钮闭包
      c.Vb = members.map(m => ({ Qy: m.classIndex, za: m.defaultName }));
      c.Ww = true;
      startButtonOf(c).onclick();
    } else if (mode === 'product') {
      // U133 主线二：走产品 adapter.startParty（内部：校验→escapeName→controller.startParty→paused=false）。
      // adapter 经 internal-api 与本 harness 共享同一 game 单例，属于公平调用而非复制组队逻辑。
      const adapterModule = await import('../src/engine/adapter.js');
      adapterModule.engine.startParty(members.map(m => ({ id: m.classIndex, name: m.defaultName })));
    } else {
      c.selectedCharacters = members.map(m => ({ classIndex: m.classIndex, defaultName: m.defaultName }));
      c.validParty = true;
      startButtonOf(c).onclick();
    }
    for (let i = 0; i < turns; i++) advance();
    return {
      created: Boolean(original ? window.Game.lg : game.partyCreated),
      waited,
      snapshot: snapshot(),
    };
  },
  // P-1 技能消费证据：按定义 id 定向购买一个角色技能树升级（与视图同一条
  // refresh→canPurchase→purchase 路径）。原版 CharacterSkillUpgrade 的定义访问器是
  // Jr（返回 skillDefinition；原版定义形状 {c:id, title, e:description, g:statBonusValue, f:statType}，
  // c2.js:12443 起）；重构版为 getUpgradeDefinition/.id。
  // 技能树内第 2+ 项依赖前一项已购（bindSkillTree 设 prerequisite，原版 Wp，c2.js:21560-21566），
  // 因此沿前置链从树根顺序购买；点数不足时如实返回 not-purchasable。
  purchaseCharacterSkill({ charIndex = 0, skillId } = {}) {
    const indexes = Array.isArray(charIndex) ? charIndex : [charIndex];
    for (const index of indexes) {
      const outcome = this.purchaseCharacterSkillOne({ charIndex: index, skillId });
      if (!outcome.purchased) return { ...outcome, charIndex: index };
    }
    const snapshotState = snapshot();
    const allOwned = indexes.every(i => ['upgrades1', 'upgrades2', 'upgrades3', 'upgrades4']
      .some(k => ((snapshotState.adventurers ?? [])[i] ?? {})[k]?.[skillId] === true));
    return { purchased: allOwned, skillId, snapshot: snapshotState };
  },
  purchaseCharacterSkillOne({ charIndex = 0, skillId } = {}) {
    const chars = original ? window.Game.i.D : game.state.adventurers;
    const c = chars[charIndex];
    if (!c) throw new Error('角色下标不存在: ' + charIndex);
    const trees = original ? [c.ei, c.fi, c.gi, c.hi] : [c.skillTree1, c.skillTree2, c.skillTree3, c.skillTree4];
    let target = null;
    for (const tree of trees) {
      const rows = original ? tree.HC : tree.upgradeRows;
      for (const row of rows) {
        for (const upgrade of row) {
          const definition = original ? upgrade.Jr() : upgrade.getUpgradeDefinition();
          const definitionId = original ? definition.c : definition.id;
          if (definition && definitionId === skillId) { target = upgrade; break; }
        }
        if (target) break;
      }
      if (target) break;
    }
    if (!target) return { purchased: false, reason: 'not-found', skillId, snapshot: snapshot() };
    const chain = [];
    for (let u = target; u; u = (original ? u.Wp : u.prerequisite)) chain.unshift(u);
    const bought = [];
    for (const upgrade of chain) {
      const id = original ? upgrade.Jr().c : upgrade.getUpgradeDefinition().id;
      // purchase() 自身守卫已购与点数不足（原版 Qc 同构），链上已购项安全跳过
      if (original) upgrade.Qc(); else upgrade.purchase();
      bought.push(id);
    }
    const adv = snapshot().adventurers[charIndex] ?? {};
    const ownedNow = ['upgrades1', 'upgrades2', 'upgrades3', 'upgrades4'].some(k => (adv[k] ?? {})[skillId] === true);
    return { purchased: ownedNow, bought, skillId, snapshot: snapshot() };
  },
  // P-1 被动族切片（statType 10 冷却缩减）：只读观察战斗节奏公式 getAttackCooldown
  // （stats.js:40，消费点 character.js:134 canAttack——每次攻击时机的真实判定）。
  // 原版为 Mw(a,b)（c2.js:21272，角色面板"冷却回合"同源）；字段 原版 ao ↔ 重构 attackCooldownReduction。
  readAttackCooldown({ charIndex = 0 } = {}) {
    const c = (original ? window.Game.i.D : game.state.adventurers)[charIndex];
    if (!c) throw new Error('角色下标不存在: ' + charIndex);
    const stats = original ? c.K : c.stats;
    const cooldown = original ? window.Mw(stats, true) : getAttackCooldown(stats, true);
    const reduction = original ? stats.ao : stats.attackCooldownReduction;
    return { cooldown, reduction, snapshot: snapshot() };
  },
  // P-1 被动族（statType 2-7 增益族，132+ 条定义）：只读直读组合属性公式 statValue
  // （stats.js:14-16；原版 $h，c2.js:21246-21249）。一次覆盖 damage/armor/attackRating/
  // defenceRating/maxHealth/maxSpirit 六个分量——组合值正是全部伤害/命中/生存公式的输入。
  readStatValue({ charIndex = 0, component = 'damage' } = {}) {
    const c = (original ? window.Game.i.D : game.state.adventurers)[charIndex];
    if (!c) throw new Error('角色下标不存在: ' + charIndex);
    const stats = original ? c.K : c.stats;
    const componentField = (original ? {
      damage: 'sd', armor: 'je', attackRating: 'xe', defenceRating: 'Ae', maxHealth: 'Jb', maxSpirit: 'Ke',
    } : {
      damage: 'damage', armor: 'armor', attackRating: 'attackRating', defenceRating: 'defenceRating', maxHealth: 'maxHealth', maxSpirit: 'maxSpirit',
    })[component];
    if (!componentField) throw new Error('未知分量: ' + component);
    const comp = stats[componentField];
    const value = original ? window.$h(comp) : statValue(comp);
    return {
      value,
      skillBonusPercent: original ? comp.wc : comp.skillBonusPercent,
      snapshot: snapshot(),
    };
  },
  // P-1 被动族（statType 26 召唤上限）：只读直读 stats.maxSummonedMinions（原版 gl，
  // c2.js 侧经 symbol-map）。消费点 ai/behaviors.js:1418,1462——召唤行为评分与上限门控。
  readSummonLimit({ charIndex = 0 } = {}) {
    const c = (original ? window.Game.i.D : game.state.adventurers)[charIndex];
    if (!c) throw new Error('角色下标不存在: ' + charIndex);
    const stats = original ? c.K : c.stats;
    return { limit: original ? stats.gl : stats.maxSummonedMinions, snapshot: snapshot() };
  },
  // P-1 被动族（statType 8 生命回复）：只读直读 stats.healthRegenBonus（原版 ap，
  // symbol-map）。消费点 simulation/tick.js:42——每 3 回合回复量公式。
  readRegenBonus({ charIndex = 0 } = {}) {
    const c = (original ? window.Game.i.D : game.state.adventurers)[charIndex];
    if (!c) throw new Error('角色下标不存在: ' + charIndex);
    const stats = original ? c.K : c.stats;
    return { bonus: original ? stats.ap : stats.healthRegenBonus, snapshot: snapshot() };
  },
  // P-1 被动族（statType 11-15 法术强度）：只读直读五个增益强度字段。
  // 原版名（symbol-map）：Ts=healPotency、Rs=buffDamagePotency、Ps=buffArmorPotency、
  // Qs=buffAttackRatingPotency、Ss=buffDefenceRatingPotency。消费点 combat/actions.js:94,131,134,137,140
  // （治疗/增益法术量公式）。
  readBuffPotencies({ charIndex = 0 } = {}) {
    const c = (original ? window.Game.i.D : game.state.adventurers)[charIndex];
    if (!c) throw new Error('角色下标不存在: ' + charIndex);
    const stats = original ? c.K : c.stats;
    return {
      heal: original ? stats.Ts : stats.healPotency,
      damage: original ? stats.Rs : stats.buffDamagePotency,
      armor: original ? stats.Ps : stats.buffArmorPotency,
      attackRating: original ? stats.Qs : stats.buffAttackRatingPotency,
      defenceRating: original ? stats.Ss : stats.buffDefenceRatingPotency,
      snapshot: snapshot(),
    };
  },
  // P-1 剩余被动族（statType 1/9/16/20/21/22/25/27/28/29）：一次直读全部剩余技能字段。
  // 原版名（symbol-map）：wo=damageResistance、pq=spiritRegenBonus、xn=spellCostReduction、
  // mr=controlTargetBonus、ar=chainArcBonus、Qq=rainAreaBonus、ho=areaRadiusBonus、
  // Ft=transformTargetBonus、vt=swiftStrikeTargetBonus、nt=ricochetCountBonus。
  // 消费点：actions.js:587(1)、tick.js:47(9)、stats.js:52(16)、character.js:900(20)、:513(21)、
  // :586(22)、:677+tick.js:300(25)、:902(27)、:857(28)、:878(29)。
  readSkillFields({ charIndex = 0 } = {}) {
    const c = (original ? window.Game.i.D : game.state.adventurers)[charIndex];
    if (!c) throw new Error('角色下标不存在: ' + charIndex);
    const stats = original ? c.K : c.stats;
    const F = original
      ? { damageResistance: 'wo', spiritRegenBonus: 'pq', spellCostReduction: 'xn', controlTargetBonus: 'mr', chainArcBonus: 'ar', rainAreaBonus: 'Qq', areaRadiusBonus: 'ho', transformTargetBonus: 'Ft', swiftStrikeTargetBonus: 'vt', ricochetCountBonus: 'nt', healthRegenBonus: 'ap' }
      : { damageResistance: 'damageResistance', spiritRegenBonus: 'spiritRegenBonus', spellCostReduction: 'spellCostReduction', controlTargetBonus: 'controlTargetBonus', chainArcBonus: 'chainArcBonus', rainAreaBonus: 'rainAreaBonus', areaRadiusBonus: 'areaRadiusBonus', transformTargetBonus: 'transformTargetBonus', swiftStrikeTargetBonus: 'swiftStrikeTargetBonus', ricochetCountBonus: 'ricochetCountBonus', healthRegenBonus: 'healthRegenBonus' };
    const fields = {};
    for (const [k, f] of Object.entries(F)) fields[k] = stats[f];
    return { fields, snapshot: snapshot() };
  },
  // P-1 被动族（statType 16 施法花费缩减）：直读 getSpellSpiritCost 公式输出
  // （stats.js:52 = min(base - floor(reduction/100×base), statValue(maxSpirit))；
  //   原版同构函数 bu，c2.js:21284-21286；字段 原版 mt=spellSpiritCost、xn=reduction、Ke=maxSpirit）。
  // base = stats.spellSpiritCost（按角色等级派生，simulation/characters.js:184），
  // reduction = stats.spellCostReduction（原版 xn）。消费点：施法决策的可施性判定。
  readSpellCostProbe({ charIndex = 0 } = {}) {
    const c = (original ? window.Game.i.D : game.state.adventurers)[charIndex];
    if (!c) throw new Error('角色下标不存在: ' + charIndex);
    const stats = original ? c.K : c.stats;
    return {
      base: original ? stats.mt : stats.spellSpiritCost,
      reduction: original ? stats.xn : stats.spellCostReduction,
      discounted: original ? window.bu(stats) : getSpellSpiritCost(stats),
      maxSpiritValue: original ? window.$h(stats.Ke) : statValue(stats.maxSpirit),
      snapshot: snapshot(),
    };
  },
  // U7：药水激活也没有非视图入口（Potion.activate 只由药水按钮调用），激活会在存档里
  // 记 statistics.potionsUsed，因此两端各自断言计数增长，再照常做完整存档差分。
  // 重构侧 Potion.activate 已语义化，原版侧仍是 aw（archive 不可改）→ 双端分支；
  // 库存数组字段 potionList/re 仍两端同名，只有 Game 上的容器字段不同名。
  activatePotions({ turns = 0, limit = 3 } = {}) {
    for (let i = 0; i < turns; i++) advance();
    const inventory = original ? window.Game.Yj : game.potions;
    const list = inventory && (original ? inventory.re : inventory.potionList);
    if (!Array.isArray(list)) throw new Error('药水库存访问失败');
    let attempted = 0;
    for (const potion of list) {
      if (attempted >= limit) break;
      if (original) potion.aw(); else potion.activate(game.state);
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


