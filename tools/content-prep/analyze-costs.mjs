#!/usr/bin/env node
// T7:建筑成本离线展开(不是新经济运行时)。
// 算法:按固定配方路线递归展开建筑投入;ceil(缺口/每批产量)决定批次;
//       记录剩余产物与工位时间;g 与 count 量纲分开,不合并;循环输出报错并给路径。
// 先断言两个人工算例,再展开 8 栋 × 3 级(默认空成品库存,普通路线)。
// 输出:content-prep/expedition-v1/building-cost-analysis.json / .csv / building-cost-report.md
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { selectedInputs } from './content-rules.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PREP = join(ROOT, 'content-prep', 'expedition-v1');
const load = (f) => JSON.parse(readFileSync(join(PREP, f), 'utf8'));
const items = load('items.json').items;
const recipes = load('recipes.json').recipes;
const buildings = load('buildings.json').buildings;
const itemById = new Map(items.map((i) => [i.id, i]));

// 固定普通路线(设计6章默认;anyOf 选择记录在案,可复现)
const ROUTE = {
  plank: 'plank-workshop',
  rope: 'rope-workshop',
  cloth: 'cloth',
  brick: 'brick',
  charcoal: 'charcoal',
  copper_ingot: 'copper-smelt',
  iron_ingot: 'iron-smelt',
  nails: 'nails', // anyOf 默认选 iron_ingot(主干金属),见 anyOfChoice
};
const anyOfChoice = { nails: 'iron_ingot' };
const recipeById = new Map(recipes.map((r) => [r.id, r]));

function batchOutputOf(recipeId, recipesById, itemsById) {
  const r = recipesById.get(recipeId);
  if (!r || !Array.isArray(r.outputs) || r.outputs.length !== 1) throw new Error(`成本工具仅支持单输出普通路线: ${recipeId}`);
  const o = r.outputs[0];
  if (!Number.isSafeInteger(o.qty) || o.qty <= 0) throw new Error(`路线产量非法: ${recipeId}`);
  return { id: o.id, qty: o.qty, kind: itemsById.get(o.id).measure.kind };
}

// 展开一个需求队列。返回 {raw:{id:qty}, stationMs:{station:ms}, leftovers:{id:qty}, batches:[...]}
export function expand(demands, ctx, { routes = ROUTE, choiceByItem = anyOfChoice, itemsById = itemById, recipesById = recipeById } = {}) {
  const raw = {}; // 原料需求
  const stationMs = {};
  const batches = [];
  const leftovers = ctx.leftovers; // 共享池(g 或 件,按物品量纲)
  const queue = [...demands];
  let steps = 0;
  while (queue.length) {
    if (++steps > 10000) throw new Error('成本展开超过有界步数');
    const need = queue.shift();
    const it = itemsById.get(need.id);
    if (!it) throw new Error(`未知物品 ${need.id}`);
    if (!Number.isSafeInteger(need.qty) || need.qty < 0) throw new Error(`需求数量非法: ${need.id}`);
    if (need.qty === 0) continue;
    if (need.trail?.includes(need.id)) throw new Error(`展开循环: ${[...need.trail, need.id].join(' → ')}`);
    if (it.category === 'raw') { raw[need.id] = (raw[need.id] || 0) + need.qty; continue; }
    const routeId = routes[need.id];
    if (!routeId) throw new Error(`${need.id} 无展开路线(非原料且未配置配方)`);
    const r = recipesById.get(routeId);
    // 批产量
    const out = batchOutputOf(routeId, recipesById, itemsById);
    if (out.id !== need.id) throw new Error(`路线输出不匹配 ${need.id} ← ${routeId}`);
    // 复用剩余
    const have = leftovers[need.id] || 0;
    if (!Number.isSafeInteger(have) || have < 0) throw new Error(`余料数量非法: ${need.id}`);
    const shortfall = need.qty - have;
    if (shortfall <= 0) { leftovers[need.id] = have - need.qty; continue; }
    const nBatches = Math.ceil(shortfall / out.qty);
    leftovers[need.id] = have + nBatches * out.qty - need.qty;
    // 扣本批工位时间与输入
    stationMs[r.station] = (stationMs[r.station] || 0) + nBatches * r.baseTimeMs;
    const chosen = choiceByItem[need.id] == null ? {} : {0: choiceByItem[need.id]};
    const inputs = selectedInputs(r.inputs, r.anyOf, chosen);
    batches.push({ recipeId: routeId, batches: nBatches, selectedInputs: inputs,
      output: `${need.id}×${nBatches * out.qty}${out.kind === 'mass' ? 'g' : '件'}` });
    for (const io of inputs) queue.push({ id: io.id, qty: nBatches * io.qty, trail: [...(need.trail || []), need.id] });
  }
  return { raw, stationMs, batches, leftovers };
}

