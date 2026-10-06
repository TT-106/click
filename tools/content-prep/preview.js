// 内容准备预览页(独立,只读)。数据来自 content-prep/expedition-v1/ 与 assets/、output/ 的本地文件。
// 不注册资源到 runtime.game,不修改任何真实游戏入口。
'use strict';

const $ = (sel) => document.querySelector(sel);
const CAT_CN = { raw: '原料', processed: '加工物', consumable: '消耗品', tool: '工具携具', equipment: '武器护具', research: '研究收藏' };
const VIS_CN = { combat: '战斗消费者', 'combat-consumers': '战斗消费者', 'casting-consumers': '施法消费者', 'night-content': '夜间内容', 'environment-states': '环境状态' };

const state = { items: [], recipes: [], buildings: null, assets: null, iconRects: new Map() };

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.json();
}

function fmtDuration(ms) {
  const m = Math.floor(ms / 60000), s = (ms % 60000) / 1000;
  return m ? `${m} 分 ${s ? s + ' 秒' : ''}` : `${s} 秒`;
}
function fmtQty(id, qty) {
  const it = state.items.find((x) => x.id === id);
  if (!it) return `${qty}`;
  if (it.measure.kind === 'mass') return qty >= 1000 ? `${qty / 1000} kg` : `${qty} g`;
  return `${qty} ${it.measure.unit}`;
}
function esc(s) { return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

// ---------- 图标:从已注册图集按 asset.json 的 rect 提取到 canvas ----------
async function loadIconRects() {
  for (const bundle of ['expedition', 'forest-village']) {
    try {
      const meta = await fetchJson(`/assets/themes/${bundle}/asset.json`);
      for (const a of meta) {
        if (a.group !== 'items' || !a.source) continue;
        // asset.json 的 image 相对于 /assets/themes/<bundle>/,例如 ../../vendor/bizmaster-crafting/materials.png
        const img = '/assets/themes/' + bundle + '/' + a.source.image;
        state.iconRects.set(a.id, { img, rect: a.source.rect });
      }
    } catch (e) { console.warn('asset.json 加载失败', bundle, e); }
  }
  const imgs = new Map();
  for (const { img } of state.iconRects.values()) {
    if (!imgs.has(img)) {
      const im = new Image();
      im.src = img;
      imgs.set(img, im);
    }
  }
  state.atlasImgs = imgs;
  await Promise.all([...imgs.values()].map((im) => im.decode().catch(() => {})));
}

function iconEl(item) {
  const slot = document.createElement('span');
  slot.className = 'icon-slot';
  if (item.icon.status === 'candidate' && item.icon.candidatePath) {
    const image = document.createElement('img');
    image.src = '/' + item.icon.candidatePath;
    image.alt = item.name + '生成候选';
    image.style.cssText = 'width:100%;height:100%;object-fit:contain';
    slot.title = 'AI生成候选，未注册进游戏';
    slot.appendChild(image);
    return slot;
  }
  if (item.icon.status === 'registered' && state.iconRects.has(item.icon.semanticId)) {
    const { img, rect } = state.iconRects.get(item.icon.semanticId);
    const im = state.atlasImgs.get(img);
    if (im && im.naturalWidth) {
      const c = document.createElement('canvas');
      c.width = rect.width; c.height = rect.height;
      c.getContext('2d').drawImage(im, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
      c.title = `${item.icon.semanticId}(已注册,提取自图集)`;
      slot.appendChild(c);
      return slot;
    }
  }
  if (item.icon.status === 'registered') {
    slot.textContent = '注册?';
    slot.title = `semanticId ${item.icon.semanticId} 标记为已注册但图集未加载/不存在`;
    return slot;
  }
  slot.textContent = '缺图';
  slot.title = item.icon.status === 'candidate' ? '仅有候选原图' : '无图标候选,数据保留缺口';
  return slot;
}

// ---------- Tab 1 物品 ----------
function renderItems() {
  const q = $('#item-search').value.trim().toLowerCase();
  const cat = $('#item-category').value;
  const phase = $('#item-phase').value;
  const grid = $('#item-grid');
  grid.innerHTML = '';
  let shown = 0;
  for (const it of state.items) {
    if (cat && it.category !== cat) continue;
    if (phase && it.phase !== phase) continue;
    if (q && !(`${it.id} ${it.name}`.toLowerCase().includes(q))) continue;
    shown += 1;
    const card = document.createElement('div');
    card.className = 'card';
    const m = it.measure;
    const measureTxt = m.kind === 'mass'
      ? `散装 g${m.quantumG != null ? ` · 采集步长 ${m.quantumG}g` : ''}`
      : m.kind === 'count'
        ? `件数 · ${m.unitMassG}g/${m.unit}`
        : `实例${m.unitMassG != null ? ` · ${m.unitMassG}g` : it.massRangeG ? ` · ${it.massRangeG[0]}-${it.massRangeG[1]}g` : ''}`;
    card.innerHTML = `
      <h3>${esc(it.name)} <span class="id">${esc(it.id)}</span></h3>
      <div><span class="badge ${it.phase}">阶段 ${it.phase}</span><span class="badge">${CAT_CN[it.category] || it.category}</span><span class="badge ${it.icon.status === 'registered' ? 'reg' : 'missing'}">${it.icon.status === 'registered' ? '图标已注册' : it.icon.status === 'candidate' ? '生成候选' : '缺图'}</span></div>
      <div class="row">${measureTxt}</div>
      <div class="row muted">来源:${esc((it.sources || []).join('; '))}</div>
      <div class="row muted">用途:${esc((it.uses || []).join('; '))}</div>`;
    card.prepend(iconEl(it));
    grid.appendChild(card);
  }
  $('#item-count').textContent = `显示 ${shown} / 60`;
}

// ---------- Tab 2 配方 ----------
function recipeOutputs(r) {
  if (r.operation === 'upgrade-instance') return `升级实例 → ${r.targetItemId}(升级后 ${r.resultMassG}g,材质 ${r.resultVariant || '-'})`;
  return (r.outputs || []).map((o) => `${o.id} ×${fmtQty(o.id, o.qty)}`).join(' + ');
}
function renderRecipeDetail() {
  const id = $('#recipe-select').value;
  const r = state.recipes.find((x) => x.id === id);
  const box = $('#recipe-detail');
  if (!r) { box.innerHTML = ''; return; }
  const station = r.level === 0 ? ({ handcraft: '免费手作', campfire: '初始篝火' }[r.station] || r.station) : `${r.station} L${r.level}`;
  const inputs = (r.inputs || []).map((i) => `<li>${esc(i.id)} ×${fmtQty(i.id, i.qty)}</li>`).join('');
  const anyOf = (r.anyOf || []).map((g) => `<li class="anyof">[以下材料只需一种] ${g.options.map((o) => `${esc(o.id)} ×${fmtQty(o.id, o.qty)}`).join(' ／ ')}</li>`).join('');
  box.innerHTML = `
    <div class="card">
      <h3>${esc(r.name)} <span class="id">${esc(r.id)}</span></h3>
      <div class="row"><span class="badge ${r.phase}">阶段 ${r.phase}</span><span class="badge">工位 ${esc(station)}</span><span class="badge">整批 ${fmtDuration(r.baseTimeMs)}</span>${r.visibleWhen && r.visibleWhen !== 'always' ? `<span class="badge pending">隐藏 until ${VIS_CN[r.visibleWhen] || r.visibleWhen}</span>` : ''}</div>
      <div class="row">输入:<ul>${inputs}${anyOf}</ul></div>
      <div class="row">输出:${esc(recipeOutputs(r))}</div>
      ${r.externalSource ? `<div class="row muted">外部来源:${esc(r.externalSource)}</div>` : ''}
      ${(r.notes || []).length ? `<div class="row muted">注:${esc(r.notes.join('; '))}</div>` : ''}
      <div class="row muted">设计出处:${esc(r.designRef)}</div>
    </div>`;
}
function renderRecipes() {
  const sel = $('#recipe-select');
  sel.innerHTML = '';
  for (const r of state.recipes) {
    const opt = document.createElement('option');
    opt.value = r.id;
    opt.textContent = `${r.name}(${r.level === 0 ? '免费工位' : `${r.station} L${r.level}`})`;
    sel.appendChild(opt);
  }
  sel.addEventListener('change', renderRecipeDetail);
  renderRecipeDetail();
}

// ---------- Tab 3 建筑 ----------
const BUILDING_CAND = {
  lodge: { img: '/assets/vendor/rubberduck-medieval-buildings-03/building_1/128x64_shaded/b1_128x64_shaded_00.png', cap: '候选示意:B1 都铎小屋(未注册,风格待定)' },
  warehouse: { img: '/assets/vendor/rubberduck-medieval-buildings-03/building_3/128x64_shaded/b3_128x64_shaded_00.png', cap: '候选示意:B3 开放木棚(缺封闭仓库造型)' },
  workshop: { img: '/assets/vendor/feudalwars-buildings/blacksmith.png', cap: '候选示意:FW 铁匠铺(像素风,与GPT样板互斥)' },
  smelter: { img: null, cap: '缺图:专用炉窑造型缺失(仅 FW 铁匠铺可借用示意)' },
  well: { img: '/assets/vendor/rubberduck-medieval-props/medieval_props_2x2_128x64_shaded/medieval_props_2x2_128x64_shaded_04.png', cap: '候选示意:2x2 石砌水井(仅两朝向)' },
  garden: { img: '/assets/vendor/rubberduck-medieval-props/medieval_props_2x2_128x64_shaded/medieval_props_2x2_128x64_shaded_06.png', cap: '候选示意:空摊位棚(农田/苗床缺失)' },
  supply: { img: '/assets/vendor/rubberduck-medieval-props/medieval_props_2x2_128x64_shaded/medieval_props_2x2_128x64_shaded_10.png', cap: '候选示意:果蔬市场摊(建筑型补给所缺失)' },
  cartography: { img: null, cap: '缺图:地图室素材完全缺失' },
};
function renderBuildings() {
  const list = $('#building-list');
  list.innerHTML = '';
  for (const b of state.buildings.buildings) {
    const cand = BUILDING_CAND[b.id] || {};
    const div = document.createElement('div');
    div.className = 'card building';
    const rows = b.levels.map((lv) => `
      <tr>
        <td>L${lv.level}${lv.freeInitially ? ' <span class="badge reg">初始免费</span>' : ''}</td>
        <td>${lv.freeInitially ? '(免费)' : [...(lv.cost || []).map((c) => `${esc(c.id)} ×${fmtQty(c.id, c.qty)}`), ...(lv.costAnyOf || []).map(g => '(' + g.options.map(c => `${esc(c.id)} ×${fmtQty(c.id, c.qty)}`).join(' 或 ') + ')')].join(' + ')}</td>
        <td>${fmtDuration(lv.buildTimeMs)}</td>
        <td>${esc(lv.unlockDesc)}</td>
        <td>${lv.efficiency ? Object.entries(lv.efficiency).map(([k, v]) => `${esc(k)}=${v}`).join('; ') : '(无数值收益)'}</td>
        <td>${esc((lv.prereq || []).join('; ') || '无')}</td>
      </tr>`).join('');
    div.innerHTML = `
      <div class="head">
        ${cand.img ? `<img class="cand" src="${cand.img}" alt="${esc(b.name)} 候选图">` : `<span class="icon-slot" style="width:200px;height:80px">缺图</span>`}
        <div style="flex:1;min-width:220px">
          <h3>${esc(b.name)} <span class="id">${esc(b.id)}</span> <span class="badge pending">外观 ${esc(b.levels[0].visual?.status || 'pending')}</span></h3>
          <div class="row muted">${esc(cand.cap || '')}</div>
          <div class="row muted">限制:${esc(b.limits || '')}</div>
        </div>
      </div>
      <div class="table-wrap"><table class="data" style="margin-top:8px">
        <tr><th>等级</th><th>新增成本(非累计)</th><th>建造</th><th>功能解锁</th><th>效率(量纲见键名)</th><th>前置</th></tr>
        ${rows}
      </table></div>`;
    list.appendChild(div);
  }
}

// ---------- Tab 4 素材 ----------
const ASSET_KEYS = [
  ['B1 房屋 朝向0', '/assets/vendor/rubberduck-medieval-buildings-03/building_1/128x64_shaded/b1_128x64_shaded_00.png'],
  ['B1 房屋 雪顶', '/assets/vendor/rubberduck-medieval-buildings-03/building_1/128x64_shaded/b1_128x64_shaded_04.png'],
  ['B2 庄园 朝向0', '/assets/vendor/rubberduck-medieval-buildings-03/building_2/128x64_shaded/b2_128x64_shaded_00.png'],
  ['B3 木棚 朝向0', '/assets/vendor/rubberduck-medieval-buildings-03/building_3/128x64_shaded/b3_128x64_shaded_00.png'],
  ['FW 铁匠铺', '/assets/vendor/feudalwars-buildings/blacksmith.png'],
  ['FW 马厩', '/assets/vendor/feudalwars-buildings/stable.png'],
  ['手推车 朝向0', '/assets/vendor/rubberduck-medieval-props/medieval_props_2x2_128x64_shaded/medieval_props_2x2_128x64_shaded_00.png'],
  ['水井(两朝向之一)', '/assets/vendor/rubberduck-medieval-props/medieval_props_2x2_128x64_shaded/medieval_props_2x2_128x64_shaded_04.png'],
  ['空摊位棚', '/assets/vendor/rubberduck-medieval-props/medieval_props_2x2_128x64_shaded/medieval_props_2x2_128x64_shaded_06.png'],
  ['食品摊', '/assets/vendor/rubberduck-medieval-props/medieval_props_2x2_128x64_shaded/medieval_props_2x2_128x64_shaded_10.png'],
  ['工具摊', '/assets/vendor/rubberduck-medieval-props/medieval_props_2x2_128x64_shaded/medieval_props_2x2_128x64_shaded_16.png'],
  ['单桶', '/assets/vendor/rubberduck-medieval-props/medieval_props_128x64_shaded/medieval_props_128x64_shaded_26.png'],
  ['石臼', '/assets/vendor/rubberduck-medieval-props/medieval_props_128x64_shaded/medieval_props_128x64_shaded_04.png'],
  ['柳条篮', '/assets/vendor/rubberduck-medieval-props/medieval_props_128x64_shaded/medieval_props_128x64_shaded_32.png'],
  ['板条箱', '/assets/vendor/rubberduck-medieval-props/medieval_props_128x64_shaded/medieval_props_128x64_shaded_36.png'],
  ['GPT 工坊概念(风格样板,未注册)', '/output/imagegen/building-concepts/workshop-v1.png'],
];

function loadMeta(rec) {
  // 优先用扫描元数据的 alpha128 包围框推脚点线索
  const found = state.assets?.records?.find((r) => r.path === rec);
  return found || null;
}

function renderAsset() {
  const [label, url] = $('#asset-select').value.split('|');
  const rel = url.replace(/^\//, '');
  const view = $('#asset-view');
  const meta = loadMeta(rel);
  const bb = meta?.alpha128BBox;
  const bbFrac = bb && meta.height ? (bb.y1 + 1) / meta.height : null; // 底边位置(高度比例)
  const cell = (cls, size) => `
    <span class="swatch ${cls} fp-line" style="${bbFrac ? `--fp:${bbFrac * 100}%;` : ''}display:inline-block">
      <img src="${url}" style="height:${size}px;max-width:60vw;display:block" alt="${esc(label)}">
    </span>`;
  view.innerHTML = `
    <div class="card">
      <h3>${esc(label)} <span class="id">${meta ? `${meta.width}×${meta.height} canvas` : ''}</span></h3>
      <div>
        <div class="row muted">原尺寸:</div>
        <span class="swatch checker"><img src="${url}" style="max-height:320px;max-width:80vw;display:block" alt="原尺寸"></span>
        <div class="row muted">240px / 160px × 三背景(绿/灰/棋盘):</div>
        <div>${cell('bg-green', 240)}${cell('bg-gray', 240)}${cell('checker', 240)}</div>
        <div>${cell('bg-green', 160)}${cell('bg-gray', 160)}${cell('checker', 160)}</div>
      </div>
      <div class="row">脚点参考线(橙虚线)= alpha≥128 包围框底边 ${bb ? `(y=${bb.y1 + 1}/${meta.height})` : '(无元数据)'} — **仅线索,正式锚点未标定**。</div>
      <div class="row muted">没有正式世界碰撞/进屋接线;原图未改动,本页全部为只读展示。</div>
    </div>`;
}

// ---------- init ----------
function initTabs() {
  const tabs = document.querySelectorAll('[role="tab"]');
  for (const t of tabs) {
    t.addEventListener('click', () => {
      for (const o of tabs) {
        o.setAttribute('aria-selected', o === t ? 'true' : 'false');
        document.getElementById(o.getAttribute('aria-controls')).hidden = o !== t;
      }
    });
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const arr = [...tabs];
      const next = arr[(arr.indexOf(t) + (e.key === 'ArrowRight' ? 1 : arr.length - 1)) % arr.length];
      next.focus(); next.click();
    });
  }
}

async function main() {
  initTabs();
  const status = $('#data-status');
  try {
    const [items, recipes, buildings, assets] = await Promise.all([
      fetchJson('/content-prep/expedition-v1/items.json'),
      fetchJson('/content-prep/expedition-v1/recipes.json'),
      fetchJson('/content-prep/expedition-v1/buildings.json'),
      fetchJson('/output/glm-r52/asset-review/asset-candidates.json'),
    ]);
    state.items = items.items; state.recipes = recipes.recipes; state.buildings = buildings; state.assets = assets;
    for (const c of ['raw', 'processed', 'consumable', 'tool', 'equipment', 'research']) {
      const o = document.createElement('option');
      o.value = c; o.textContent = CAT_CN[c];
      $('#item-category').appendChild(o);
    }
    for (const [label, url] of ASSET_KEYS) {
      const o = document.createElement('option');
      o.value = `${label}|${url}`;
      o.textContent = label;
      $('#asset-select').appendChild(o);
    }
    $('#item-search').addEventListener('input', renderItems);
    $('#item-category').addEventListener('change', renderItems);
    $('#item-phase').addEventListener('change', renderItems);
    $('#asset-select').addEventListener('change', renderAsset);
    renderItems();
    renderRecipes();
    renderBuildings();
    renderAsset();
    await loadIconRects();
    renderItems(); // 图集就绪后重画图标
    status.textContent = `数据就绪:物品 ${state.items.length},配方 ${state.recipes.length},建筑 ${state.buildings.buildings.length},素材元数据 ${state.assets.records.length}。所有资源均为本地加载。`;
  } catch (e) {
    status.textContent = `数据加载失败:${e.message}`;
    console.error(e);
  }
}
main();
