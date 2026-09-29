// 法术类别覆盖检查：确认 content/spells.js 里出现的每个 spellCategoryId
// 都有一条差分场景驱动它，并标出该场景是否带**直接可观测量**。
//
// 动机：规范 §56 的验收矩阵里「法术」一行曾长期是 PARTIAL——16 个类别都有场景、
// 但只有 4 类有专属可观测量，其余靠"唯一注入法术 + 两端施法计数增长"归因。
// 本脚本把"哪几类有直接可观测量"变成可复核的机械结论，避免口径靠记忆。
//
// 用法: node scripts/check-spell-coverage.mjs
import fs from 'node:fs';

const scenarioSrc = fs.readFileSync('scripts/test-scenarios.mjs', 'utf8');
const spellSrc = fs.readFileSync('src/engine/modules/content/spells.js', 'utf8');

// 1) 法术名 -> 类别（在 spells.js 里按 name 就近取 spellCategoryId）
const spellToCategory = new Map();
for (const m of spellSrc.matchAll(/name:\s*"([^"]+)"([\s\S]{0,500}?)spellCategoryId:\s*(\d+)/g)) {
  const name = m[1];
  const category = Number(m[3]);
  if (!spellToCategory.has(name)) spellToCategory.set(name, category);
}
const allCategories = [...new Set([...spellToCategory.values()])].sort((a, b) => a - b);

// 2) 场景块：name / 注入的法术名 / 该场景是否带直接可观测量
const blocks = [];
const rawBlocks = scenarioSrc.split(/\n  \{\n/).slice(1);
for (const raw of rawBlocks) {
  const nameMatch = raw.match(/name: '([^']+)'/);
  if (!nameMatch) continue;
  const injected = [...raw.matchAll(/with(?:ReclassedSpell|ClassSpell)\([^)]*?,\s*'([^']+)'\s*\)/g)].map((m) => m[1]);
  // 有些场景不按名字注入法术（如 spell-resurrect 用 withResurrectionTrial 保留角色原有法术），
  // 这类场景在注释里显式写了 `spellCategoryId=N`，直接采用该声明。
  const declaredCategories = [...raw.matchAll(/spellCategoryId\s*[=:]\s*(\d+)/g)].map((m) => Number(m[1]));
  const observables = [];
  if (/\beffectType:\s*\d+/.test(raw)) observables.push('活怪物效果队列直接计数(effectType)');
  if (/\ballyEffectType:\s*\d+/.test(raw)) observables.push('盟友效果队列直接计数(allyEffectType)');
  if (/\bdamageNumbers:\s*true/.test(raw)) observables.push('伤害浮动文字(damageNumbers)');
  if (/\bhealNumbers:\s*true/.test(raw)) observables.push('治疗浮动文字(healNumbers)');
  if (/minionsSummoned/.test(raw)) observables.push('随从数(minionsSummoned)');
  if (/\bspellEffects:\s*true/.test(raw)) observables.push('特效池(spellEffects)');
  if (/\bstunned:/.test(raw)) observables.push('昏迷前置(characterStunnedCount)');
  if (/\bitemsFound:/.test(raw)) observables.push('拾取统计(itemsFound)');
  if (/\btreasureLooted:/.test(raw)) observables.push('开箱统计(treasureChestsLooted)');
  if (/\bselectedTreasure:/.test(raw)) observables.push('财宝目标选中直接计数(selectedTreasure)');
  if (!observables.length && /floatingText/.test(raw)) observables.push('浮动文字(floatingText)');
  blocks.push({ name: nameMatch[1], injected, observables, declaredCategories });
}

// 3) 类别 -> 场景
const byCategory = new Map();
const addScene = (category, block) => {
  const list = byCategory.get(category) ?? [];
  list.push(block);
  byCategory.set(category, list);
};
for (const b of blocks) {
  let mapped = false;
  for (const spellName of b.injected) {
    const category = spellToCategory.get(spellName);
    if (category === undefined) continue;
    addScene(category, b);
    mapped = true;
  }
  if (!mapped) for (const category of b.declaredCategories) addScene(category, b);
}

console.log('法术类别覆盖（来源：content/spells.js 的定义 + scripts/test-scenarios.mjs 的场景）：\n');
let missing = 0;
let noObservable = 0;
for (const category of allCategories) {
  const scenes = byCategory.get(category);
  if (!scenes || !scenes.length) {
    console.log(`  cat=${String(category).padStart(2)}  ✗ 无场景驱动`);
    missing++;
    continue;
  }
  const withObs = scenes.filter((s) => s.observables.length);
  const mark = withObs.length ? '✓' : '△';
  if (!withObs.length) noObservable++;
  const detail = withObs.length
    ? `${withObs[0].name} → ${withObs[0].observables.join(' + ')}`
    : `${scenes[0].name} → 仅"施法计数增长 + 完整存档差分"归因`;
  console.log(`  cat=${String(category).padStart(2)}  ${mark} ${detail}`);
}

console.log(`\n共 ${allCategories.length} 个类别：无场景 ${missing} 个，无直接可观测量 ${noObservable} 个。`);
if (missing) process.exitCode = 1;