function fmtMs(ms) { return `${(ms / 60000).toFixed(0)} 分钟`; }

// ---------- 人工算例断言 ----------
function assertExample1() {
  const ctx = { leftovers: {} };
  const res = expand([{ id: 'plank', qty: 8 }], ctx);
  const okWood = res.raw.wood === 24000;
  const okTime = res.stationMs.workshop === 8 * 120000;
  if (!okWood || !okTime) throw new Error(`算例1失败: wood=${res.raw.wood} workshop=${res.stationMs.workshop}`);
  console.log(`算例1通过: 木板8块 → 木料 ${res.raw.wood}g,工坊 ${fmtMs(res.stationMs.workshop)}(8批)`);
}

function assertExample2() {
  const ctx = { leftovers: {} };
  const res = expand([{ id: 'plank', qty: 8 }, { id: 'rope', qty: 2 }, { id: 'iron_ingot', qty: 2000 }], ctx);
  const ok = res.raw.wood === 28000 && res.raw.fiber === 1200 && res.raw.iron === 4000
    && res.leftovers.charcoal === 1000
    && res.stationMs.workshop === 20 * 60000 && res.stationMs.smelter === 11 * 60000;
  if (!ok) throw new Error(`算例2失败: ${JSON.stringify({ raw: res.raw, leftovers: res.leftovers, stationMs: res.stationMs })}`);
  console.log(`算例2通过: 工坊二级料 → 木料28kg/纤维1.2kg/铁矿4kg,余炭1kg,工坊${fmtMs(res.stationMs.workshop)}+炉窑${fmtMs(res.stationMs.smelter)}(并行,最短参考${fmtMs(Math.max(res.stationMs.workshop, res.stationMs.smelter))}+建造2分=22分钟)`);
}

// ---------- 展开全部建筑等级 ----------
function expandAll() {
  const results = [];
  for (const b of buildings) {
    for (const lv of b.levels) {
      if (lv.freeInitially) {
        results.push({ building: b.id, name: b.name, level: lv.level, free: true, raw: {}, stationMs: {}, leftovers: {}, batches: [], note: lv.unlockDesc });
        continue;
      }
      const ctx = { leftovers: {} };
      let res;
      try {
        res = expand(selectedInputs(lv.cost, lv.costAnyOf), ctx);
      } catch (e) {
        results.push({ building: b.id, name: b.name, level: lv.level, free: false, error: e.message });
        continue;
      }
      // 串行工位时间总和与并行最短参考(不能把 max 当精确调度,只作参考)
      const totalMs = Object.values(res.stationMs).reduce((s, v) => s + v, 0);
      const parallelRefMs = Math.max(0, ...Object.values(res.stationMs)) + lv.buildTimeMs;
      results.push({
        building: b.id, name: b.name, level: lv.level, free: false,
        directCost: selectedInputs(lv.cost, lv.costAnyOf).map((c) => `${c.id}×${c.qty}`),
        costAnyOf: lv.costAnyOf || [],
        raw: res.raw, rawSummary: Object.entries(res.raw).map(([id, q]) => {
          const kind = itemById.get(id).measure.kind;
          return `${id} ${kind === 'mass' ? `${q}g` : `${q}件`}`;
        }),
        stationMs: res.stationMs,
        stationSummary: Object.entries(res.stationMs).map(([s, ms]) => `${s} ${fmtMs(ms)}`),
        totalStationMs: totalMs,
        buildTimeMs: lv.buildTimeMs,
        parallelRefMs,
        leftovers: res.leftovers,
        batches: res.batches,
        note: lv.unlockDesc,
      });
    }
  }
  return results;
}

