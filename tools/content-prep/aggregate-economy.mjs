#!/usr/bin/env node
// T6:聚合 glm-r52-batch-001..011(100种子×8趟)为统一汇总。
// 输出: measurements/summary-100x8.json + summary-100x8.md
// 统计:物品/趟与8趟累计 P10/P50/P90、零产出比例、各物品最长连续缺货趟数、
//       前期(1-4趟)与后期(5-8趟)返程占比、归仓原因分布。
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { longestZeroStreak } from './content-rules.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const MEAS = join(ROOT, 'output', 'glm-r52', 'measurements');
const ECO = join(ROOT, 'output', 'economy-design');

function measure(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const pct = (f) => {
    if (!sorted.length) return null;
    const pos = (sorted.length - 1) * f;
    const lo = Math.floor(pos), hi = Math.ceil(pos);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
  };
  return { n: sorted.length, min: sorted[0] ?? null, p10: pct(0.1), p50: pct(0.5), mean: sorted.length ? sorted.reduce((s, v) => s + v, 0) / sorted.length : null, p90: pct(0.9), max: sorted[sorted.length - 1] ?? null };
}

const files = readdirSync(ECO).filter((f) => /^glm-r52-batch-\d+\.json$/.test(f)).sort();
const all = [];
for (const f of files) {
  const j = JSON.parse(readFileSync(join(ECO, f), 'utf8'));
  all.push(...j.seeds);
}
const seeds = all.filter((s) => s.status === 'complete');
if (new Set(all.map(s => s.seed)).size !== all.length) throw new Error('存在重复种子，不能当独立样本计数');
if (seeds.some(s => s.trips.length !== 8)) throw new Error('完整种子必须恰有8趟，不能混入不同长度序列');
const trips = seeds.flatMap((s) => s.trips);
if (!trips.length) throw new Error('没有可聚合的完整趟记录');
const itemIds = Object.keys(trips[0]?.items || {});

// 物品统计
const items = {};
for (const id of itemIds) {
  const perTrip = trips.map((t) => t.items[id]);
  // 每个种子是独立世界，不能跨世界拼接成一次连续缺货。
  const worst = longestZeroStreak(seeds, id);
  // 8趟累计/种子
  const perSeedTotal = seeds.map((s) => s.trips.reduce((sum, t) => sum + t.items[id], 0));
  items[id] = {
    perOuting: measure(perTrip),
    zeroYieldRatio: perTrip.filter((v) => v === 0).length / perTrip.length,
    longestZeroStreakWithinSeed: worst,
    absentSeeds: seeds.filter((s) => s.warehouse[id] === 0).map((s) => s.seed),
    perSeed8Outings: measure(perSeedTotal),
  };
}

// 前期/后期返程占比
const earlyReturnShare = trips.filter((t) => t.number <= 4).map((t) => t.phaseMs.returning / Math.max(1, t.durationMs));
const lateReturnShare = trips.filter((t) => t.number >= 5).map((t) => t.phaseMs.returning / Math.max(1, t.durationMs));
const earlyBySeed = seeds.map((s) => s.trips.filter((t) => t.number <= 4).reduce((sum, t) => sum + t.phaseMs.returning, 0) / Math.max(1, s.trips.filter((t) => t.number <= 4).reduce((sum, t) => sum + t.durationMs, 0)));
const lateBySeed = seeds.map((s) => s.trips.filter((t) => t.number >= 5).reduce((sum, t) => sum + t.phaseMs.returning, 0) / Math.max(1, s.trips.filter((t) => t.number >= 5).reduce((sum, t) => sum + t.durationMs, 0)));

const summary = {
  schema: 1,
  generatedAt: new Date().toISOString(),
  scope: 'current-r50-rules; simulation-time; no-user-save',
  sourceFiles: files,
  seeds: { requested: all.length, complete: seeds.length, errored: all.filter((s) => s.status !== 'complete').map((s) => ({ seed: s.seed, status: s.status })) },
  outingsPerSeed: 8,
  totalOutings: trips.length,
  longestZeroStreakScope: 'within-one-seed; seed boundary resets streak; range 0..8',
  returnedWeight: measure(trips.map((t) => t.returnedWeight)),
  returnedCount: measure(trips.map((t) => t.returnedCount)),
  durationSimSeconds: measure(trips.map((t) => t.durationMs / 1000)),
  explorationSimSeconds: measure(trips.map((t) => t.phaseMs.exploring / 1000)),
  returnSimSeconds: measure(trips.map((t) => t.phaseMs.returning / 1000)),
  returnDistanceSteps: measure(trips.map((t) => t.returnSteps)),
    returnReasons: Object.fromEntries([...new Set(trips.map((t) => t.returnReason))].map((r) => [r, trips.filter((t) => t.returnReason === r).length])),
  returnShareEarlyTrips1to4: measure(earlyReturnShare),
  returnShareLateTrips5to8: measure(lateReturnShare),
  returnShareEarlyBySeedMedian: measure(earlyBySeed).p50,
  returnShareLateBySeedMedian: measure(lateBySeed).p50,
  items,
};

writeFileSync(join(MEAS, 'summary-100x8.json'), JSON.stringify(summary, null, 2) + '\n', 'utf8');

// Markdown 摘要
const lines = [];
lines.push('# 100种子×8趟 原野收益汇总(current-r50-rules / simulation-time / no-user-save)');
lines.push('');
lines.push(`- 数据来源:${files.join(', ')};complete 种子 ${seeds.length}/${all.length}。`);
lines.push(`- 归仓负重/趟:P10 ${summary.returnedWeight.p10} · P50 ${summary.returnedWeight.p50} · P90 ${summary.returnedWeight.p90}(抽象负重单位,非kg)`);
lines.push(`- 单趟时长/秒:P50 ${summary.durationSimSeconds.p50.toFixed(1)} · P90 ${summary.durationSimSeconds.p90.toFixed(1)};返程步数 P50 ${summary.returnDistanceSteps.p50}`);
lines.push(`- 归仓原因:${JSON.stringify(summary.returnReasons)}`);
lines.push(`- 返程占比:前4趟(1-4)P50 ${(summary.returnShareEarlyTrips1to4.p50 * 100).toFixed(1)}% vs 后4趟(5-8)P50 ${(summary.returnShareLateTrips5to8.p50 * 100).toFixed(1)}%(按种子中位:${(summary.returnShareEarlyBySeedMedian * 100).toFixed(1)}% → ${(summary.returnShareLateBySeedMedian * 100).toFixed(1)}%)`);
lines.push('');
lines.push('| 物品 | 趟P50 | 趟P90 | 零产出比例 | 单种子最长连续缺货 | 全无种子 | 8趟/种子 P50 |');
lines.push('|---|---|---|---|---|---|---|');
for (const [id, st] of Object.entries(items)) {
  lines.push(`| ${id} | ${st.perOuting.p50} | ${st.perOuting.p90} | ${(st.zeroYieldRatio * 100).toFixed(1)}% | ${st.longestZeroStreakWithinSeed} | ${st.absentSeeds.length} | ${st.perSeed8Outings.p50} |`);
}
lines.push('');
lines.push('注:新石料/水/食物等未来材料不在本采样生成(来源未实现);物品单位是现有整数数量,weight 是抽象负重。');
writeFileSync(join(MEAS, 'summary-100x8.md'), lines.join('\n') + '\n', 'utf8');
console.log(`聚合完成:${seeds.length} complete 种子 / ${trips.length} 趟 → summary-100x8.json + .md`);
