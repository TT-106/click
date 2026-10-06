#!/usr/bin/env node
// 内容准备数据校验器(离线,只读源数据,不接游戏运行时)。
// 用法:
//   node tools/content-prep/validate.mjs items      校验 items.json
//   node tools/content-prep/validate.mjs recipes    校验 recipes.json(依赖 items.json)
//   node tools/content-prep/validate.mjs buildings  校验 buildings.json(依赖 items/recipes)
//   node tools/content-prep/validate.mjs all        依次校验全部
//   node tools/content-prep/validate.mjs csv-items  从 items.json 生成 items.csv
//   node tools/content-prep/validate.mjs csv-recipes 从 recipes.json 生成 recipes.csv
//   node tools/content-prep/validate.mjs negative   反向验证(内存注入坏数据,校验器必须失败)
// 退出码:0 全部通过;1 数据错误;2 用法错误。
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { availableContent } from './content-rules.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PREP = join(ROOT, 'content-prep', 'expedition-v1');
const ASSET_JSONS = ['assets/themes/expedition/asset.json', 'assets/themes/forest-village/asset.json'];

const CATEGORY_ORDER = ['raw', 'processed', 'consumable', 'tool', 'equipment', 'research'];
const CATEGORY_EXPECT = { raw: 20, processed: 12, consumable: 10, tool: 6, equipment: 8, research: 4 };
const CATEGORY_CN = { raw: '原料', processed: '加工物', consumable: '消耗品', tool: '工具携具', equipment: '武器护具', research: '研究收藏' };

let errors = [];
let warnings = [];
function err(msg) { errors.push(msg); }
function warn(msg) { warnings.push(msg); }

function readJson(path) {
  if (!existsSync(path)) { err(`文件不存在: ${path}`); return null; }
  try { return JSON.parse(readFileSync(path, 'utf8')); }
  catch (e) { err(`JSON 解析失败 ${path}: ${e.message}`); return null; }
}

function registeredIconIds() {
  const ids = new Set();
  for (const rel of ASSET_JSONS) {
    const abs = join(ROOT, rel);
    if (!existsSync(abs)) continue;
    for (const a of JSON.parse(readFileSync(abs, 'utf8'))) ids.add(a.id);
  }
  return ids;
}

function isPosInt(v) { return Number.isSafeInteger(v) && v > 0; }

