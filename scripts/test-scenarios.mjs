// 场景差分矩阵：同一变异存档驱动原版与重构引擎，逐步推进并比较完整存档状态。
// 运行前置：node scripts/serve.mjs（默认 http://127.0.0.1:4173）。
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import {
  decodeFixture, encodeSave, summarize,
  withPotions, withScrolls, withGold, withTurns, withElapsed, withOfflineProcessing,
  withVictories, withClassSpell, withCastleVictory, withReclassedSpell, withEquippedItem, withResurrectionTrial,
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
    name: 'offline-13h-capped',
    make: () => withElapsed(withOfflineProcessing(base, true), 13 * 3600e3),
    offline: true,
    expectedOfflineDuration: 12 * 3600e3,
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
    name: 'fireball-blast-stun',
    make: () => withClassSpell(base, 4, '火球'),
    // 第一步同时直接计数 blastStunSpell（cat=2、statusEffectTypeId=14）被施加到活怪物上的次数，
    // 两端都必须 > 0 且数值相等；效果队列不入存档，因此这是独立的直接观察。
    steps: [{ turns: 3000, check: snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount }), effectType: 14 }, [3000, null]],
  },
  {
    // 施法后的状态效果施加分支：spellCategoryId=2 且 statusEffectTypeId=4，
    // 会走 combat/actions.js 的效果应用与 characters/character.js 的 cat2/type4 特判。
    name: 'spell-status-transform',
    make: () => withClassSpell(base, 4, '转变怪物'),
    steps: [[3000, snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount })], [3000, null]],
  },
  {
    // 增益法术分支：spellCategoryId=3 且 statusEffectTypeId=5，
    // 加成结果写入存档的 spellBonusPercent，因此属于可直接对账的可观察量。
    name: 'spell-buff-armor',
    make: () => withClassSpell(base, 6, '提高护甲'),
    steps: [[3000, snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount })], [3000, null]],
  },
  {
    // 召唤类分支：spellCategoryId=9 → applySpellEffect 走 summonSpellMinion，
    // 召唤数写入存档统计 minionsSummoned，因此两端各自的增长可直接对账。
    name: 'spell-summon-ghost-skeleton',
    make: () => withReclassedSpell(base, 3, 9, '幽灵骷髅'),
    steps: [{ turns: 3000, check: snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount, summoned: snap.statistics.minionsSummoned > base.statistics.minionsSummoned }) }, [3000, null]],
  },
  {
    // 召唤+移除目标分支：spellCategoryId=11 先把目标怪从活怪物列表 splice 掉再召唤
    name: 'spell-summon-skeleton-army',
    make: () => withReclassedSpell(base, 3, 9, '骷髅军队'),
    steps: [{ turns: 3000, check: snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount, summoned: snap.statistics.minionsSummoned > base.statistics.minionsSummoned }) }, [3000, null]],
  },
  {
    // 控制类分支：spellCategoryId=2、statusEffectTypeId=0（睡眠），
    // 用逐帧扫描直接计数睡眠落到活怪物上的次数。
    name: 'spell-sleep',
    make: () => withReclassedSpell(base, 3, 10, '睡眠'),
    steps: [{ turns: 3000, check: snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount }), effectType: 0 }, [3000, null]],
  },
  {
    // 治疗分支：spellCategoryId=1（牧师 治疗）。两端各自断言实际施法，再比较完整存档。
    name: 'spell-heal',
    make: () => withReclassedSpell(base, 3, 6, '治疗'),
    steps: [[3000, snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount })], [3000, null]],
  },
  {
    // 弹射范围伤害分支：spellCategoryId=4、bo:true（火法师 火环）。
    name: 'spell-area-bounce',
    make: () => withReclassedSpell(base, 3, 4, '火环'),
    steps: [[3000, snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount })], [3000, null]],
  },
  {
    // 连锁伤害分支：spellCategoryId=5（电法师 连锁闪电）。
    name: 'spell-chain-lightning',
    make: () => withReclassedSpell(base, 3, 3, '连锁闪电'),
    steps: [[3000, snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount })], [3000, null]],
  },
  {
    // 落雨型范围伤害分支：spellCategoryId=6（电法师 闪电雨）。
    name: 'spell-rain-damage',
    make: () => withReclassedSpell(base, 3, 3, '闪电雨'),
    steps: [[3000, snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount })], [3000, null]],
  },
  {
    // 弹跳投射物分支：spellCategoryId=13（死灵法师 绿色死亡）。
    name: 'spell-bouncing-projectile',
    make: () => withReclassedSpell(base, 3, 9, '绿色死亡'),
    steps: [[3000, snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount })], [3000, null]],
  },
  {
    // 远程法术分支需要已装备的远程武器：原版与重构版的 createAttackAction 都把 equipment.Ey
    // 交给无空值保护的 getProjectileAnimation，因此改职业后要补回槽 61 的投射武器（itemTypeId 取自引擎注册表）。
    // 唯一的 td:false 定义：spellCategoryId=12（忍者 快速打击，槽 62 飞镖 → projectileAnimationId=3）。
    name: 'spell-deferred-strike',
    make: () => withEquippedItem(withReclassedSpell(base, 3, 8, '快速打击'), 3, '2081168329', '62', 8),
    steps: [[3000, snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount })], [3000, null]],
  },
  {
    // 拾取分支：spellCategoryId=14（盗贼 立即搜索），一次收集本层全部金币/物品/卷轴/药水掉落。
    name: 'spell-instant-search',
    make: () => withEquippedItem(withReclassedSpell(base, 3, 7, '立即搜索'), 3, '41393542', '61', 7),
    steps: [[3000, snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount })], [3000, null]],
  },
  {
    // 宝箱发现分支：spellCategoryId=15（盗贼 发现财宝箱）→ hw.prototype.wu 置宝箱已发现。
    name: 'spell-find-chest',
    make: () => withEquippedItem(withReclassedSpell(base, 3, 7, '发现财宝箱'), 3, '41393542', '61', 7),
    steps: [[3000, snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount })], [3000, null]],
  },
  {
    // 复活分支：spellCategoryId=16（牧师 复活）要求场上已有昏迷的冒险者，昏迷只在 resolveCharacterDefeat 里产生。
    // 因此用随机首领药水提供致命敌人、把三名队友压到 1 级 1 血，并清空其他队员法术，
    // 使两端的 spellCastCount 增长只能归因于牧师的复活；stunned 断言证明前置确实达成。
    name: 'spell-resurrect',
    make: () => withResurrectionTrial(base, { casterIndex: 3, victimIndexes: [0, 1, 2] }),
    steps: [[1500, snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount, stunned: snap.statistics.characterStunnedCount > 0 })], [1500, null]],
  },
  {
    // 鸡群分支：spellCategoryId=17（鸡王 召唤鸡群）走 Math.random 概率选模板再 spawnMinion，
    // 召唤数写入存档统计 minionsSummoned，属于可直接对账的增长。
    name: 'spell-chicken-swarm',
    make: () => withReclassedSpell(base, 3, 11, '召唤鸡群'),
    steps: [[3000, snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount, summoned: snap.statistics.minionsSummoned > base.statistics.minionsSummoned })], [3000, null]],
  },
  {
    // 城堡征服全流程：只剩最后一座城堡待攻克，队伍走进城堡再从出口离开，
    // 触发 iw() 的征服尾部（解锁邻区、recordCastleConquered）与胜利瞬间。
    // 断言放在终点：castlesConquered 在载入后为 0，只有真的走完征服尾部才会变成 1。
    name: 'castle-victory',
    make: () => withCastleVictory(base),
    steps: [
      [3000, null],
      [3000, null],
      [3000, null],
      [3000, null],
      [3000, snap => ({
        victory: snap.gameWon === true && snap.victoryCount === 1
          && snap.statistics.castlesConquered === 1
          && snap.castleManager.castleStates.every(c => c.conquered),
      })],
    ],
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
  {
    name: 'veteran-run',
    make: () => withVictories(base, 3),
    steps: [[600, null], [600, null]],
  },
  {
    // 胜利重置：保留统计、清空当前冒险状态、立即回写存档
    name: 'prestige-restart',
    make: () => base,
    restart: true,
    steps: [[300, null], [300, null]],
  },
  {
    // 完全重置：回到开局状态（比较重置后的完整存档）
    name: 'full-reset',
    make: () => base,
    reset: true,
    steps: [[1, null]],
  },
];

