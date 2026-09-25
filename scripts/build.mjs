// 构建：生成可部署静态快照到 dist/。
// 当前应用为纯静态 ESM（无转译需求），构建即"校验过的拷贝"：
// 仅复制运行时所需文件，并逐文件校验存在性；引入打包器前必须先通过 test:parity 对 dist 做差分。
import { cp, mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');

const required = ['index.html', 'src/app.js', 'src/engine/adapter.js', 'spritesheet/items.png', 'spritesheet/monsters.png', 'spritesheet/terrain.png'];
for (const file of required) {
  await stat(path.join(root, file)); // 缺失直接抛错，构建失败
}

await mkdir(dist, { recursive: true });
for (const entry of ['index.html', 'favicon.svg', 'src', 'spritesheet', 'images']) {
  await cp(path.join(root, entry), path.join(dist, entry), { recursive: true });
}

const count = async dir => {
  let n = 0;
  for (const e of await readdir(dir, { withFileTypes: true })) {
    n += e.isDirectory() ? await count(path.join(dir, e.name)) : 1;
  }
  return n;
};
console.log(`✓ dist/ 就绪（${await count(dist)} 个文件）→ node scripts/serve.mjs --dist`);
