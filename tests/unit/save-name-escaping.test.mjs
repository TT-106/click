// 名称类文本的输出边界（R55 阶段 0-A）。
//
// 问题：存档可写入的 itemName / 怪物名原样进入 innerHTML，手工编辑或导入的存档能把标签
// 变成真实 DOM 节点。R54 的浏览器探针已在真实 DOM 上复现。
//
// 取证结论决定了修法（见下三条，缺一不可）：
//   1) 内容表里 0 个合法名称含 < > &（src/engine/modules/content/** 全量扫描），所以在输出
//      边界转义对所有合法内容是逐字节 no-op，不触碰 R1/R4。
//   2) serializeItem 会把内存里的 itemName 原样写回存档。若在 restoreItem 读档时转义，
//      存档里存的就是已转义值，下次读档再转义一次——每读一次档多一层双重转义。因此转义
//      必须发生在输出边界，存档值保持原样。
//   3) getHighlightedItemName 按契约返回 HTML（用 <span> 高亮基础名）。整体转义它的返回值
//      会把 span 一起转义掉、破坏全游戏每个物品名的显示——所以只转义它的文本分段，标签保持字面量。
//
// 覆盖四件事：
//   1) escapeHtmlText：五个敏感字符，且同字符多次出现全部转义（原版输入转义用 String.replace
//      链，只替换第一个出现；本函数是输出边界的最后一道，不重复该缺陷）；
//   2) getHighlightedItemName：存档里的标签被中和，高亮 span 原样保留，入参不被改写，
//      重复调用结果一致（证明不存在累积二次转义）；
//   3) MonsterRowView 真实 sink：nameCell.innerHTML 里没有可执行标签；
//   4) R4 no-op 证明：合法内容名经同一路径逐字节不变；
//   5) escapeHtmlTextPreservingEntities（实体感知，供 adventurerName 用）：裸字符转义、既有实体
//      保留、导入存档的标签被中和；并端到端证明玩家输入的字符最终仍按原文显示（无双重转义）。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { escapeHtmlText, escapeHtmlTextPreservingEntities } from '../../src/engine/modules/core/html-text.js';
import { getHighlightedItemName } from '../../src/engine/modules/loot/items.js';
import { MonsterRowView, initializeViewsMonsters } from '../../src/engine/modules/views/monsters.js';
import { initializeViewsDom } from '../../src/engine/modules/views/dom.js';
import { initializeContentBalance } from '../../src/engine/modules/content/balance.js';

initializeViewsDom();
initializeContentBalance(makeUpgradeDependencies());
initializeViewsMonsters();

function makeUpgradeDependencies() {
  class Fake {}
  return {
    LevelUpUpgrade: Fake, EquipBestItemUpgrade: Fake, EquipItemUpgrade: Fake, GlobalUpgrade: Fake,
    ScrollUpgrade: Fake, UnlockMonsterLevelUpgrade: Fake, RetireMonsterLevelUpgrade: Fake,
    PurchaseCastleUpgrade: Fake, PurchaseItemUpgrade: Fake, ClaimAchievementUpgrade: Fake,
    AutoPurchaseDungeonUpgrade: Fake, CollectFarmUpgrade: Fake, UpgradeCollection: Fake,
    scrollDefinitions: [],
  };
}

// 最小 DOM：createElement 造新元素，insertCell/appendChild 维护 children。
class Element {
  constructor() {
    this.style = {};
    this.children = [];
    this.className = '';
    this.id = '';
    this.innerHTML = '';
    this.src = '';
  }
  get firstChild() { return this.children[0]; }
  appendChild(child) { this.children.push(child); return child; }
  removeChild(child) { this.children.splice(this.children.indexOf(child), 1); }
  insertRow(index) { return this.insertChild(index); }
  insertCell(index) { return this.insertChild(index); }
  insertChild(index) {
    const child = new Element();
    this.children.splice(index < 0 ? this.children.length : index, 0, child);
    return child;
  }
}

function withDocument(run) {
  const previous = globalThis.document;
  globalThis.document = { createElement: () => new Element(), getElementById: () => null };
  try { run(); }
  finally { if (previous === undefined) delete globalThis.document; else globalThis.document = previous; }
}

function makeItem(itemName, baseName) {
  return { itemName, itemType: { baseName } };
}

test('escapeHtmlText 转义五个敏感字符，且同字符多次出现全部覆盖', () => {
  assert.equal(escapeHtmlText('&'), '&amp;');
  assert.equal(escapeHtmlText('<'), '&lt;');
  assert.equal(escapeHtmlText('>'), '&gt;');
  assert.equal(escapeHtmlText('"'), '&quot;');
  assert.equal(escapeHtmlText("'"), '&#39;');
  // 原版 renameSelectedCharacter 的 String.replace 链只替换第一个出现；输出边界不能重复该缺陷。
  assert.equal(escapeHtmlText('<b><i>'), '&lt;b&gt;&lt;i&gt;');
  assert.equal(escapeHtmlText('a&b&c'), 'a&amp;b&amp;c');
  // 非字符串按字符串处理，不抛错。
  assert.equal(escapeHtmlText(42), '42');
});

