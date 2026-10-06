import { escapeHtml, icon, sprite } from './dom.js';
import { EXPEDITION_ITEMS } from '../data/expedition-items.js';
import definitions from '../data/assets.generated.js';

const phaseName = journey => journey.phase === 'returning' ? '带着收获返程' : journey.phase === 'resting' ? '营地休整中' : journey.gathering ? '收集沿途材料' : '探索与收集';

/** 游戏背包投影：规则和图片帧都由探索控制器提供，界面只持有选中状态。 */
export function createExpeditionInventory({ heroes, preview, onReturn, isVisible = () => !document.hidden }) {
  const dialog = document.createElement('dialog'); dialog.id = 'expedition-inventory'; dialog.className = 'expedition-inventory';
  dialog.setAttribute('aria-labelledby', 'inventory-title');
  dialog.innerHTML = `<header class="inventory-heading"><div><span class="inventory-emblem">${icon('users')}</span><div><span class="inventory-kicker">队伍的旅途收藏</span><h2 id="inventory-title">远行背包</h2></div></div><div class="inventory-heading-actions"><button type="button" data-inventory-expand>展开查看</button><button type="button" data-inventory-close aria-label="关闭背包">${icon('close')}</button></div></header>
    <div class="inventory-summary"><div><span>这趟旅途</span><strong id="inventory-outing">第 1 趟</strong></div><div><span>随身收获</span><strong id="inventory-carried">0 件</strong></div><div><span>营地库存</span><strong id="inventory-stored">0 件</strong></div><p id="inventory-phase"></p></div>
    <div class="inventory-owners" role="group" aria-label="查看队员背包或营地仓库"></div>
    <div class="inventory-body"><section class="inventory-collection" aria-labelledby="inventory-bag-title"><div class="inventory-bag-heading"><h3 id="inventory-bag-title"></h3><span id="inventory-capacity"></span></div><progress id="inventory-weight" max="24" value="0" aria-label="背包负重"></progress><div class="inventory-filters" role="group" aria-label="物品分类"></div><div class="inventory-grid" role="group" aria-label="背包物品"></div><p id="inventory-empty" class="inventory-empty" hidden></p></section><aside class="inventory-detail" aria-label="物品详情"></aside></div>
    <footer class="inventory-footer"><p id="inventory-return-note">材料自动堆叠，装满前会自动返程。</p><button type="button" id="inventory-return">返程带回 ${icon('arrow')}</button></footer>
    <details class="inventory-credits"><summary>素材署名</summary><p>材料：<a href="https://opengameart.org/content/rpg-crafting-material-icons" target="_blank" rel="noopener noreferrer">RPG Crafting Material Icons</a> · BizmasterStudios · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>。原图未修改，通过资源清单选帧并缩放显示。界面边框：<a href="https://kenney.nl/assets/ui-pack-adventure" target="_blank" rel="noopener noreferrer">UI Pack - Adventure</a> · Kenney · CC0。</p></details>`;
  document.body.append(dialog);
  const style = document.createElement('link'); style.rel = 'stylesheet'; style.href = './src/styles/expedition-inventory.css'; document.head.append(style);
  // 独立 PNG 的 UI 边框也由生成清单解析，CSS 不保存素材路径。
  for (const [name, id] of [['panel', 'expedition-ui.panel'], ['slot', 'expedition-ui.slot']]) {
    const source = definitions.find(definition => definition.id === id)?.source;
    if (source) dialog.style.setProperty(`--inventory-pack-${name}`, `url(${JSON.stringify(new URL(source.image, document.baseURI).href)})`);
  }
  const element = selector => dialog.querySelector(selector);
  let latest = null, owner = 0, filter = '全部', selected = null, rendered = '', restoreFocus = null;
  const image = (id, className = '') => {
    const item = EXPEDITION_ITEMS[id], visual = preview(item.icon);
    return visual ? `<img class="inventory-item-image ${className}" src="${escapeHtml(visual.url)}" alt="" width="32" height="32">` : `<span class="inventory-item-fallback" aria-hidden="true">${escapeHtml(item.name.slice(0, 1))}</span>`;
  };
  const close = () => { dialog.close(); restoreFocus?.focus({ preventScroll: true }); };
  const render = () => {
    if (!dialog.open || !latest?.expedition || !isVisible()) return;
    const journey = latest.expedition;
    element('#inventory-outing').textContent = `第 ${journey.outing} 趟`;
    element('#inventory-carried').textContent = `${journey.carried} 件`;
    element('#inventory-stored').textContent = `${journey.stored} 件`;
    element('#inventory-phase').textContent = `${latest.paused ? '已暂停 · ' : ''}${phaseName(journey)}`;
    element('#inventory-return').disabled = journey.phase !== 'exploring';
    element('#inventory-return').title = latest.paused ? '已暂停；继续旅途后队伍会返程' : '队伍沿已走过的路线返回营地';
    element('#inventory-return-note').textContent = journey.phase === 'returning' ? '队伍正在返程，抵达营地后自动归仓。' : journey.phase === 'resting' ? '收获已归仓，短暂休整后会自动再出发。' : '材料自动堆叠，装满前会自动返程。';
    const key = JSON.stringify([journey.bags, journey.warehouse, journey.journal, owner, filter, selected, latest.loading]);
    if (key === rendered) return;
    rendered = key;
    const focus = document.activeElement?.closest('[data-owner],[data-item],[data-filter]');
    const focusKey = focus && [...focus.attributes].find(attribute => ['data-owner', 'data-item', 'data-filter'].includes(attribute.name));
    element('.inventory-owners').innerHTML = heroes.map((hero, index) => `<button type="button" data-owner="${index}" aria-pressed="${owner === index}" class="inventory-owner ${owner === index ? 'active' : ''}">${sprite(hero.sprite, 'inventory-portrait')}<span><strong>${escapeHtml(hero.name)}</strong><small>${escapeHtml(hero.className)} · ${journey.bags[index]?.count || 0} 件</small></span></button>`).join('') + `<button type="button" data-owner="warehouse" aria-pressed="${owner === 'warehouse'}" class="inventory-owner inventory-camp ${owner === 'warehouse' ? 'active' : ''}">${icon('dungeon')}<span><strong>营地仓库</strong><small>已带回 ${journey.stored} 件</small></span></button>`;
    const bag = journey.bags[owner], stacks = owner === 'warehouse' ? journey.warehouse : bag?.stacks || {};
    element('#inventory-bag-title').textContent = owner === 'warehouse' ? '安心存放的收获' : `${heroes[owner]?.name || '队员'}的背包`;
    element('#inventory-capacity').textContent = owner === 'warehouse' ? `${journey.completed} 趟归来` : `负重 ${bag?.weight || 0} / ${journey.capacity}`;
    element('#inventory-weight').hidden = owner === 'warehouse'; element('#inventory-weight').value = bag?.weight || 0;
    element('.inventory-filters').innerHTML = ['全部', '材料', '矿物'].map(name => `<button type="button" data-filter="${name}" aria-pressed="${name === filter}">${name}</button>`).join('');
    const items = Object.entries(stacks).filter(([id]) => filter === '全部' || EXPEDITION_ITEMS[id].category === filter)
      .sort(([left], [right]) => Object.keys(EXPEDITION_ITEMS).indexOf(left) - Object.keys(EXPEDITION_ITEMS).indexOf(right));
    if (!items.some(([id]) => id === selected)) selected = items[0]?.[0] || null;
    element('.inventory-grid').innerHTML = items.map(([id, count]) => `<button type="button" data-item="${id}" class="inventory-slot ${id === selected ? 'selected' : ''}" aria-pressed="${id === selected}" aria-label="${escapeHtml(EXPEDITION_ITEMS[id].name)}，${count} 件">${image(id)}<span class="inventory-stack">${count}</span><span class="inventory-item-label">${escapeHtml(EXPEDITION_ITEMS[id].name)}</span></button>`).join('') + Array.from({ length: Math.max(0, 12 - items.length) }, () => '<span class="inventory-slot inventory-slot-empty" aria-hidden="true"></span>').join('');
    const empty = element('#inventory-empty'); empty.hidden = items.length > 0;
    empty.textContent = Object.keys(stacks).length ? '这一类还没有收获，切换分类看看。' : owner === 'warehouse' ? '营地等着第一趟收获。队伍返程后，材料会自动存到这里。' : '背包还空着。队伍会自动收集沿途材料，你随时回来看看。';
    const detail = element('.inventory-detail');
    if (selected) {
      const item = EXPEDITION_ITEMS[selected];
      detail.innerHTML = `<div class="inventory-detail-art">${image(selected, 'inventory-detail-image')}</div><span class="inventory-rarity">${item.rarity} · ${item.category}</span><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description)}</p><dl><div><dt>当前数量</dt><dd>${stacks[selected]} 件</dd></div><div><dt>单件负重</dt><dd>${item.weight}</dd></div><div><dt>存放位置</dt><dd>${owner === 'warehouse' ? '营地仓库' : escapeHtml(heroes[owner].name)}</dd></div></dl><small>制作和升级用途将在后续开放。</small>`;
    } else {
      const record = journey.journal[0], recap = record ? Object.entries(record.items).map(([id, count]) => `${EXPEDITION_ITEMS[id].name} ×${count}`).join(' · ') : '';
      detail.innerHTML = `<div class="inventory-detail-art inventory-detail-empty">${icon('compass')}</div><span class="inventory-rarity">旅途记录</span><h3>${record ? `第 ${record.outing} 趟归来` : '收获慢慢积累'}</h3><p>${escapeHtml(recap || '每件材料都会记在拾取它的队员身上。返程后，一起存入营地仓库。')}</p><small>打开背包时，旅途会继续。</small>`;
    }
    if (focusKey) dialog.querySelector(`[${focusKey.name}="${CSS.escape(focusKey.value)}"]`)?.focus({ preventScroll: true });
  };
  dialog.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-inventory-close')) close();
    if (button.hasAttribute('data-inventory-expand')) document.dispatchEvent(new Event('inventory:expand'));
    if (button.hasAttribute('data-owner')) { owner = button.dataset.owner === 'warehouse' ? 'warehouse' : Number(button.dataset.owner); selected = null; rendered = ''; render(); }
    if (button.hasAttribute('data-filter')) { filter = button.dataset.filter; selected = null; rendered = ''; render(); }
    if (button.hasAttribute('data-item')) { selected = button.dataset.item; rendered = ''; render(); }
    if (button.id === 'inventory-return') onReturn();
  });
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  return {
    update(snapshot) { latest = snapshot; render(); },
    open() { if (!latest?.expedition || dialog.open) return; restoreFocus = document.activeElement; rendered = ''; dialog.showModal(); render(); },
    close() { if (dialog.open) close(); },
    isOpen: () => dialog.open,
  };
}
