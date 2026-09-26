// 死读扫描：找出"读取了任何地方都没有写入的属性"的语句。
// 动因：本轮发现 Equipment 的判断读 `a.statType`，而 Item 从来没有这个字段（原版是 `a.s`，
// 恢复时被错映射），分支恒假 → 装备武器特效静默丢失；存档差分看不见它（纯瞬时视觉状态）。
// 用法：node scripts/find-dead-reads.mjs [--min=1]
import fs from 'node:fs';
import path from 'node:path';

const BUILTIN = new Set(`prototype length push pop shift splice slice concat join indexOf map filter reduce forEach sort find call apply bind keys values hasOwnProperty
style innerHTML textContent type name value id class title href src parent children childNodes firstChild nextSibling parentNode hidden checked disabled dataset classList className
clientWidth clientHeight offsetWidth offsetHeight scrollWidth scrollHeight context canvas getImageData putImageData drawImage clearRect fillRect strokeRect beginPath closePath
moveTo lineTo arc fill stroke save restore translate rotate scale fillStyle strokeStyle lineWidth globalAlpha font textAlign textBaseline shadowColor shadowBlur insertCell insertRow
appendChild removeChild setAttribute getAttribute addEventListener removeEventListener getElementById querySelector querySelectorAll createElement createTextNode focus blur click
preventDefault stopPropagation charCodeAt charAt substr substring toLowerCase toUpperCase trim replace split match test exec toString valueOf isFinite abs min max floor ceil round
sqrt pow random now log error warn info stringify parse imul from isArray of x y z width height left top right bottom index target message string capacity files closest
ms eq pe kf hf yf gd td xd cd bd ad`.split(/\s+/));
const IGNORE_NAMES = new Set(['js', 'mjs', 'json', 'png', 'PNG', 'gif', 'GIF', 'jpg', 'jpeg', 'svg', 'ico', 'html', 'txt', 'css', 'md',
  // 浏览器/宿主 API：不是引擎字段
  'key', 'code', 'repeat', 'ctrlKey', 'metaKey', 'meta', 'PI', 'lastSaved', 'blocked', 'open', 'detail', 'deltaY', 'href']);
const SKIP_FILE = /(^|[\\/])(vendor|data)([\\/]|$)|terrain-atlas\.js$/;

const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full); else if (full.endsWith('.js')) files.push(full);
  }
})('src');

// 字符串/模板字面量区间：引号里的 ".png"、".target" 不是属性读取
const quotedRanges = (line) => {
  const out = [];
  let quote = null;
  let start = 0;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quote) {
      if (ch === '\\') { i++; continue; }
      if (ch === quote) { out.push([start, i]); quote = null; }
    } else if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      start = i;
    }
  }
  if (quote) out.push([start, line.length]);
  return out;
};

const defined = new Set();
const reads = [];
for (const file of files) {
  if (SKIP_FILE.test(file)) continue;
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((raw, i) => {
    const trimmedForComment = raw.trimStart();
    if (trimmedForComment.startsWith('*') || trimmedForComment.startsWith('/*')) return; // 块注释行不扫
    const line = raw.replace(/\/\/.*$/, '');
    for (const m of line.matchAll(/\bthis\.([A-Za-z_$][\w$]*)\s*[/=]/g)) defined.add(m[1]);
    for (const m of line.matchAll(/\.([A-Za-z_$][\w$]*)\s*=(?!=)/g)) defined.add(m[1]);
    for (const m of line.matchAll(/prototype\.([A-Za-z_$][\w$]*)\s*=/g)) defined.add(m[1]);
    for (const m of line.matchAll(/^\s*([A-Za-z_$][\w$]*)\s*:/gm)) defined.add(m[1]);
    for (const m of line.matchAll(/@property\s+\{[^}]*\}\s*([A-Za-z_$][\w$]*)/g)) defined.add(m[1]);
    const ranges = quotedRanges(line);
    const inString = (offset) => ranges.some(([a, b]) => offset >= a && offset <= b);
    for (const m of line.matchAll(/([A-Za-z_$)\]]+)\.([A-Za-z_$][\w$]*)(?![\w$(])/g)) {
      const name = m[2];
      if (BUILTIN.has(name) || IGNORE_NAMES.has(name) || inString(m.index)) continue;
      reads.push({ file, line: i + 1, name, text: line.trim().slice(0, 110) });
    }
  });
}

const byName = new Map();
for (const read of reads) {
  if (defined.has(read.name)) continue;
  if (!byName.has(read.name)) byName.set(read.name, []);
  byName.get(read.name).push(read);
}
const min = Number((process.argv.find((a) => a.startsWith('--min=')) || '--min=1').split('=')[1]);
const rows = [...byName.entries()].filter(([, v]) => v.length >= min).sort((a, b) => b[1].length - a[1].length);
console.log(`写入过的属性名 ${defined.size} 个；读取点 ${reads.length} 处；疑似死读名字 ${rows.length} 个（≥${min} 次）`);
for (const [name, sites] of rows) {
  console.log(`\n${name}  ×${sites.length}`);
  for (const s of sites.slice(0, 4)) console.log(`    ${s.file.split(path.sep).join('/')}:${s.line}  ${s.text}`);
}
