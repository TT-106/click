// 功能面完整性与外部契约取证（只读，可复跑）：
//   node scripts/audit-feature-surface.mjs
//  A. 两份原版 JS 是否只是本地化差异（比较属性名集合 / 数值字面量序列，而非文案字符串）。
//  B. 原版 index.html 的 id 在产品里到底是"动态生成"还是"真缺失"——
//     带尾标的模板 id（xxx0..xxx4）要按前缀匹配，否则会把拼接出来的 id 误判成缺失。
//  C. c2c.user.js（外部 userscript 契约）引用的 id/class，我们的产品是否全部提供。
import fs from 'node:fs';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule.default ?? traverseModule;

function shapeOf(file) {
  const src = fs.readFileSync(file, 'utf8');
  const props = new Set();
  const nums = [];
  let funcs = 0;
  const ast = parse(src, { sourceType: 'script', errorRecovery: true });
  traverse(ast, {
    MemberExpression(p) {
      const pr = p.node.property;
      if (!p.node.computed && pr.type === 'Identifier') props.add(pr.name);
    },
    ObjectProperty(p) {
      const k = p.node.key;
      if (k.type === 'Identifier') props.add(k.name);
      else if (k.type === 'StringLiteral') props.add('S:' + k.value);
    },
    NumericLiteral(p) { nums.push(p.node.value); },
    'FunctionDeclaration|FunctionExpression|ArrowFunctionExpression'() { funcs++; },
  });
  return { props, nums, funcs };
}

console.log('=== A. 结构形态对比（属性名集合 + 数值字面量序列，避开文案差异）===');
const a = shapeOf('archive/original/c2.js');
const b = shapeOf('archive/original/c2-ver=20150918.js');
console.log(`  c2.js              属性名 ${a.props.size}，数值字面量 ${a.nums.length}，函数 ${a.funcs}`);
console.log(`  c2-ver=20150918.js 属性名 ${b.props.size}，数值字面量 ${b.nums.length}，函数 ${b.funcs}`);
console.log(`  数值字面量序列完全相同：${a.nums.length === b.nums.length && a.nums.every((v, i) => v === b.nums[i])}`);
const onlyBProps = [...b.props].filter((p) => !a.props.has(p));
const onlyAProps = [...a.props].filter((p) => !b.props.has(p));
console.log(`  属性名差异：仅 ver 有 ${onlyBProps.length} 个，仅 c2 有 ${onlyAProps.length} 个`);
console.log(`  前 20 个仅 ver 的属性名：${onlyBProps.slice(0, 20).join(', ') || '（无）'}`);
console.log(`  前 20 个仅 c2 的属性名：${onlyAProps.slice(0, 20).join(', ') || '（无）'}`);

console.log('\n=== B. 原版 id 的下落（模板 id 按前缀匹配）===');
const origHtml = fs.readFileSync('archive/original/index.html', 'utf8');
const ids = [...new Set([...origHtml.matchAll(/id="([^"]+)"/g)].map((m) => m[1]))];
function readAll(dir) {
  let out = '';
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) out += readAll(p);
    else if (e.name.endsWith('.js')) out += fs.readFileSync(p, 'utf8') + '\n';
  }
  return out;
}
const srcAll = readAll('src');
const ourHtml = fs.readFileSync('index.html', 'utf8');
const buckets = { static: 0, exact: 0, templated: 0, missing: [] };
for (const id of ids) {
  if (new RegExp(`id="${id}"`).test(ourHtml)) buckets.static++;
  else if (srcAll.includes(`"${id}"`) || srcAll.includes(`'${id}'`) || srcAll.includes('`' + id + '`')) buckets.exact++;
  else {
    const prefix = id.replace(/\d+$/, '');
    // 前缀在 src 里以 "prefix" / 'prefix' / `prefix` 出现，或作为拼接的前半（"prefix" + …）
    const esc = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp('[\'"`]' + esc + '[\'"`]');
    const reConcat = new RegExp('[\'"`]' + esc + '[\'"`]\\s*\\+');
    const hit = prefix !== id && (re.test(srcAll) || reConcat.test(srcAll));
    if (hit) buckets.templated++;
    else buckets.missing.push(id);
  }
}
console.log(`  原版 ${ids.length} 个 id：静态页 ${buckets.static}，src 精确字符串 ${buckets.exact}，src 前缀拼接 ${buckets.templated}，仍未找到 ${buckets.missing.length}`);
for (const id of buckets.missing) console.log(`     仍未找到: ${id}`);

console.log('\n=== C. c2c.user.js 外部契约 ===');
const user = fs.readFileSync('archive/original/c2c.user.js', 'utf8');
const userIds = [...new Set([...user.matchAll(/getElementById\(\s*['"]([^'"]+)['"]\s*\)/g)].map((m) => m[1]))];
const userCls = [...new Set([...user.matchAll(/getElementsByClassName\(\s*['"]([^'"]+)['"]/g)].map((m) => m[1]))];
const userSel = [...new Set([...user.matchAll(/querySelector(?:All)?\(\s*['"]([^'"]+)['"]/g)].map((m) => m[1]))];
const probe = (v) => ourHtml.includes(v) || srcAll.includes(`"${v}"`) || srcAll.includes(`'${v}'`) || srcAll.includes('`' + v + '`') || srcAll.includes(v);
console.log(`  userscript 引用：id ${userIds.length} 个、class ${userCls.length} 个、选择器 ${userSel.length} 个`);
const goneIds = userIds.filter((v) => !probe(v));
const goneCls = userCls.filter((v) => !probe(v));
const goneSel = userSel.filter((v) => !probe(v));
console.log(`  产品里找不到的：id ${goneIds.length} ${goneIds.join(', ') || '（无）'}`);
console.log(`                    class ${goneCls.length} ${goneCls.join(', ') || '（无）'}`);
console.log(`                    选择器 ${goneSel.length} ${goneSel.join(' | ') || '（无）'}`);