// SCENARIO_FILTER=a,b 只跑指定场景，便于新场景快速迭代；不设置时跑全部。
const filter = process.env.SCENARIO_FILTER?.split(',').map(s => s.trim()).filter(Boolean);
const selected = filter ? scenarios.filter(s => filter.includes(s.name)) : scenarios;
if (filter && selected.length !== filter.length) {
  console.error(`SCENARIO_FILTER 含未注册场景: ${filter.join(',')} —— 实际匹配 ${selected.length}`);
  process.exit(1);
}

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

  for (const scenario of selected) {
    const saveText = encodeSave(scenario.make());
    try {
      // 两端载入同一变异存档（harness.load 内部重置随机种子，保证相同随机流起点）
      const loaded = await Promise.all(pages.map(p => p.page.evaluate(text => window.harness.load(text), saveText)));
      assert.deepEqual(loaded, [true, true], '两端都必须成功载入');

      if (scenario.expectedOfflineDuration !== undefined) {
        const durations = await Promise.all(pages.map(p => p.page.evaluate(() => window.harness.offlineDuration())));
        assert.deepEqual(durations, [scenario.expectedOfflineDuration, scenario.expectedOfflineDuration], '两端都必须触发 12 小时离线上限');
      }

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

      // 重置类场景：驱动两端各自的 reset/restart 原生入口后比较完整状态
      if (scenario.restart || scenario.reset) {
        const method = scenario.restart ? 'restart' : 'reset';
        const resetStates = await Promise.all(pages.map(p => p.page.evaluate(m => window.harness[m](), method)));
        try {
          assert.deepEqual(resetStates[1], resetStates[0], '重置后状态分叉');
        } catch (error) {
          await fs.mkdir('output/scenarios', { recursive: true });
          await fs.writeFile(`output/scenarios/${scenario.name}-reset-original.json`, JSON.stringify(resetStates[0], null, 2));
          await fs.writeFile(`output/scenarios/${scenario.name}-reset-refactored.json`, JSON.stringify(resetStates[1], null, 2));
          throw error;
        }
      }

      let previous = await Promise.all(pages.map(p => p.page.evaluate(() => window.harness.snapshot())));
      for (const rawStep of scenario.steps) {
        // 步骤可以是 [turns, check] 或 { turns, check, effectType }
        // effectType 表示这一步改用"逐帧扫描活怪物效果队列"的推进方式，并直接对账施加次数。
        const step = Array.isArray(rawStep) ? { turns: rawStep[0], check: rawStep[1] } : rawStep;
        const { turns, check, effectType } = step;
        const results = await Promise.all(pages.map(async p => {
          await p.page.evaluate(ms => window.harness.setTime(ms), HARNESS_FIXED_NOW);
          // 重置后无队伍：走真实帧循环（守卫路径），而非裸推进
          if (scenario.restart || scenario.reset) return { snapshot: await p.page.evaluate(n => window.harness.idle(n), turns) };
          if (effectType !== undefined) return p.page.evaluate(a => window.harness.countEffectApplications(a.turns, a.effectType), { turns, effectType });
          return { snapshot: await p.page.evaluate(turns => window.harness.advance(turns), turns) };
        }));
        const states = results.map(r => r.snapshot);
        try {
          assert.deepEqual(states[1], states[0], `推进 ${turns} 回合后状态分叉`);
        } catch (error) {
          await fs.mkdir('output/scenarios', { recursive: true });
          const tag = `${scenario.name}-${previous[0].turnNumber}`;
          await fs.writeFile(`output/scenarios/${tag}-original.json`, JSON.stringify(states[0], null, 2));
          await fs.writeFile(`output/scenarios/${tag}-refactored.json`, JSON.stringify(states[1], null, 2));
          // 全保真序列化复核（含 -0/NaN/undefined）：若字符串相等，则是序列化盲区差异，打印首处分叉
          const s = await Promise.all(pages.map(p => p.page.evaluate(() => JSON.stringify(window.harness.snapshot(), (k, v) => {
            if (typeof v === 'number') { if (Number.isNaN(v)) return '⟂NaN'; if (Object.is(v, -0)) return '⟂-0'; }
            return v === undefined ? '⟂undef' : v;
          }))));
          if (s[0] === s[1]) {
            console.error(`  [诊断] 全保真序列化完全一致 —— playwright 反序列化层差异（对象原型/键顺序）`);
          } else {
            let i = 0; while (i < s[0].length && s[0][i] === s[1][i]) i++;
            console.error(`  [诊断] 首处分叉 @${i}\n  ORIG: ${s[0].slice(Math.max(0, i - 100), i + 60)}\n  REF : ${s[1].slice(Math.max(0, i - 100), i + 60)}`);
          }
          throw error;
        }
        if (effectType !== undefined) {
          const counts = results.map(r => r.applications);
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            assert.ok(counts[i] > 0, `${label} 必须真的观察到 type=${effectType} 效果被施加到活怪物`);
          }
          assert.equal(counts[1], counts[0], `两端 type=${effectType} 施加次数不一致（原版 ${counts[0]} / 重构版 ${counts[1]}）`);
          console.log(`  · type=${effectType} 直接计数两端一致 = ${counts[0]}`);
        }
        // 场景有效性断言：对每一端独立验证"场景确实产生了预期效果"
        for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
          if (check) {
            const verdict = check(states[i]);
            if (verdict.changed !== undefined) assert.equal(verdict.changed, true, `${label} 离线后金币应增长`);
            if (verdict.unchanged !== undefined) assert.equal(verdict.unchanged, true, `${label} 关闭离线后金币不应变化`);
            if (verdict.spellCast !== undefined) assert.equal(verdict.spellCast, true, `${label} 法术场景必须实际施法`);
            if (verdict.summoned !== undefined) assert.equal(verdict.summoned, true, `${label} 召唤场景必须真的召唤出随从`);
            if (verdict.stunned !== undefined) assert.equal(verdict.stunned, true, `${label} 必须真的出现冒险者被击倒（昏迷前置）`);
            if (verdict.victory !== undefined) assert.equal(verdict.victory, true, `${label} 必须真的走完征服尾部并触发胜利`);
          }
        }
        previous = states;
      }
      const errors = engineErrors();
      assert.deepEqual(errors, [], `${scenario.name} 浏览器异常`);
      console.log(`✓ ${scenario.name}`);
    } catch (error) {
      failures.push(scenario.name);
      if (process.env.SCENARIO_VERBOSE) console.error(error);
      console.error(`✗ ${scenario.name}: ${error.message.split('\n').slice(0, process.env.SCENARIO_VERBOSE ? 8 : 1).join(' | ')}`);
    }
  }
} finally {
  await browser.close();
}
if (failures.length) {
  console.error(`失败场景: ${failures.join(', ')}`);
  process.exit(1);
}
console.log(`✓ ${selected.length} / ${scenarios.length} 个差分场景通过`);
