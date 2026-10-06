import { writeFile, mkdir } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { relative, isAbsolute } from 'node:path';
import { OpenWorldSession } from '../../src/engine/exploration/open-world-session.js';
import { bagWeight, itemCount } from '../../src/engine/exploration/expedition.js';
import { EXPEDITION_ITEMS, EXPEDITION_RULES } from '../../src/data/expedition-items.js';
import { cellAt } from '../../src/engine/exploration/navigation.js';

// 只在内存中运行真实会话。输出分析证据，不加载浏览器、用户存档或修改规则。
const defaultSeeds = ['原野-01', '远行资源', '春日原野', '青苔河岸', '高地营地', '长风草原', '雨林之旅', '铜山遗迹', '暮色森林', '北岸营地', '晨露湿地', '东部荒野'];
const argumentsByKey = Object.fromEntries(process.argv.slice(2).map(argument => {
  const index = argument.indexOf('=');
  if (index < 0 || !argument.startsWith('--')) throw new Error('参数格式应为 --name=value');
  return [argument.slice(2, index), argument.slice(index + 1)];
}));
const outings = Number(argumentsByKey.outings || 8);
const deltaMs = Number(argumentsByKey.delta || 240);
const seeds = argumentsByKey.seeds ? argumentsByKey.seeds.split('|') : defaultSeeds;
if (!Number.isInteger(outings) || outings < 1 || outings > 40 || !Number.isInteger(deltaMs) || deltaMs < 16 || deltaMs > 240
  || !seeds.length || seeds.length > 20 || seeds.some(seed => !seed.trim() || seed.length > 64)) throw new Error('分析参数超出有界范围');
const outputDirectory = new URL('../../output/glm-r52/measurements/', import.meta.url);
const outputFile = new URL(argumentsByKey.output || 'long-runs.json', outputDirectory);
const outputRelativePath = relative(fileURLToPath(outputDirectory), fileURLToPath(outputFile));
if (outputRelativePath.startsWith('..') || isAbsolute(outputRelativePath)) throw new Error('输出必须在 output/glm-r52/measurements 内');
const started = performance.now();
const itemIds = Object.keys(EXPEDITION_ITEMS);
const zeroItems = () => Object.fromEntries(itemIds.map(id => [id, 0]));
const totalWeight = stacks => bagWeight(stacks);
const measure = samples => {
  const sorted = [...samples].sort((left, right) => left - right);
  const percentile = fraction => {
    const position = (sorted.length - 1) * fraction;
    const lower = Math.floor(position), upper = Math.ceil(position);
    return sorted.length ? sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower) : null;
  };
  return { n: samples.length, min: sorted[0] ?? null, p10: percentile(.1), median: percentile(.5), mean: samples.length ? samples.reduce((sum, value) => sum + value, 0) / samples.length : null, p90: percentile(.9), max: sorted[sorted.length - 1] ?? null };
};
const newOuting = (number, timeMs) => ({ number, startTimeMs: timeMs, phaseMs: { exploring: 0, returning: 0 }, movementSteps: 0,
  explorationSteps: 0, returnSteps: 0, maxDistanceFromCamp: 0, maxRouteLength: 1, maxIndividualWeight: 0, biomeSteps: {},
  pickupNodes: 0, pickupItemsByBiome: {}, visitedStructures: new Set(), returnReason: null, returnStartTimeMs: null, departureBagWeights: null });

