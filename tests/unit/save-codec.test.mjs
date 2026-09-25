// 存档编码契约：LZ-string 1.3.3 Base64。升级/替换 codec 前本测试必须保持通过。
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import codec from '../../src/engine/save-codec.js';

test('compress/decompress 往返保持原文', () => {
  for (const text of ['hello world', '', '中文与 emoji 🗡️', JSON.stringify({ a: 1, nested: [1, 2, 3] }), 'x'.repeat(100000)]) {
    assert.equal(codec.decompress(codec.compress(text)), text);
  }
});

test('与原版 fixture 的编码互通（向后兼容）', () => {
  const raw = fs.readFileSync('tests/fixtures/original.c2save', 'utf8').trim();
  const json = codec.decompress(raw);
  assert.ok(json, '原版存档应可被当前 codec 解码');
  const save = JSON.parse(json);
  for (const key of ['saveKey', 'gameTimestamp', 'gameInitialized', 'turnNumber', 'world', 'party', 'adventurers', 'statistics']) {
    assert.ok(Object.hasOwn(save, key), `原版存档缺少键 ${key}`);
  }
  // 当前 codec 压缩出的字符串必须仍能被自身还原
  assert.equal(codec.decompress(codec.compress(json)), json);
});
