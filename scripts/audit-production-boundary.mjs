// 检查产品入口、源码模块和构建产物没有依赖原版反编译文件。
// 原版档案仍可作为差分测试的只读 oracle；它不进入产品模块图。
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule.default ?? traverseModule;

async function listFiles(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(full));
    else files.push(full);
  }
  return files;
}

async function existingModule(base) {
  for (const candidate of [base, `${base}.js`, path.join(base, 'index.js')]) {
    try {
      if ((await stat(candidate)).isFile()) return candidate;
    } catch { /* 尝试下一个候选路径。 */ }
  }
  return null;
}

export async function auditProductionBoundary(root, dist = path.join(root, 'dist')) {
  const sourceRoot = path.join(root, 'src');
  const modules = (await listFiles(sourceRoot)).filter((file) => file.endsWith('.js'));
  const problems = [];
  let importCount = 0;
  const entryHtml = await readFile(path.join(root, 'index.html'), 'utf8');
  const scriptTags = [...entryHtml.matchAll(/<script\b/gi)].length;
  const entryScripts = [...entryHtml.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi)].map((match) => match[1]);
  if (scriptTags !== 1 || entryScripts.length !== 1 || entryScripts[0] !== './src/app.js') {
    problems.push(`产品入口脚本应只指向 ./src/app.js，实得 ${JSON.stringify(entryScripts)}`);
  }

  for (const file of modules) {
    const code = await readFile(file, 'utf8');
    const ast = parse(code, { sourceType: 'module' });
    const specifications = [];
    traverse(ast, {
      ImportDeclaration(p) { specifications.push(p.node.source.value); },
      ExportNamedDeclaration(p) { if (p.node.source) specifications.push(p.node.source.value); },
      ExportAllDeclaration(p) { specifications.push(p.node.source.value); },
      CallExpression(p) {
        if (p.node.callee.type !== 'Import') return;
        const argument = p.node.arguments[0];
        if (argument?.type === 'StringLiteral') specifications.push(argument.value);
        else problems.push(`动态导入路径无法静态核对：${path.relative(root, file)}`);
      },
    });
    for (const spec of specifications) {
      importCount++;
      if (!spec.startsWith('.')) {
        problems.push(`非本地产品模块：${path.relative(root, file)} -> ${spec}`);
        continue;
      }
      const resolved = await existingModule(path.resolve(path.dirname(file), spec));
      const relative = resolved ? path.relative(sourceRoot, resolved) : '..';
      if (!resolved || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
        problems.push(`导入越过 src 或目标不存在：${path.relative(root, file)} -> ${spec}`);
      }
    }
  }

  const outputFiles = await listFiles(dist);
  for (const file of outputFiles) {
    const relative = path.relative(dist, file).replaceAll('\\', '/');
    if (relative.split('/').includes('archive') || /(^|\/)c2\.js$/i.test(relative)) {
      problems.push(`构建产物包含原版反编译文件：${relative}`);
    }
  }
  if (problems.length) throw new Error(problems.join('\n'));
  return { modules: modules.length, imports: importCount, outputFiles: outputFiles.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(import.meta.dirname, '..');
  const result = await auditProductionBoundary(root);
  console.log(`✓ 产品边界：${result.modules} 个源码模块、${result.imports} 条导入、${result.outputFiles} 个产物文件；原版档案依赖 0`);
}
