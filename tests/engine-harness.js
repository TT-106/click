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
let game, initialize, ready, snapshot, load, advance, isOffline, loopTick, restart, reset, syncLoopClock, upgradeCollections, castScroll, PurchaseDungeonUpgrade;
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
  // 采样浮动战斗文字（用于暴击、首领击杀、伤害数字、治疗、免疫等瞬时视觉的直接计数对账）。
  countFloatingText({ turns = 0, text, pattern } = {}) {
    const list = () => (original ? window.Game.pc.al : game.floatingText.al);
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
  // 法术/攻击视觉特效直接对账：特效池（原版 Game.df.Wg / 重构版 game.effects.Wg）不入存档 DTO，
  // 渲染帧每帧消费池内 VisualEffect（sprites.js:164 清空标记 bg/Pk）。逐帧差分采样新入池特效的
  // impactEffectName 序列（创建次序即战斗事件次序），返回各类名称计数、总数与顺序列表。
  countVisualEffects({ turns = 0 } = {}) {
    const pool = () => (original ? window.Game.df.Wg : game.effects.Wg);
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
    const getMonsters = () => (isOriginal ? window.Game.Gf.Pi : game.monsters.Pi);
    const getFloating = () => (isOriginal ? window.Game.pc.al : game.floatingText.al);
    let bossEncounterTurns = 0;
    let bossSeenTurns = 0;
    let bossKills = 0;
    const bossNames = [];
    const seenKillTexts = new Set();
    for (let i = 0; i < turns; i++) {
      advance();
      const enc = getEncounter();
      if (enc && enc.du) {
        bossEncounterTurns++;
        if (enc.fw && !bossNames.includes(enc.fw)) bossNames.push(enc.fw);
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
    };
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
    c.Qk(item);
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
  castScrollDuringCombat({ maxTurns = 3000, scrollId } = {}) {
    const scroll = (original
      ? window.Game.nh.at.find(s => !s.Qe && s.mh > 0 && (!scrollId || s.qg === scrollId))
      : game.scrolls.at.find(s => !s.locked && s.quantity > 0 && (!scrollId || s.scrollId === scrollId)));
    if (!scroll) throw new Error(`没有已解锁且有库存的卷轴 (${scrollId || 'any'})`);
    const before = snapshot().statistics.scrollsUsed;
    let attempts = 0;
    for (let i = 0; i < maxTurns; i++) {
      advance();
      if ((original ? window.Game.Gf.Og : game.monsters.Og).length === 0) continue;
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
    const dungeon = (original ? window.Game.Aa.bk : game.dungeons.bk)[0];
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
        const pendingKills = original ? window.Game.Aa.Sd : game.dungeons.Sd;
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


