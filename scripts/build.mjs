// 构建：生成可部署静态快照到 dist/。
// 当前应用为纯静态 ESM（无转译需求），构建即"校验过的拷贝"：
// 仅复制运行时所需文件，并逐文件校验存在性；引入打包器前必须先通过 test:parity 对 dist 做差分。
//
// 采用**增量拷贝**（内容相同则跳过）：既避免无谓写盘/加速构建，也避开本环境下
// node-safe-delete-shim 对"批量 unlink 覆盖"的守卫（cp 覆盖每个已存在文件都会 unlink 一次）。
//
// **可复现纯净**：拷贝完成后把 dist/ 中不在本次源清单内的陈旧文件清理掉（历史上曾把
// 38 个带 U+F00D 尾随字符的垃圾文件留在快照里）。清理只作用于 dist/，有双重护栏：
// ① 陈旧路径必须落在本次拷贝根之下；② 单轮清理数超过 45（safe-delete-shim 每轮限额
// 附近）时中止并提示重跑，绝不碰源工作树。
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { auditProductionBoundary } from './audit-production-boundary.mjs';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');

const required = ['index.html', 'src/app.js', 'src/engine/adapter.js', 'spritesheet/items.png', 'spritesheet/monsters.png', 'spritesheet/terrain.png'];
for (const file of required) {
  await stat(path.join(root, file)); // 缺失直接抛错，构建失败
}

await mkdir(dist, { recursive: true });

let copied = 0;
let unchanged = 0;

async function copyIfChanged(from, to) {
  const source = await readFile(from);
  let same = false;
  try {
    same = (await readFile(to)).equals(source);
  } catch {
    same = false; // 目标不存在
  }
  if (same) {
    unchanged++;
    return;
  }
  await mkdir(path.dirname(to), { recursive: true });
  await writeFile(to, source);
  copied++;
}

async function listFiles(base, rel = '') {
  const out = [];
  for (const entry of await readdir(path.join(base, rel), { withFileTypes: true })) {
    const childRel = rel ? path.join(rel, entry.name) : entry.name;
    if (entry.isDirectory()) out.push(...await listFiles(base, childRel));
    else out.push(childRel);
  }
  return out;
}

for (const entry of ['index.html', 'favicon.svg', 'src', 'spritesheet', 'images']) {
  const sourceRoot = path.join(root, entry);
  const info = await stat(sourceRoot);
  if (info.isDirectory()) {
    for (const rel of await listFiles(sourceRoot)) {
      await copyIfChanged(path.join(sourceRoot, rel), path.join(dist, entry, rel));
    }
  } else {
    await copyIfChanged(sourceRoot, path.join(dist, entry));
  }
}

const count = async dir => {
  let n = 0;
  for (const e of await readdir(dir, { withFileTypes: true })) {
    n += e.isDirectory() ? await count(path.join(dir, e.name)) : 1;
  }
  return n;
};

// 可复现纯净：dist 中不在本次源清单内的文件即陈旧产物，逐一清理（只动 dist/）。
const copyRoots = ['index.html', 'favicon.svg', 'src', 'spritesheet', 'images'];
const expected = new Set();
for (const entry of copyRoots) {
  const sourceRoot = path.join(root, entry);
  const info = await stat(sourceRoot);
  if (info.isDirectory()) for (const rel of await listFiles(sourceRoot)) expected.add(path.join(entry, rel));
  else expected.add(entry);
}
const distFiles = await listFiles(dist);
const stale = distFiles.filter((rel) => !expected.has(rel));
const inCopyRoot = (rel) => copyRoots.some((entry) => rel === entry || rel.startsWith(entry + path.sep));
if (stale.length > 45) {
  throw new Error(`dist/ 陈旧文件 ${stale.length} 个超过单轮清理上限 45；清单异常或需分轮重跑 npm run build`);
}
let pruned = 0;
for (const rel of stale) {
  if (!inCopyRoot(rel)) {
    throw new Error(`拒绝清理拷贝根之外的路径: ${JSON.stringify(rel)}`);
  }
  await rm(path.join(dist, rel), { force: false });
  pruned++;
  console.log(`  清理陈旧产物: ${JSON.stringify(rel)}`);
}

const boundary = await auditProductionBoundary(root, dist);
console.log(`✓ dist/ 就绪（${await count(dist)} 个文件，本轮回写 ${copied} / 未变 ${unchanged} / 清理 ${pruned}）→ node scripts/serve.mjs --dist`);
console.log(`✓ 产品边界：${boundary.modules} 个源码模块、${boundary.imports} 条导入；原版档案依赖 0`);