const results = [];
await mkdir(outputDirectory, { recursive: true });
const seedWallClockCapMs = Number(argumentsByKey.seedCapMs || 180000);
if (!Number.isInteger(seedWallClockCapMs) || seedWallClockCapMs < 1 || seedWallClockCapMs > 300000) throw new Error('seedCapMs 必须为 1–300000 毫秒整数');
for (const seed of seeds) {
  try {
  const seedStarted = performance.now();
  const session = new OpenWorldSession(seed, 4, { expedition: true, ownerIds: ['sample-a', 'sample-b', 'sample-c', 'sample-d'] });
  const trips = [];
  let trip = newOuting(1, 0), lastPickup = null, ticks = 0, status = 'complete';
  while (trips.length < outings && ticks++ < 100000) {
    if (performance.now() - seedStarted >= seedWallClockCapMs) { status = 'wall-clock-limit'; break; }
    const expedition = session.expedition, previousPhase = expedition.phase;
    const before = { ...session.members[0] }, previousCompleted = expedition.completed;
    session.tick(deltaMs);
    if (session.waiting && expedition.phase === 'exploring') { status = 'waiting-no-reachable-frontier'; break; }
    if (previousPhase === 'resting') {
      if (expedition.phase === 'exploring') trip = newOuting(expedition.outing, session.timeMs);
      continue;
    }
    trip.phaseMs[previousPhase] += deltaMs;
    const leader = session.members[0], cell = cellAt(session.world, leader.x, leader.y);
    const moved = Math.abs(leader.x - before.x) + Math.abs(leader.y - before.y);
    if (moved > 1 || !cell?.walkable) throw new Error(`${seed} 出现非相邻移动或不可行走位置`);
    if (moved) {
      trip.movementSteps++;
      if (previousPhase === 'returning') trip.returnSteps++; else trip.explorationSteps++;
      trip.biomeSteps[cell.biome] = (trip.biomeSteps[cell.biome] || 0) + 1;
      if (cell.area.startsWith('structure:')) trip.visitedStructures.add(cell.area);
    }
    trip.maxDistanceFromCamp = Math.max(trip.maxDistanceFromCamp, Math.abs(leader.x - expedition.camp.x) + Math.abs(leader.y - expedition.camp.y));
    trip.maxRouteLength = Math.max(trip.maxRouteLength, expedition.route.length);
    trip.maxIndividualWeight = Math.max(trip.maxIndividualWeight, ...expedition.bags.map(bagWeight));
    if (expedition.lastPickup && expedition.lastPickup !== lastPickup) {
      lastPickup = expedition.lastPickup;
      const source = cell.area.startsWith('structure:') ? 'building' : cell.biome;
      const picked = trip.pickupItemsByBiome[source] ||= zeroItems();
      picked[lastPickup.itemId] += lastPickup.amount; trip.pickupNodes++;
    }
    if (previousPhase === 'exploring' && expedition.phase === 'returning') {
      const weight = expedition.bags.reduce((sum, bag) => sum + bagWeight(bag), 0);
      trip.returnReason = weight >= 4 * EXPEDITION_RULES.capacity * EXPEDITION_RULES.returnAt ? 'weight-threshold'
        : expedition.elapsedMs >= EXPEDITION_RULES.maximumOutingMs ? 'time-limit'
          : expedition.route.length >= EXPEDITION_RULES.maximumRoute ? 'route-limit' : 'no-reachable-frontier';
      trip.returnStartTimeMs = session.timeMs;
      trip.departureBagWeights = expedition.bags.map(bagWeight);
    }
    if (expedition.completed !== previousCompleted) {
      const bank = expedition.journal[0];
      if (expedition.completed !== previousCompleted + 1 || expedition.phase !== 'resting') throw new Error('归仓阶段不符合预期');
      trips.push({ ...trip, visitedStructures: [...trip.visitedStructures], items: { ...zeroItems(), ...bank.items },
        returnedCount: itemCount(bank.items), returnedWeight: totalWeight(bank.items),
        endTimeMs: session.timeMs, durationMs: session.timeMs - trip.startTimeMs,
        generatedChunks: session.generator.generated.size, discoveredTiles: session.discovered.size, collectedNodes: expedition.collected.size });
    }
  }
  if (trips.length < outings && status === 'complete') status = 'tick-limit';
  const totals = { ...zeroItems(), ...session.expedition.warehouse };
  for (const id of itemIds) {
    if (totals[id] !== trips.reduce((sum, current) => sum + current.items[id], 0)) throw new Error(`${seed} ${id} 归仓未守恒`);
  }
  const result = { seed, status, ticks, completedOutings: trips.length, initialCamp: session.expedition.camp,
    simulatedTimeMs: session.timeMs, generatedChunks: session.generator.generated.size, discoveredTiles: session.discovered.size,
    visitedTiles: session.visited.size, warehouse: totals, unbankedItems: session.expedition.bags,
    firstOutingContainingItem: Object.fromEntries(itemIds.map(id => [id, trips.find(current => current.items[id] > 0)?.number ?? null])), trips };
  results.push(result);
  process.stdout.write(`${seed}: ${trips.length}/${outings} 趟，${status}，${itemCount(totals)} 件，${Math.round(session.timeMs / 1000)} 模拟秒\n`);
  } catch (error) {
    results.push({ seed, status: `error: ${error.message}`, ticks: -1, completedOutings: -1, trips: [] });
    process.stdout.write(`${seed}: 异常 ${error.message}\n`);
  }
}

