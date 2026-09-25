import { loadGamePanels } from './ui/load-panels.js';
import { engine } from './engine/adapter.js';
import { createSaveService } from './services/saves.js';
import { MAX_SAVE_BYTES } from './services/save-validation.js';
import { $, $$, icon, escapeHtml } from './ui/dom.js';
import { createPartyBuilder } from './ui/party-builder.js';
import { createDashboard } from './ui/dashboard.js';
import { enhanceLegacyControls, mountExpedition } from './ui/legacy-panels.js';

let toastTimer, currentPage = 'expedition', activeHero = 0, booted = false;
function notify(message, error = false) {
  clearTimeout(toastTimer);
  $('#toast-message').textContent = message;
  $('#toast').dataset.error = String(error);
  $('#toast').hidden = false;
  if (!error) toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 4500);
}
const saves = createSaveService(engine, notify);
const titles = {
  expedition: ['远征 / 探索中', '小队的脚步，从未停歇。', '探索、战斗、成长。下一场奇遇就在前方。'],
  heroes: ['冒险手册 / 冒险者', '每位伙伴，各有所长。', '分配技能点，整理装备，打造属于你的阵容。'],
  dungeons: ['冒险手册 / 地牢', '深入未知，收复失地。', '追踪地牢状态，将清理过的地牢变为农场。'],
  castles: ['冒险手册 / 城堡', '让大陆重见光明。', '攻陷城堡，解除永恒之冬的诅咒。'],
  monsters: ['冒险手册 / 怪物图鉴', '了解你的下一位对手。', '升级怪物，换取更丰厚的冒险回报。'],
  points: ['冒险手册 / 成就与点数', '每一步，皆有回响。', '把旅途中的里程碑，化作下一次出发的力量。'],
  settings: ['冒险手册 / 设置与帮助', '按你的节奏冒险。', '调整游戏偏好，了解这片大陆的规则。'],
  info: ['冒险手册 / 统计资料', '你的冒险，皆有记录。', '查看本周目与历次冒险的详细统计。'],
  victory: ['远征 / 胜利', '永冬终将散去。', '回顾战果，准备下一次远征。']
};
const panels = { dungeons:'dungeonsTabContent', castles:'castlesTabContent', monsters:'monstersTabContent', points:'pointsTabContent', info:'infoTabContent', victory:'gameOverTabContent' };
const dashboard = createDashboard(index => { activeHero = index; navigate('heroes'); });

function navigate(page, focus = false) {
  if (!booted) return;
  const state = engine.snapshot();
  if (!state.started && ['heroes','dungeons','castles','monsters'].includes(page)) return;
  currentPage = page;
  const setup = page === 'expedition' && !state.started;
  const title = setup ? ['远征 / 准备出发', '每段传奇，都始于一支小队。', '召集冒险者，走进永冬笼罩的大陆。'] : titles[page];
  ['page-eyebrow','page-title','page-description'].forEach((id,index) => { $(`#${id}`).textContent = title[index]; });
  $('#setup-screen').hidden = !setup;
  $('#expedition-screen').hidden = page !== 'expedition' || !state.started;
  $('#settings-screen').hidden = page !== 'settings';
  $('#legacy-screen').hidden = ![...Object.keys(panels),'heroes'].includes(page);
  $('#hero-tabs').hidden = page !== 'heroes';
  if (page === 'heroes') {
    activeHero = Math.min(activeHero, state.heroes.length - 1);
    $('#hero-tabs').innerHTML = state.heroes.map(hero => `<button data-hero-tab="${hero.index}" class="${hero.index === activeHero ? 'active' : ''}" aria-pressed="${hero.index === activeHero}">${escapeHtml(hero.name)} · ${escapeHtml(hero.className)}</button>`).join('');
    engine.showPanel(`characterTabContent${activeHero}`);
  } else if (panels[page]) engine.showPanel(panels[page]);
  else engine.showPanel(state.started ? state.won ? 'gameOverTabContent' : 'gameTabContent' : 'partyCreationTabContent');
  if (page === 'settings') for (const input of $$('[data-option]')) input.checked = state.options[input.dataset.option];
  for (const button of $$('[data-page]')) {
    const active = button.dataset.page === page;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current');
  }
  for (const button of $$('#main-nav [data-page]')) {
    if (['heroes','dungeons','castles','monsters'].includes(button.dataset.page)) button.disabled = !state.started;
    button.setAttribute('aria-label', button.textContent.trim());
    button.title = button.textContent.trim();
  }
  if (focus) $('#main').focus({ preventScroll:true });
  refresh();
}

