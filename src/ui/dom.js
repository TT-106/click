export const $ = selector => document.querySelector(selector);
export const $$ = selector => [...document.querySelectorAll(selector)];
export const escapeHtml = text => String(text).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
export const number = value => new Intl.NumberFormat('zh-CN', { notation: value >= 100000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value || 0);
export function sprite(position, className = '') { return `<span class="sprite ${className}" style="--sprite-x:-${position.x}px;--sprite-y:-${position.y}px" aria-hidden="true"></span>`; }
const paths = {
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5Z"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 5"/>',
  dungeon: '<path d="M4 21V9l8-6 8 6v12ZM9 21v-8h6v8M3 21h18"/>',
  castle: '<path d="M3 21V4h4v4h3V4h4v4h3V4h4v17ZM9 21v-6h6v6"/>',
  skull: '<path d="M8 21v-4a8 8 0 1 1 8 0v4ZM10 21v-3M14 21v-3"/><circle cx="8" cy="10" r="1"/><circle cx="16" cy="10" r="1"/>',
  medal: '<path d="m7 3 5 6 5-6M5 3h4M15 3h4"/><circle cx="12" cy="15" r="6"/><path d="m12 12 1 2 2 1-2 1-1 2-1-2-2-1 2-1Z"/>',
  settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="16" cy="17" r="3"/>',
  save: '<path d="M4 3h13l4 4v14H3V3ZM7 3v6h9V3M7 21v-8h10v8"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  play: '<path d="m7 4 14 8-14 8Z"/>',
  book: '<path d="M12 5v16M3 3c4-1 7 0 9 2 2-2 5-3 9-2v16c-4-1-7 0-9 2-2-2-5-3-9-2Z"/>',
  sword: '<path d="m4 20 4-4m-3-3 6 6M8 16 20 4h-5L5 14"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
};
export function icon(name) { return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.compass}</svg>`; }