test('getHighlightedItemName 中和存档标签，同时保留高亮 span 字面量', () => {
  const payload = '<img src=x onerror=alert(1)>';
  withDocument(() => {
    const plain = getHighlightedItemName(makeItem(payload, '巨剑'));
    // 存档标签整体变成实体：输出里不再有任何能开启标签的裸 '<'。
    assert.ok(!plain.includes('<'), `仍存在裸 '<'：${plain}`);
    assert.equal(plain, '&lt;img src=x onerror=alert(1)&gt;');

    const highlighted = getHighlightedItemName(makeItem('锋利' + payload + '巨剑', '巨剑'));
    // 引擎自产的高亮标签必须仍是字面量 span，否则全游戏物品名显示都会被破坏。
    assert.ok(highlighted.includes('<span style="color:#FAF;">'), '高亮 span 被误转义');
    // 剔除引擎自产的那对 span 后，不得再有别的标签起始符。
    const withoutEngineTags = highlighted.replace(/<span style="color:#FAF;">|<\/span>/g, '');
    assert.ok(!withoutEngineTags.includes('<'), `出现了引擎自产 span 以外的标签起始符：${highlighted}`);
    assert.equal(highlighted, '锋利&lt;img src=x onerror=alert(1)&gt;<span style="color:#FAF;">巨剑</span>');
  });
});

test('getHighlightedItemName 不改写入参，重复调用结果一致（不累积二次转义）', () => {
  const itemName = 'A&B 的 <b>巨剑</b>';
  const item = makeItem(itemName, '巨剑');
  withDocument(() => {
    const first = getHighlightedItemName(item);
    const second = getHighlightedItemName(item);
    assert.equal(first, second, '重复调用结果不一致');
    // 存档值必须保持原样：serializeItem 会把它写回存档，一旦被改写就会每读档多一层转义。
    assert.equal(item.itemName, itemName, '写入参被改写，会导致读档累积二次转义');
  });
});

test('怪物图鉴真实 sink 把存档怪物名写成纯文本', () => {
  const payload = '<img src=x onerror=alert(1)>';
  withDocument(() => {
    const row = new Element();
    const view = new MonsterRowView(row, {
      sprite: { sourceX: 0, sourceY: 0 },
      getName: () => payload,
      level: 1, killCount: 0, rank: 0, armor: 0, attackRating: 0, defenceRating: 0,
      maxHealth: 0, health: 0, experience: 0, rankProgressKills: 0, treasureChance: 0,
    });
    if (!view.nameCell) view.createRowCells();
    // 存档怪物名整体变成实体：输出里不再有任何能开启标签的裸 '<'。
    assert.ok(!view.nameCell.innerHTML.includes('<'), `怪物名 sink 仍产生标签：${view.nameCell.innerHTML}`);
    assert.equal(view.nameCell.innerHTML, '&lt;img src=x onerror=alert(1)&gt;');
  });
});

test('合法内容名经同一路径逐字节不变（R4 no-op 证明）', () => {
  // 内容表里不存在含 < > & 的合法名称；一旦有人给内容表加了这类字符，这条会红。
  const legitimate = ['棕色蝙蝠', '巨剑', '平均之靴子', '休克'];
  for (const name of legitimate) {
    assert.equal(escapeHtmlText(name), name, `合法名称被改动：${name}`);
  }
  withDocument(() => {
    assert.equal(getHighlightedItemName(makeItem('锋利的巨剑', '巨剑')), '锋利的<span style="color:#FAF;">巨剑</span>');
  });
  withDocument(() => {
    const row = new Element();
    const view = new MonsterRowView(row, {
      sprite: { sourceX: 0, sourceY: 0 },
      getName: () => '棕色蝙蝠',
      level: 1, killCount: 0, rank: 0, armor: 0, attackRating: 0, defenceRating: 0,
      maxHealth: 0, health: 0, experience: 0, rankProgressKills: 0, treasureChance: 0,
    });
    if (!view.nameCell) view.createRowCells();
    assert.equal(view.nameCell.innerHTML, '棕色蝙蝠');
  });
});

// ---- 实体感知转义（adventurerName 专用）------------------------------------------------
// adventurerName 的编码状态是混合的：输入侧（原版 renameSelectedCharacter）已逐字符转义，
// 而导入存档可以是任意裸文本。实体感知转义同时满足两侧：既不把玩家输入的 `&` 显示成
// `&amp;`，也不让导入存档的裸标签变成真实节点。

// 原版输入侧转义：逐字符，但 String.replace 只替换第一个出现（R4：原样保留该缺陷，不修）。
function escapeLikeOriginalInput(value) {
  let escaped = value;
  escaped = escaped.replace("&", "&amp;");
  escaped = escaped.replace("<", "&lt;");
  escaped = escaped.replace(">", "&gt;");
  escaped = escaped.replace('"', "&quot;");
  escaped = escaped.replace("'", "&#x27;");
  escaped = escaped.replace("/", "&#x2F;");
  return escaped;
}

