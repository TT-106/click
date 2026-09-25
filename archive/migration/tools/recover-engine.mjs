// 确定性提取：原始交付物保留不动；只提取有明确边界的数据与压缩器。
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const raw = await readFile(path.join(root, 'c2.js'), 'utf8');
const hash = createHash('sha256').update(raw).digest('hex');
await mkdir(path.join(root, 'src/engine'), { recursive: true });
await mkdir(path.join(root, 'src/data'), { recursive: true });
let source = raw;
function extractArray(start) {
  let depth = 0, quote = null, escape = false;
  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    if (quote) { if (escape) escape = false; else if (ch === '\\') escape = true; else if (ch === quote) quote = null; continue; }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '[') depth++;
    else if (ch === ']' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error('无法确认精灵图数据边界');
}
const atlases = {};
for (const [name, marker] of [ ['monsters', 'var aa = '], ['terrain', 'I: new Pb("spritesheet/terrain.png", 54, '], ['items', 'Kj: new Pb("spritesheet/items.png", 32, '] ]) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) throw new Error(`原始包结构变化：${name}`);
  const start = markerIndex + marker.length;
  const text = extractArray(start);
  const data = vm.runInNewContext('(' + text + ')', {}, { timeout: 1000 });
  atlases[name] = data.length;
  await writeFile(path.join(root, `src/data/${name}-atlas.js`), `// 从 c2.js 恢复；坐标保持原样。\nexport default ${JSON.stringify(data, null, 2)};\n`);
  source = source.slice(0, start) + `${name}Atlas` + source.slice(start + text.length);
}
const codecStart = source.indexOf('/*\n\n Copyright (c) 2013 Pieroxy');
const codecEnd = source.indexOf('function ga(a)');
if (codecStart < 0 || codecEnd < codecStart) throw new Error('压缩器边界变化');
const codec = source.slice(codecStart, codecEnd).replace(/"undefined" !== typeof module[^\n]+\n/, '');
await writeFile(path.join(root, 'src/engine/save-codec.js'), codec + '\nexport const compress = value => fa.cD(value);\nexport const decompress = value => fa.eD(value);\nexport default fa;\n');
source = source.slice(0, codecStart) + source.slice(codecEnd);
source = source.replace('window.Game = w;', `// 遗留实现的唯一出口。产品代码只依赖 adapter.js。\nexport const legacy = { game: w, classes: av, partyBonus: Rs, statValue: $h, serialize: () => vz(w.pg), decode: fa.eD, encode: fa.cD, snapshot: () => lB(w.pg), importSave: value => w.hE(value), setPersistence: value => { persistence = value; } };`);
// 存储由现代服务负责异常处理与校验；保留原序列化格式和保存时机。
source = source.replace('"undefined" != typeof localStorage && localStorage.removeItem(a.Zp)', 'persistence.remove()');
source = source.replace('"undefined" != typeof localStorage && localStorage.setItem(a.Zp, b)', 'persistence.write(b)');
source = source.replace('"undefined" != typeof localStorage && kB(b, localStorage.getItem(b.Zp))', 'kB(b, persistence.read())');
source = source.replace('this.UC = 3E5;', 'this.UC = 3E4;');
source = `// 恢复来源 c2.js SHA-256: ${hash}\n// 由 npm run recover 生成。不要将短变量名视为已经恢复的原始命名。\nimport monstersAtlas from '../data/monsters-atlas.js';\nimport terrainAtlas from '../data/terrain-atlas.js';\nimport itemsAtlas from '../data/items-atlas.js';\nimport fa from './save-codec.js';\nlet persistence = { read: () => null, write: () => {}, remove: () => {} };\n` + source;
await writeFile(path.join(root, 'src/engine/recovered-runtime.js'), source);
await writeFile(path.join(root, 'src/engine/recovery-manifest.json'), JSON.stringify({ source: 'c2.js', sha256: hash, atlases, transformations: ['extract-sprite-atlases', 'extract-original-lz-codec', 'isolate-es-module-scope', 'inject-persistence', 'autosave-30-seconds', 'replace-window-game-with-private-export'] }, null, 2) + '\n');
console.log(`恢复完成：${Object.values(atlases).reduce((a,b) => a+b, 0)} 个图块，原引擎保留。`);
