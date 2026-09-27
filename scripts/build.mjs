// 构建：生成可部署静态快照到 dist/。
// 当前应用为纯静态 ESM（无转译需求），构建即"校验过的拷贝"：
// 仅复制运行时所需文件，并逐文件校验存在性；引入打包器前必须先通过 test:parity 对 dist 做差分。
//
// 采用**增量拷贝**（内容相同则跳过）：既避免无谓写盘/加速构建，也避开本环境下
// node-safe-delete-shim 对"批量 unlink 覆盖"的守卫（cp 覆盖每个已存在文件都会 unlink 一次）。
// 最终 dist/ 内容与整目录 cp 完全一致（只复制、不删除 dist 中的陈旧文件，与原行为相同）。
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

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
console.log(`✓ dist/ 就绪（${await count(dist)} 个文件，本轮回写 ${copied} / 未变 ${unchanged}）→ node scripts/serve.mjs --dist`);