// ---------- 场景B:连建全局共享余量 ----------
function expandSequence() {
  const order = ['workshop', 'smelter', 'well', 'warehouse', 'lodge', 'garden', 'supply', 'cartography'];
  const ctx = { leftovers: {} };
  const steps = [];
  for (const bid of order) {
    const b = buildings.find((x) => x.id === bid);
    for (const lv of b.levels) {
      if (lv.freeInitially) { steps.push({ building: bid, level: lv.level, free: true }); continue; }
      const res = expand(selectedInputs(lv.cost, lv.costAnyOf), ctx);
      steps.push({ building: bid, level: lv.level, raw: res.raw, stationMs: res.stationMs, leftoversAfter: { ...ctx.leftovers } });
    }
  }
  return { steps, finalLeftovers: ctx.leftovers };
}

// ---------- main ----------
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
assertExample1();
assertExample2();
const perLevel = expandAll();
const sequence = expandSequence();

const bad = perLevel.filter((r) => r.error);
const output = {
  schema: 1,
  generatedAt: new Date().toISOString(),
  assumptions: [
    '默认空成品库存;每次独立展开(场景A),另提供连建场景B(全局共享余量,顺序:工坊→炉窑→水井→仓库→营舍→园圃→补给所→地图室)',
    '固定普通路线:' + JSON.stringify(ROUTE) + ';nails 的 anyOf 默认选 iron_ingot(空库存无"储备充足"可言,按主干金属选择,可复现)',
    '假设所需工位等级已存在(工坊一级/炉窑一级等),与设计7.3算例口径一致',
    '使用基础配方时间;未叠加建筑速度倍率(升级后速度对后续加工的影响未计入,报告注明)',
    '串行时间是各工位时间之和;并行最短参考 = max(工位时间)+建造时间,不冒充精确调度',
  ],
  examples: { example1_plank8: '通过', example2_workshop_l2: '通过' },
  perLevel,
  sequence,
};
writeFileSync(join(PREP, 'building-cost-analysis.json'), JSON.stringify(output, null, 2) + '\n', 'utf8');

// CSV
const esc = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const rows = [['building', 'name', 'level', 'free', 'directCost', 'rawSummary', 'stationSummary', 'totalStationMin', 'buildMin', 'parallelRefMin', 'leftovers', 'note']];
for (const r of perLevel) {
  rows.push([r.building, r.name, r.level, r.free ? '是' : '否',
    (r.directCost || []).join(' + '), (r.rawSummary || []).join(' + '), (r.stationSummary || []).join(' + '),
    r.totalStationMs != null ? (r.totalStationMs / 60000).toFixed(0) : '', r.buildTimeMs != null ? r.buildTimeMs / 60000 : '',
    r.parallelRefMs != null ? (r.parallelRefMs / 60000).toFixed(0) : '', r.error || JSON.stringify(r.leftovers || {}), r.note || '']);
}
writeFileSync(join(PREP, 'building-cost-analysis.csv'), '\ufeff' + rows.map((r) => r.map(esc).join(',')).join('\r\n') + '\r\n', 'utf8');

console.log(`建筑成本展开完成:${perLevel.length} 级记录(${bad.length} 个错误);场景B ${sequence.steps.length} 步`);
if (bad.length) { for (const e of bad) console.error(`展开错误: ${e.building} L${e.level}: ${e.error}`); process.exit(1); }
}
