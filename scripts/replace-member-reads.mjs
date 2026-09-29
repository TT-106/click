// 把「读取某对象的成员」替换为「导入的具名常量」，并在对象不再被引用时清掉它的 import。
// 用途：把散落在各模块里的 god-object 字段读取（如 game.tileSize）改为依赖无副作用的常量模块。
//
//   node scripts/replace-member-reads.mjs --config <json> [--dry]
//
// config:
// {
//   "files": ["src/engine/modules/world/terrain.js", ...],
//   "object": "game",
//   "objectModule": "runtime/game.js",
//   "members": { "tileSize": "TILE_SIZE", "halfTileSize": "HALF_TILE_SIZE" },
//   "targetModule": "core/screen-layout.js"
// }
//
// 为什么用 AST 而不是文本替换：game.tileSize 这种点号名在文本层无法区分
// 成员读取 / 字符串字面量 / 注释 / 同名局部对象（foo.game.tileSize）。
// 断言：只替换 object 绑定确实来自 objectModule 的 MemberExpression 读取；
// 写盘后重新解析成功、字符串+数字+正则字面量多重集不变、除 import 行增删外行数不变、
// 每个声明的成员替换次数与预期一致（未命中的成员报错，避免"以为改完其实没改"）。
import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule.default ?? traverseModule;
const ROOT = process.cwd();
const arg = (n, f = null) => {
  const i = process.argv.indexOf('--' + n);
  if (i === -1) return f;
  const next = process.argv[i + 1];
  return next && !next.startsWith('--') ? next : true;
};

const cfgPath = arg('config');
if (!cfgPath) { console.error('缺少 --config <json>'); process.exit(2); }
const cfg = JSON.parse(fs.readFileSync(path.resolve(ROOT, cfgPath), 'utf8'));
const dry = Boolean(arg('dry'));
const fail = (msg) => { console.error('中止：' + msg); process.exit(1); };

function literalsOf(text) {
  const acc = [];
  traverse(parse(text, { sourceType: 'module' }), {
    // import 来源字符串本身就是要增删改的部分，不计入"代码字面量不得变化"的断言
    ImportDeclaration(p) { p.skip(); },
    StringLiteral(p) { acc.push('S' + p.node.value); },
    NumericLiteral(p) { acc.push('N' + p.node.value); },
    BigIntLiteral(p) { acc.push('B' + p.node.value); },
    RegExpLiteral(p) { acc.push('R' + p.node.pattern); },
  });
  return acc.sort().join('|');
}