// ---------- items ----------
function validateItemsStructural(items, opts = {}) {
  const { expectTotal = 60, expectCategories = true, iconIds = null } = opts;
  if (!Array.isArray(items)) { err('items 必须是数组'); return; }
  const seen = new Set();
  const byCat = {};
  for (const it of items) {
    const where = `物品 ${it && it.id ? it.id : '(缺id)'}`;
    if (!it.id || typeof it.id !== 'string') { err(`${where}: id 缺失或非字符串`); continue; }
    if (seen.has(it.id)) err(`${where}: 重复 ID`);
    seen.add(it.id);
    if (!it.name || typeof it.name !== 'string' || !it.name.trim()) err(`${where}: 名称非空文本缺失`);
    if (!CATEGORY_ORDER.includes(it.category)) err(`${where}: 类别非法(${it.category})`);
    byCat[it.category] = (byCat[it.category] || 0) + 1;

    const m = it.measure || {};
    if (!['mass', 'count', 'instance'].includes(m.kind)) err(`${where}: measure.kind 非法(${m.kind})`);
    if (m.kind === 'mass') {
      if (m.unit !== 'g') err(`${where}: mass 计量单位必须是 g`);
      if (m.unitMassG != null) err(`${where}: mass 的 unitMassG 必须为 null(数量本身是克)`);
      if (m.quantumG != null && !isPosInt(m.quantumG)) err(`${where}: quantumG 必须为正整数或 null`);
    } else if (m.kind === 'count') {
      if (!m.unit || typeof m.unit !== 'string') err(`${where}: count 计量单位缺失`);
      if (!isPosInt(m.unitMassG)) err(`${where}: count 缺少正整数单件质量 unitMassG`);
      if (m.quantumG != null && !isPosInt(m.quantumG)) err(`${where}: quantumG 必须为正整数或 null`);
    } else if (m.kind === 'instance') {
      if (!m.unit || typeof m.unit !== 'string') err(`${where}: instance 计量单位缺失`);
      if (m.unitMassG == null && !(Array.isArray(it.massRangeG) && it.massRangeG.length === 2
        && isPosInt(it.massRangeG[0]) && isPosInt(it.massRangeG[1]) && it.massRangeG[0] <= it.massRangeG[1])) {
        err(`${where}: instance 需要 unitMassG 或 massRangeG`);
      }
      if (m.unitMassG != null && !isPosInt(m.unitMassG)) err(`${where}: instance unitMassG 必须为正整数或 null`);
    }

    if (!['A', 'B', 'C'].includes(it.phase)) err(`${where}: phase 必须是 A/B/C`);
    if (!Array.isArray(it.sources) || it.sources.length === 0 || it.sources.some((s) => !s || !String(s).trim())) {
      err(`${where}: sources 需为非空文本数组`);
    }
    if (!Array.isArray(it.uses) || it.uses.length === 0 || it.uses.some((s) => !s || !String(s).trim())) {
      err(`${where}: uses 需为非空文本数组`);
    }
    const ic = it.icon || {};
    if (!['registered', 'candidate', 'missing'].includes(ic.status)) err(`${where}: icon.status 非法(${ic.status})`);
    if (ic.status === 'registered') {
      if (!ic.semanticId) err(`${where}: registered 图标缺 semanticId`);
      else if (iconIds && !iconIds.has(ic.semanticId)) err(`${where}: semanticId ${ic.semanticId} 未在素材清单注册`);
    }
    if (ic.status === 'candidate') {
      if (typeof ic.candidatePath !== 'string' || !ic.candidatePath) err(`${where}: candidate 缺本地 candidatePath`);
      else {
        const relativePath = ic.candidatePath.replace(/\\/g, '/');
        if (relativePath.startsWith('/') || relativePath.includes('..') || /^[A-Za-z]:/.test(relativePath)) err(`${where}: candidatePath 必须为项目内相对路径`);
        else if (!existsSync(join(ROOT, relativePath))) err(`${where}: 候选原图不存在 ${relativePath}`);
      }
    }
    if (!it.designRef || typeof it.designRef !== 'string') err(`${where}: designRef 缺失`);
    if (it.notes != null && !Array.isArray(it.notes)) err(`${where}: notes 必须为数组`);
  }
  if (expectCategories) {
    for (const c of CATEGORY_ORDER) {
      if ((byCat[c] || 0) !== CATEGORY_EXPECT[c]) err(`类别 ${c}(${CATEGORY_CN[c]})数量 ${byCat[c] || 0} ≠ ${CATEGORY_EXPECT[c]}`);
    }
  }
  if (items.length !== expectTotal) err(`物品总数 ${items.length} ≠ ${expectTotal}`);
}

function cmdItems() {
  const data = readJson(join(PREP, 'items.json'));
  if (!data) return;
  if (data.schemaVersion !== 1) err('schemaVersion 必须=1');
  if (data.status !== 'planned-not-wired') err('status 必须=planned-not-wired(未接线草案)');
  validateItemsStructural(data.items, { iconIds: registeredIconIds() });
}

