// 长程差分：按 250ms/回合推进 8h 与 24h 等价回合，并采样 GC 后 JS 堆。
// 前置：npm run dev (http://127.0.0.1:4173)。
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import { decodeFixture, encodeSave, HARNESS_FIXED_NOW } from '../tests/scenarios/save-mutations.mjs';

const baseURL = process.env.TEST_URL || 'http://127.0.0.1:4173';
const turnsPerHour = 3600_000 / 250;
const checkpoints = [8 * turnsPerHour, 24 * turnsPerHour];
const batchSize = 3000;
const fixture = encodeSave(decodeFixture());
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const records = [];
const pages = [];

async function sample(page, cdp) {
  await cdp.send('HeapProfiler.collectGarbage');
  const { metrics } = await cdp.send('Performance.getMetrics');
  const usedBytes = metrics.find(metric => metric.name === 'JSHeapUsedSize')?.value;
  assert.equal(typeof usedBytes, 'number', 'Chrome 必须提供 JSHeapUsedSize 指标');
  return usedBytes;
}

async function checkpoint(turns) {
  const states = await Promise.all(pages.map(p => p.page.evaluate(() => window.harness.snapshot())));
  assert.deepEqual(states[1], states[0], `推进 ${turns} 回合后完整存档分叉`);
  assert.equal(states[0].turnNumber, decodeFixture().turnNumber + turns, '实际回合数必须等于目标');
  const heaps = await Promise.all(pages.map(p => sample(p.page, p.cdp)));
  const record = { turns, hours: turns / turnsPerHour, originalHeapBytes: heaps[0], restoredHeapBytes: heaps[1] };
  records.push(record);
  console.log(`✓ ${record.hours}h：完整存档一致；GC 后 JS 堆 原版 ${heaps[0]} / 重构版 ${heaps[1]} bytes`);
}

try {
  for (const original of [true, false]) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.stack ?? error.message));
    await page.goto(`${baseURL}/tests/engine-harness.html${original ? '?original' : ''}`);
    await page.waitForFunction(() => Boolean(window.harness), null, { timeout: 10000 });
    await page.evaluate(text => window.harness.load(text), fixture);
    await page.evaluate(ms => window.harness.setTime(ms), HARNESS_FIXED_NOW);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Performance.enable');
    pages.push({ page, cdp, errors });
  }

  let completed = 0;
  const initialHeaps = await Promise.all(pages.map(p => sample(p.page, p.cdp)));
  records.push({ turns: 0, hours: 0, originalHeapBytes: initialHeaps[0], restoredHeapBytes: initialHeaps[1] });
  for (const target of checkpoints) {
    while (completed < target) {
      const turns = Math.min(batchSize, target - completed);
      await Promise.all(pages.map(p => p.page.evaluate(n => window.harness.advanceRaw(n), turns)));
      completed += turns;
    }
    await checkpoint(completed);
    assert.deepEqual(pages.flatMap(p => p.errors), [], '浏览器运行时异常');
  }
  await fs.mkdir('output/soak', { recursive: true });
  await fs.writeFile('output/soak/last-run.json', JSON.stringify({ runAt: new Date().toISOString(), checkpoints: records }, null, 2) + '\n');
} finally {
  await browser.close();
}
