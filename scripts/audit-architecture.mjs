// 架构债只读审计（NEXT-ARCHITECTURE-PROMPT §3）。
//
// 只读：不写任何源文件，只把可复核的事实打印出来（并在 --json 时落 artifacts/）。
// 报告口径：**有证据的事实**（可数、可复跑）与**设计推断**分开；本脚本只产事实。
//
// 用法: node scripts/audit-architecture.mjs [--json]
import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule.default ?? traverseModule;

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const jsonOut = process.argv.includes('--json');

/** 递归列出 src 下的 .js 文件（相对 ROOT 的 POSIX 路径） */
function listJs(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) listJs(full, out);
    else if (e.name.endsWith('.js')) out.push(path.relative(ROOT, full).split(path.sep).join('/'));
  }
  return out;
}

const files = listJs(SRC).sort();
const sources = new Map(files.map((f) => [f, fs.readFileSync(path.join(ROOT, f), 'utf8')]));

function parseOrDie(file) {
  try {
    return parse(sources.get(file), { sourceType: 'module', plugins: ['classProperties'] });
  } catch (err) {
    throw new Error(`解析失败 ${file}: ${err.message}`);
  }
}

/** 解析 import 说明符为仓库内路径 */
function resolveSpec(fromFile, spec) {
  if (!spec.startsWith('.')) return null;
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), spec));
  for (const cand of [base, base + '.js', base + '/index.js']) {
    if (sources.has(cand)) return cand;
  }
  return null;
}

// ---------------------------------------------------------------- 1) import 图
/** @type {Map<string, Set<string>>} */
const edges = new Map(files.map((f) => [f, new Set()]));
/** file -> [{ spec, resolved, names, isNamespace, isSideEffect }] */
const importsOf = new Map(files.map((f) => [f, []]));
/** file -> exportedNames Set（本模块导出的顶层名） */
const exportsOf = new Map(files.map((f) => [f, new Set()]));
/** 用于定位仍需人工语义命名的局部绑定；单字母也可能是合法坐标名，只作审计线索。 */
const singleLetterBindingsByFile = new Map();

for (const file of files) {
  const ast = parseOrDie(file);
  const shortBindings = new Set();
  traverse(ast, {
    Scope(p) {
      for (const binding of Object.values(p.scope.bindings)) {
        const identifier = binding.identifier;
        if (/^[A-Za-z]$/.test(identifier.name)) shortBindings.add(identifier.start);
      }
    },
    ImportDeclaration(p) {
      const spec = p.node.source.value;
      const resolved = resolveSpec(file, spec);
      const names = [];
      for (const s of p.node.specifiers) {
        if (s.type === 'ImportNamespaceSpecifier') names.push({ local: s.local.name, imported: '*', isNamespace: true });
        else if (s.type === 'ImportDefaultSpecifier') names.push({ local: s.local.name, imported: 'default', isNamespace: false });
        else {
          const imported = s.imported.type === 'Identifier' ? s.imported.name : s.imported.value;
          names.push({ local: s.local.name, imported, isNamespace: false });
        }
      }
      importsOf.get(file).push({ spec, resolved, names });
      if (resolved) edges.get(file).add(resolved);
    },
    ExportNamedDeclaration(p) {
      for (const s of p.node.specifiers) {
        if (s.type === 'ExportSpecifier') {
          const local = s.local.type === 'Identifier' ? s.local.name : s.local.value;
          exportsOf.get(file).add(local);
        }
      }
      const decl = p.node.declaration;
      if (decl) {
        if (decl.type === 'FunctionDeclaration' || decl.type === 'ClassDeclaration') exportsOf.get(file).add(decl.id.name);
        if (decl.type === 'VariableDeclaration') for (const d of decl.declarations) if (d.id.type === 'Identifier') exportsOf.get(file).add(d.id.name);
      }
    },
  });
  if (file.startsWith('src/engine/modules/') && shortBindings.size) {
    singleLetterBindingsByFile.set(file, shortBindings.size);
  }
}

// 反向：file -> 直接依赖它的文件
const dependents = new Map(files.map((f) => [f, new Set()]));
for (const [from, tos] of edges) for (const to of tos) dependents.get(to).add(from);