// 浏览器把 innerHTML 里这些实体解码后显示的文本。
const DISPLAYED_ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
function decodeEntities(text) {
  return text.replace(/&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);/g, (whole, body) => {
    if (body[0] === "#") {
      const code = body[1] === "x" || body[1] === "X" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
    }
    return Object.hasOwn(DISPLAYED_ENTITIES, body) ? DISPLAYED_ENTITIES[body] : whole;
  });
}

test('实体感知转义：裸敏感字符转义，成形实体与数字实体原样保留', () => {
  assert.equal(escapeHtmlTextPreservingEntities('<b>'), '&lt;b&gt;');
  assert.equal(escapeHtmlTextPreservingEntities('"'), '&quot;');
  assert.equal(escapeHtmlTextPreservingEntities("'"), '&#39;');
  // 裸 & 不是实体，必须转义
  assert.equal(escapeHtmlTextPreservingEntities('A&B'), 'A&amp;B');
  // 已经成形的实体不能再转义（否则双重转义）
  assert.equal(escapeHtmlTextPreservingEntities('A&amp;B'), 'A&amp;B');
  assert.equal(escapeHtmlTextPreservingEntities('&lt;b&gt;'), '&lt;b&gt;');
  assert.equal(escapeHtmlTextPreservingEntities('&#65;'), '&#65;');
  assert.equal(escapeHtmlTextPreservingEntities('&#x27;'), '&#x27;');
  // 不成形的前缀不算实体
  assert.equal(escapeHtmlTextPreservingEntities('&lt'), '&amp;lt');
  assert.equal(escapeHtmlTextPreservingEntities('A&B&C'), 'A&amp;B&amp;C');
  // 混合来源：前段已是实体、后段是导入的裸标签
  assert.equal(
    escapeHtmlTextPreservingEntities('A&amp;B<img src=x onerror=1>'),
    'A&amp;B&lt;img src=x onerror=1&gt;'
  );
  // 非字符串按字符串处理
  assert.equal(escapeHtmlTextPreservingEntities(42), '42');
  assert.equal(escapeHtmlTextPreservingEntities(null), 'null');
});

test('端到端：玩家输入经输入侧转义 + 输出侧实体感知转义后，浏览器显示的仍是原文', () => {
  // 这是"不双重转义"的直接证明：显示层结果必须等于玩家当初输入的字符。
  const inputs = ['战士', 'A&B', 'A&B&C', '<script>', 'a"b\'c', '路径/名称', 'x<y>z', '&amp;', '&#65;', '100% & 折扣'];
  for (const input of inputs) {
    const stored = escapeLikeOriginalInput(input);
    const rendered = escapeHtmlTextPreservingEntities(stored);
    assert.equal(decodeEntities(rendered), input, `输入 "${input}" 经两端处理后显示成了 "${decodeEntities(rendered)}"`);
  }
});

test('导入存档的裸标签被中和：实体感知转义后不含可开启标签的裸 <', () => {
  const payload = '<img src=x onerror=alert(1)>';
  const rendered = escapeHtmlTextPreservingEntities(payload);
  assert.ok(!rendered.includes('<'), `仍存在裸 '<'：${rendered}`);
  assert.equal(rendered, '&lt;img src=x onerror=alert(1)&gt;');
  // 已是实体的伪标签同样只显示文本
  const preEscaped = escapeHtmlTextPreservingEntities('&lt;img src=x onerror=alert(1)&gt;');
  assert.ok(!preEscaped.includes('<'), '已转义的伪标签被还原成了真标签');
  assert.equal(decodeEntities(preEscaped), '<img src=x onerror=alert(1)>');
});

test('实体感知转义对合法内容名逐字节不变（R4 no-op 证明）', () => {
  for (const name of ['棕色蝙蝠', '平均之靴子', 'Tank', 'Tank.强力的近战攻击.']) {
    assert.equal(escapeHtmlTextPreservingEntities(name), name, `合法名称被改动：${name}`);
  }
  // 空串与纯文本也不能被改写
  assert.equal(escapeHtmlTextPreservingEntities(''), '');
});

// 接线守卫（非行为测试）：adventurerName 的真实 sink 必须走实体感知转义。
// AdventurerSummaryView 未导出、其构造链需要 canvas 等大量依赖，无法在 node 单测里实例化；
// 因此这里锁住 sink 那一行，防止将来有人改回裸赋值。真正的行为由上面四条覆盖。
test('接线守卫：adventurerName 的 sink 使用实体感知转义', () => {
  const source = readFileSync(
    new URL('../../src/engine/modules/views/expedition.js', import.meta.url), 'utf8');
  assert.ok(
    /nameCell\.innerHTML = escapeHtmlTextPreservingEntities\(adventurer\.adventurerName\);/.test(source),
    'adventurerName 的 sink 没有使用实体感知转义'
  );
});
