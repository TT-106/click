// 存档 DTO schema 与"真实形态"的机械比对（NEXT-ARCHITECTURE-PROMPT §5.2 第一步）。
//
// 比对四种形态的顶层键集合：
//   1) save-dto.js 声明的 SAVE_TOP_LEVEL_KEYS（文档/类型资产）
//   2) 真实原版 fixture tests/fixtures/original.c2save 解码后的顶层键
//   3) createSaveState 的**已初始化**分支实际写出的键（运行时序列化器）
//   4) createSaveState 的**未初始化**分支实际写出的键（空白档：只有 4 个键）
// 并顺带核对"每一条 SaveData @property 是否在真实 fixture 里存在"。
// 差异不是错误，但必须被写明——它决定 SaveData 能不能被当作真契约接进 game-save.js。
//
// 用法: node scripts/audit-save-schema.mjs
import fs from 'node:fs';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import { decodeFixture } from '../tests/scenarios/save-mutations.mjs';
import { SAVE_TOP_LEVEL_KEYS, SAVE_BLANK_TOP_LEVEL_KEYS } from '../src/engine/modules/persistence/save-dto.js';

const traverse = traverseModule.default ?? traverseModule;

// -------------------------------------------------- 1) createSaveState 实际写出的键
const gameSaveSource = fs.readFileSync('src/engine/modules/persistence/game-save.js', 'utf8');
const ast = parse(gameSaveSource, { sourceType: 'module' });
const branches = [];
traverse(ast, {
  FunctionDeclaration(p) {
    if (p.node.id?.name !== 'createSaveState') return;
    // 先找出"这个函数最终 return 的是哪个变量"，再按数据流收集它的对象字面量赋值。
    // 早期版本硬编码 `left.name !== 'b'`（因为当时那个局部变量恰好叫 b），
    // 于是检查器的正确性绑在了恢复期的混淆名上：改名一落地它就静默收集到 0 个分支，
    // 报"已初始化 0 键"——检查器跟着改名变红，说明检查的是名字而不是结构。现在按 return 目标推导。
    const returnedNames = new Set();
    p.traverse({
      ReturnStatement(inner) {
        const arg = inner.node.argument;
        if (arg?.type === 'Identifier') returnedNames.add(arg.name);
      },
    });
    if (returnedNames.size !== 1) {
      throw new Error(`createSaveState 的 return 目标应唯一，实得 ${[...returnedNames].join(', ') || '（无标识符 return）'}——请人工核对结构`);
    }
    const carrier = [...returnedNames][0];
    p.traverse({
      AssignmentExpression(inner) {
        // 只取最终被 return 的那个变量（当前名为 ${carrier}）的两个分支对象，
        // 否则会把循环里的 achievements 条目等中间对象也算进来
        const left = inner.node.left;
        if (left.type !== 'Identifier' || left.name !== carrier) return;
        const right = inner.node.right;
        if (right.type !== 'ObjectExpression') return;
        const keys = right.properties
          .filter((prop) => prop.key && (prop.key.type === 'Identifier' || prop.key.type === 'StringLiteral'))
          .map((prop) => (prop.key.type === 'Identifier' ? prop.key.name : prop.key.value));
        if (!keys.length) return;
        branches.push({ line: right.loc.start.line, keys });
      },
      ReturnStatement(inner) {
        if (inner.node.argument?.type === 'ObjectExpression') {
          branches.push({ line: inner.node.loc.start.line, keys: inner.node.argument.properties.map((pr) => pr.key.name ?? pr.key.value) });
        }
      },
    });
  },
});
// 键多的那个分支 = 已初始化档；键少的 = 未初始化档
branches.sort((a, b) => b.keys.length - a.keys.length);
const initializedBranch = branches[0];
const blankBranch = branches[branches.length - 1];

// -------------------------------------------------- 2) 真实 fixture
const fixture = decodeFixture();
const fixtureKeys = Object.keys(fixture);

// -------------------------------------------------- 3) SaveData 的 @property
const dtoSource = fs.readFileSync('src/engine/modules/persistence/save-dto.js', 'utf8');
/** 解析 `@property {Type} name 描述`；Type 里可能含嵌套花括号
 *  （`{Object<string, number>}`、`{{gold: number, ...}}`），必须按括号配平切，
 *  否则会把这三条漏掉（第一版正则 `[^}]*` 就漏了 settings/party/achievementManager）。 */
