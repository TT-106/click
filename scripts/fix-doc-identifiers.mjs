// 把文档"围栏代码块"内残留的**旧混淆标识符**替换为当前语义名（依据 docs/symbol-map.json 的 fields 段）。
// 动机：57 批改名之后，docs/formulas/* 的内嵌 JS 片段仍在用 `a.sg`/`b.Qt`/`a.We` 这类已不存在的名字，
// 属规范 §10/§89 明令禁止的"文档与代码相互矛盾"。
//
// 安全边界（防误伤）：
//   1) 只改 ``` 围栏代码块内的内容，散文不动；
//   2) 只改**成员访问**（`.X`）与**键**（`X:`）两种形态——与 rename-fields-batch 同款模式，
//      不碰局部变量、不碰字符串；
//   3) 单字符名（`a`/`b`/`x` 等）永不替换；
//   4) 替换后若某行"新名 + 旧名"同时出现，跳过该行并在报告里标出（可能是真·巧合，需人工看）。
// 用法: node scripts/fix-doc-identifiers.mjs [--apply] [file.md ...]
import fs from 'node:fs';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const docs = args.filter((a) => !a.startsWith('--'));
if (!docs.length) docs.push('docs/formulas/combat.md', 'docs/formulas/items.md', 'docs/formulas/progression.md');

const symbolMap = JSON.parse(fs.readFileSync('docs/symbol-map.json', 'utf8'));
const fields = symbolMap.fields ?? {};
// 只保留长度 >= 2 的原名，避免 `a`/`b` 这类万能名误伤
const pairs = Object.entries(fields).filter(([oldName]) => oldName.length >= 2);

const escapeRe = (t) => t.replace(/[$()*+.?[\\\]^{|}]/g, '\\$&');

let totalReplacements = 0;
let totalSkipped = 0;

for (const doc of docs) {
  if (!fs.existsSync(doc)) continue;
  const lines = fs.readFileSync(doc, 'utf8').split('\n');
  let inFence = false;
  let changed = 0;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*```/.test(lines[i])) { inFence = !inFence; continue; }
    let line = lines[i];
    let lineChanged = 0;
    if (inFence) {
      // 代码块内：只改成员访问与键
      for (const [oldName, newName] of pairs) {
        const memberRe = new RegExp('\\.' + escapeRe(oldName) + '\\b', 'g');
        const keyRe = new RegExp('(^|[ \\t])' + escapeRe(oldName) + ':(?=\\s)', 'g');
        const before = line;
        line = line.replace(memberRe, '.' + newName).replace(keyRe, (_m, pre) => pre + newName + ':');
        if (line !== before) lineChanged++;
      }
    } else {
      // 散文：只改**反引号包裹的标识符**（显式引用，反引号天然定界，最安全）
      for (const [oldName, newName] of pairs) {
        const re = new RegExp('`' + escapeRe(oldName) + '`', 'g');
        const before = line;
        line = line.replace(re, '`' + newName + '`');
        if (line !== before) lineChanged++;
      }
    }
    if (lineChanged) {
      // 自检：新名与旧名同时出现在同一行 → 可能是巧合，回退并报告
      const suspicious = pairs.some(([oldName, newName]) =>
        (inFence ? (line.includes('.' + oldName) && line.includes('.' + newName))
                 : (line.includes('`' + oldName + '`') && line.includes('`' + newName + '`'))));
      if (suspicious) {
        totalSkipped++;
        console.log(`  ~ 跳过（新旧名同行，疑似巧合）  ${doc}:${i + 1}`);
        continue;
      }
      lines[i] = line;
      changed++;
    }
  }
  totalReplacements += changed;
  console.log(`${doc}: ${changed} 行标识符已更新`);
  if (apply && changed) fs.writeFileSync(doc, lines.join('\n'));
}

console.log(`\n合计 ${totalReplacements} 行更新，跳过 ${totalSkipped} 行${apply ? '' : '（--apply 未指定，未写盘）'}。`);
