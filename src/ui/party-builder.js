import { $, escapeHtml, sprite, icon } from './dom.js';

const roles = ['先锋 / 近战', '支援 / 治疗', '后排 / 远程', '后排 / 法术', '游走 / 寻宝', '支援 / 召唤'];

export function createPartyBuilder(engine, onStart, notify) {
  let party = [];
  const catalog = engine.catalog();
  function render() {
    $('#class-list').innerHTML = catalog.filter(entry => entry.unlocked).map(entry => `<button class="class-option" data-add-class="${entry.id}" ${party.length >= engine.capacity ? 'disabled' : ''}>
      <span class="class-portrait">${sprite(entry.sprite)}</span><span class="class-copy"><span class="class-name">${escapeHtml(entry.name)}<span>${roles[entry.id] || '进阶职业'}</span></span><span class="class-description">${escapeHtml(entry.description)}</span></span><span class="add-mark">${icon('plus')}</span></button>`).join('');
    $('#locked-classes').innerHTML = catalog.filter(entry => !entry.unlocked).map(entry => `<div class="locked-class" title="第 ${entry.unlockRun} 周目解锁"><span class="locked-portrait">${sprite(entry.sprite)}</span><span>${escapeHtml(entry.name)}<small>第 ${entry.unlockRun} 周目</small></span>${icon('lock')}</div>`).join('');
    $('#party-count').textContent = `${party.length} / ${engine.capacity}`;
    $('#party-slots').innerHTML = Array.from({ length: engine.capacity }, (_, index) => {
      const member = party[index];
      if (!member) return `<div class="empty-slot"><span class="slot-number">0${index + 1}</span><span>等待冒险者加入</span>${icon('plus')}</div>`;
      const entry = catalog[member.id];
      return `<div class="filled-slot"><span class="slot-number">0${index + 1}</span>${sprite(entry.sprite)}<label><span>${escapeHtml(entry.name)}</span><input name="hero-${index}" data-rename="${index}" maxlength="15" value="${escapeHtml(member.name)}" aria-label="第 ${index + 1} 位队员姓名" autocomplete="off"></label><div class="slot-actions"><button class="icon-button" data-move="${index}" aria-label="上移${escapeHtml(member.name)}" ${index === 0 ? 'disabled' : ''}>↑</button><button class="icon-button" data-remove="${index}" aria-label="移除${escapeHtml(member.name)}">${icon('close')}</button></div></div>`;
    }).join('');
    validate();
  }
  function validate() {
    const names = party.map(member => member.name.trim());
    const valid = names.length && names.every(Boolean) && new Set(names).size === names.length;
    $('#begin-adventure').disabled = !valid;
    $('#party-validation').textContent = names.length && !valid ? '请给每位队员填写不同的名字。' : party.length ? '队伍将自动探索与战斗，你来决定成长方向。' : '从左侧招募队员，或使用推荐阵容。';
  }
  function add(id) {
    if (party.length >= engine.capacity || !catalog[id]?.unlocked) return;
    const entry = catalog[id];
    let name = entry.defaultName, suffix = 2;
    while (party.some(member => member.name === name)) name = `${entry.defaultName}${suffix++}`;
    party.push({ id, name }); render();
  }
  $('#setup-screen').addEventListener('click', event => {
    const addButton = event.target.closest('[data-add-class]');
    if (addButton) add(Number(addButton.dataset.addClass));
    const remove = event.target.closest('[data-remove]');
    if (remove) { party.splice(Number(remove.dataset.remove), 1); render(); }
    const move = event.target.closest('[data-move]');
    if (move) { const i = Number(move.dataset.move); if (i > 0) [party[i-1], party[i]] = [party[i], party[i-1]]; render(); }
  });
  $('#party-slots').addEventListener('input', event => {
    if (event.target.matches('[data-rename]')) { party[Number(event.target.dataset.rename)].name = event.target.value; validate(); }
  });
  $('#recommended-party').addEventListener('click', () => { party = []; [0,1,2,3].forEach(add); });
  $('#begin-adventure').addEventListener('click', () => {
    try { engine.startParty(party); onStart(); } catch (error) { notify(error.message, true); }
  });
  render();
}
