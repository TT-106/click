// 真实帧时间测量：建队→开战→采样 rAF 间隔，并记录被 loop.js 吞掉的渲染异常。
// U133 起新增原版同口径腿：archive/original/index.html 的遗留组队流程可自动化
// （点 4 个职业行 → startQuestButton），与重构版交替 A/B 采样。
// 口径警告：headless rAF 间隔含浏览器调度影响，不等于真机掉帧率；真机/低端设备仍未测。
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

  const sample = async (target, label) => {
    const deltas = await target.evaluate(async (n) => {
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

  const results = [await sample(page, '远征视图（地牢渲染 + DOM 面板）')];
  await page.locator('#main-nav [data-page="points"]').click();
  await page.waitForTimeout(1500);
  results.push(await sample(page, '冒险点面板（大量 DOM 行刷新）'));
  for (const r of results) console.log(JSON.stringify(r));

  // ---- U133：原版同口径腿 + 交替 A/B ----
  // index.html 引用 g8hh.com/baidu 的站外脚本，离线环境会挂起 window.onload（游戏启动点），
  // 必须阻断外部请求 onload 才会触发（Game.onLoad）。
  await context.route(/g8hh\.com|hm\.baidu\.com|\.baidu\.com/, (route) => route.abort());
  const startOriginal = async () => {
    const opage = await context.newPage();
    await opage.goto(`${baseURL}/archive/original/index.html`, { waitUntil: 'domcontentloaded' });
    await opage.waitForFunction(() => typeof window.Game !== 'undefined', null, { timeout: 20000, polling: 200 });
    // onload 被挂起的站外资源阻塞时手动触发启动（与 tests/engine-harness.js 同构）；
    // 若 boot 后视图未自动挂载，按 harness 的方式补几帧 Hr.Hr()。
    // 初始化需要真实时间间隔的重复 tick（贴图 404 的 error 事件要插在 tick 之间被消费），
    // 与 tests/engine-harness.js 的 20ms 轮询同构；挂载完成后清除 ticker，交还生产自循环。
    await opage.evaluate(() => {
      window.onload = null;
      if (!window.__u133Booted) {
        window.__u133Booted = true;
        Game.onLoad(document);
        window.__u133Ticker = setInterval(() => { try { Game.Hr.Hr(); } catch (e) {} }, 20);
      }
    });
    await opage.waitForFunction(() => Boolean(document.getElementById('startQuestButton')), null, { timeout: 30000, polling: 200 });
    await opage.evaluate(() => clearInterval(window.__u133Ticker));
    // 与重构版推荐阵容 [0,1,2,3] 同构：点前 4 个已解锁职业行，默认名即合法
    const rows = opage.locator('#partyCreationTabContent .characterSelectionButton');
    for (let i = 0; i < 4; i++) await rows.nth(i).click();
    await opage.locator('#startQuestButton').click();
    await opage.waitForTimeout(3000);
    return opage;
  };
  // 原版腿为非致命：生产 boot（Game.onLoad → 资产门控装载）在资产被剥离的冻结档案里
  // 无法到达组队挂载（Game.Em 恒 false，复现探针 output/overnight-u133/probe-original2.mjs），
  // 失败时如实记录并跳过 A/B，不让 perf:frames 假红。
  let opage = null;
  const oerrors = [];
  let abRounds = [];
  let abNote = null;
  try {
    opage = await startOriginal();
    opage.on('pageerror', (e) => oerrors.push('pageerror: ' + e.message));
    const orders = [['original', opage], ['refactored', page]];
    for (let round = 0; round < 3; round++) {
      const leg = orders[round % 2][0] === 'original' ? orders : [...orders].reverse();
      for (const [label, target] of leg) {
        abRounds.push({ round: round + 1, side: label, ...(await sample(target, `R${round + 1}-${label}`)) });
      }
    }
    for (const r of abRounds) console.log(JSON.stringify(r));
  } catch (error) {
    abNote = 'original 腿不可启动（资产剥离的冻结档案下生产 boot 未达组队挂载，Game.Em=false）：' + String(error).slice(0, 160);
    console.log(JSON.stringify({ abSkipped: abNote }));
  }
  if (opage) await opage.close();

  console.log(JSON.stringify({ measuredAt: new Date().toISOString(), samples, viewport: '1440x1000 chrome headless', results, abRounds, abNote, swallowedRenderErrors: [...new Set(errors)], originalPageErrors: [...new Set(oerrors)] }, null, 2));
} finally {
  await browser.close();
}