function propertyNamesOf(source) {
  const out = [];
  for (const m of source.matchAll(/@property\s+\{/g)) {
    let depth = 0;
    let i = m.index + m[0].length - 1;
    for (; i < source.length; i++) {
      if (source[i] === '{') depth++;
      else if (source[i] === '}') { depth--; if (depth === 0) break; }
    }
    const rest = source.slice(i + 1).match(/^\s+(\w+)/);
    if (rest) out.push(rest[1]);
  }
  return out;
}
const declaredProps = propertyNamesOf(dtoSource);
const saveDataBlock = dtoSource.slice(dtoSource.indexOf('@typedef {Object} SaveData'));
const saveDataProps = propertyNamesOf(saveDataBlock);

// -------------------------------------------------- 报告
const setOf = (arr) => new Set(arr);
const diff = (a, b) => [...a].filter((x) => !b.has(x));

const declared = setOf(SAVE_TOP_LEVEL_KEYS);
const fixtureSet = setOf(fixtureKeys);
const initSet = setOf(initializedBranch ? initializedBranch.keys : []);
const blankSet = setOf(blankBranch ? blankBranch.keys : []);

console.log('存档 DTO schema 比对：');
console.log(`  ① save-dto.js 声明      ${declared.size} 键`);
console.log(`  ② 真实原版 fixture      ${fixtureSet.size} 键`);
console.log(`  ③ createSaveState 已初始化 ${initSet.size} 键（game-save.js:${initializedBranch?.line}）`);
console.log(`  ④ createSaveState 未初始化 ${blankSet.size} 键（game-save.js:${blankBranch?.line}）`);

const rows = [
  ['① 声明 有、② fixture 无', diff(declared, fixtureSet)],
  ['② fixture 有、① 声明 无', diff(fixtureSet, declared)],
  ['① 声明 有、③ 序列化器无', diff(declared, initSet)],
  ['③ 序列化器有、① 声明 无', diff(initSet, declared)],
  ['② fixture 有、③ 序列化器无', diff(fixtureSet, initSet)],
  ['③ 序列化器有、② fixture 无', diff(initSet, fixtureSet)],
  ['④ 未初始化档 有、① 声明 无', diff(blankSet, declared)],
  // 空白档形态有自己的声明常量（SaveDataUninitialized 的运行时对应物）。
  // 反向破坏实测（2026-09-27）：给空白分支加一个 declared 里也有的键（如 turnNumber），
  // 上面"④ ⊆ ①"的检查与 tsc 的联合类型多余属性规则**都**不会红——审计曾因此假绿。
  // 故空白分支必须与 SAVE_BLANK_TOP_LEVEL_KEYS 逐键相等（双向）。
  ['④ 未初始化档 有、⑤ 空白声明 无', diff(blankSet, setOf(SAVE_BLANK_TOP_LEVEL_KEYS))],
  ['⑤ 空白声明 有、④ 未初始化档 无', diff(setOf(SAVE_BLANK_TOP_LEVEL_KEYS), blankSet)],
];
let mismatch = 0;
for (const [label, items] of rows) {
  if (!items.length) { console.log(`  ✓ ${label}：无`); continue; }
  mismatch++;
  console.log(`  ✗ ${label}：${items.join(', ')}`);
}

// 键序（存档 JSON 键顺序也是外部契约的一部分：JSON.stringify 保序，差分靠 deepEqual 不看序，
// 但顺序变化会让"逐字节相同"的落盘文本变化——这里只报告，不判定）
const orderEqual = JSON.stringify(fixtureKeys) === JSON.stringify(initializedBranch?.keys ?? []);
console.log(`  · 键序：fixture 与序列化器${orderEqual ? '完全一致' : '不一致'}（仅报告，存档键序不属强契约）`);

// SaveData 的 @property 是否都在真实 fixture 里
const missingProps = saveDataProps.filter((k) => !fixtureSet.has(k));
if (missingProps.length) { mismatch++; console.log(`  ✗ SaveData 的 @property 在 fixture 里不存在：${missingProps.join(', ')}`); }
else console.log(`  ✓ SaveData 的 ${saveDataProps.length} 个 @property 全部存在于真实 fixture`);

// 嵌套 spot-check：SaveAdventurer / SavePotion / SaveScroll 的字段是否在 fixture 里真有
const spotCheck = (typeName, samplePath) => {
  const anchor = `@typedef {Object} ${typeName}`;
  const blockStart = dtoSource.indexOf(anchor);
  if (blockStart < 0) return;
  // 整个文件只有一段 JSDoc 注释，故按"下一个 @typedef"切块，而不是找 */
  const nextTypedef = dtoSource.indexOf('@typedef', blockStart + anchor.length);
  const block = dtoSource.slice(blockStart, nextTypedef < 0 ? undefined : nextTypedef);
  const props = propertyNamesOf(block);
  const sample = samplePath(fixture);
  if (!sample) { console.log(`  ~ ${typeName}：fixture 里没有样本，跳过`); return; }
  const missing = props.filter((k) => !(k in sample));
  const extra = Object.keys(sample).filter((k) => !props.includes(k));
  console.log(`  ${missing.length || extra.length ? '✗' : '✓'} ${typeName}：${props.length} 个声明字段` +
    (missing.length ? `；声明有而样本无：${missing.join(', ')}` : '') +
    (extra.length ? `；样本有而声明无：${extra.join(', ')}` : ''));
  if (missing.length || extra.length) mismatch++;
};
spotCheck('SaveAdventurer', (f) => f.adventurers?.[0]);
spotCheck('SavePotion', (f) => f.potionInventory?.[0]);
spotCheck('SaveScroll', (f) => f.scrollInventory?.[0]);
spotCheck('SaveAchievement', (f) => f.achievementManager?.achievements?.[0]);
spotCheck('SaveGameOptions', (f) => f.gameOptions);
spotCheck('SavePosition', (f) => f.adventurers?.[0]?.positionComponent);
spotCheck('SaveDungeonManagerState', (f) => f.dungeonManagerState);
spotCheck('SaveDungeonState', (f) => f.dungeonManagerState?.dungeonStates?.[0]);
spotCheck('SavePointManagerState', (f) => f.pointManagerState);
spotCheck('SavePointEventCount', (f) => f.pointManagerState?.pointsByType?.[0]);
spotCheck('SavePointUpgrade', (f) => f.pointManagerState?.pointUpgrades?.[0]);
spotCheck('SaveMonsterTypesState', (f) => f.monsterTypes);
spotCheck('SaveMonsterTypeState', (f) => f.monsterTypes?.monsterLevelStates?.[0]);
spotCheck('SaveMonsterTypeEntry', (f) => f.monsterTypes?.monsterLevelStates?.[0]?.monsterTypes?.[0]);

console.log(`\n结论：${mismatch === 0 ? '四种形态的顶层键完全一致，SaveData 可以直接当作契约接线。' : `有 ${mismatch} 项差异（见上），接线前必须先让 schema 与真实形态对齐。`}`);
process.exit(mismatch ? 1 : 0);
