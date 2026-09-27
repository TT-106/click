// 扫描 src/ 中残留的 1-2 字符混淆属性名（成员访问 + 对象字面量键），
// 输出 artifacts/obfuscated-fields.json：按出现频次排序的重命名工作清单。
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import generateModule from '@babel/generator';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import fs from 'node:fs';

const walk = traverseModule.default ?? traverseModule;
const generate = generateModule.default ?? generateModule;
const OBFUSCATED = /^[A-Za-z_$]{1,2}$/;
// JS/浏览器内建成员与已是语义名的常见属性——不属于混淆治理范围
// 另：'ok' 是 Fetch `Response.ok` 与 postMessage 消息协议字段（src/ui/load-panels.js、
// services/save-worker.js、services/saves.js），不是游戏字段，永远不参与重命名。
const BUILTIN = new Set([
  'prototype', 'length', 'push', 'pop', 'shift', 'splice', 'slice', 'concat', 'join', 'indexOf', 'map', 'filter', 'reduce', 'forEach', 'sort', 'find', 'call', 'apply', 'bind', 'keys', 'values',
  'style', 'innerHTML', 'textContent', 'width', 'height', 'left', 'top', 'right', 'bottom', 'type', 'name', 'value', 'id', 'class', 'title', 'href', 'src', 'parent', 'children', 'childNodes', 'firstChild', 'nextSibling', 'parentNode', 'hidden', 'checked', 'disabled', 'selected', 'dataset', 'classList', 'className', 'clientWidth', 'clientHeight', 'offsetWidth', 'offsetHeight', 'scrollWidth', 'scrollHeight', 'context', 'canvas', 'getImageData', 'putImageData', 'drawImage', 'clearRect', 'fillRect', 'strokeRect', 'beginPath', 'closePath', 'moveTo', 'lineTo', 'arc', 'fill', 'stroke', 'save', 'restore', 'translate', 'rotate', 'scale', 'fillStyle', 'strokeStyle', 'lineWidth', 'globalAlpha', 'font', 'textAlign', 'textBaseline', 'shadowColor', 'shadowBlur', 'createLinearGradient', 'addColorStop', 'insertCell', 'insertRow', 'appendChild', 'removeChild', 'setAttribute', 'getAttribute', 'addEventListener', 'removeEventListener', 'getElementById', 'querySelector', 'querySelectorAll', 'createElement', 'createTextNode', 'focus', 'blur', 'click', 'preventDefault', 'stopPropagation', 'charCodeAt', 'charAt', 'substr', 'substring', 'toLowerCase', 'toUpperCase', 'trim', 'replace', 'split', 'match', 'test', 'exec', 'toString', 'valueOf', 'hasOwnProperty', 'abs', 'min', 'max', 'floor', 'ceil', 'round', 'sqrt', 'pow', 'random', 'now', 'log', 'error', 'warn', 'stringify', 'parse', 'imul', 'from', 'isArray', 'size', 'x', 'y', 'z', 'ok', 'PI',
]);

async function listJs(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await listJs(full));
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

const files = [
  ...await listJs('src/engine'),
  ...await listJs('src/ui').catch(() => []),
];
const fields = new Map();

function record(name, kind, file, node) {
  if (!OBFUSCATED.test(name) || BUILTIN.has(name)) return;
  const entry = fields.get(name) ?? { name, kind, reads: 0, writes: 0, files: new Set(), samples: [] };
  entry.files.add(file);
  if (entry.samples.length < 3 && entry.samples.every(s => s.loc !== `${file}`)) {
    entry.samples.push({ loc: `${file}:${node.loc?.start.line}`, code: generate(node).code.slice(0, 140) });
  }
  fields.set(name, entry);
}

for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');
  const ast = parse(code, { sourceType: 'module' });
  walk(ast, {
    MemberExpression(path) {
      const prop = path.node.property;
      if (path.node.computed || prop?.type !== 'Identifier') return;
      if (!OBFUSCATED.test(prop.name) || BUILTIN.has(prop.name)) return;
      const entry = fields.get(prop.name) ?? { name: prop.name, reads: 0, writes: 0, files: new Set(), samples: [] };
      entry.files.add(file);
      const isWrite = path.parent.type === 'AssignmentExpression' && path.parent.left === path.node
        || path.parent.type === 'UpdateExpression';
      if (isWrite) entry.writes++; else entry.reads++;
      if (entry.samples.length < 3) entry.samples.push({ loc: `${file}:${path.node.loc?.start.line}`, code: generate(path.node).code.slice(0, 140) });
      fields.set(prop.name, entry);
    },
    ObjectProperty(path) {
      const key = path.node.key;
      if (!path.node.computed && key?.type === 'Identifier' && OBFUSCATED.test(key.name) && !BUILTIN.has(key.name)) {
        const entry = fields.get(key.name) ?? { name: key.name, reads: 0, writes: 0, files: new Set(), samples: [] };
        entry.files.add(file);
        entry.writes++;
        if (entry.samples.length < 3) entry.samples.push({ loc: `${file}:${path.node.loc?.start.line}`, code: generate(path.node).code.slice(0, 140) });
        fields.set(key.name, entry);
      }
    },
  });
}

const result = [...fields.values()]
  .map(({ files, ...rest }) => ({ ...rest, fileCount: files.size, files: [...files].sort() }))
  .sort((a, b) => (b.reads + b.writes) - (a.reads + a.writes));

fs.mkdirSync('artifacts', { recursive: true });
fs.writeFileSync('artifacts/obfuscated-fields.json', JSON.stringify(result, null, 2));

const symbolMap = JSON.parse(fs.readFileSync('docs/symbol-map.json', 'utf8'));
const proposals = { ...symbolMap.fields, ...symbolMap.gameFields };
const knownCount = result.filter(f => proposals[f.name]).length;

console.log(`混淆属性总数: ${result.length}（${knownCount} 个在 symbol-map 中有语义提案）`);
console.log('高频前 30：');
for (const f of result.slice(0, 30)) {
  console.log(`  ${f.name}  r:${f.reads} w:${f.writes} files:${f.fileCount}  ${proposals[f.name] ?? '⚠ 无提案'}  例: ${f.samples[0]?.loc}`);
}
