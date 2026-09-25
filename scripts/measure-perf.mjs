// 性能基线测量：在差分 harness 环境中测量重构引擎（与原版对照）的关键操作耗时。
// 产物：output/perf/perf-baseline.json + 控制台摘要。
// 注意：这是 harness 环境（无真实渲染循环）的 CPU 基线，用于回归比较，不代表浏览器渲染帧率。
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import { decodeFixture, encodeSave, withElapsed, withOfflineProcessing, HARNESS_FIXED_NOW } from '../tests/scenarios/save-mutations.mjs';

const baseURL = process.env.TEST_URL || 'http://127.0.0.1:4173';
const base = decodeFixture();
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = {};

try {
  for (const original of [false, true]) {
    const label = original ? 'original' : 'refactored';
    const page = await browser.newPage();
    await page.goto(`${baseURL}/tests/engine-harness.html${original ? '?original' : ''}`);
    await page.waitForFunction(() => Boolean(window.harness), null, { timeout: 10000, polling: 100 });
    // 先载入基线存档：无队伍时直接推进会走空状态路径，不代表真实负载
    await page.evaluate(text => window.harness.load(text), encodeSave(base));
    await page.evaluate(ms => window.harness.setTime(ms), HARNESS_FIXED_NOW);
    results[label] = {};

    // 1) 回合推进吞吐：单次 evaluate 内推进并计时（排除 IPC 影响）
    results[label].advancePerCallMs = await page.evaluate(() => {
      const t0 = performance.now();
      window.harness.advance(500);
      return (performance.now() - t0) / 500;
    });

    // 2) 存档序列化耗时（snapshot = 完整 DTO 构造）
    results[label].serializeMs = await page.evaluate(() => {
      const t0 = performance.now();
      for (let i = 0; i < 50; i++) window.harness.snapshot();
      return (performance.now() - t0) / 50;
    });

    // 3) 存档导入耗时
    const saveText = encodeSave(base);
    results[label].importMs = await page.evaluate(text => {
      const t0 = performance.now();
      window.harness.load(text);
      return performance.now() - t0;
    }, saveText);

    // 4) 离线结算吞吐（1 小时虚拟时长）：载入时时钟已领先存档时间戳 1 小时，离线即刻触发
    const off1h = encodeSave(withElapsed(withOfflineProcessing(base, true), 3600e3));
    results[label].offline1h = await page.evaluate(text => {
      window.harness.setTime(1750000000000);
      window.harness.load(text);
      const t0 = performance.now();
      const snap = window.harness.advanceOffline();
      const wall = performance.now() - t0;
      return { wallMs: wall, turnsProcessed: snap.turnNumber };
    }, off1h);

    await page.close();
  }

  await fs.mkdir('output/perf', { recursive: true });
  await fs.writeFile('output/perf/perf-baseline.json', JSON.stringify(results, null, 2));

  const r = results.refactored, o = results.original;
  console.log('重构引擎（harness CPU 基线）:');
  console.log(`  回合推进: ${r.advancePerCallMs.toFixed(3)} ms/回合`);
  console.log(`  存档序列化: ${r.serializeMs.toFixed(2)} ms/次`);
  console.log(`  存档导入: ${r.importMs.toFixed(1)} ms/次`);
  console.log(`  离线 1h 结算: ${r.offline1h.wallMs.toFixed(0)} ms CPU（${r.offline1h.turnsProcessed} 回合）`);
  console.log('原版对照:');
  console.log(`  回合推进: ${o.advancePerCallMs.toFixed(3)} ms/回合（比值 ${(r.advancePerCallMs / o.advancePerCallMs).toFixed(2)}x）`);
  console.log(`  存档序列化: ${o.serializeMs.toFixed(2)} ms/次`);
  console.log(`  存档导入: ${o.importMs.toFixed(1)} ms/次`);
  console.log(`  离线 1h 结算: ${o.offline1h.wallMs.toFixed(0)} ms CPU（${o.offline1h.turnsProcessed} 回合）`);
} finally {
  await browser.close();
}
