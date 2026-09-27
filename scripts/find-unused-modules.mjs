// Exhaustion Pass 辅助：盘点 src/ 下的"零引用模块"与"零引用导出"。
// 只做静态盘点，不删任何东西；结论需人工/运行时复核后再动（规范 §71：搜不到调用 ≠ dead code）。
// 用法: node scripts/find-unused-modules.mjs
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'src';
const ENTRY = new Set(['src/app.js', 'src/engine/adapter.js', 'src/engine/internal-api.js']);

function listJs(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) listJs(full, out);
    else if (e.name.endsWith('.js')) out.push(full);
  }
  return out;
}

const files = listJs(SRC);
const sources = new Map(files.map((f) => [f, fs.readFileSync(f, 'utf8')]));

// 收集 import 说明符（含动态 import 与 new Worker）
const importedSpecifiers = new Set();
const importRe = /(?:import\s*\(\s*|from\s+|import\s+)(['"])([^'"]+)\1/g;
const workerRe = /new\s+Worker\s*\(\s*(['"])([^'"]+)\1/g;
for (const [, , spec] of [...sources.values()].flatMap((s) => [...s.matchAll(importRe)])) importedSpecifiers.add(spec);
for (const [, , spec] of [...sources.values()].flatMap((s) => [...s.matchAll(workerRe)])) importedSpecifiers.add(spec);

const resolved = new Set();
for (const spec of importedSpecifiers) {
  if (!spec.startsWith('.')) continue;
  const base = spec.startsWith('src/') ? spec : null;
  if (base) { resolved.add(path.normalize(base)); continue; }
  // 相对说明符：对每个文件都试一遍（不精确但足以覆盖）
  for (const f of files) {
    const cand = path.normalize(path.join(path.dirname(f), spec));
    if (sources.has(cand)) resolved.add(cand);
    else if (sources.has(cand + '.js')) resolved.add(cand + '.js');
  }
}

const orphans = files.filter((f) => !resolved.has(path.normalize(f)) && !ENTRY.has(path.normalize(f)));
console.log(`模块总数 ${files.length}；无任何 import 指向的模块 ${orphans.length} 个：`);
for (const f of orphans) {
  const size = sources.get(f).split('\n').length;
  console.log(`  ${size} 行  ${f}`);
}

// 零引用导出（按名字在"其它文件"中的出现次数粗筛）
console.log('\n可能零引用的导出（名字在其它文件中出现 0 次）：');
let flagged = 0;
for (const [file, text] of sources) {
  const names = new Set();
  for (const m of text.matchAll(/export\s+(?:var|let|const|function|class)\s+([A-Za-z_$][\w$]*)/g)) names.add(m[1]);
  for (const m of text.matchAll(/export\s*\{([^}]+)\}/g)) {
    for (const part of m[1].split(',')) {
      const name = part.split(/\s+as\s+/).pop().trim();
      if (name) names.add(name);
    }
  }
  for (const name of names) {
    if (name.length <= 2) continue; // 单/双字母是混淆残留口径，另有清单
    let used = 0;
    for (const [other, otherText] of sources) {
      if (other === file) continue;
      if (new RegExp('\\b' + name.replace(/[$]/g, '\\$&') + '\\b').test(otherText)) used++;
    }
    if (used === 0) { console.log(`  ${file}: ${name}`); flagged++; }
  }
}
console.log(`\n合计可能零引用导出 ${flagged} 个（含仅本文件内部使用的私有导出）。`);