// ---------- recipes(T2 扩展) ----------
function validateRecipesStructural(recipes, itemIds, opts = {}) {
  const { expectTotal = null, itemsById = new Map() } = opts;
  if (!Array.isArray(recipes)) { err('recipes 必须是数组'); return; }
  if (expectTotal != null && recipes.length !== expectTotal) err(`配方总数 ${recipes.length} ≠ ${expectTotal}`);
  const seen = new Set();
  const stationLevels = {}; // station -> Set(level)
  for (const r of recipes) {
    const where = `配方 ${r && r.id ? r.id : '(缺id)'}`;
    if (!r.id || typeof r.id !== 'string') { err(`${where}: id 缺失`); continue; }
    if (seen.has(r.id)) err(`${where}: 重复 ID`);
    seen.add(r.id);
    if (!r.name) err(`${where}: name 缺失`);
    if (!r.station || typeof r.station !== 'string') err(`${where}: 工位缺失`);
    if (!Number.isInteger(r.level) || r.level < 0 || r.level > 3) err(`${where}: level 必须为 0-3 整数(0=手作/篝火)`);
    if (!['A', 'B', 'C'].includes(r.phase)) err(`${where}: phase 必须是 A/B/C`);
    if (!isPosInt(r.baseTimeMs)) err(`${where}: baseTimeMs 必须为正整数毫秒`);
    else if (r.baseTimeMs < 60000) err(`${where}: baseTimeMs=${r.baseTimeMs}ms 可疑 — 设计最短配方为1分钟(60000ms),检查是否把分钟写成了毫秒`);

    const checkIO = (list, label) => {
      if (!Array.isArray(list)) { err(`${where}: ${label} 必须为数组`); return; }
      const seenIds = new Set();
      for (const io of list) {
        if (!io || typeof io !== 'object') { err(`${where}: ${label} 非物品记录`); continue; }
        if (!itemIds.has(io.id)) err(`${where}: ${label} 引用未知物品 ${io.id}`);
        if (seenIds.has(io.id)) err(`${where}: ${label} 重复物品 ${io.id}`);
        seenIds.add(io.id);
        if (!isPosInt(io.qty)) err(`${where}: ${label} ${io.id} 数量必须为正整数(散装g或件数)`);
        const kind = io.kind || null;
        if (kind && !['mass', 'count', 'instance'].includes(kind)) err(`${where}: ${label} ${io.id} kind 非法`);
        if (kind && itemsById.get(io.id)?.measure.kind !== kind) err(`${where}: ${label} ${io.id} kind 与物品量纲不一致`);
        if (io.resultMassG != null && (!isPosInt(io.resultMassG) || itemsById.get(io.id)?.measure.kind !== 'instance')) err(`${where}: ${io.id} resultMassG 只允许正整数实例质量`);
      }
    };
    checkIO(r.inputs, 'inputs');
    // 替代组不得与普通输入重复扣同一物品
    const inputIds = new Set((r.inputs || []).map((io) => io.id));
    for (const grp of r.anyOf || []) {
      for (const opt of grp.options || []) {
        if (inputIds.has(opt.id)) err(`${where}: 物品 ${opt.id} 同时出现在 inputs 和 anyOf — 会被双扣`);
      }
    }
    if (r.operation === 'upgrade-instance') {
      if (!r.targetItemId || !itemIds.has(r.targetItemId)) err(`${where}: upgrade-instance 缺目标物品ID`);
      else if (itemsById.get(r.targetItemId)?.measure.kind !== 'instance') err(`${where}: upgrade-instance 目标必须是 instance`);
      if (r.outputs?.length) err(`${where}: upgrade-instance 不得另造 outputs 复制实例`);
      if (!r.inputInstanceId || !r.outputInstanceId) err(`${where}: upgrade-instance 需明确旧实例输入与原实例输出`);
      if (r.outputInstanceId !== r.inputInstanceId) err(`${where}: upgrade-instance 输出必须是原实例(禁止复制)`);
      if (!isPosInt(r.resultMassG)) err(`${where}: upgrade-instance 需记录升级后质量 resultMassG`);
    } else {
      checkIO(r.outputs, 'outputs');
      if (!r.outputs?.length) err(`${where}: 普通配方至少一个输出`);
    }
    if (r.anyOf) {
      if (!Array.isArray(r.anyOf) || r.anyOf.length < 1) err(`${where}: anyOf 至少一组`);
      const alternativeIds = new Set();
      for (const grp of r.anyOf) {
        if (!Array.isArray(grp.options) || grp.options.length < 2) err(`${where}: 每个 anyOf 组至少两个互斥选项`);
        checkIO(grp.options, 'anyOf');
        for (const opt of grp.options || []) {
          if (alternativeIds.has(opt.id)) err(`${where}: ${opt.id} 在替代组之间重复，可能双扣`);
          alternativeIds.add(opt.id);
          if (!itemIds.has(opt.id)) err(`${where}: 替代组引用未知物品 ${opt.id}`);
          if (!isPosInt(opt.qty)) err(`${where}: 替代组 ${opt.id} 数量必须为正整数`);
        }
      }
    }
    const skey = `${r.station}`;
    (stationLevels[skey] ||= new Set()).add(r.level);
    if (!r.designRef) err(`${where}: designRef 缺失`);
  }
  return { seen, stationLevels };
}

function cmdRecipes() {
  const items = readJson(join(PREP, 'items.json'));
  const data = readJson(join(PREP, 'recipes.json'));
  if (!data) return;
  validateRecipesCore(data, items);
}

