import { runtime } from "./internal-api.js";
const {
  game
} = runtime;
const escapeName = text => text.replace(/[&<>"']/g, ch => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[ch]);
const plainName = text => {
  const el = document.createElement('textarea');
  el.innerHTML = text;
  return el.value;
};

/** 产品层的唯一引擎入口：校验命令并提供只读显示快照。 */
export const engine = {
  async boot(persistence) {
    runtime.setPersistence(persistence);
    game.onLoad();
    const start = performance.now();
    while (!game.view.panels.length || !game.partyCreated && !document.getElementById('startQuestButton')) {
      if (performance.now() - start > 15000) throw new Error('游戏资源加载超时，请刷新重试。');
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    // 新存档默认不显示调试帧率；老存档的选项原样保留。
    if (!game.partyCreated) game.options.showFps = false;
  },
  catalog() {
    return runtime.classes.map((entry, index) => {
      const sprite = game.monsterSprites.getSprite(entry.spriteName);
      return {
        id: index,
        name: entry.className,
        defaultName: entry.defaultName,
        description: entry.descriptionText,
        unlocked: game.state.victoryCount >= entry.requiredVictories,
        unlockRun: entry.requiredVictories + 1,
        sprite: {
          x: sprite.sourceX + 10,
          y: sprite.sourceY + 12
        }
      };
    });
  },
  get capacity() {
    return 4 + runtime.partyBonus.currentValue;
  },
  startParty(party) {
    if (game.partyCreated) throw new Error('当前冒险已经开始。');
    if (!party.length || party.length > this.capacity) throw new Error('请选择有效数量的队员。');
    const names = new Set();
    for (const member of party) {
      const definition = runtime.classes[member.id];
      const name = member.name.trim();
      if (!definition || game.state.victoryCount < definition.requiredVictories) throw new Error('该职业尚未解锁。');
      if (!name || name.length > 15 || names.has(name)) throw new Error('每位队员需要不同的名字（1–15 字）。');
      names.add(name);
    }
    const controller = game.view.panels.find(tab => tab.elementId === 'partyCreationTabContent');
    controller.selectedCharacters = party.map(member => ({
      classIndex: member.id,
      defaultName: escapeName(member.name.trim())
    }));
    controller.validParty = true;
    controller.startButton.onclick();
    game.paused = false;
  },
  snapshot() {
    return {
      ready: game.initialized,
      started: game.partyCreated,
      paused: game.paused,
      won: game.gameWon,
      offline: game.processingOffline,
      turn: game.state.turnNumber,
      run: game.state.victoryCount + 1,
      gold: game.state.party.gold,
      kills: game.state.party.kills,
      experience: game.state.party.experiencePoints,
      points: game.state.adventurePoints.availablePoints,
      location: game.currentDungeon ? game.currentDungeon.dungeonName : game.currentCastle ? game.currentCastle.castleName : '永冬荒野',
      floor: game.currentDungeon ? game.currentDungeon.currentLevelIndex + 1 : null,
      inWorld: game.worldActive,
      inCombat: !game.state.encounter.ym,
      offlineProgress: game.offlineDuration ? Math.min(100, Math.round(game.offlineProcessed / game.offlineDuration * 100)) : 0,
      dungeons: {
        discovered: game.dungeons.uj.length,
        cleared: game.dungeons.ze.length,
        farms: game.dungeons.dg.length
      },
      heroes: game.state.adventurers.map((hero, index) => {
        const sprite = game.monsterSprites.getSprite(hero.classDefinition.spriteName),
          stats = hero.stats;
        return {
          index,
          name: plainName(hero.adventurerName),
          className: hero.classDefinition.className,
          level: stats.characterLevel,
          health: stats.health,
          maxHealth: runtime.statValue(stats.maxHealth),
          spirit: stats.spirit,
          maxSpirit: runtime.statValue(stats.maxSpirit),
          damage: runtime.statValue(stats.damage),
          armor: runtime.statValue(stats.armor),
          skillPoints: hero.skillPoints + hero.initialSpellSkillPoint,
          sprite: {
            x: sprite.sourceX + 10,
            y: sprite.sourceY + 12
          }
        };
      }),
      options: {
        effects: game.options.showSpellEffects,
        text: game.options.showCombatText,
        map: game.options.showMapOverlay,
        offline: game.options.allowOfflineProgress,
        background: game.options.allowBackgroundProgress,
        fps: game.options.showFps
      }
    };
  },
  showPanel(id) {
    const tab = game.view.panels.find(tab => tab.elementId === id);
    if (!tab?.tabState.enabled) return false;
    for (const item of game.view.tabBar.tabs) item.selected = item === tab.tabState;
    game.view.render();
    return true;
  },
  pause(value = !game.paused) {
    game.paused = value;
  },
  setOption(name, enabled) {
    const fields = {
      effects: 'showSpellEffects',
      text: 'showCombatText',
      map: 'showMapOverlay',
      offline: 'allowOfflineProgress',
      background: 'allowBackgroundProgress',
      fps: 'showFps'
    };
    if (!Object.hasOwn(fields, name)) throw new Error('未知设置');
    game.options[fields[name]] = Boolean(enabled);
  },
  serialize() {
    return runtime.serialize();
  },
  importSave(value) {
    return runtime.importSave(value);
  },
  reset() {
    game.resetGame();
  }
};
