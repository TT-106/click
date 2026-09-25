import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const baseURL = process.env.TEST_URL || 'http://127.0.0.1:4173';
const fixture = await fs.readFile('tests/fixtures/original.c2save', 'utf8');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const errors = [];
  const pages = await Promise.all([true, false].map(async original => {
    const page = await browser.newPage();
    page.on('pageerror', error => { errors.push({ original, error: error.stack }); console.error(original, error.stack); });
    await page.goto(`${baseURL}/tests/engine-harness.html${original ? '?original' : ''}`);
    await page.waitForFunction(() => Boolean(window.harness), null, { timeout: 10000, polling: 100 });
    await page.evaluate(text => window.harness.load(text), fixture);
    return page;
  }));
  const compare = async turns => {
    const states = await Promise.all(pages.map(page => page.evaluate(turns => window.harness.advance(turns), turns)));
    await fs.mkdir('output/parity', { recursive: true });
    await Promise.all(states.map((state, i) => fs.writeFile(`output/parity/${i === 0 ? 'original' : 'refactored'}.json`, JSON.stringify(state, null, 2))));
    assert.deepEqual(states[1], states[0], `推进 ${turns} 回合后存在行为差异`);
    console.log(`✓ 原版与重构版完整存档一致（推进 ${turns} 回合）`);
  };
  await compare(0);
  await compare(1);
  await compare(99);
  await compare(900);
  assert.deepEqual(errors, [], '浏览器运行出现异常');
} finally { await browser.close(); }
