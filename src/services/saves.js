import { SAVE_KEY, MAX_SAVE_BYTES } from './save-validation.js';

export function inspectSave(text) {
  return new Promise((resolve, reject) => {
    if (typeof text !== 'string' || text.length > MAX_SAVE_BYTES) { reject(new Error('存档超过 2 MB。')); return; }
    const worker = new Worker(new URL('./save-worker.js', import.meta.url), { type: 'module' });
    const finish = (callback, result) => { clearTimeout(timeout); worker.terminate(); callback(result); };
    const timeout = setTimeout(() => finish(reject, new Error('存档校验超时，原进度未更改。')), 5000);
    worker.onmessage = ({ data }) => data.ok ? finish(resolve, data.state) : finish(reject, new Error(data.error));
    worker.onerror = () => finish(reject, new Error('无法读取存档，请重试。'));
    worker.postMessage(text);
  });
}

export function createSaveService(engine, notify, {
  storage = () => globalThis.localStorage,
  inspect = inspectSave,
  reload = () => location.reload()
} = {}) {
  let bootSave = null, lastSaved = null, blocked = false, transaction = false, pendingError = null;
  const backupKey = SAVE_KEY + '_backup';
  const write = (value, backupValue) => {
    if (blocked || transaction) return false;
    try {
      const previous = backupValue ?? storage().getItem(SAVE_KEY);
      if (previous && previous !== value) storage().setItem(backupKey, previous);
      storage().setItem(SAVE_KEY, value);
      lastSaved = new Date();
      return true;
    } catch { notify('本地保存失败。请导出存档，避免丢失本次进度。', true); return false; }
  };
  return {
    async prepare() {
      try {
        const raw = storage().getItem(SAVE_KEY);
        if (raw) { await inspect(raw); bootSave = raw; }
      } catch (error) {
        blocked = true;
        pendingError = `未载入本地存档：${error.message} 原存档已保留；请在存档管理中导出原文件或恢复备份。`;
      }
    },
    report() { if (pendingError) notify(pendingError, true); },
    get blocked() { return blocked; },
    get lastSaved() { return lastSaved; },
    persistence: {
      read: () => bootSave, write, remove: () => {},
      onLoadError(error) {
        blocked = true;
        pendingError = `本地存档恢复失败：${error.message}。原文件已保留，请导出原文件或恢复备份。`;
      }
    },
    save(silent = false) {
      if (blocked) { if (!silent) notify('原存档需要恢复，暂不覆盖。你仍可以导出本次进度。', true); return false; }
      if (!engine.snapshot().ready) return false;
      const success = write(engine.serialize());
      if (success && !silent) notify('冒险进度已保存。');
      return success;
    },
    export(raw = false) {
      let text;
      try { text = raw ? storage().getItem(SAVE_KEY) : engine.serialize(); } catch { notify('无法读取本地存档。', true); return; }
      if (!text) { notify('当前没有可导出的存档。', true); return; }
      const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = `clickpocalypse-${raw ? 'original-' : ''}${new Date().toISOString().slice(0,10)}.c2save`;
      anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify('存档文件已导出。');
    },
    async import(text) {
      await inspect(text);
      const previous = engine.serialize(), wasPaused = engine.snapshot().paused, wasBlocked = blocked;
      transaction = true;
      try {
        if (!engine.importSave(text.trim())) throw new Error('游戏无法载入该存档。');
      } catch (error) {
        engine.importSave(previous);
        engine.pause(wasPaused);
        throw new Error('导入失败，已恢复原进度。' + error.message);
      } finally { transaction = false; }
      blocked = false;
      engine.pause(wasPaused);
      const success = write(engine.serialize(), wasBlocked ? undefined : previous);
      notify(success ? '存档已载入，原进度已留作备份。' : '存档已载入，但本地保存失败，请立即导出。', !success);
    },
    async restore() {
      const backup = storage().getItem(backupKey);
      if (!backup) throw new Error('还没有可用的备份。');
      await this.import(backup);
    },
    reset() {
      transaction = true;
      try { engine.reset(); } finally { transaction = false; }
      blocked = false;
      if (write(engine.serialize())) reload();
      else notify('本次已重新开始，但浏览器拒绝保存。请先导出新存档，再刷新页面。', true);
    }
  };
}
