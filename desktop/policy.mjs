import path from 'node:path';

export const APP_ORIGIN = 'companion://game';
export const STORAGE_KEYS = ['C2_V1_001', 'C2_V1_001_backup', 'C2_OPEN_WORLD_V1', 'C2_OPEN_WORLD_V1_backup', 'C2_OPEN_WORLD_V1_before_recovery', 'C2_FOREST_VILLAGE_V1', 'C2_PRESENTATION_V1'];
export const MAX_CHECKPOINT_BYTES = 12 * 1024 * 1024;

/** 本地协议只提供发布素材和产品源码，不能借 URL 访问磁盘的其他内容。 */
export function resourcePath(root, address) {
  const url = new URL(address);
  if (url.protocol !== 'companion:' || url.host !== 'game' || url.username || url.password) return null;
  let relative;
  try { relative = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html'; } catch { return null; }
  if (relative.includes('\\') || relative.includes('\0') || relative.split('/').includes('..')) return null;
  if (!['index.html', 'favicon.svg'].includes(relative) && !/^(src|assets|images|spritesheet)\//.test(relative)) return null;
  const full = path.resolve(root, relative), within = path.relative(root, full);
  return within && !within.startsWith('..') && !path.isAbsolute(within) ? full : null;
}

export function checkedStorage(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('桌面存档格式无效');
  const result = {};
  for (const [key, text] of Object.entries(value)) {
    if (!STORAGE_KEYS.includes(key) || typeof text !== 'string') throw new Error('桌面存档包含未知字段');
    if ((key === 'C2_V1_001' || key === 'C2_V1_001_backup') && Buffer.byteLength(text) > 2 * 1024 * 1024) throw new Error('经典存档超过 2 MB');
    result[key] = text;
  }
  if (Buffer.byteLength(JSON.stringify(result)) > MAX_CHECKPOINT_BYTES) throw new Error('桌面检查点超过 12 MB；请备份进度');
  return result;
}

/** 显示器拔掉后也把窗口放回可见工作区；每种模式各自记住位置和尺寸。 */
export function windowBounds(saved, workArea, mode) {
  const minimum = mode === 'companion' ? { width: 480, height: 320 } : { width: 800, height: 600 };
  const defaults = mode === 'companion' ? { width: 720, height: 440 } : { width: 1200, height: 820 };
  const dimension = (key, limit) => Math.min(limit, Math.max(Math.min(minimum[key], limit), Number.isFinite(saved?.[key]) ? Math.round(saved[key]) : defaults[key]));
  const width = dimension('width', workArea.width), height = dimension('height', workArea.height);
  const x = Number.isFinite(saved?.x) ? Math.round(saved.x) : workArea.x + workArea.width - width - 24;
  const y = Number.isFinite(saved?.y) ? Math.round(saved.y) : workArea.y + workArea.height - height - 24;
  return { width, height, x: Math.min(workArea.x + workArea.width - width, Math.max(workArea.x, x)), y: Math.min(workArea.y + workArea.height - height, Math.max(workArea.y, y)) };
}
