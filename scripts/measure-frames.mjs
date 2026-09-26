// 真实帧时间测量（重构版页面）：建队→开战→采样 rAF 间隔，并记录被 loop.js 吞掉的渲染异常。
// 原版独立页面（archive/original/index.html）的开局流程未被自动化，因此本脚本不测它——
// 报告照此说明，不假装有对比基线。
// 用法：node scripts/measure-frames.mjs   （前置：npm run dev 已在 127.0.0.1:4173）
import { chromium } from 'playwright';

const baseURL = process.env.TEST_URL || 'http://127.0.0.1:4173';
const samples = Number(process.env.FRAME_SAMPLES || 600);

const percentile = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.round((sorted.length - 1) * p))];

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { const t = m.text(); if (t.startsWith('Caught error')) errors.push(t.slice(0, 140)); });
  await page.goto(`${baseURL}/index.html`);
  await page.locator('#app-content').waitFor({ state: 'visible' });
  await page.locator('#recommended-party').click();
  await page.locator('#begin-adventure').click();
  await page.locator('#expedition-screen').waitFor({ state: 'visible' });
  await page.waitForTimeout(3000);

  const sample = async (label) => {
    const deltas = await page.evaluate(async (n) => {
      const out = [];
      await new Promise((resolve) => {
        let last = performance.now();
        let count = 0;
        const step = () => {
          const now = performance.now();
          out.push(now - last);
          last = now;
          if (++count >= n) { resolve(); return; }
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
      return out;
    }, samples);
    const sorted = deltas.slice(1).sort((a, b) => a - b);
    return {
      state: label,
      frames: sorted.length,
      meanMs: Number((sorted.reduce((x, y) => x + y, 0) / sorted.length).toFixed(2)),
      p50: Number(percentile(sorted, 0.5).toFixed(2)),
      p95: Number(percentile(sorted, 0.95).toFixed(2)),
      p99: Number(percentile(sorted, 0.99).toFixed(2)),
      worstMs: Number(sorted[sorted.length - 1].toFixed(2)),
      over50ms: sorted.filter((d) => d > 50).length,
    };
  };

  const results = [await sample('远征视图（地牢渲染 + DOM 面板）')];
  await page.locator('#main-nav [data-page="points"]').click();
  await page.waitForTimeout(1500);
  results.push(await sample('冒险点面板（大量 DOM 行刷新）'));

  for (const r of results) console.log(JSON.stringify(r));
  console.log(JSON.stringify({ measuredAt: new Date().toISOString(), samples, viewport: '1440x1000 chrome headless', results, swallowedRenderErrors: [...new Set(errors)] }, null, 2));
} finally {
  await browser.close();
}