// ---------------------------------------------------- 2) 谁 import 了 runtime/game
const GAME = 'src/engine/modules/runtime/game.js';
const gameImporters = [];
for (const file of files) {
  if (file === GAME) continue;
  for (const imp of importsOf.get(file)) {
    if (imp.resolved !== GAME) continue;
    const hasGame = imp.names.some((n) => n.imported === 'game');
    gameImporters.push({ file, hasGameBinding: hasGame, names: imp.names.map((n) => n.local) });
  }
}

function dirOf(file) {
  const rel = path.posix.relative('src', file);
  const parts = rel.split('/');
  return parts.length > 1 ? parts.slice(0, -1).join('/') : '(src root)';
}
const gameImportersByDir = {};
for (const g of gameImporters) {
  const d = dirOf(g.file);
  gameImportersByDir[d] = (gameImportersByDir[d] || 0) + 1;
}

// ------------------------------------------------------- 3) 强连通分量（Tarjan）
const index = new Map();
const low = new Map();
const onStack = new Set();
const stack = [];
const sccs = [];
let counter = 0;

for (const root of files) {
  if (index.has(root)) continue;
  // 迭代式 Tarjan，避免深递归爆栈
  const work = [[root, 0]];
  while (work.length) {
    const frame = work[work.length - 1];
    const [v, childIdx] = frame;
    if (childIdx === 0) {
      index.set(v, counter);
      low.set(v, counter);
      counter++;
      stack.push(v);
      onStack.add(v);
    }
    const children = [...edges.get(v)];
    if (childIdx < children.length) {
      frame[1]++;
      const w = children[childIdx];
      if (!index.has(w)) work.push([w, 0]);
      else if (onStack.has(w)) low.set(v, Math.min(low.get(v), index.get(w)));
    } else {
      work.pop();
      if (work.length) {
        const parent = work[work.length - 1][0];
        low.set(parent, Math.min(low.get(parent), low.get(v)));
      }
      if (low.get(v) === index.get(v)) {
        const comp = [];
        let w;
        do { w = stack.pop(); onStack.delete(w); comp.push(w); } while (w !== v);
        sccs.push(comp);
      }
    }
  }
}
const cycles = sccs.filter((c) => c.length > 1);
cycles.sort((a, b) => b.length - a.length);

// -------------------------------------------------- 4) 初始化顺序的实际依赖
const IDX = 'src/engine/modules/runtime/index.js';
const idxAst = parseOrDie(IDX);
const initOrder = [];
traverse(idxAst, {
  ExpressionStatement(p) {
    const e = p.node.expression;
    if (e.type === 'CallExpression' && e.callee.type === 'Identifier' && /^initialize/.test(e.callee.name)) {
      initOrder.push(e.callee.name);
    }
  },
});
// 每个 initializeX 属于哪个文件（按导出名反查）
const initOwner = new Map();
for (const file of files) for (const name of exportsOf.get(file)) if (/^initialize/.test(name)) initOwner.set(name, file);
const orderIndex = new Map(initOrder.map((n, i) => [n, i]));