function validateRecipesCore(data, items) {
  const itemIds = new Set((items && items.items || []).map((i) => i.id));
  if (data.schemaVersion !== 1) err('recipes schemaVersion 必须=1');
  if (data.status !== 'planned-not-wired') err('recipes status 必须=planned-not-wired');
  const itemsById = new Map((items.items || []).map((i) => [i.id, i]));
  validateRecipesStructural(data.recipes, itemIds, { expectTotal: data.expectTotal ?? null, itemsById });
  if (errors.length) return;
  // 量纲检查:普通加工输出质量不得超过投入质量(外部来源除外)
  for (const r of data.recipes || []) {
    if (r.operation === 'upgrade-instance' || r.externalSource) continue;
    const inMass = massOf(r.inputs, itemsById);
    // anyOf 每组取最小选项质量:保守保证任何替代分支都满足投入≥产出
    let anyOfMin = 0; let anyOfKnown = true;
    for (const grp of r.anyOf || []) {
      const masses = (grp.options || []).map((o) => massOf([o], itemsById));
      if (masses.some((m) => m == null)) { anyOfKnown = false; break; }
      anyOfMin += Math.min(...masses);
    }
    if (inMass == null || !anyOfKnown) continue;
    const outMass = massOf(r.outputs, itemsById);
    if (outMass != null && outMass > inMass + anyOfMin) {
      err(`配方 ${r.id}: 输出质量 ${outMass}g 超过投入质量 ${inMass + anyOfMin}g(含替代组最小值)且无外部来源说明`);
    }
  }
  // 检查真正可启动的完整生产路径，不能仅凭环上出现原料就判定可启动。
  for (const id of availableContent(items.items, data.recipes).unreachableRecipes) err(`配方无法启动: ${id}，缺少可从原料启动的完整生产路径`);
}

function massOf(list, itemsById) {
  if (!Array.isArray(list)) return null;
  let total = 0; let ok = true;
  for (const io of list) {
    const it = itemsById.get(io.id);
    if (!it) { ok = false; break; }
    if (it.measure.kind === 'mass') total += io.qty;
    else if (it.measure.kind === 'count' && isPosInt(it.measure.unitMassG)) total += io.qty * it.measure.unitMassG;
    else { ok = false; break; } // instance 不计
  }
  return ok ? total : null;
}

