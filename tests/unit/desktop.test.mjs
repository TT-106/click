import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { resourcePath, checkedStorage, windowBounds, MAX_CHECKPOINT_BYTES } from '../../desktop/policy.mjs';
import { createDesktopStorage } from '../../src/services/desktop-storage.js';

test('桌面协议允许产品资源，拒绝档案、源码配置和编码后的路径越界', () => {
  const root = path.resolve('dist');
  assert.equal(resourcePath(root, 'companion://game/'), path.join(root, 'index.html'));
  assert.equal(resourcePath(root, 'companion://game/src/app.js'), path.join(root, 'src/app.js'));
  for (const url of ['https://game/src/app.js', 'companion://other/src/app.js', 'companion://game/package.json', 'companion://game/archive/original/c2.js', 'companion://game/assets/%2e%2e%2f%2e%2e%2fsecret', 'companion://game/src/%5c..%5csecret', 'companion://game/src/%00', 'companion://game/src/%FF']) assert.equal(resourcePath(root, url), null, url);
});

test('桌面检查点保留原保存文本，拒绝未知键、非文本和超限内容', () => {
  const value = { C2_V1_001: 'unchanged-base64', C2_OPEN_WORLD_V1: '{"seed":"原野"}' };
  assert.deepEqual(checkedStorage(value), value);
  assert.throws(() => checkedStorage({ arbitrary: 'x' }));
  assert.throws(() => checkedStorage({ C2_V1_001: {} }));
  assert.throws(() => checkedStorage({ C2_V1_001: 'x'.repeat(2 * 1024 * 1024 + 1) }));
  assert.throws(() => checkedStorage({ C2_OPEN_WORLD_V1: 'x'.repeat(MAX_CHECKPOINT_BYTES) }));
});

test('桌面窗口在显示器变更和小屏幕上保持可见，负坐标显示器可恢复', () => {
  assert.deepEqual(windowBounds({ x: 2000, y: -500, width: 9000, height: 9000 }, { x: 0, y: 0, width: 800, height: 600 }, 'full'), { x: 0, y: 0, width: 800, height: 600 });
  assert.deepEqual(windowBounds({ x: -700, y: 20, width: 640, height: 400 }, { x: -1920, y: 0, width: 1920, height: 1080 }, 'companion'), { x: -700, y: 20, width: 640, height: 400 });
  assert.deepEqual(windowBounds(null, { x: 0, y: 0, width: 400, height: 250 }, 'companion'), { x: 0, y: 0, width: 400, height: 250 });
});

test('桌面存储合并写入，失败后可重试且不丢最后一次更改', async () => {
  const commits = []; let fail = true;
  const storage = await createDesktopStorage({ load: async () => ({ storage: { C2_V1_001: 'old' } }), commit: async value => { if (fail) throw new Error('disk full'); commits.push(value); } }, () => {});
  storage.setItem('C2_V1_001', 'new'); storage.setItem('C2_OPEN_WORLD_V1', 'world');
  await assert.rejects(storage.flush(), /disk full/);
  assert.equal(storage.getItem('C2_V1_001'), 'new');
  fail = false; await storage.flush();
  assert.deepEqual(commits, [{ C2_V1_001: 'new', C2_OPEN_WORLD_V1: 'world' }]);
});

test('桌面存储等待进行中的提交后保存新变化，重复文本不写盘', async () => {
  const commits = []; let release;
  const storage = await createDesktopStorage({ load: async () => ({ storage: {} }), commit: async value => { commits.push(value); if (commits.length === 1) await new Promise(resolve => { release = resolve; }); } }, () => {});
  storage.setItem('C2_V1_001', 'first'); const first = storage.flush();
  storage.setItem('C2_V1_001', 'latest'); const second = storage.flush(); release();
  await Promise.all([first, second]);
  assert.equal(commits.at(-1).C2_V1_001, 'latest');
  storage.setItem('C2_V1_001', 'latest'); await storage.flush(); assert.equal(commits.length, 2);
});

test('桌面损坏存档保持只读，禁止空白进度覆盖原文件', async () => {
  let writes = 0;
  const storage = await createDesktopStorage({ load: async () => ({ storage: {}, error: 'corrupt' }), commit: async () => { writes++; } }, () => {});
  assert.equal(storage.error, 'corrupt'); assert.throws(() => storage.setItem('C2_V1_001', 'empty'), /corrupt/);
  await storage.flush(); assert.equal(writes, 0);
});