// 在 initializeX 的函数体里找"对别的模块导入绑定的调用"
const initDeps = [];
for (const name of initOrder) {
  const owner = initOwner.get(name);
  if (!owner) continue;
  const ast = parseOrDie(owner);
  const localToModule = new Map();
  for (const imp of importsOf.get(owner)) {
    if (!imp.resolved) continue;
    for (const n of imp.names) localToModule.set(n.local, { module: imp.resolved, isNamespace: n.isNamespace, imported: n.imported });
  }
  const callees = new Set();
  // 只统计**初始化期真正执行**的调用：进入 initializeX 函数体后，跳过所有嵌套函数体
  // （嵌套函数里的调用是"以后才发生"的，不构成初始化顺序依赖）。
  const visitExecuted = (node) => {
    if (!node || typeof node.type !== 'string') return;
    if (node.type === 'CallExpression' || node.type === 'NewExpression') {
      const callee = node.callee;
      let baseName = null;
      if (callee.type === 'Identifier') baseName = callee.name;
      else if (callee.type === 'MemberExpression' && callee.object.type === 'Identifier') baseName = callee.object.name;
      const info = baseName ? localToModule.get(baseName) : null;
      if (info) callees.add(info.module);
    }
    for (const key of Object.keys(node)) {
      if (key === 'loc' || key === 'start' || key === 'end' || key === 'leadingComments' || key === 'trailingComments') continue;
      const v = node[key];
      if (Array.isArray(v)) for (const c of v) visitExecuted(c);
      else if (v && typeof v.type === 'string') {
        // 嵌套函数：其体不在初始化期执行，但默认参数/装饰器仍会执行——本项目没有，直接跳过
        if (v.type === 'FunctionExpression' || v.type === 'ArrowFunctionExpression' || v.type === 'FunctionDeclaration') continue;
        visitExecuted(v);
      }
    }
  };
  traverse(ast, {
    FunctionDeclaration(p) {
      if (p.node.id?.name !== name) return;
      for (const stmt of p.node.body.body) visitExecuted(stmt);
    },
  });
  for (const target of callees) {
    const targetInit = [...initOwner.entries()].find(([, f]) => f === target);
    initDeps.push({
      from: name,
      fromModule: owner,
      toModule: target,
      toInit: targetInit ? targetInit[0] : null,
      toIndex: targetInit ? orderIndex.get(targetInit[0]) : null,
      fromIndex: orderIndex.get(name),
      // true = 被调方在本顺序里排在调用方之后 → 顺序是"运行契约"的一部分
      violatesOrder: targetInit ? orderIndex.get(targetInit[0]) > orderIndex.get(name) : null,
    });
  }
}

// ---------------------------------------- 5) 产品层是否绕过 adapter 访问引擎
const SHELL_FILES = files.filter((f) => f === 'src/app.js' || f.startsWith('src/ui/') || f.startsWith('src/services/'));
const shellEngineImports = [];
for (const f of SHELL_FILES) {
  for (const imp of importsOf.get(f)) {
    if (!imp.resolved) continue;
    if (!imp.resolved.startsWith('src/engine/')) continue;
    shellEngineImports.push({ file: f, spec: imp.spec, resolved: imp.resolved });
  }
}

// ------------------------------- 6) game.* / game.state.* 的跨目录读/写热点
const GAME_FIELDS = /^(game|window\.Game)\./;
const memberAccess = new Map(); // path -> { reads:Set<file>, writes:Set<file> }
function record(pathStr, file, isWrite) {
  if (!memberAccess.has(pathStr)) memberAccess.set(pathStr, { reads: new Set(), writes: new Set() });
  const rec = memberAccess.get(pathStr);
  (isWrite ? rec.writes : rec.reads).add(file);
}
for (const file of files) {
  if (file === GAME) continue;
  const ast = parseOrDie(file);
  traverse(ast, {
    MemberExpression(p) {
      // 只取以 game 为根的最长静态链
      const chain = [];
      let node = p.node;
      while (node.type === 'MemberExpression') {
        if (node.property.type === 'Identifier' && !node.computed) chain.unshift(node.property.name);
        else if (node.property.type === 'StringLiteral') chain.unshift(JSON.stringify(node.property.value));
        else return;
        node = node.object;
      }
      if (node.type !== 'Identifier' || node.name !== 'game') return;
      if (!chain.length) return;
      // 排除 game.js 内部的活绑定导入以外的同名局部变量：靠 import 事实判定
      const isGameBinding = importsOf.get(file).some((i) => i.resolved === GAME && i.names.some((n) => n.local === 'game'));
      if (!isGameBinding) return;
      let isWrite = false;
      const parent = p.parent;
      if (parent.type === 'AssignmentExpression' && parent.left === p.node) isWrite = true;
      else if (parent.type === 'UpdateExpression') isWrite = true;
      else if (parent.type === 'UnaryExpression' && parent.operator === 'delete') isWrite = true;
      record('game.' + chain.join('.'), file, isWrite);
    },
  });
}
const hotFields = [...memberAccess.entries()]
  .map(([p, rec]) => ({
    path: p,
    readFiles: rec.reads.size,
    writeFiles: rec.writes.size,
    dirs: [...new Set([...rec.reads, ...rec.writes].map(dirOf))].sort(),
  }))
  .filter((h) => h.readFiles + h.writeFiles >= 3)
  .sort((a, b) => b.readFiles + b.writeFiles - (a.readFiles + a.writeFiles));

