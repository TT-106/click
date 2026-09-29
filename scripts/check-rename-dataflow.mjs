// 只读校验：拆分改名后的两类数据流事故
//  A. 读出现在任何写之前（段首不是赋值 → 读到 undefined）
//  B. 自引用写（var y = y.foo / y = y.bar）——第一次写就依赖自己 = 拆分没修右值
import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule.default ?? traverseModule;
const FILE = path.resolve(process.cwd(), process.argv[2]);
const src = fs.readFileSync(FILE, 'utf8');
const lineOf = (p) => src.slice(0, p).split('\n').length;
const ast = parse(src, { sourceType: 'module' });
let a = 0, b = 0;

traverse(ast, {
  Scope(path) {
    for (const [name, binding] of Object.entries(path.scope.bindings)) {
      if (binding.kind === 'param' || binding.kind === 'function' || binding.kind === 'module') continue;
      const items = [];
      const decl = binding.path.node;
      for (const rp of binding.referencePaths) if (rp.node.type === 'Identifier') items.push({ pos: rp.node.start, write: false });
      if (decl.type === 'VariableDeclarator' && decl.init) items.push({ pos: binding.identifier.start, write: true, rhsStart: decl.init.start, rhsEnd: decl.init.end });
      else if (decl.type !== 'VariableDeclarator') items.push({ pos: binding.identifier.start, write: true });
      for (const v of binding.constantViolations) {
        const n = v.node;
        if (n.type === 'AssignmentExpression') items.push({ pos: n.left.start, write: true, rhsStart: n.right.start, rhsEnd: n.right.end });
        else if (n.type === 'UpdateExpression') items.push({ pos: n.argument.start, write: true });
        else if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier' && n.init) items.push({ pos: n.id.start, write: true, rhsStart: n.init.start, rhsEnd: n.init.end });
        else if (n.type === 'VariableDeclarator') { /* 无初值的 var 声明：既非读也非写 */ }
      }
      items.sort((x, y) => x.pos - y.pos);
      let seenWrite = false;
      for (const it of items) {
        if (!it.write && !seenWrite) { console.log(`A 读在任何写之前：${name} @${lineOf(it.pos)}`); a++; }
        if (it.write) {
          if (it.rhsStart >= 0) {
            const inner = items.filter((x) => x.pos > it.pos && x.pos < it.rhsEnd && !x.write);
            if (inner.length) { console.log(`B 自引用写：${name} @${lineOf(it.pos)} 右值读到自己`); b++; }
          }
          seenWrite = true;
        }
      }
    }
  },
});
function hasInit(binding) {
  const v = binding.path.node;
  return v.type === 'VariableDeclarator' ? !!v.init : v.type === 'FunctionDeclaration' || v.type === 'ClassDeclaration';
}
console.log(`数据流检查：先读后写 ${a} 处；自引用写 ${b} 处`);
process.exit(a + b === 0 ? 0 : 1);
