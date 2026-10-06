import { icon } from './dom.js';

/** 桌面观赏界面只编排窗口与已有产品操作，地图与游戏规则不依赖 Electron。 */
export async function mountDesktopCompanion({ bridge, storage, engine, saves, explorer, openWorld, notify }) {
  let state = await bridge.window();
  const stylesheet = document.createElement('link'); stylesheet.rel = 'stylesheet'; stylesheet.href = './src/styles/desktop.css'; document.head.append(stylesheet);
  document.body.classList.add('desktop-app');
  const bar = document.createElement('header'); bar.className = 'desktop-titlebar';
  bar.innerHTML = `<div class="desktop-brand"><span class="desktop-mark">${icon('compass')}</span><strong>原野陪伴</strong><span class="desktop-caption">让旅途陪你专注</span></div><div class="desktop-window-actions"><button id="desktop-mode" type="button">展开</button><button id="desktop-pin" type="button" aria-pressed="false" title="窗口置顶">置顶</button><button id="desktop-minimize" type="button" aria-label="最小化到任务栏">−</button><button id="desktop-hide" type="button" aria-label="收起到托盘，探索继续" title="收起到托盘，探索继续">${icon('close')}</button></div>`;
  const footer = document.createElement('footer'); footer.className = 'desktop-observation';
  footer.innerHTML = `<div><span class="desktop-status-dot"></span><strong id="desktop-status">正在准备旅途</strong><span id="desktop-discovery"></span></div><div class="desktop-observation-actions"><button id="desktop-recovery" type="button" hidden>恢复记录</button><button id="desktop-inventory" type="button">背包</button><button id="desktop-pause" type="button">暂停</button><button id="desktop-overview" type="button" aria-pressed="false">周边</button><button id="desktop-save" type="button">保存</button></div>`;
  document.body.prepend(bar); document.body.append(footer);
  document.querySelector('#save-dialog > p').textContent = '进度保存在这台电脑。可导出经典队伍存档；原野记录可从托盘打开存档文件夹备份。';
  for (const item of document.querySelectorAll('.help-column details')) {
    if (item.querySelector('summary')?.textContent === '存档保存在哪里？') item.querySelector('p').textContent = '队伍与原野进度保存在本机，保存并退出时写入磁盘。托盘菜单可打开存档文件夹；经典队伍也可导出 .c2save 文件。';
  }
  const element = id => document.getElementById(id);
  const apply = value => {
    state = value; document.body.classList.toggle('desktop-compact', state.mode === 'companion');
    element('desktop-mode').textContent = state.mode === 'companion' ? '展开' : '小窗';
    element('desktop-pin').setAttribute('aria-pressed', String(state.pinned));
    engine.setDisplayActive(state.visible && !explorer()?.isOpen());
    if (state.mode === 'companion' && engine.snapshot().started) openWorld();
  };
  const checkpoint = async () => {
    explorer()?.checkpoint();
    if (saves.blocked) { await storage.flush(); return false; }
    if (!saves.save(true)) throw new Error('游戏进度未能保存，请先导出存档');
    await storage.flush();
    return true;
  };
  const execute = async callback => { try { await callback(); } catch (error) { notify(error.message, true); } };
  const save = () => execute(async () => {
    const saved = await checkpoint();
    notify(saved ? '旅途已保存。' : '原存档需要恢复，已保留磁盘记录。', !saved);
  });
  element('desktop-mode').onclick = () => execute(async () => apply(await bridge.mode(state.mode === 'companion' ? 'full' : 'companion')));
  element('desktop-pin').onclick = () => execute(async () => apply(await bridge.pin(!state.pinned)));
  element('desktop-minimize').onclick = () => execute(() => bridge.minimize());
  element('desktop-hide').onclick = () => execute(() => bridge.hide());
  element('desktop-pause').onclick = () => { if (explorer()?.isOpen()) explorer().togglePause(); else engine.pause(); };
  element('desktop-overview').onclick = () => { element('village-overview').click(); element('desktop-overview').setAttribute('aria-pressed', element('village-overview').getAttribute('aria-pressed')); };
  element('desktop-save').onclick = save;
  element('desktop-recovery').onclick = () => execute(async () => {
    apply(await bridge.mode('full')); element('village-restore').focus();
  });
  element('desktop-inventory').onclick = () => explorer()?.openInventory();
  document.addEventListener('inventory:expand', () => execute(async () => apply(await bridge.mode('full'))));
  bridge.onState(apply);
  bridge.onCommand(async ({ action, id }) => {
    if (action === 'pause') element('desktop-pause').click();
    if (action === 'checkpoint') {
      try { await checkpoint(); if (id) bridge.acknowledge(id, null); }
      catch (error) { notify(error.message, true); if (id) bridge.acknowledge(id, error.message); }
    }
  });
  if (!engine.snapshot().started) state = await bridge.mode('full');
  apply(state); bridge.ready();
  return {
    isVisible: () => state.visible,
    isCompanion: () => state.mode === 'companion',
    canAdvance: () => !state.suspended,
    save,
    async onPartyStarted() { apply(await bridge.mode('companion')); },
    refresh() {
      engine.setDisplayActive(state.visible && !explorer()?.isOpen());
      if (!state.visible) return;
      const snapshot = explorer()?.snapshot();
      if (snapshot && explorer().isOpen()) {
        element('desktop-status').textContent = snapshot.paused ? '旅途已暂停' : snapshot.waiting ? '队伍正在休整' : `${snapshot.layout} · 自动探索`;
        if (!snapshot.paused && snapshot.expedition?.phase === 'returning') element('desktop-status').textContent = '带着收获返程';
        if (!snapshot.paused && snapshot.expedition?.phase === 'resting') element('desktop-status').textContent = '营地休整中';
        if (snapshot.persistence?.blocked) element('desktop-status').textContent = '记录未恢复';
        else if (snapshot.persistence?.error) element('desktop-status').textContent = '记录未保存';
        if (snapshot.persistence?.recovering) element('desktop-status').textContent = '正在写回记录…';
        element('desktop-recovery').hidden = !snapshot.persistence?.blocked && !snapshot.persistence?.error;
        element('desktop-discovery').textContent = snapshot.expedition ? `携带 ${snapshot.expedition.carried} · 归仓 ${snapshot.expedition.stored}` : `已探明 ${snapshot.discovered} 格`;
        element('desktop-pause').textContent = snapshot.paused ? '继续' : '暂停';
      }
    },
  };
}