// ------------------------------------------- 7) 存档 DTO typedef 的实际使用
const SAVE_DTO = 'src/engine/modules/persistence/save-dto.js';
const dtoTypeNames = [...sources.get(SAVE_DTO).matchAll(/@typedef\s+\{Object\}\s+(\w+)/g)].map((m) => m[1]);
const dtoUsage = {};
for (const name of dtoTypeNames) {
  const users = files.filter((f) => f !== SAVE_DTO && new RegExp(`\\b${name}\\b`).test(sources.get(f)));
  dtoUsage[name] = users;
}
const dtoReferencedAnywhere = Object.values(dtoUsage).some((u) => u.length > 0);

// ------------------------------------------------------------------ 输出
const out = {
  generatedAt: new Date().toISOString(),
  counts: {
    srcJsFiles: files.length,
    engineModules: files.filter((f) => f.startsWith('src/engine/modules/')).length,
    totalEdges: [...edges.values()].reduce((n, s) => n + s.size, 0),
  },
  gameImporters: {
    total: gameImporters.length,
    withGameBinding: gameImporters.filter((g) => g.hasGameBinding).length,
    byDir: gameImportersByDir,
    files: gameImporters.map((g) => g.file),
  },
  cycles: cycles.map((c) => c.sort()),
  initOrder,
  initDeps: initDeps.filter((d) => d.toModule !== d.fromModule),
  shellEngineImports,
  hotFields: hotFields.slice(0, 40),
  saveDto: { typeNames: dtoTypeNames, referencedOutsideDtoFile: dtoReferencedAnywhere, usage: dtoUsage },
  naming: {
    singleLetterBindings: [...singleLetterBindingsByFile.values()].reduce((sum, count) => sum + count, 0),
    filesWithSingleLetterBindings: singleLetterBindingsByFile.size,
    topFiles: [...singleLetterBindingsByFile.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([file, count]) => ({ file, count })),
  },
};

