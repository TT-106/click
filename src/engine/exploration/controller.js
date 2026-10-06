import { createAssetCatalog } from '../modules/rendering/asset-catalog.js';
import assetDefinitions from '../../data/assets.generated.js';
import { OpenWorldSession, OPEN_WORLD_SAVE_KEY, OPEN_WORLD_BACKUP_KEY, OPEN_WORLD_RECOVERY_KEY } from './open-world-session.js';
import { ExplorationRenderer } from './renderer.js';
import { itemCount } from './expedition.js';
import { getSpritePreview } from '../modules/rendering/preview.js';

/** 产品入口持有生命周期；关闭页面不推进探索。存储失败不妨碍本次游玩。 */
export function createVillageExplorer(canvas, { heroes, storage, onUpdate = () => {}, background = false, isVisible = () => !document.hidden, canAdvance = () => true }) {
  const assets = createAssetCatalog({ definitions: assetDefinitions, bundle: 'forest-village' });
  const expeditionOptions = { expedition: true, ownerIds: heroes.map(hero => hero.name) };
  let session = new OpenWorldSession('原野-01', heroes.length, expeditionOptions), notice = '', saveBlocked = false, saveError = '', recovering = false;
  try {
    if (storage === undefined) storage = window.localStorage;
    const raw = storage?.getItem(OPEN_WORLD_SAVE_KEY);
    if (raw) session = OpenWorldSession.restore(JSON.parse(raw), heroes.length, expeditionOptions);
    else if (storage?.getItem('C2_FOREST_VILLAGE_V1')) notice = '旧村记录已保留；开放世界单独保存探索进度。';
  } catch { notice = '原野记录无法载入，原文件已保留。本次临时探索不覆盖记录；可恢复备份或开启新世界。'; saveBlocked = true; }
  const renderer = new ExplorationRenderer(canvas, assets, heroes);
  let active = false, request = 0, previous = 0, lastSave = 0, lastUpdate = 0, speed = 1;
  let simulationTimer = 0, simulationAt = 0, lastDraw = 0;
  let savedPhase = session.expedition?.phase, savedCompleted = session.expedition?.completed;
  const persistence = () => {
    let canRestore = false;
    try { canRestore = Boolean(storage?.getItem(OPEN_WORLD_BACKUP_KEY)); } catch { /* 恢复入口仍显示读取失败提示。 */ }
    return { blocked: saveBlocked, recovering, canRestore, error: saveError };
  };
  const snapshot = () => ({ ...session.snapshot(), loading: !assets.isLoaded(), error: assets.getErrors().join('; '), notice, persistence: persistence() });
  const publish = () => onUpdate(snapshot());
  // 内容变化前先把上一版留作备份：与经典档 saves.js 的写法一致，坏记录才有回退点。
  const writeRecord = (value) => {
    if (!storage) throw new Error('没有可用存储');
    const previous = storage?.getItem(OPEN_WORLD_SAVE_KEY);
    if (previous && previous !== value) storage?.setItem(OPEN_WORLD_BACKUP_KEY, previous);
    storage?.setItem(OPEN_WORLD_SAVE_KEY, value);
  };
  const save = () => {
    if (saveBlocked || recovering) return false;
    try { writeRecord(JSON.stringify(session.serialize())); saveError = ''; return true; }
    catch { saveError = '无法保存探索记录，本次探索仍可继续；请恢复存储后再次保存。'; return false; }
  };
  // 替换记录先留档，桌面还要等磁盘确认；失败时恢复缓存，防止后台重试写入未获确认的新世界。
  const replaceSession = async (restored, message, preserveBackup) => {
    if (recovering) return false;
    recovering = true; publish();
    let original, changed = false;
    try {
      if (!storage) throw new Error('没有可用存储');
      original = storage.getItem(OPEN_WORLD_SAVE_KEY);
      const value = JSON.stringify(restored.serialize());
      if (original && original !== value) storage.setItem(preserveBackup ? OPEN_WORLD_RECOVERY_KEY : OPEN_WORLD_BACKUP_KEY, original);
      storage.setItem(OPEN_WORLD_SAVE_KEY, value); changed = true;
      await storage.flush?.();
      session = restored; saveBlocked = false; saveError = ''; notice = message;
      savedPhase = session.expedition?.phase; savedCompleted = session.expedition?.completed;
      previous = 0; simulationAt = performance.now(); lastSave = performance.now();
      return true;
    } catch {
      if (changed) {
        try {
          if (original === null) storage.removeItem(OPEN_WORLD_SAVE_KEY);
          else storage.setItem(OPEN_WORLD_SAVE_KEY, original);
        } catch { saveBlocked = true; }
      }
      saveError = '未能确认写回探索记录，原记录与备份已保留；请恢复存储后重试。'; notice = saveError;
      return false;
    } finally { recovering = false; publish(); }
  };
  const saveTransition = () => {
    if (session.expedition?.phase !== savedPhase || session.expedition?.completed !== savedCompleted) {
      save(); savedPhase = session.expedition?.phase; savedCompleted = session.expedition?.completed;
    }
  };
  const frame = now => {
    if (!active) return;
    if (background) {
      if (isVisible() && assets.isLoaded() && now - lastDraw >= 1000 / 30) { renderer.draw(session); lastDraw = now; }
    } else {
      if (!document.hidden && assets.isLoaded()) {
        if (!recovering) session.tick(previous ? Math.min(100, now - previous) : 0, speed);
        saveTransition();
        renderer.draw(session);
      }
      previous = document.hidden ? 0 : now;
      if (now - lastSave > 1500) { save(); lastSave = now; }
      if (now - lastUpdate > 180) { publish(); lastUpdate = now; }
    }
    request = requestAnimationFrame(frame);
  };
  // 桌面模拟独立于绘制；隐藏时每秒推进，分小步保证导航和跟随顺序一致。
  // 单次最多补一秒，休眠/卡顿不作为未实现的离线远征收益。
  const simulate = () => {
    if (!active) return;
    const now = performance.now();
    let elapsed = Math.max(0, Math.min(1000, now - simulationAt)); simulationAt = now;
    if (!recovering && assets.isLoaded() && canAdvance()) while (elapsed > 0) { const step = Math.min(100, elapsed); session.tick(step, speed); elapsed -= step; }
    saveTransition();
    if (now - lastSave > 1500) { save(); lastSave = now; }
    if (now - lastUpdate > (isVisible() ? 180 : 1000)) { publish(); lastUpdate = now; }
    simulationTimer = setTimeout(simulate, isVisible() ? 1000 / 30 : 1000);
  };
  const onHide = () => { if (active) save(); };
  window.addEventListener('pagehide', onHide);
  return {
    resume() { if (active) return; active = true; previous = 0; simulationAt = performance.now(); publish(); request = requestAnimationFrame(frame); if (background) simulate(); },
    suspend() { active = false; cancelAnimationFrame(request); clearTimeout(simulationTimer); save(); },
    pause() { if (recovering) return; session.paused = !session.paused; save(); publish(); },
    async restart(seed) {
      if (recovering) return false;
      const previousExpedition = session.expedition;
      const next = new OpenWorldSession(seed, heroes.length, expeditionOptions);
      let message = '';
      if (!saveBlocked && previousExpedition) {
        next.expedition.warehouse = { ...previousExpedition.warehouse };
        for (const bag of previousExpedition.bags) for (const [id, count] of Object.entries(bag)) next.expedition.warehouse[id] = (next.expedition.warehouse[id] || 0) + count;
        if (itemCount(next.expedition.warehouse)) message = '携带材料和营地库存已带入新世界。';
      }
      return replaceSession(next, message, saveBlocked);
    },
    async restoreBackup() {
      if (recovering) return false;
      let backup;
      try { backup = storage?.getItem(OPEN_WORLD_BACKUP_KEY); }
      catch { notice = '无法读取探索备份，原记录未改动。'; publish(); return false; }
      if (!backup) { notice = '还没有可用的探索记录备份。'; publish(); return false; }
      let restored;
      try { restored = OpenWorldSession.restore(JSON.parse(backup), heroes.length, expeditionOptions); }
      catch { notice = '备份记录同样无法载入，原记录未改动。'; publish(); return false; }
      return replaceSession(restored, '已从备份恢复探索记录，恢复前的记录已留档。', true);
    },
    returnToCamp() { if (recovering) return; session.returnToCamp(); save(); publish(); },
    setSpeed(value) { speed = [1, 4, 12].includes(value) ? value : 1; },
    setOverview(value) { renderer.overview = Boolean(value); },
    snapshot() { return { ...snapshot(), assets: assets.getStatus() }; },
    itemPreview(id) { const sprite = assets.resolve(id, 'items'); return sprite ? getSpritePreview(sprite, 'icon') : null; },
    checkpoint() { if (saveBlocked) throw new Error(notice); if (recovering) throw new Error('正在恢复探索记录，请稍后保存。'); if (!save()) throw new Error(saveError); },
    dispose() { active = false; cancelAnimationFrame(request); clearTimeout(simulationTimer); save(); window.removeEventListener('pagehide', onHide); },
  };
}
