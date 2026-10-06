#!/usr/bin/env node
// T5 预览页真实浏览器验收(现有 Playwright,不装新包)。
// 检查:375×812 / 720×440 / 1280×820 三视口、暗/浅背景、减少动画、四标签可访问、
// 筛选搜索有效、JSON/图片请求成功、无横向溢出、控制台错误逐条记录。
// 截图存 output/glm-r52/screenshots/。退出码:0 全过;1 有失败。
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';

const BASE = process.env.TEST_URL || 'http://127.0.0.1:4181/tools/content-prep/index.html';
const outputRoot = resolve(process.env.CONTENT_PREP_OUTPUT_DIR || 'output/glm-r52');
const outputRelative = relative(resolve('output'), outputRoot);
if (outputRelative.startsWith('..') || isAbsolute(outputRelative)) throw new Error('浏览器证据输出须在 output/ 内');
const OUT = resolve(outputRoot, 'screenshots');
mkdirSync(OUT, { recursive: true });
mkdirSync(resolve(outputRoot, 'logs'), { recursive: true });
const expected = {
  items: JSON.parse(readFileSync('content-prep/expedition-v1/items.json', 'utf8')).items.length,
  candidateIcons: JSON.parse(readFileSync('content-prep/expedition-v1/items.json', 'utf8')).items.filter(i=>i.icon.status==='candidate' && i.icon.candidatePath).length,
  recipes: JSON.parse(readFileSync('content-prep/expedition-v1/recipes.json', 'utf8')).recipes.length,
  buildings: JSON.parse(readFileSync('content-prep/expedition-v1/buildings.json', 'utf8')).buildings.length,
};

const VIEWPORTS = [
  { name: 'mobile-375x812', width: 375, height: 812 },
  { name: 'small-720x440', width: 720, height: 440 },
  { name: 'desktop-1280x820', width: 1280, height: 820 },
];
const SCHEMES = ['dark', 'light'];

const failures = [];
const consoleErrors = [];
const failedRequests = [];

