/** 同步读写接口复用原存档服务；磁盘检查点异步合并提交，失败可重试且不冒充成功。 */
export async function createDesktopStorage(bridge, onError) {
  const loaded = await bridge.load(), values = new Map(Object.entries(loaded.storage));
  let dirty = false, timer = 0, running = null;
  const flush = async () => {
    clearTimeout(timer);
    if (running) await running;
    if (!dirty) return;
    dirty = false;
    running = bridge.commit(Object.fromEntries(values));
    try { await running; }
    catch (error) { dirty = true; throw error; }
    finally { running = null; }
    if (dirty) await flush();
  };
  const schedule = () => {
    dirty = true; clearTimeout(timer);
    timer = setTimeout(() => { flush().catch(error => onError(`桌面保存失败：${error.message}`)); }, 500);
  };
  return {
    error: loaded.error,
    getItem: key => values.get(key) ?? null,
    setItem(key, value) {
      if (loaded.error) throw new Error(loaded.error);
      const text = String(value); if (values.get(key) === text) return;
      values.set(key, text); schedule();
    },
    removeItem(key) {
      if (loaded.error) throw new Error(loaded.error);
      if (values.delete(key)) schedule();
    },
    flush,
  };
}
