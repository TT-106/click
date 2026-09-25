// 场景差分矩阵：同一变异存档驱动原版与重构引擎，逐步推进并比较完整存档状态。
// 运行前置：node scripts/serve.mjs（默认 http://127.0.0.1:4173）。
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import {
  decodeFixture, encodeSave, summarize,
  withPotions, withScrolls, withGold, withTurns, withElapsed, withOfflineProcessing,
  HARNESS_FIXED_NOW,
} from '../tests/scenarios/save-mutations.mjs';

const baseURL = process.env.TEST_URL || 'http://127.0.0.1:4173';
const base = decodeFixture();

// 场景定义：steps 中的每个 (推进回合数, 断言钩子) 依次执行。
const scenarios = [
  {
    name: 'long-run-9000',
    make: () => base,
    steps: [[3000, null], [3000, null], [3000, null]],
  },
  {
    name: 'offline-1h',
    make: () => withElapsed(withOfflineProcessing(base, true), 3600e3),
    offline: true,
    steps: [[0, snap => ({ changed: summarize(snap).gold > base.party.gold })], [200, null]],
    // 载入后离线结算应带来金币增长（两端都必须真的做了离线处理）
  },
  {
    name: 'offline-8h',
    make: () => withElapsed(withOfflineProcessing(base, true), 8 * 3600e3),
    offline: true,
    steps: [[0, snap => ({ changed: summarize(snap).kills > base.party.kills })], [200, null]],
  },
  {
    name: 'offline-disabled',
    make: () => withElapsed(withOfflineProcessing(base, false), 3600e3),
    offline: true,
    steps: [[0, snap => ({ unchanged: summarize(snap).gold === base.party.gold })], [200, null]],
  },
  {
    name: 'potions-active',
    make: () => withPotions(base, ['doubleKills', 'randomBossEncounter', 'doubleGold'], { active: true }),
    steps: [[600, null], [600, null]],
  },
  {
    name: 'potions-inactive-auto',
    make: () => withPotions(base, ['doubleKills', 'doubleExperience', 'randomTreasureRoom']),
    steps: [[600, null], [600, null]],
  },
  {
    name: 'scrolls-stocked',
    make: () => withScrolls(base, [
      { scrollId: 'shockScroll', count: 99 },
      { scrollId: 'spiderWebScroll', count: 50 },
      { scrollId: 'arrowScroll', count: 50 },
      { scrollId: 'fireBallScroll', count: 20 },
    ]),
    steps: [[600, null], [600, null]],
  },
  {
    name: 'gold-windfall',
    make: () => withGold(base, 1000000),
    steps: [[600, null], [600, null]],
  },
  {
    name: 'late-horizon',
    make: () => withTurns(base, base.turnNumber + 1000000),
    steps: [[500, null], [500, null]],
  },
];

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const failures = [];
try {
  const pages = await Promise.all([true, false].map(async original => {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.stack));
    await page.goto(`${baseURL}/tests/engine-harness.html${original ? '?original' : ''}`);
    await page.waitForFunction(() => Boolean(window.harness), null, { timeout: 10000, polling: 100 });
    return { page, original, errors };
  }));
  const engineErrors = () => pages.flatMap(p => p.errors);

  for (const scenario of scenarios) {
    const saveText = encodeSave(scenario.make());
    try {
      // 两端载入同一变异存档（harness.load 内部重置随机种子，保证相同随机流起点）
      const loaded = await Promise.all(pages.map(p => p.page.evaluate(text => window.harness.load(text), saveText)));
      assert.deepEqual(loaded, [true, true], '两端都必须成功载入');

      await Promise.all(pages.map(p => p.page.evaluate(ms => window.harness.setTime(ms), HARNESS_FIXED_NOW)));

      // 离线场景：驱动帧循环完成离线结算（时间随帧前移）
      if (scenario.offline) {
        const offlineStates = await Promise.all(pages.map(p => p.page.evaluate(() => window.harness.advanceOffline())));
        try {
          assert.deepEqual(offlineStates[1], offlineStates[0], '离线结算后状态分叉');
        } catch (error) {
          await fs.mkdir('output/scenarios', { recursive: true });
          await fs.writeFile('output/scenarios/offline-original.json', JSON.stringify(offlineStates[0], null, 2));
          await fs.writeFile('output/scenarios/offline-refactored.json', JSON.stringify(offlineStates[1], null, 2));
          throw error;
        }
        // 离线确实发生时：序列化写入"当前时刻"，而 advanceOffline 期间时钟已随帧前移
        if (scenario.name !== 'offline-disabled') {
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            const after = summarize(offlineStates[i]);
            assert.equal(after.timestamp > HARNESS_FIXED_NOW, true, `${label} 离线后时间戳应已前移`);
          }
        }
      }

      let previous = await Promise.all(pages.map(p => p.page.evaluate(() => window.harness.snapshot())));
      for (const [turns, check] of scenario.steps) {
        const states = await Promise.all(pages.map(async p => {
          await p.page.evaluate(ms => window.harness.setTime(ms), HARNESS_FIXED_NOW);
          return p.page.evaluate(turns => window.harness.advance(turns), turns);
        }));
        try {
          assert.deepEqual(states[1], states[0], `推进 ${turns} 回合后状态分叉`);
        } catch (error) {
          await fs.mkdir('output/scenarios', { recursive: true });
          const tag = `${scenario.name}-${previous[0].turnNumber}`;
          await fs.writeFile(`output/scenarios/${tag}-original.json`, JSON.stringify(states[0], null, 2));
          await fs.writeFile(`output/scenarios/${tag}-refactored.json`, JSON.stringify(states[1], null, 2));
          throw error;
        }
        // 场景有效性断言：对每一端独立验证"场景确实产生了预期效果"
        for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
          if (check) {
            const verdict = check(states[i]);
            if (verdict.changed !== undefined) assert.equal(verdict.changed, true, `${label} 离线后金币应增长`);
            if (verdict.unchanged !== undefined) assert.equal(verdict.unchanged, true, `${label} 关闭离线后金币不应变化`);
          }
        }
        previous = states;
      }
      const errors = engineErrors();
      assert.deepEqual(errors, [], `${scenario.name} 浏览器异常`);
      console.log(`✓ ${scenario.name}`);
    } catch (error) {
      failures.push(scenario.name);
      console.error(`✗ ${scenario.name}: ${error.message.split('\n')[0]}`);
    }
  }
} finally {
  await browser.close();
}
if (failures.length) {
  console.error(`失败场景: ${failures.join(', ')}`);
  process.exit(1);
}
console.log(`✓ 全部 ${scenarios.length} 个差分场景通过`);