function refresh() {
  const state = engine.snapshot();
  $('#run-number').textContent = state.run;
  $('#pause-label').textContent = state.paused ? '继续' : '暂停';
  $('#toggle-pause').setAttribute('aria-label', state.paused ? '继续冒险' : '暂停冒险');
  $('#toggle-pause [data-icon]').innerHTML = icon(state.paused ? 'play' : 'pause');
  if (saves.lastSaved) $('#save-status').textContent = `已保存 ${saves.lastSaved.toLocaleTimeString('zh-CN', { hour:'2-digit', minute:'2-digit' })}`;
  if (saves.blocked) $('#save-status').textContent = '本地存档待恢复';
  dashboard.update(state);
}

function bind() {
  for (const button of $$('[data-page]')) button.addEventListener('click', () => navigate(button.dataset.page, true));
  $('#header-settings').onclick = () => navigate('settings');
  $('#manage-heroes').onclick = () => navigate('heroes');
  $('#original-info').onclick = () => navigate('info');
  $('#hero-tabs').onclick = event => { const target = event.target.closest('[data-hero-tab]'); if (target) { activeHero = Number(target.dataset.heroTab); navigate('heroes'); } };
  $('#toggle-pause').onclick = () => { engine.pause(); refresh(); };
  $('#dismiss-toast').onclick = () => { $('#toast').hidden = true; };
  $('#open-saves').onclick = () => { $('#save-dialog').showModal(); };
  $('#close-saves').onclick = () => $('#save-dialog').close();
  $('#save-now').onclick = () => { saves.save(); refresh(); };
  $('#export-save').onclick = () => saves.export();
  $('#export-original').onclick = () => saves.export(true);
  $('#save-file').onchange = async event => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > MAX_SAVE_BYTES) { $('#import-error').textContent = '文件超过 2 MB。'; return; }
    $('#save-code').value = await file.text(); $('#import-error').textContent = '';
  };
  $('#import-save').onclick = async () => {
    const button = $('#import-save'); button.disabled = true; button.textContent = '正在校验存档…';
    try { await saves.import($('#save-code').value); $('#save-code').value = ''; $('#import-error').textContent = ''; $('#save-dialog').close(); mountExpedition(); navigate('expedition'); }
    catch (error) { $('#import-error').textContent = error.message; }
    finally { button.disabled = false; button.textContent = '载入并备份当前进度'; }
  };
  $('#restore-backup').onclick = async () => {
    try { await saves.restore(); $('#save-dialog').close(); navigate('expedition'); } catch(error) { notify(error.message,true); }
  };
  $('#reset-confirm').oninput = event => { $('#reset-game').disabled = event.target.value !== '重新开始'; };
  $('#reset-game').onclick = () => { if ($('#reset-confirm').value === '重新开始') saves.reset(); };
  for (const input of $$('[data-option]')) input.onchange = () => engine.setOption(input.dataset.option, input.checked);
  $('#settings-save').onclick = () => saves.save();
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); saves.save(); return; }
    if (event.code !== 'Space' || event.repeat || $('#save-dialog').open || event.target.closest('input,textarea,select,button,a,summary,[role="button"],[contenteditable]')) return;
    if (engine.snapshot().started) { event.preventDefault(); engine.pause(); refresh(); }
  });
  window.addEventListener('pagehide', () => saves.save(true));
  document.addEventListener('visibilitychange', () => { if (document.hidden) saves.save(true); });
}

async function boot() {
  $$('[data-icon]').forEach(element => { element.innerHTML = icon(element.dataset.icon); });
  $('#legacy-host').innerHTML = await loadGamePanels();
  for (const link of $$('#legacy-host a[target="_blank"]')) link.rel = 'noopener noreferrer';
  await saves.prepare();
  await engine.boot(saves.persistence);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches && !engine.snapshot().started) engine.setOption('effects', false);
  booted = true;
  createPartyBuilder(engine, () => { saves.save(true); mountExpedition(); navigate('expedition'); }, notify);
  bind();
  enhanceLegacyControls($('#main'));
  $('#loading-screen').hidden = true;
  $('#app-content').hidden = false;
  navigate(engine.snapshot().won ? 'victory' : 'expedition');
  saves.report();
  let wasStarted = engine.snapshot().started, wasWon = engine.snapshot().won, wasOffline = engine.snapshot().offline;
  setInterval(() => {
    const state = engine.snapshot();
    if (state.started !== wasStarted || state.won !== wasWon) { wasStarted = state.started; wasWon = state.won; navigate(state.won ? 'victory' : 'expedition'); }
    if (wasOffline && !state.offline) navigate(currentPage);
    wasOffline = state.offline;
    refresh();
  }, 300);
}

$('#retry-load').onclick = () => location.reload();
boot().catch(error => {
  console.error('启动失败', error);
  $('#loading-screen h1').textContent = '冒险暂时无法开始';
  $('#loading-message').textContent = error.message;
  $('#retry-load').hidden = false;
});