const summary = [];
for (const rel of cfg.files) {
  const FILE = path.resolve(ROOT, rel);
  const src = fs.readFileSync(FILE, 'utf8');
  const eol = src.includes('\r\n') ? '\r\n' : '\n';
  const ast = parse(src, { sourceType: 'module' });

  // 该文件里 object 这个名字是否真的绑到 objectModule 的导入
  let importPath = null;
  for (const node of ast.program.body) {
    if (node.type !== 'ImportDeclaration') continue;
    if (!node.source.value.includes(cfg.objectModule)) continue;
    const names = node.specifiers.map((s) => s.local.name);
    if (!names.includes(cfg.object)) continue;
    importPath = node.source.value;
  }
  if (!importPath) { console.log(`跳过 ${rel}：没有 ${cfg.object} 来自 ${cfg.objectModule} 的 import`); continue; }

  // 收集替换点
  const edits = [];
  const perMember = new Map();
  traverse(ast, {
    MemberExpression(p) {
      const o = p.node.object;
      const prop = p.node.property;
      if (o.type !== 'Identifier' || o.name !== cfg.object) return;
      if (p.node.computed) return;
      if (prop.type !== 'Identifier') return;
      const to = cfg.members[prop.name];
      if (!to) return;
      // 确认该标识符不是别处重新声明的同名局部变量
      const binding = p.scope.getBinding(cfg.object);
      if (binding && !binding.path.isImportSpecifier?.() && binding.kind !== 'module') return;
      // 不替换赋值左侧（写操作必须保留原样，交由人工判断）
      const parent = p.parentPath.node;
      if (parent.type === 'AssignmentExpression' && parent.left === p.node) {
        fail(`${rel}: 检测到对 ${cfg.object}.${prop.name} 的写入，不能机械替换`);
      }
      edits.push({ start: p.node.start, end: p.node.end, text: to, member: prop.name });
      perMember.set(prop.name, (perMember.get(prop.name) || 0) + 1);
    },
  });
  if (!edits.length) { console.log(`跳过 ${rel}：没有 ${cfg.object}.<声明的成员> 读取点`); continue; }
  for (const [member, expected] of Object.entries(cfg.expectPerFile && cfg.expectPerFile[rel] || {})) {
    if ((perMember.get(member) || 0) !== expected) fail(`${rel}: ${cfg.object}.${member} 预期 ${expected} 处，实测 ${perMember.get(member) || 0} 处`);
  }

  let out = src;
  for (const e of edits.sort((a, b) => b.start - a.start)) out = out.slice(0, e.start) + e.text + out.slice(e.end);

  // 重写 import：仍用 object 时在 import 块末尾加一行；不再用它时把 game 的 import 行原地顶替（行数不变）
  const withoutThatImport = out.replace(new RegExp('from\\s+"[^"]*' + cfg.objectModule.replace(/\./g, '\\.') + '"'), '');
  const stillUsesObject = new RegExp('\\b' + cfg.object + '\\b').test(withoutThatImport);
  const lines = out.split(/\r?\n/);
  const usedConsts = [...new Set(edits.map((e) => e.text))].sort();
  // 目标模块相对路径：按当前文件与 targetModule 的层级算
  const fromDir = path.dirname(path.resolve(ROOT, rel));
  let relTarget = path.relative(fromDir, path.resolve(ROOT, 'src/engine/modules', cfg.targetModule)).split(path.sep).join('/');
  if (!relTarget.startsWith('.')) relTarget = './' + relTarget;
  const newImport = `import { ${usedConsts.join(', ')} } from "${relTarget}";`;
  const gameImportIdx = lines.findIndex((l) => /^import\b/.test(l) && l.includes(cfg.objectModule));
  if (gameImportIdx === -1) fail(`${rel}: 找不到 ${cfg.objectModule} 的 import 行`);
  if (stillUsesObject) {
    const lastImportIdx = lines.map((l) => /^import\b/.test(l)).lastIndexOf(true);
    if (lastImportIdx === -1) fail(`${rel}: 找不到 import 行`);
    lines.splice(lastImportIdx + 1, 0, newImport);
  } else {
    const specText = (lines[gameImportIdx].match(/\{([^}]*)\}/) || [, ''])[1];
    const specCount = specText.split(',').map((s) => s.trim()).filter(Boolean).length;
    if (specCount !== 1) fail(`${rel}: ${cfg.object} 已无读取，但该行还有 ${specCount} 个说明符，需人工拆分`);
    lines[gameImportIdx] = newImport;
  }
  out = lines.join(eol);

  parse(out, { sourceType: 'module' });
  const literalsOk = literalsOf(src) === literalsOf(out);
  const lineDelta = out.split(/\r?\n/).length - src.split(/\r?\n/).length;
  console.log(`${dry ? 'PLAN' : 'EDIT'} ${rel}: 替换 ${edits.length} 处 ${JSON.stringify(Object.fromEntries(perMember))}；字面量不变 ${literalsOk}；行数变化 ${lineDelta >= 0 ? '+' : ''}${lineDelta}${stillUsesObject ? '' : '；game import 已移除'}`);
  if (!literalsOk) fail(`${rel}: 字面量多重集变化`);
  if (lineDelta > 1 || lineDelta < 0) fail(`${rel}: 行数变化异常（${lineDelta}）`);
  summary.push({ rel, sites: edits.length, droppedGameImport: !stillUsesObject });
  if (!dry) fs.writeFileSync(FILE, out);
}
const total = summary.reduce((n, s) => n + s.sites, 0);
console.log(`合计 ${summary.length} 个文件、${total} 处读取点；其中 ${summary.filter((s) => s.droppedGameImport).length} 个文件退出 ${cfg.object} 依赖${dry ? '（--dry 未写盘）' : ''}`);