const trips = results.flatMap(result => result.trips);
const measuredResults = results.filter(result => result.warehouse);
const summary = {
  completeSeeds: results.filter(result => result.status === 'complete').length, stalledSeeds: results.filter(result => result.status !== 'complete').map(result => ({ seed: result.seed, status: result.status })),
  completedOutings: trips.length, returnedWeight: measure(trips.map(trip => trip.returnedWeight)), returnedCount: measure(trips.map(trip => trip.returnedCount)),
  durationSimSeconds: measure(trips.map(trip => trip.durationMs / 1000)), explorationSimSeconds: measure(trips.map(trip => trip.phaseMs.exploring / 1000)),
  returnSimSeconds: measure(trips.map(trip => trip.phaseMs.returning / 1000)), returnDistanceSteps: measure(trips.map(trip => trip.returnSteps)),
  maxIndividualWeight: trips.length ? Math.max(...trips.map(trip => trip.maxIndividualWeight)) : null,
  returnReasons: Object.fromEntries([...new Set(trips.map(trip => trip.returnReason))].map(reason => [reason, trips.filter(trip => trip.returnReason === reason).length])),
  items: Object.fromEntries(itemIds.map(id => [id, { name: EXPEDITION_ITEMS[id].name, currentWeightUnits: EXPEDITION_ITEMS[id].weight,
    perOuting: measure(trips.map(trip => trip.items[id])), zeroYieldOutings: trips.filter(trip => trip.items[id] === 0).length,
    absentSeeds: measuredResults.filter(result => result.warehouse[id] === 0).map(result => result.seed),
    total: trips.reduce((sum, trip) => sum + trip.items[id], 0) }]))
};
const output = { schema: 1, scope: 'current-r50-production-rules-in-memory', generatedAt: new Date().toISOString(),
  methodology: { seeds, requestedOutingsPerSeed: outings, partySize: 4, tickDeltaMs: deltaMs, speed: 1,
    itemRules: EXPEDITION_ITEMS, expeditionRules: EXPEDITION_RULES, percentileMethod: 'linear-interpolation-between-sorted-samples',
    limitations: [`本次 ${seeds.length} 个种子、每个最多 ${outings} 趟；不代表种子全集或长期渐近分布。`, '模拟时间；不是现实浏览器计时、后台功耗或一周连续运行测试。', '当前没有战斗、制造、建筑升级、水、食物或新版本原料保障；不能推导未来完整经济平衡。', '归仓物品数量仍为现有整数单位，weight 是抽象负重单位，不是千克。', `${deltaMs} ms 采样量化了采集与休息等待；不同 tick 大小会影响当前模拟时间。`] },
  runtimeSeconds: (performance.now() - started) / 1000, summary, seeds: results };
await writeFile(outputFile, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n证据：${fileURLToPath(outputFile)}\n`);
if (results.some(result => result.status.startsWith('error:'))) process.exitCode = 1;
