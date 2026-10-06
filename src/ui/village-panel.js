import { escapeHtml } from './dom.js';
import { createExpeditionInventory } from './expedition-inventory.js';

const SPEEDS = [1, 4, 12];

/** 开放世界独立保存：进入时暂停经典远征，退出时恢复原先的暂停状态。 */
export function createVillagePanel(engine, notify, { onExit = () => {}, storage, background = false, isVisible, canAdvance } = {}) {
  const screen = document.getElementById('village-screen');
  const canvas = document.getElementById('village-canvas');
  const view = {
    seed: document.getElementById('village-seed'),
    target: document.getElementById('village-target'),
    discovered: document.getElementById('village-discovered'),
    points: document.getElementById('village-points'),
    state: document.getElementById('village-state'),
    log: document.getElementById('village-log'),
    notice: document.getElementById('village-notice'),
    pause: document.getElementById('village-pause'),
    speed: document.getElementById('village-speed'),
    overview: document.getElementById('village-overview'),
    restart: document.getElementById('village-restart'),
    restore: document.getElementById('village-restore'),
    exit: document.getElementById('village-exit'),
  };
  let explorer = null, active = false, restorePaused = false, speedIndex = 0, overview = false, latest = null;
  const inventory = createExpeditionInventory({ heroes: engine.snapshot().heroes, preview: id => explorer?.itemPreview(id), onReturn: () => explorer?.returnToCamp(), isVisible });

  const render = snapshot => {
    latest = snapshot;
    inventory.update(snapshot);
    if (!active) return;
    view.seed.textContent = `${snapshot.layout} · 种子 ${snapshot.seed}`;
    view.target.textContent = snapshot.target;
    view.discovered.textContent = `${snapshot.discovered} 格 · ${snapshot.generatedChunks} 区域`;
    view.points.textContent = `${snapshot.points} 到访 / ${snapshot.pointTotal} 发现`;
    view.state.textContent = snapshot.error ? '素材加载失败' : snapshot.complete ? '探索完成'
      : snapshot.paused ? '已暂停' : snapshot.loading ? '载入素材…' : snapshot.waiting ? '暂无可达新区域' : '自动探索中';
    if (!snapshot.paused && !snapshot.loading && snapshot.expedition?.phase === 'returning') view.state.textContent = '带着收获返程';
    if (!snapshot.paused && !snapshot.loading && snapshot.expedition?.phase === 'resting') view.state.textContent = '营地休整中';
    view.pause.textContent = snapshot.paused ? '继续' : '暂停';
    view.log.innerHTML = snapshot.log.map(entry => `<li>${escapeHtml(entry)}</li>`).join('');
    if (snapshot.persistence?.blocked) view.state.textContent = '临时探索 · 未保存';
    if (snapshot.persistence?.recovering) view.state.textContent = '正在写回记录…';
    view.restore.disabled = !snapshot.persistence?.canRestore || snapshot.persistence?.recovering;
    view.restore.title = snapshot.persistence?.canRestore ? '退回上一份备份，当前记录会另行留档' : '尚无可用备份';
    view.restart.disabled = view.pause.disabled = Boolean(snapshot.persistence?.recovering);
    const notice = snapshot.error || snapshot.persistence?.error || snapshot.notice;
    view.notice.textContent = notice || '';
    view.notice.hidden = !notice;
  };

  const ensureExplorer = () => {
    if (!explorer) explorer = engine.createVillageExplorer(canvas, { onUpdate: render, storage, background, isVisible, canAdvance });
    return explorer;
  };

  view.pause.onclick = () => explorer?.pause();
  view.speed.onclick = () => {
    speedIndex = (speedIndex + 1) % SPEEDS.length;
    explorer?.setSpeed(SPEEDS[speedIndex]);
    view.speed.textContent = `速度 ×${SPEEDS[speedIndex]}`;
  };
  view.overview.onclick = () => {
    overview = !overview;
    explorer?.setOverview(overview);
    view.overview.setAttribute('aria-pressed', String(overview));
    view.overview.classList.toggle('active', overview);
  };
  view.restart.onclick = async () => {
    if (latest?.persistence?.blocked && !window.confirm('原野记录尚未恢复。开启新世界会从头探索，原记录会另行留档；现有可用备份仍会保留。继续吗？')) return;
    const seed = `原野-${Date.now().toString(36).slice(-5)}`;
    const restored = await ensureExplorer().restart(seed);
    notify(restored ? `已开启新世界：${seed}` : latest?.notice || '新世界未能保存，请重试。', !restored);
  };
  view.restore.onclick = async () => {
    if (!window.confirm('恢复上一份原野备份？备份之后的收获可能回退，当前记录会另行留档。经典队伍存档保持原样。')) return;
    const restored = await ensureExplorer().restoreBackup();
    notify(latest?.notice || (restored ? '已恢复探索记录。' : '恢复失败，原记录已保留。'), !restored);
  };
  view.exit.onclick = () => { close(); onExit(); };
  document.getElementById('village-inventory').onclick = () => inventory.open();
  function close() {
    if (!active) return;
    active = false;
    inventory.close();
    explorer?.suspend();
    screen.hidden = true;
    engine.pause(restorePaused);
  }

  return {
    open() {
      if (active) return;
      restorePaused = engine.snapshot().paused;
      engine.pause(true);
      active = true;
      screen.hidden = false;
      ensureExplorer().resume();
      explorer.setOverview(overview);
      if (latest) render(latest);
    },
    close,
    isOpen: () => active,
    togglePause() { if (active) explorer?.pause(); },
    checkpoint() { explorer?.checkpoint(); },
    snapshot: () => explorer?.snapshot(),
    openInventory() { if (active) inventory.open(); },
    dispose() { explorer?.dispose(); explorer = null; }
  };
}
