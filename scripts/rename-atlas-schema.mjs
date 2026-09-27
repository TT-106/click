// 贴纸图集（atlas）数据键语义化：a → name（贴纸文件名）、b → position（{x,y} 图集像素坐标）。
// 用法: node scripts/rename-atlas-schema.mjs [--dry]
//
// 为什么不用 rename-fields-batch.mjs：这三份数据文件的键是**带引号的 JSON 键**（"a":），
// 而批处理工具的 keyRe 只匹配裸键（^indent a:），且其"字符串字面量多重集"校验会把
// 键名改动误判为语义变化。故此处做精确的、带断言的定向替换。
//
// 消费点只有两处：
//   src/engine/modules/rendering/sprites.js  SpriteSheet.registerDefinitions（c.a/c.b.x/c.b.y）
//   src/engine/modules/views/results.js      appendRandomMonsterPortrait（b.a）
// Sprite 构造签名 (spriteSheet, sourceX, sourceY, name) 印证 name/position 定名。
import fs from 'node:fs';

const dry = process.argv.includes('--dry');

const dataFiles = ['src/data/items-atlas.js', 'src/data/monsters-atlas.js', 'src/data/terrain-atlas.js'];
const consumerFiles = ['src/engine/modules/rendering/sprites.js', 'src/engine/modules/views/results.js'];

const edits = [];

for (const file of dataFiles) {
  const src = fs.readFileSync(file, 'utf8');
  const countA = (src.match(/"a":/g) || []).length;
  const countB = (src.match(/"b":/g) || []).length;
  if (countA === 0 || countA !== countB) {
    throw new Error(`${file}: "a": ${countA} 个 / "b": ${countB} 个——键数不等，拒绝改（可能已改过）`);
  }
  const next = src.split('"a":').join('"name":').split('"b":').join('"position":');
  if (next === src) throw new Error(`${file}: 替换后内容未变化`);
  edits.push({ file, src, next, detail: `a=${countA} b=${countB}` });
}

const consumerReplacements = [
  {
    file: 'src/engine/modules/rendering/sprites.js',
    from: 'this.animationMap[c.a] = new Sprite(this, c.b.x, c.b.y, c.a);',
    to: 'this.animationMap[c.name] = new Sprite(this, c.position.x, c.position.y, c.name);',
  },
  {
    file: 'src/engine/modules/views/results.js',
    from: 'b = game.monsterSprites.getSprite(b.a);',
    to: 'b = game.monsterSprites.getSprite(b.name);',
  },
];

const consumerEdits = new Map();
for (const { file, from, to } of consumerReplacements) {
  const src = consumerEdits.get(file)?.src ?? fs.readFileSync(file, 'utf8');
  const hits = src.split(from).length - 1;
  if (hits !== 1) throw new Error(`${file}: 期望 1 处「${from}」，实际 ${hits} 处`);
  consumerEdits.set(file, { src, next: src.split(from).join(to) });
}

for (const { file, detail } of edits) console.log(`${file}: ${detail}`);
for (const [file, { src, next }] of consumerEdits) {
  console.log(`${file}: 消费点已改写（${src.length} -> ${next.length} 字节）`);
}

if (dry) {
  console.log('\n--dry：断言全部通过，未写盘。');
} else {
  for (const { file, next } of edits) fs.writeFileSync(file, next);
  for (const [file, { next }] of consumerEdits) fs.writeFileSync(file, next);
  console.log('\n已写入。');
}

// 全库回扫：确认 src 内不再有 .a / .b 形式的图集访问
const leftovers = [];
for (const file of [...dataFiles, ...consumerFiles]) {
  const text = fs.readFileSync(file, 'utf8');
  for (const pattern of [/\.a\b/, /\.b\b/, /"a":/, /"b":/]) {
    const m = text.match(pattern);
    if (m) leftovers.push(`${file}: 仍有 ${m[0]}`);
  }
}
console.log(leftovers.length ? `!! 残留：\n${leftovers.join('\n')}` : '回扫：无 .a/.b/"a":/"b": 残留。');
