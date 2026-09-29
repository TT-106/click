// 只读：检测"声明点不支配后续读取"的绑定形状 —— 即 R27 pathfinding 实证的静默拆刀危险。
//   若一个绑定的声明位于 if/else/循环/try 的分支块内，而它在该块之外还有更晚的出现，
//   那么走另一条分支时这个名字可能是 undefined。
// 用法：node scripts/check-decl-domination.mjs <目录或文件...>
// 报告口径与 check-rename-dataflow 一致：拿 HEAD 与工作树各跑一遍，**只看计数有没有增加**。
import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule.default ?? traverseModule;
const BRANCH = new Set(['IfStatement', 'ForStatement', 'ForInStatement', 'ForOfStatement', 'WhileStatement', 'DoWhileStatement', 'SwitchStatement', 'TryStatement', 'ConditionalExpression', 'LogicalExpression']);

function filesOf(target) {
  const out = [];
  const st = fs.statSync(target);
  if (st.isDirectory()) {
    (function walk(d) {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (e.name.endsWith('.js')) out.push(p);
      }
    })(target);
  } else if (target.endsWith('.js')) out.push(target);
  return out;
}

function branchDepth(p) {
  // 返回"进入分支块"的层数（只在真正决定执行与否的块里计数）
  let n = 0;
  let cur = p.parentPath;
  while (cur) {
    if (BRANCH.has(cur.node.type) && cur.key !== 'test' && cur.key !== 'discriminant') n++;
    cur = cur.parentPath;
  }
  return n;
}

function analyze(source, label) {
  let ast;
  try { ast = parse(source, { sourceType: 'module' }); } catch { return { label, count: -1, sites: [] }; }
  const sites = [];
  const seen = new Set();
  traverse(ast, {
    Scope(p) {
      for (const [name, b] of Object.entries(p.scope.bindings)) {
        if (seen.has(b.identifier.start)) continue;
        if (b.kind === 'param' || b.kind === 'module' || b.kind === 'function') continue;
        const decl = b.path;
        const declBranchDepth = branchDepth(decl);
        if (declBranchDepth === 0) continue;             // 函数体顶层，天然支配
        const later = [];
        for (const rp of b.referencePaths) {
          if (rp.node.start <= b.identifier.start) continue;
          if (branchDepth(rp) < declBranchDepth) later.push(rp.node.start);   // 块外的更晚使用
        }
        for (const v of b.constantViolations) {
          if (v.node.start <= b.identifier.start) continue;
          if (branchDepth(v) < declBranchDepth) later.push(v.node.start);
        }
        if (later.length) {
          seen.add(b.identifier.start);
          sites.push({ name, line: b.identifier.loc ? b.identifier.loc.start.line : 0, outside: later.length });
        }
      }
    },
  });
  return { label, count: sites.length, sites };
}

const targets = process.argv.slice(2);
if (!targets.length) { console.error('用法: node scripts/check-decl-domination.mjs <目录或文件...>'); process.exit(2); }
let total = 0;
for (const t of targets) {
  for (const f of filesOf(t)) {
    const r = analyze(fs.readFileSync(f, 'utf8'), f.split(path.sep).join('/'));
    if (r.count > 0) {
      total += r.count;
      console.log(`  ${String(r.count).padStart(2)}  ${r.label.replace('src/engine/modules/', '')}  ${r.sites.slice(0, 6).map((s) => `${s.name}@${s.line}(外${s.outside})`).join(' ')}`);
    }
  }
}
console.log(`声明不支配型绑定合计 ${total} 处`);