const browser = await chromium.launch({ channel: 'msedge' });
try {
  for (const vp of VIEWPORTS) {
    for (const scheme of SCHEMES) {
      for (const reduceMotion of ['reduce', 'no-preference']) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: scheme,
        reducedMotion: reduceMotion,
      });
      const page = await context.newPage();
      page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(`[${vp.name}/${scheme}] ${msg.text()}`); });
      page.on('pageerror', error => consoleErrors.push(`[${vp.name}/${scheme}/${reduceMotion}] ${error.message}`));
      page.on('requestfailed', (req) => failedRequests.push(`[${vp.name}/${scheme}] ${req.url()} ${req.failure()?.errorText}`));
      page.on('response', (res) => { if (res.status() >= 400) failedRequests.push(`[${vp.name}/${scheme}] ${res.url()} HTTP ${res.status()}`); });
      await page.goto(BASE, { waitUntil: 'networkidle' });
      await page.waitForTimeout(400);

      // 数据就绪
      const status = await page.textContent('#data-status');
      if (!status.includes('数据就绪')) failures.push(`${vp.name}/${scheme}: 数据未就绪 — ${status}`);

      // 四标签可访问且无横向溢出
      const tabs = ['tab-items', 'tab-recipes', 'tab-buildings', 'tab-assets'];
      for (const tabId of tabs) {
        await page.click(`#${tabId}`);
        await page.waitForTimeout(150);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (overflow > 1) failures.push(`${vp.name}/${scheme}/${tabId}: 横向溢出 ${overflow}px`);
        const panel = await page.evaluate(({id, expected}) => {
          const p = document.getElementById(id.replace('tab-', 'panel-'));
          if (!p || p.hidden) return false;
          if (id === 'tab-items') return p.querySelectorAll('#item-grid .card').length === expected.items
            && p.querySelectorAll('canvas').length === 11
            && p.querySelectorAll('.icon-slot img').length === expected.candidateIcons
            && [...p.querySelectorAll('.icon-slot img')].every(image=>image.complete && image.naturalWidth>0);
          if (id === 'tab-recipes') return p.querySelectorAll('option').length === expected.recipes
            && p.querySelectorAll('#recipe-detail .card').length === 1;
          if (id === 'tab-buildings') return p.querySelectorAll('.building').length === expected.buildings
            && p.querySelectorAll('table tr').length === expected.buildings * 4;
          return p.querySelectorAll('#asset-view img').length === 7
            && [...p.querySelectorAll('#asset-view img')].every(image => image.complete && image.naturalWidth > 0);
        }, {id:tabId, expected});
        if (!panel) failures.push(`${vp.name}/${scheme}/${reduceMotion}/${tabId}: 面板数量/图像/可见性不满足契约`);
      }
      // 截图:每种屏幕至少一张(物品标签)
      await page.click('#tab-items');
      await page.waitForTimeout(150);
      await page.screenshot({ path: `${OUT}/preview-${vp.name}-${scheme}-${reduceMotion}.png`, fullPage: false });

      // 搜索/筛选(只在桌面暗色做一次断言)
      if (vp.name === 'desktop-1280x820' && scheme === 'dark' && reduceMotion === 'no-preference') {
        await page.fill('#item-search', '木');
        await page.waitForTimeout(150);
        const shown = await page.textContent('#item-count');
        if (!/显示 \d+ \/ 60/.test(shown) || shown.startsWith('显示 0 ')) failures.push(`搜索"木"无结果: ${shown}`);
        await page.screenshot({ path: `${OUT}/preview-search-mu.png` });
        await page.fill('#item-search', '');
        await page.selectOption('#item-category', 'raw');
        await page.waitForTimeout(150);
        const raw = await page.textContent('#item-count');
        if (!raw.startsWith('显示 20 ')) failures.push(`原料筛选应20项: ${raw}`);
        await page.selectOption('#item-category', '');
        // 配方选择
        await page.click('#tab-recipes');
        await page.selectOption('#recipe-select', 'plank-workshop');
        await page.waitForTimeout(150);
        const detail = await page.textContent('#recipe-detail');
        if (!detail.includes('wood') || !detail.includes('工位')) failures.push('配方详情未渲染');
        await page.selectOption('#recipe-select', 'nails');
        const alternatives = await page.locator('#recipe-detail .anyof').allTextContents();
        if (alternatives.length !== 1 || !alternatives[0].includes('只需一种') || !alternatives[0].includes('iron_ingot') || !alternatives[0].includes('copper_ingot')) failures.push('铜铁替代没有显示为同一互斥组');
        await page.screenshot({ path: `${OUT}/preview-recipe.png` });
        // 建筑标签
        await page.click('#tab-buildings');
        await page.waitForTimeout(250);
        const bcount = await page.evaluate(() => document.querySelectorAll('.building').length);
        if (bcount !== 8) failures.push(`建筑卡片 ${bcount} ≠ 8`);
        await page.screenshot({ path: `${OUT}/preview-buildings.png`, fullPage: false });
        // 素材标签(脚点线+三背景)
        await page.click('#tab-assets');
        await page.selectOption('#asset-select', '水井(两朝向之一)|/assets/vendor/rubberduck-medieval-props/medieval_props_2x2_128x64_shaded/medieval_props_2x2_128x64_shaded_04.png');
        await page.waitForTimeout(400);
        await page.screenshot({ path: `${OUT}/preview-asset-well.png`, fullPage: true });
        // 键盘操作:方向键切标签
        await page.focus('#tab-assets');
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(100);
        const wrapped = await page.getAttribute('#tab-items', 'aria-selected');
        if (wrapped !== 'true') failures.push('键盘方向键循环切换失败');
        await page.click('#tab-items');
      }
      await context.close();
      }
    }
  }
} finally {
  await browser.close();
}

const report = {
  base: BASE,
  checkedAt: new Date().toISOString(),
  failures,
  consoleErrors,
  failedRequests,
  configurations: VIEWPORTS.length * SCHEMES.length * 2,
  expected,
};
writeFileSync(resolve(outputRoot, 'logs/t5-browser-report.json'), JSON.stringify(report, null, 2), 'utf8');
console.log(`failures=${failures.length} consoleErrors=${consoleErrors.length} failedRequests=${failedRequests.length}`);
for (const f of failures) console.error('FAIL: ' + f);
for (const c of consoleErrors) console.error('CONSOLE: ' + c);
for (const r of failedRequests) console.error('REQ: ' + r);
process.exit(failures.length || consoleErrors.length || failedRequests.length ? 1 : 0);
