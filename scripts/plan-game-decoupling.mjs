// 只读：为"退出 runtime/game.js 依赖"生成可执行工单。
//   node scripts/plan-game-decoupling.mjs
// 每个仍 import game 的模块：列出它用到的 game 成员、成员类别、调用点数，
// 并按"消掉它需要注入几个依赖"排序——注入数最少的先做，风险与收益都能预测。
// 成员类别沿用工程里已有的三种先例，避免为每个模块发明新装配方式：
//   const   -> 已由 core/screen-layout.js 承担的常量（直接改 import，零注入）
//   handle  -> game 单例上的注册表/子系统（clearVisualEffects(effects) 那种"调用点传参"，
//              或 bindXxx(state) 那种"组合根绑定"，取决于生命周期是否稳定）
//   state   -> game.state.* 活状态（bindXxx(state) 先例：bindStatistics / bindAdventurePoints）
//   flag    -> 布尔生命周期旗标（worldActive/paused/gameWon…）——最麻烦，值会变，
//              只能读时取（回调注入）或把旗标搬进 state 对象；单独标出来供裁决
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CONST_NAMES = new Set(['tileSize', 'halfTileSize', 'viewportWidth', 'viewportHeight', 'viewportHalfWidth', 'viewportHalfHeight']);
const STATE_FLAGS = new Set(['worldActive', 'paused', 'gameWon', 'partyCreated', 'initialized', 'processingOffline', 'offlineProcessed', 'gameOver', 'visible', 'ready']);
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.js')) files.push(p);
  }
})(path.join(ROOT, 'src/engine/modules'));

const rows = [];
for (const f of files) {
  const rel = path.relative(ROOT, f).split(path.sep).join('/');
  if (rel.endsWith('runtime/game.js')) continue;
  const src = fs.readFileSync(f, 'utf8');
  // 判定"是否依赖 game.js"必须解析说明符，不能按字面路径匹配：runtime/ 目录内的模块写的是
  // from './game.js'，字面量里没有 runtime/ 这一段（本会话正是这样漏掉了 runtime/index.js，
  // 于是 audit:arch 报 32 而本工单报 31，两个口径并存迟早误导下一刀）。
  {
    let depends = false;
    const specRe = /from\s+['"]([^'"]+)['"]/g;
    let mm;
    const gameAbs = path.resolve(ROOT, 'src/engine/modules/runtime/game.js').split(path.sep).join('/');
    while ((mm = specRe.exec(src))) {
      const spec = mm[1];
      if (!spec.startsWith('.')) continue;
      const abs = path.resolve(path.dirname(f), spec).split(path.sep).join('/');
      if (abs === gameAbs || abs.endsWith('/runtime/game.js')) { depends = true; break; }
    }
    if (!depends) continue;
  }
  const members = new Map();
  const re = /\bgame\.([A-Za-z_$][\w$]*)/g;
  let m;
  while ((m = re.exec(src))) {
    const name = m[1];
    if (name === 'js') continue;
    members.set(name, (members.get(name) || 0) + 1);
  }
  const stateUses = (src.match(/\bgame\.state\b/g) || []).length;
  if (stateUses && !members.has('state')) members.set('state', stateUses);
  const kindOf = (n) => (n === 'state' ? 'state' : CONST_NAMES.has(n) ? 'const' : STATE_FLAGS.has(n) ? 'flag' : 'handle');
  const classified = [...members.entries()].map(([n, c]) => ({ name: n, count: c, kind: kindOf(n) }));
  const injections = classified.filter((c) => c.kind !== 'const').length;
  rows.push({ rel, total: members.size, injections, classified, stateUses });
}
rows.sort((a, b) => a.injections - b.injections || a.total - b.total);
console.log(`仍 import runtime/game.js 的模块：${rows.length} 个\n`);
console.log('按"退出所需注入数"升序（先做最便宜的；const 成员不算注入，直接换 screen-layout 导入）：');
for (const r of rows) {
  const parts = r.classified.sort((a, b) => b.count - a.count).map((c) => `${c.name}:${c.count}[${c.kind}]`);
  console.log(`  注入 ${String(r.injections).padStart(2)}  ${r.rel.replace('src/engine/modules/', '').padEnd(34)} ${parts.join(' ')}`);
}
const tally = {};
for (const r of rows) for (const c of r.classified) tally[c.kind] = (tally[c.kind] || 0) + 1;
console.log(`\n成员类别合计：${Object.entries(tally).map(([k, v]) => `${k} ${v}`).join('，')}`);
const flagOnly = rows.filter((r) => r.classified.every((c) => c.kind === 'flag'));
console.log(`只用到旗标（需要单独裁决注入方式）的模块：${flagOnly.length ? flagOnly.map((r) => r.rel.split('/').pop()).join(', ') : '（无）'}`);
