// 把已完成改名的「原字母 → 语义名」写入 docs/symbol-map.json 的 fields 段（一对一表）。
// 用法: node scripts/record-field-names.mjs scripts/mappings/a.json [scripts/mappings/b.json ...]
// 规则（见 docs/DEVELOPMENT.md）：**异主字母不得写入**——本脚本不做属主判定，
// 调用方必须只传入「单主或已确证同义并名」的映射文件。
import fs from 'node:fs';

const files = process.argv.slice(2);
if (!files.length) {
  console.error('用法: node scripts/record-field-names.mjs <mapping.json> [...]');
  process.exit(2);
}

const pairs = new Map();
for (const file of files) {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const list = Array.isArray(raw)
    ? raw
    : Object.entries(raw.map).map(([oldName, newName]) => ({ old: oldName, new: newName }));
  for (const { old: oldName, new: newName } of list) {
    if (!oldName || !newName) continue;
    if (pairs.has(oldName) && pairs.get(oldName) !== newName) {
      throw new Error(`${oldName} 在同一批内映射到两个名字：${pairs.get(oldName)} / ${newName}`);
    }
    pairs.set(oldName, newName);
  }
}

const mapPath = 'docs/symbol-map.json';
const symbolMap = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
symbolMap.fields ??= {};

const added = [];
const changed = [];
for (const [oldName, newName] of pairs) {
  if (!(oldName in symbolMap.fields)) added.push(`${oldName} -> ${newName}`);
  else if (symbolMap.fields[oldName] !== newName) changed.push(`${oldName}: ${symbolMap.fields[oldName]} -> ${newName}`);
  symbolMap.fields[oldName] = newName;
}

fs.writeFileSync(mapPath, JSON.stringify(symbolMap, null, 2) + '\n');
console.log(`fields 段：新增 ${added.length}，改写 ${changed.length}，当前共 ${Object.keys(symbolMap.fields).length} 条`);
if (added.length) console.log('新增：' + added.join(', '));
if (changed.length) console.log('改写：' + changed.join(', '));