// ---------- buildings(T3 扩展) ----------
function validateBuildingsStructural(data, itemIds) {
  const bs = data.buildings || [];
  if (!Array.isArray(bs)) { err('buildings 必须为数组'); return; }
  if (bs.length !== 8) err(`建筑数 ${bs.length} ≠ 8`);
  const seen = new Set();
  const validLevelKeys = new Set(bs.flatMap(b => (b.levels || []).map(lv => `${b.id}:${lv.level}`)));
  let levelCount = 0;
  const requiredFreeStations = new Set(['handcraft']); // 免费手作是初始工位,不是第九栋收费建筑
  for (const b of bs) {
    const where = `建筑 ${b && b.id ? b.id : '(缺id)'}`;
    if (!b.id || typeof b.id !== 'string') { err(`${where}: id 缺失`); continue; }
    if (seen.has(b.id)) err(`${where}: 重复`);
    seen.add(b.id);
    if (!b.name) err(`${where}: name 缺失`);
    const levels = b.levels || [];
    if (!Array.isArray(levels) || levels.length !== 3) { err(`${where}: 需要 3 个等级记录,实际 ${levels ? levels.length : 0}`); continue; }
    const seenLevels = new Set();
    for (const lv of levels) {
      levelCount += 1;
      const lw = `${where} L${lv.level}`;
      if (![1, 2, 3].includes(lv.level)) err(`${lw}: level 必须为 1/2/3`);
      if (seenLevels.has(lv.level)) err(`${lw}: 重复等级`);
      seenLevels.add(lv.level);
      if (typeof lv.freeInitially !== 'boolean') err(`${lw}: freeInitially 必须为布尔`);
      if (lv.freeInitially === false) {
        if (!Array.isArray(lv.cost) || lv.cost.length === 0) err(`${lw}: 非免费等级必须有成本`);
        for (const c of lv.cost || []) {
          if (!itemIds.has(c.id)) err(`${lw}: 成本引用未知物品 ${c.id}`);
          if (!isPosInt(c.qty)) err(`${lw}: 成本 ${c.id} 数量必须为正整数`);
        }
      }
      if (!isPosInt(lv.buildTimeMs)) err(`${lw}: buildTimeMs 缺失或非法(正整数毫秒,设计为1/2/3分钟短任务)`);
      if (!lv.unlockDesc || typeof lv.unlockDesc !== 'string') err(`${lw}: 功能解锁说明缺失`);
      if (!Array.isArray(lv.prereq)) err(`${lw}: prereq 必须为数组`);
      else for (const key of lv.prereq) {
        if (!validLevelKeys.has(key)) err(`${lw}: 未知前置 ${key}`);
        if (key === `${b.id}:${lv.level}`) err(`${lw}: 不得以前置依赖自己`);
      }
      if (!Array.isArray(lv.cost)) err(`${lw}: cost 必须为数组`);
      if (lv.freeInitially && (lv.level !== 1 || lv.cost?.length || lv.prereq?.length || lv.costAnyOf?.length)) err(`${lw}: 初始免费仅限无成本无前置的一级`);
      const requiredIds = new Set((lv.cost || []).map(c => c.id));
      if (requiredIds.size !== (lv.cost || []).length) err(`${lw}: 成本重复物品`);
      if (lv.costAnyOf != null) {
        if (!Array.isArray(lv.costAnyOf) || !lv.costAnyOf.length) err(`${lw}: costAnyOf 必须为非空替代组数组`);
        const optionIds = new Set();
        for (const group of lv.costAnyOf || []) {
          if (!Array.isArray(group.options) || group.options.length < 2) err(`${lw}: 成本替代组至少两个选项`);
          for (const option of group.options || []) {
            if (!itemIds.has(option.id) || !isPosInt(option.qty)) err(`${lw}: 成本替代选项非法 ${option.id}`);
            if (requiredIds.has(option.id) || optionIds.has(option.id)) err(`${lw}: 成本替代重复扣料 ${option.id}`);
            optionIds.add(option.id);
          }
        }
      }
      if (!lv.phase || !['A', 'B', 'C'].includes(lv.phase)) err(`${lw}: phase 必须为 A/B/C`);
      if (lv.efficiency) {
        for (const [k, v] of Object.entries(lv.efficiency)) {
          if (typeof v !== 'number' || v <= 0) err(`${lw}: 效率字段 ${k} 必须为正数(量纲写在键名)`);
        }
      }
    }
    // 营舍/仓库一级免费,不能要求自己的仓库先存在
    if ((b.id === 'lodge' || b.id === 'warehouse') && levels[0] && levels[0].freeInitially !== true) {
      err(`${where}: 一级必须初始免费`);
    }
  }
  if (levelCount !== 24) err(`等级记录总数 ${levelCount} ≠ 24`);
  for (const s of requiredFreeStations) {
    if (!bs.some((b) => b.id === s) && !data.freeStations?.some((f) => f.id === s)) {
      err(`缺少免费初始工位 ${s}(free handcraft 不能变成第九栋收费建筑)`);
    }
  }
}

function cmdBuildings() {
  const items = readJson(join(PREP, 'items.json'));
  const itemIds = new Set((items && items.items || []).map((i) => i.id));
  const data = readJson(join(PREP, 'buildings.json'));
  if (!data) return;
  if (data.schemaVersion !== 1) err('buildings schemaVersion 必须=1');
  if (data.status !== 'planned-not-wired') err('buildings status 必须=planned-not-wired');
  validateBuildingsStructural(data, itemIds);
  const recipes = readJson(join(PREP, 'recipes.json'));
  if (!errors.length && recipes) {
    const reachable = availableContent(items.items, recipes.recipes, data);
    for (const id of reachable.unreachableLevels) err(`建筑无法启动: ${id}，前置/成本/工位依赖无法满足`);
    for (const id of reachable.unreachableRecipes) err(`配方无法启动: ${id}，所需工位等级或材料无法解锁`);
    const knownStations = new Map((data.freeStations || []).map(s => [s.id, new Set([0])]));
    for (const b of data.buildings) knownStations.set(b.id, new Set(b.levels.map(l => l.level)));
    for (const r of recipes.recipes) if (!knownStations.get(r.station)?.has(r.level)) err(`配方 ${r.id}: 未知工位等级 ${r.station}:${r.level}`);
  }
}

