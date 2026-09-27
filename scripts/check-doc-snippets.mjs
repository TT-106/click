// 文档代码片段漂移检查：把 md 里"`path:start-end` 紧跟一个 ```js 代码块"的片段
// 与当前源码对应行范围逐行比对，报告漂移。
// 动机：U66–U122 的 57 批改名移动了行号、也改了字段名，而 docs/formulas/* 里内嵌的
// JS 片段是改名前抄的——"文档与代码相互矛盾"是规范 §10/§89 明确禁止的收尾状态。
// 用法: node scripts/check-doc-snippets.mjs [--rewrite] [file.md ...]
//   --rewrite 时用当前源码覆盖漂移片段（仅当片段首行能在源码中找到、且片段不含省略号）。
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const rewrite = args.includes('--rewrite');
const docs = args.filter((a) => !a.startsWith('--'));
if (!docs.length) {
  docs.push('docs/formulas/combat.md', 'docs/formulas/items.md', 'docs/formulas/progression.md');
}

const SKIP = new Set(['node_modules', '.git', 'dist', 'output', '.workbuddy-ai']);
const byBase = new Map();
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP.has(e.name)) walk(path.join(dir, e.name)); }
    else {
      const list = byBase.get(e.name) ?? [];
      list.push(path.normalize(path.join(dir, e.name)));
      byBase.set(e.name, list);
    }
  }
})('.');

const ROOTS = ['.', 'src/engine/modules', 'src', 'archive/original', 'tests', 'scripts'];
function resolveRef(rel) {
  for (const root of ROOTS) {
    const cand = path.normalize(path.join(root, rel));
    if (fs.existsSync(cand) && fs.statSync(cand).isFile()) return cand;
  }
  const hits = byBase.get(path.basename(rel));
  if (hits && hits.length === 1) return hits[0];
  return null;
}

const REF_ONLY = /^\s*`([A-Za-z0-9_\-./]+\.(?:js|mjs)):(\d+)(?:-(\d+))?`\s*$/;

// 已知"被改过名"的标识符集合（symbol-map 的 fields 段：原字母 → 语义名）。
// 用它把一行里的相关标识符统一替换成占位符，从而在"文档抄的是改名前的代码"时
// 仍能在源码里定位到对应片段——这解决了 57 批改名导致的文档片段失配。
const symbolMap = JSON.parse(fs.readFileSync('docs/symbol-map.json', 'utf8'));
const knownTokens = new Set();
for (const [oldName, newName] of Object.entries(symbolMap.fields ?? {})) {
  knownTokens.add(oldName);
  if (newName) knownTokens.add(newName);
}
const normalizeLine = (line) => line.replace(/\b[A-Za-z_$][\w$]*\b/g, (t) => (knownTokens.has(t) ? 'X' : t)).replace(/\s+/g, ' ').trim();

// 在源码里按"归一化后逐行匹配"定位片段，返回 0 基起始行；找不到返回 -1。
function locateSnippet(srcLines, snippetLines) {
  const needle = snippetLines.map(normalizeLine).filter((l) => l !== '');
  if (!needle.length) return -1;
  const hay = srcLines.map(normalizeLine);
  outer: for (let i = 0; i + needle.length <= hay.length; i++) {
    for (let k = 0; k < needle.length; k++) {
      if (hay[i + k] !== needle[k]) continue outer;
    }
    return i;
  }
  return -1;
}

let checked = 0;
let drifted = 0;
let skipped = 0;

