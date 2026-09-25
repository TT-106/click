import { $, escapeHtml, sprite, number } from './dom.js';
import { mountExpedition } from './legacy-panels.js';

export function createDashboard(onHero) {
  let heroKey = '', lastLocation = '', lastKills = 0, mounted = false;
  const entries = [];
  function log(message) {
    entries.unshift({ message, time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) });
    entries.length = Math.min(entries.length, 5);
    $('#journal-entries').innerHTML = entries.map(entry => `<li><time>${entry.time}</time><span>${escapeHtml(entry.message)}</span></li>`).join('');
  }
  $('#hero-list').addEventListener('click', event => { const button = event.target.closest('[data-hero]'); if (button) onHero(Number(button.dataset.hero)); });
  return {
    update(state) {
      if (!state.started) return;
      mountExpedition();
      if (!mounted) { log('冒险继续。愿你的队伍平安归来。'); mounted = true; }
      for (const [id, value] of Object.entries({ 'resource-gold': state.gold, 'resource-kills': state.kills, 'resource-xp': state.experience, 'resource-ap': state.points })) $(`#${id}`).textContent = number(value);
      $('#location-name').textContent = state.location;
      $('#floor-label').textContent = state.floor ? `地下 ${state.floor} 层` : '世界探索';
      $('#turn-count').textContent = number(state.turn);
      $('#map-state').textContent = state.paused ? '已暂停' : state.offline ? '结算离线收益' : state.inCombat ? '遭遇战斗' : '自动探索中';
      $('#map-state').dataset.state = state.paused ? 'paused' : state.inCombat ? 'combat' : 'exploring';
      $('#pause-overlay').hidden = !state.paused;
      $('#discovered-count').textContent = number(state.dungeons.discovered);
      $('#cleared-count').textContent = number(state.dungeons.cleared);
      const key = state.heroes.map(hero => `${hero.index}:${hero.name}:${hero.className}`).join('|');
      if (key !== heroKey) {
        heroKey = key;
        $('#hero-list').innerHTML = state.heroes.map(hero => `<button class="hero-card" data-hero="${hero.index}" aria-label="查看${escapeHtml(hero.name)}的技能与装备"><span class="hero-heading">${sprite(hero.sprite)}<span><strong>${escapeHtml(hero.name)}</strong><small>${escapeHtml(hero.className)} · Lv.<span data-level="${hero.index}"></span></small></span><span class="skill-count" data-skills="${hero.index}"></span></span><span class="stat-caption"><span>生命</span><span data-hp="${hero.index}"></span></span><span class="stat-bar health"><span data-hp-bar="${hero.index}"></span></span><span class="stat-caption"><span>法力</span><span data-sp="${hero.index}"></span></span><span class="stat-bar spirit"><span data-sp-bar="${hero.index}"></span></span><span class="hero-footer"><span data-attack="${hero.index}"></span><span>技能与装备 ↗</span></span></button>`).join('');
      }
      for (const hero of state.heroes) {
        const set = (key, value) => $(`[data-${key}="${hero.index}"]`).textContent = value;
        set('level', hero.level); set('hp', `${number(hero.health)} / ${number(hero.maxHealth)}`); set('sp', `${number(hero.spirit)} / ${number(hero.maxSpirit)}`);
        set('skills', hero.skillPoints ? `+${hero.skillPoints}` : ''); set('attack', `伤害 ${number(hero.damage)} · 护甲 ${number(hero.armor)}`);
        $(`[data-hp-bar="${hero.index}"]`).style.width = `${Math.min(100, Math.max(0, hero.health / Math.max(1, hero.maxHealth) * 100))}%`;
        $(`[data-sp-bar="${hero.index}"]`).style.width = `${Math.min(100, Math.max(0, hero.spirit / Math.max(1, hero.maxSpirit) * 100))}%`;
      }
      if (lastLocation && lastLocation !== state.location) log(`抵达${state.location}${state.floor ? ` · 地下 ${state.floor} 层` : ''}。`);
      if (Math.floor(state.kills / 10) > Math.floor(lastKills / 10)) log(`累计击败 ${number(state.kills)} 只怪物。`);
      lastLocation = state.location; lastKills = state.kills;
      $('#offline-notice').hidden = !state.offline;
      $('#offline-progress').textContent = `${state.offlineProgress}%`;
    }
  };
}