// ---------- CSV ----------
function csvEscape(v) {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function cmdCsvItems() {
  const data = readJson(join(PREP, 'items.json'));
  if (!data) return;
  const rows = [['ID', '中文名', '类别', '计量', '克数', '阶段', '来源', '用途', '素材状态']];
  for (const it of data.items || []) {
    const m = it.measure || {};
    let qty = '';
    if (m.kind === 'mass') qty = `${m.quantumG != null ? `步长${m.quantumG}g` : 'g'}`;
    else if (m.kind === 'count') qty = `${m.unit}/件${m.unitMassG}g`;
    else qty = `实例${m.unit}${m.unitMassG != null ? `${m.unitMassG}g` : (it.massRangeG ? `${it.massRangeG[0]}-${it.massRangeG[1]}g` : '')}`;
    rows.push([
      it.id, it.name, CATEGORY_CN[it.category] || it.category, m.kind === 'mass' ? '散装' : m.kind === 'count' ? '件数' : '实例',
      qty, it.phase, (it.sources || []).join('; '), (it.uses || []).join('; '),
      it.icon?.status === 'registered' ? `已注册:${it.icon.semanticId}` : it.icon?.status === 'candidate' ? '候选原图' : '缺图',
    ]);
  }
  const csv = '\ufeff' + rows.map((r) => r.map(csvEscape).join(',')).join('\r\n') + '\r\n';
  writeFileSync(join(PREP, 'items.csv'), csv, 'utf8');
  console.log(`items.csv 已生成(${rows.length - 1} 行,UTF-8 BOM)`);
}

function cmdCsvRecipes() {
  const data = readJson(join(PREP, 'recipes.json'));
  if (!data) return;
  const rows = [['ID', '名称', '工位', '等级', '阶段', '输入', '替代组', '输出', '整批基础时间ms', '外部来源', '操作', '设计出处']];
  for (const r of data.recipes || []) {
    const fmt = (list) => (list || []).map((io) => `${io.id}×${io.qty}`).join(' + ');
    rows.push([
      r.id, r.name, r.station, r.level, r.phase, fmt(r.inputs),
      (r.anyOf || []).map((g) => (g.options || []).map((o) => `${o.id}×${o.qty}`).join(' | ')).join(' ; '),
      r.operation === 'upgrade-instance' ? `升级实例→${r.targetItemId}(${r.resultMassG}g)` : fmt(r.outputs),
      r.baseTimeMs, r.externalSource || '', r.operation || 'craft', r.designRef || '',
    ]);
  }
  const csv = '\ufeff' + rows.map((r) => r.map(csvEscape).join(',')).join('\r\n') + '\r\n';
  writeFileSync(join(PREP, 'recipes.csv'), csv, 'utf8');
  console.log(`recipes.csv 已生成(${rows.length - 1} 行,UTF-8 BOM)`);
}

function cmdCsvBuildings() {
  const data = readJson(join(PREP, 'buildings.json'));
  if (!data) return;
  const rows = [['建筑ID', '建筑名', '等级', '初始免费', '新增成本', '建造时间ms', '阶段', '前置', '功能解锁', '效率', '外观状态']];
  for (const b of data.buildings || []) {
    for (const lv of b.levels || []) {
      rows.push([
        b.id, b.name, lv.level, lv.freeInitially ? '是' : '否',
        [...(lv.cost || []).map((c) => `${c.id}×${c.qty}`), ...(lv.costAnyOf || []).map(g => '(' + g.options.map(c => `${c.id}×${c.qty}`).join(' | ') + ')')].join(' + ') || '(免费)',
        lv.buildTimeMs, lv.phase, (lv.prereq || []).join('; ') || '(无)',
        lv.unlockDesc, lv.efficiency ? Object.entries(lv.efficiency).map(([k, v]) => `${k}=${v}`).join('; ') : '(无)',
        lv.visual?.status || '',
      ]);
    }
  }
  const csv = '\ufeff' + rows.map((r) => r.map(csvEscape).join(',')).join('\r\n') + '\r\n';
  writeFileSync(join(PREP, 'building-levels.csv'), csv, 'utf8');
  console.log(`building-levels.csv 已生成(${rows.length - 1} 行,UTF-8 BOM)`);
}

// ---------- negative(反向验证) ----------
function cmdNegative() {
  const base = readJson(join(PREP, 'items.json'));
  if (!base) return;
  let failures = 0;
  const mustFail = (label, mutate) => {
    const cloned = JSON.parse(JSON.stringify(base));
    mutate(cloned);
    errors = []; warnings = [];
    if (cloned.items) validateItemsStructural(cloned.items, { iconIds: registeredIconIds() });
    else if (cloned.buildings) validateBuildingsStructural(cloned, new Set((base.items || []).map((i) => i.id)));
    if (errors.length === 0) { console.error(`反向验证失败: ${label} — 校验器未拒绝坏数据`); failures += 1; }
    else console.log(`反向验证通过: ${label} → 被拒绝(${errors[0]})`);
  };
  mustFail('重复 ID', (d) => { d.items[1].id = d.items[0].id; });
  mustFail('负质量', (d) => { const w = d.items.find((i) => i.measure.kind === 'count'); w.measure.unitMassG = -5; });
  mustFail('count 缺少单件质量', (d) => { const w = d.items.find((i) => i.measure.kind === 'count'); w.measure.unitMassG = null; });
  mustFail('mass 带了 unitMassG(量纲混淆)', (d) => { const w = d.items.find((i) => i.measure.kind === 'mass'); w.measure.unitMassG = 1000; });
  mustFail('总数不为60', (d) => { d.items.pop(); });
  mustFail('类别数量错', (d) => { d.items.find((i) => i.id === 'wood').category = 'processed'; });
  mustFail('注册图标指向不存在的semanticId', (d) => { const w = d.items.find((i) => i.icon.status === 'registered'); w.icon.semanticId = 'material.not-exist'; });

  // 配方反向验证:在内存中变异 recipes.json,校验器必须拒绝
  const baseRecipes = readJson(join(PREP, 'recipes.json'));
  if (baseRecipes) {
    const mustFailRecipe = (label, mutate) => {
      const rClone = JSON.parse(JSON.stringify(baseRecipes));
      const iClone = JSON.parse(JSON.stringify(base));
      mutate(rClone, iClone);
      errors = []; warnings = [];
      validateRecipesCore(rClone, iClone);
      if (errors.length === 0) { console.error(`反向验证失败: ${label} — 校验器未拒绝坏数据`); failures += 1; }
      else console.log(`反向验证通过: ${label} → 被拒绝(${errors[0]})`);
    };
    mustFailRecipe('未知输入ID', (d) => { d.recipes.find((r) => r.id === 'plank-workshop').inputs[0].id = 'unobtanium'; });
    mustFailRecipe('2分钟写成2毫秒', (d) => { d.recipes.find((r) => r.id === 'plank-workshop').baseTimeMs = 2; });
    mustFailRecipe('替代组展开为双扣', (d) => {
      const nails = d.recipes.find((r) => r.id === 'nails');
      nails.inputs.push({ id: 'iron_ingot', qty: 600 });
      nails.anyOf = [{ options: [{ id: 'copper_ingot', qty: 600 }, { id: 'iron_ingot', qty: 600 }] }];
    });
    mustFailRecipe('配方程式图环(无外部输入)', (d, iClone) => {
      // 构造 A 产 x、B 产 y,A 要 y、B 要 x,且无 raw/外部来源 → SCC 死循环必须报错
      iClone.items.push({ id: 'loop-x', name: '环X', category: 'processed', measure: { kind: 'mass', unit: 'g', quantumG: null, unitMassG: null }, phase: 'A', sources: ['t'], uses: ['t'], icon: { semanticId: null, status: 'missing' }, designRef: 't', notes: [] },
        { id: 'loop-y', name: '环Y', category: 'processed', measure: { kind: 'mass', unit: 'g', quantumG: null, unitMassG: null }, phase: 'A', sources: ['t'], uses: ['t'], icon: { semanticId: null, status: 'missing' }, designRef: 't', notes: [] });
      d.recipes.push(
        { id: 'loop-a', name: '环A', station: 'workshop', level: 1, phase: 'A', inputs: [{ id: 'loop-y', qty: 1 }], outputs: [{ id: 'loop-x', qty: 1 }], baseTimeMs: 60000, designRef: 'negative-test' },
        { id: 'loop-b', name: '环B', station: 'smelter', level: 1, phase: 'A', inputs: [{ id: 'loop-x', qty: 1 }], outputs: [{ id: 'loop-y', qty: 1 }], baseTimeMs: 60000, designRef: 'negative-test' },
      );
      d.expectTotal = 55; // 绕过总数检查,专测 SCC 环检测
    });

    // 建筑反向验证
    const baseBuildings = readJson(join(PREP, 'buildings.json'));
    if (baseBuildings) {
      const mustFailBuilding = (label, mutate) => {
        const bClone = JSON.parse(JSON.stringify(baseBuildings));
        const iClone = JSON.parse(JSON.stringify(base));
        mutate(bClone);
        errors = []; warnings = [];
        validateBuildingsStructural(bClone, new Set(iClone.items.map((i) => i.id)));
        if (errors.length === 0) { console.error(`反向验证失败: ${label} — 校验器未拒绝坏数据`); failures += 1; }
        else console.log(`反向验证通过: ${label} → 被拒绝(${errors[0]})`);
      };
      mustFailBuilding('营舍一级要求收费(自举矛盾)', (d) => {
        const l1 = d.buildings.find((b) => b.id === 'lodge').levels[0];
        l1.freeInitially = false;
        l1.cost = [{ id: 'plank', qty: 6 }]; // 带上合法成本,专测"营舍/仓库一级必须免费"规则
      });
      mustFailBuilding('建筑成本引用未知物品', (d) => {
        d.buildings.find((b) => b.id === 'workshop').levels[0].cost[0].id = 'mythril';
      });
      mustFailBuilding('等级记录不足24', (d) => {
        d.buildings.find((b) => b.id === 'well').levels.pop();
      });
    }
  }
  if (failures > 0) { console.error(`\n反向验证: ${failures} 例未通过`); process.exit(1); }
  console.log('\n反向验证: 全部坏数据均被拒绝。');
}

// ---------- main ----------
// 导入时不读文件、不退出进程；供隔离反向验证使用。
export function inspectItems(data) {
  errors = []; warnings = [];
  try { validateItemsStructural(data.items, {iconIds: registeredIconIds()}); } catch (error) { err(`数据格式非法: ${error.message}`); }
  return [...errors];
}
export function inspectRecipes(data, items) {
  errors = []; warnings = [];
  try { validateRecipesCore(data, items); } catch (error) { err(`数据格式非法: ${error.message}`); }
  return [...errors];
}
export function inspectBuildings(data, items, recipes) {
  errors = []; warnings = [];
  try {
    validateBuildingsStructural(data, new Set(items.items.map(i => i.id)));
    if (!errors.length) {
      const reachable = availableContent(items.items, recipes.recipes, data);
      for (const id of reachable.unreachableLevels) err(`建筑无法启动: ${id}`);
      for (const id of reachable.unreachableRecipes) err(`配方无法启动: ${id}`);
    }
  } catch (error) { err(`数据格式非法: ${error.message}`); }
  return [...errors];
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
const cmd = process.argv[2] || 'all';
errors = []; warnings = [];
switch (cmd) {
  case 'items': cmdItems(); break;
  case 'recipes': cmdItems(); cmdRecipes(); break;
  case 'buildings': cmdItems(); cmdRecipes(); cmdBuildings(); break;
  case 'all': cmdItems(); cmdRecipes(); cmdBuildings(); break;
  case 'csv-items': cmdCsvItems(); break;
  case 'csv-recipes': cmdCsvRecipes(); break;
  case 'csv-buildings': cmdCsvBuildings(); break;
  case 'negative': cmdNegative(); process.exit(0); // negative 自行管理退出码
  default: console.error('用法: validate.mjs items|recipes|buildings|all|csv-items|csv-recipes|negative'); process.exit(2);
}
for (const w of warnings) console.log('警告: ' + w);
if (errors.length > 0) {
  console.error(`\n校验失败(${errors.length} 项):`);
  for (const e of errors) console.error('  ✗ ' + e);
  process.exit(1);
}
console.log(`\n校验通过: ${cmd}(警告 ${warnings.length} 条)`);
}
