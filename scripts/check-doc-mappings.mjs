// 映射表一致性检查（docs/persistence.md / docs/game-state-schema.md）。
//
// 为什么不是扩展现有的 check-doc-snippets：这两篇的"存档键 ↔ 运行时字段"映射写成**表格**与
// 行内反引号，没有带 ref 的围栏代码块，片段检查器对它们报"共检查 0 个代码片段"——
// 把它们加进片段检查范围只会得到一个永远绿的空检查。
//
// 这里检查的是映射本身：表格里写到的运行时字段名，必须仍然作为属性/键存在于当前源码，
// 或存在于存档 fixture 的键集合里。改名波次把 `R`/`he`/`Sd` 这类换掉之后，
// 文档若没跟上就会在这里报出来，而不是继续教下一个智能体用已经不存在的名字。
//
// **能力边界（别把它当成映射正确性证明）**：
// - 判定是"名字存在"，不是"归属正确"。知名集合含全库属性名/绑定名/字符串字面量（上万条），
//   所以 `shops.ni` 只要在任何对象上出现过 `ni` 就算通过——它能抓到"名字彻底消失"的漂移，
//   抓不到"名字还在但挂错了对象"。owner 级校验需要类型解析，成本另计。
// - 只看反引号里的**纯标识符点链**；`d = Date.now()` 这类行内代码、以及 `（:704→:1008）`
//   这类裸行号引用都不在形态内，需由 verify-doc-refs / 人工同步覆盖。
// - 原版 oracle 名（`world.R`、`state.dz`）与 tests/scripts 里的名字分别单独成桶，
//   不算漂移——这两篇文档的本意就是"原版字段 ↔ 我们的字段"。
//
// 敏感度实测：把 docs/persistence.md:76 的 `shops.ni` 改成 `shops.ZZZNOTAFIELD`，
// 本脚本立刻多报 1 条并指名该行；还原后回到 0 条。
//
//   node scripts/check-doc-mappings.mjs [--json]
import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule.default ?? traverseModule;
const ROOT = process.cwd();

const DOCS = ['docs/persistence.md', 'docs/game-state-schema.md'];

/** 当前源码里出现过的属性名 / 对象键 / 绑定名 / 字符串字面量值 */
function collectNames(dirs, withStrings = true) {
  const names = new Map(); // name -> 出处样例
  const files = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      // .mjs 也必须收：tests/unit/*.test.mjs 全在这个扩展名下，
      // 只匹配 .js 会让整个 tests 目录变成空集合，把 assert.deepEqual 这类合法名报成漂移。
      else if (/\.(js|mjs|cjs)$/.test(e.name)) files.push(p);
    }
  };
  for (const d of dirs) {
    const abs = path.join(ROOT, d);
    if (fs.existsSync(abs)) walk(abs);
  }
  for (const f of files) {
    const rel = path.relative(ROOT, f).split(path.sep).join('/');
    let ast;
    try { ast = parse(fs.readFileSync(f, 'utf8'), { sourceType: 'module' }); }
    catch { continue; }
    traverse(ast, {
      MemberExpression(p) {
        const pr = p.node.property;
        if (!p.node.computed && pr.type === 'Identifier') {
          if (!names.has(pr.name)) names.set(pr.name, rel);
        }
      },
      ObjectProperty(p) {
        const k = p.node.key;
        if (k.type === 'Identifier' && !names.has(k.name)) names.set(k.name, rel);
        if (k.type === 'StringLiteral' && !names.has(k.value)) names.set(k.value, rel);
      },
      // 文档同样会引用函数名、类名、导出名（`serializeCharacter`、`TreasureChest` 这类），
      // 只收属性名会把它们全判成"已不存在"。
      Scope(p) {
        for (const b of Object.values(p.scope.bindings)) {
          if (b.identifier.type === 'Identifier' && !names.has(b.identifier.name)) names.set(b.identifier.name, rel);
        }
      },
      LabeledStatement(p) {
        if (p.node.label?.name && !names.has(p.node.label.name)) names.set(p.node.label.name, rel);
      },
      // 字符串字面量值：事件名（pagehide）、存档键（C2_V1_001）、贴图名等都是字符串而非标识符，
      // 不收进来会把它们误报成"字段已不存在"。
      StringLiteral(p) {
        if (withStrings && !names.has(p.node.value)) names.set(p.node.value, rel);
      },
    });
  }
  return names;
}