for (const doc of docs) {
  if (!fs.existsSync(doc)) continue;
  const lines = fs.readFileSync(doc, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(REF_ONLY);
    if (!m) continue;
    // 跳过空行找 ```js
    let j = i + 1;
    while (j < lines.length && lines[j].trim() === '') j++;
    if (j >= lines.length || !/^```js\s*$/.test(lines[j])) continue;
    let k = j + 1;
    const body = [];
    while (k < lines.length && !/^```\s*$/.test(lines[k])) { body.push(lines[k]); k++; }
    if (k >= lines.length) continue;

    const [, rel, startStr, endStr] = m;
    const file = resolveRef(rel);
    if (!file) { skipped++; console.log(`? 无法解析 ${doc}:${i + 1} -> ${rel}`); continue; }

    const srcLines = fs.readFileSync(file, 'utf8').split('\n');
    const start = Number(startStr);
    const end = Number(endStr ?? start + body.length - 1);
    const actual = srcLines.slice(start - 1, end).map((l) => l.replace(/\s+$/, ''));

    checked++;
    const norm = (arr) => arr.map((l) => l.replace(/\s+$/, ''));
    const a = norm(body);
    const b = norm(actual);
    const same = a.length === b.length && a.every((l, idx) => l === b[idx]);
    if (same) continue;

    drifted++;
    const hasEllipsis = body.some((l) => /\.\.\.|…/.test(l));
    let firstDiff = 0;
    while (firstDiff < Math.min(a.length, b.length) && a[firstDiff] === b[firstDiff]) firstDiff++;
    console.log(`! 片段漂移 ${doc}:${i + 1} -> ${rel}:${start}-${end}（首个不同在第 ${firstDiff + 1} 行）`);
    console.log(`    文档: ${(a[firstDiff] ?? '(无)').trim().slice(0, 110)}`);
    console.log(`    源码: ${(b[firstDiff] ?? '(无)').trim().slice(0, 110)}`);

    if (rewrite && !hasEllipsis) {
      // 行数一致 + 至少一半行逐字相同 ⇒ ref 行号可信（改名只改文本、不改行数），可安全覆盖。
      const sameLen = a.length === b.length;
      const matchCount = sameLen ? a.filter((l, idx) => l === b[idx]).length : 0;
      const ratio = sameLen ? matchCount / a.length : 0;
      const anchorOk = (a[0] ?? '').trim() !== '' && (a[0] ?? '').trim() === (srcLines[start - 1] ?? '').trim();
      if (anchorOk || ratio >= 0.5) {
        lines.splice(j + 1, body.length, ...actual);
        console.log(`    → 已用源码覆盖（相似度 ${(ratio * 100).toFixed(0)}%）`);
        i = j + body.length; // 继续扫描
      } else {
        // 退路 A：起点正确、但 ref 的"结束行"与实际片段行数不符（节选长短不一）。
        // 用 start + 片段行数 - 1 重算范围，相似度过半即认为逐字摘录 → 覆盖内容并修正 ref 末尾。
        const altEnd = start + a.length - 1;
        const alt = altEnd <= srcLines.length
          ? srcLines.slice(start - 1, altEnd).map((l) => l.replace(/\s+$/, ''))
          : null;
        const altMatches = alt ? a.filter((l, idx) => l === alt[idx]).length : 0;
        if (alt && altMatches / a.length >= 0.5) {
          lines.splice(j + 1, body.length, ...alt);
          lines[i] = lines[i].replace(/:\d+(?:-\d+)?`/, `:${start}-${altEnd}\``);
          console.log(`    → 已按实际行数修正 ref 末尾并覆盖：${start}-${altEnd}（相似度 ${((altMatches / a.length) * 100).toFixed(0)}%）`);
          i = j + body.length;
          continue;
        }
        // 退路 B：按归一化标识符在源码里重新定位（同时修正 ref 行号与片段内容）
        const at = locateSnippet(srcLines, body);
        if (at >= 0) {
          const fresh = srcLines.slice(at, at + body.length).map((l) => l.replace(/\s+$/, ''));
          lines.splice(j + 1, body.length, ...fresh);
          lines[i] = lines[i].replace(/:\d+(?:-\d+)?`/, `:${at + 1}-${at + body.length}\``);
          console.log(`    → 已重新定位并覆盖：ref 修正为 ${at + 1}-${at + body.length}`);
          i = j + body.length;
        } else {
          console.log(`    → 跳过覆盖（行数 ${a.length}/${b.length}，相似度 ${(ratio * 100).toFixed(0)}%，归一化定位也失败，需人工处理）`);
        }
      }
    }
  }
  if (rewrite) fs.writeFileSync(doc, lines.join('\n'));
}

console.log(`\n共检查 ${checked} 个代码片段：漂移 ${drifted} 个，无法解析 ${skipped} 个。`);
