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
  expedition: '远征', heroes: '冒险者', dungeons: '地牢', castles: '城堡',
  monsters: '怪物图鉴', points: '成就与点数', settings: '设置与帮助',
  info: '统计资料', victory: '远征战果'
};
const PRESENTATION_KEY = 'C2_PRESENTATION_V1';
let presentationStyle = 'clean';
try { if (localStorage.getItem(PRESENTATION_KEY) === 'classic') presentationStyle = 'classic'; } catch { /* 浏览器禁用存储时仍可使用默认画面。 */ }
const panels = { dungeons:'dungeonsTabContent', castles:'castlesTabContent', monsters:'monstersTabContent', points:'pointsTabContent', info:'infoTabContent', victory:'gameOverTabContent' };
const dashboard = createDashboard(index => { activeHero = index; navigate('heroes'); });

function navigate(page, focus = false) {
  if (!booted) return;
  const state = engine.snapshot();
  if (!state.started && ['heroes','dungeons','castles','monsters'].includes(page)) return;
  currentPage = page;
  const setup = page === 'expedition' && !state.started;
  $('#page-heading').hidden = page === 'expedition';
  $('#page-title').textContent = titles[page];
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
  engine.setPresentation(presentationStyle);
  $('#presentation-style').value = presentationStyle;
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
  $('#presentation-style').onchange = event => {
    presentationStyle = event.target.value;
    engine.setPresentation(presentationStyle);
    try { localStorage.setItem(PRESENTATION_KEY, presentationStyle); } catch { /* 偏好仍在本次会话生效。 */ }
  };
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