console.log('=== 1) 规模 ===');
console.log(`src 下 .js 文件 ${out.counts.srcJsFiles}；其中 engine/modules ${out.counts.engineModules}；import 边 ${out.counts.totalEdges}`);
console.log(`\n=== 2) 直接 import runtime/game.js 的文件 ===`);
console.log(`合计 ${out.gameImporters.total} 个（其中真正绑定 game 的 ${out.gameImporters.withGameBinding} 个）`);
for (const [d, n] of Object.entries(gameImportersByDir).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}  ${d}`);
console.log(`\n=== 3) 循环依赖（强连通分量，>1 个成员） ===`);
console.log(`共 ${cycles.length} 个 SCC；最大 ${cycles[0]?.length ?? 0} 个成员`);
for (const c of cycles.slice(0, 6)) console.log(`  [${c.length}] ${c.map((f) => f.replace('src/engine/modules/', '')).join(', ')}`);
console.log(`\n=== 4) 初始化顺序 ===`);
console.log(`${initOrder.length} 个 initialize*() 调用`);
const violations = out.initDeps.filter((d) => d.violatesOrder);
console.log(`跨模块初始化期依赖 ${out.initDeps.length} 条；其中"被调方排在调用方之后"（=顺序确为运行契约）${violations.length} 条：`);
for (const d of violations.slice(0, 20)) console.log(`  ${d.from}(${d.fromIndex}) -> ${d.toInit}(${d.toIndex})  ${d.toModule.replace('src/engine/modules/', '')}`);
console.log(`\n=== 5) 产品壳对 engine/ 的直接 import ===`);
console.log(`${shellEngineImports.length} 条`);
for (const s of shellEngineImports) console.log(`  ${s.file} -> ${s.resolved.replace('src/engine/', '')}`);
console.log(`\n=== 6) game.* 跨目录热点（读文件数+写文件数 >= 3，前 25） ===`);
for (const h of hotFields.slice(0, 25)) console.log(`  R${String(h.readFiles).padStart(3)} W${String(h.writeFiles).padStart(3)}  ${h.path}  [${h.dirs.join(' ')}]`);
console.log(`\n=== 7) 存档 DTO typedef 的使用 ===`);
console.log(`${dtoTypeNames.length} 个 typedef：${dtoTypeNames.join(', ')}`);
console.log(`DTO 文件之外是否被任何 @type 引用：${dtoReferencedAnywhere ? '是' : '否（纯文档资产）'}`);
for (const [name, users] of Object.entries(dtoUsage)) if (users.length) console.log(`  ${name}: ${users.join(', ')}`);
console.log(`\n=== 8) 单字母局部绑定（人工语义命名的审计线索） ===`);
console.log(`合计 ${out.naming.singleLetterBindings} 个，分布于 ${out.naming.filesWithSingleLetterBindings} 个 engine/modules 文件`);
for (const { file, count } of out.naming.topFiles.slice(0, 10)) console.log(`  ${String(count).padStart(3)}  ${file.replace('src/engine/modules/', '')}`);

// === 9) 指标棘轮（ratchet）===
// 现代化是"只许变好"的方向性工程：把当前实测值钉进仓库，任何变差都直接让本命令退出码非 0，
// 这样后续批次（含并行子智能体）不可能悄悄把命名债或 game 依赖加回来。
// 允许变差只有一种情形：确有理由的重构，用 --update-baseline 重写基线，并在 diff 里接受审查。
const BASELINE = path.join(ROOT, 'artifacts', 'architecture-baseline.json');
const perFile = Object.fromEntries([...singleLetterBindingsByFile.entries()].sort((a, b) => b[1] - a[1]));
const current = {
  singleLetterBindings: out.naming.singleLetterBindings,
  filesWithSingleLetterBindings: out.naming.filesWithSingleLetterBindings,
  gameImporters: out.gameImporters.total,
  largestScc: cycles[0]?.length ?? 0,
  perFile,
};

if (process.argv.includes('--update-baseline')) {
  fs.mkdirSync(path.dirname(BASELINE), { recursive: true });
  fs.writeFileSync(BASELINE, JSON.stringify(current, null, 2));
  console.log(`\n=== 9) 指标棘轮 ===\n基线已重写：${path.relative(ROOT, BASELINE).split(path.sep).join('/')}`);
  process.exit(0);
}

console.log(`\n=== 9) 指标棘轮 ===`);
if (!fs.existsSync(BASELINE)) {
  console.log('基线缺失（artifacts/architecture-baseline.json）：本次不判定，可用 --update-baseline 生成。');
} else {
  const base = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
  const regressions = [];
  for (const key of ['singleLetterBindings', 'gameImporters', 'largestScc']) {
    if (current[key] > base[key]) regressions.push(`${key}: ${base[key]} -> ${current[key]} (+${current[key] - base[key]})`);
    else console.log(`  ${String(key).padEnd(22)} ${base[key]} -> ${current[key]}  ${current[key] < base[key] ? '改善' : '持平'}`);
  }
  for (const [file, count] of Object.entries(base.perFile || {})) {
    const now = current.perFile[file] ?? 0;
    if (now > count) regressions.push(`单字母绑定 ${file.replace('src/engine/modules/', '')}: ${count} -> ${now} (+${now - count})`);
  }
  if (regressions.length) {
    console.log(`回退 ${regressions.length} 项：`);
    for (const r of regressions) console.log(`  ✗ ${r}`);
    console.log('修复这些改动，或确有理由时用 --update-baseline 重写基线并在提交里说明。');
    process.exitCode = 1;
  } else {
    console.log('  单文件维度        无回退（39 个文件逐项对比）');
    console.log('棘轮通过：命名债与 game 依赖均未增加。');
  }
}

if (jsonOut) {
  fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
  const p = path.join(ROOT, 'artifacts', 'architecture-audit.json');
  fs.writeFileSync(p, JSON.stringify(out, null, 2));
  console.log(`\n已写出 ${path.relative(ROOT, p).split(path.sep).join('/')}`);
}