/** 原版真实存档的顶层与一层嵌套键（.c2save 是压缩编码，必须走产品的 save-codec） */
async function collectFixtureKeys() {
  const keys = new Set();
  try {
    const codec = (await import('../src/engine/save-codec.js')).default;
    const raw = fs.readFileSync(path.join(ROOT, 'tests/fixtures/original.c2save'), 'utf8');
    const obj = JSON.parse(codec.decompress(raw));
    for (const k of Object.keys(obj)) keys.add(k);
    for (const v of Object.values(obj)) {
      if (v && typeof v === 'object' && !Array.isArray(v)) for (const k of Object.keys(v)) keys.add(k);
      if (Array.isArray(v)) for (const item of v.slice(0, 5)) {
        if (item && typeof item === 'object') for (const k of Object.keys(item)) keys.add(k);
      }
    }
  } catch (e) { console.log('  （fixture 解码失败，仅按源码名判定：' + e.message + '）'); }
  return keys;
}

const srcNames = collectNames(['src']);
const otherNames = collectNames(['tests', 'scripts']);
const oracleNames = collectNames(['archive/original']);
const fixtureKeys = await collectFixtureKeys();

// 关键字/字面量与文件名不是"字段引用"，不参与判定
const KEYWORDS = new Set(['true', 'false', 'null', 'undefined', 'this', 'new', 'typeof', 'void']);
const EXT_LEAF = /^(md|js|ts|json|png|css|svg|html|mjs|cjs)$/;

// 文档里像"字段引用"的 token：反引号内、点号分隔、每段都像标识符
const TOKEN = /^[a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*){0,2}$/;
const findings = [];
const elsewhere = [];
const oracleRefs = [];
let checked = 0;
for (const doc of DOCS) {
  const lines = fs.readFileSync(path.join(ROOT, doc), 'utf8').split(/\r?\n/);
  lines.forEach((line, idx) => {
    if (!/^\s*\|/.test(line) && !/`/.test(line)) return;
    for (const m of line.matchAll(/`([^`]+)`/g)) {
      const token = m[1].trim();
      if (!TOKEN.test(token)) continue;
      // 跳过纯函数调用形态与已知的语言内建
      const parts = token.split('.');
      const head = parts[0];
      const leaf = parts[parts.length - 1];
      if (['Date', 'Math', 'JSON', 'Number', 'String', 'Object', 'Array', 'Boolean', 'window', 'document', 'localStorage'].includes(head)) continue;
      if (KEYWORDS.has(token) || KEYWORDS.has(leaf)) continue;
      if (EXT_LEAF.test(leaf) || /\.[a-z]{2,3}$/.test(token) && EXT_LEAF.test(leaf)) continue;
      if (/^(now|random|floor|ceil|round|min|max|abs|stringify|parse|decode|encode)$/.test(leaf)) continue;
      checked++;
      if (srcNames.has(leaf) || fixtureKeys.has(leaf)) continue;
      // 这两篇是"原版字段 ↔ 我们的字段"的映射表，右栏大量引用原版混淆名（`world.R`、`state.dz`）。
      // 引用 oracle 名不是文档漂移，得单独成桶，否则检查器会把最核心的内容全判成错误。
      if (oracleNames.has(leaf)) { oracleRefs.push({ doc, line: idx + 1, token }); continue; }
      // 只在 tests/ scripts/ 里出现的（测试辅助名、检查器内部名）单列，不算文档漂移
      if (otherNames.has(leaf)) elsewhere.push({ doc, line: 0, token });
      else findings.push({ doc, line: idx + 1, token });
    }
  });
}

console.log(`映射表一致性：核对 ${DOCS.join(' / ')}`);
console.log(`  知名集合：源码 ${srcNames.size}、tests/scripts ${otherNames.size}、原版档案 ${oracleNames.size}、fixture 键 ${fixtureKeys.size}`);
console.log(`  核对 token ${checked} 个：`);
console.log(`    - 引用原版 oracle 名（合理）${oracleRefs.length} 个`);
console.log(`    - 仅见于 tests/scripts（合理）${elsewhere.length} 个`);
console.log(`    - 当前源码/fixture/原版都找不到 → 疑似文档漂移 ${findings.length} 个`);
for (const f of findings.slice(0, 60)) console.log(`  ✗ ${f.doc}:${f.line}  \`${f.token}\``);
if (findings.length > 60) console.log(`  …另有 ${findings.length - 60} 条`);
if (process.argv.includes('--json')) {
  fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'artifacts', 'doc-mappings.json'), JSON.stringify({ checked, findings }, null, 2));
}
process.exitCode = findings.length ? 1 : 0;
