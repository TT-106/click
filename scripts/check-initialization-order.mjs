// 只读取组合根，不执行引擎。基线需要人工审查；本脚本没有自动更新选项。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { parse } from '@babel/parser';
import generatorModule from '@babel/generator';

const generate = generatorModule.default || generatorModule;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export function readInitializationPlan(source) {
  const program = parse(source, { sourceType: 'module' }).program;
  const bindings = new Map();
  for (const statement of program.body) {
    if (statement.type !== 'ImportDeclaration') continue;
    for (const specifier of statement.specifiers) {
      if (specifier.type !== 'ImportSpecifier') throw new Error('组合根只允许具名依赖');
      bindings.set(specifier.local.name, {
        module: statement.source.value, name: specifier.imported.name,
      });
    }
  }
  const steps = [];
  for (const statement of program.body) {
    if (statement.type === 'ImportDeclaration') continue;
    if (statement.type === 'ExportNamedDeclaration' && !statement.declaration && statement.source) continue;
    const call = statement.type === 'ExpressionStatement' && statement.expression;
    if (!call || call.type !== 'CallExpression' || call.callee.type !== 'Identifier') {
      throw new Error(`组合根第 ${statement.loc.start.line} 行不是直接装配调用；需显式审查`);
    }
    const dependency = bindings.get(call.callee.name);
    if (!dependency || !/^(initialize|bind)/.test(dependency.name)) {
      throw new Error(`未识别的装配调用：${call.callee.name}`);
    }
    steps.push({ ...dependency,
      arguments: call.arguments.map(argument => generate(argument, { compact: true, comments: false }).code),
    });
  }
  return steps;
}

export function verifyInitializationPlan(actual, expected) {
  if (!Array.isArray(expected) || !expected.length) throw new Error('初始化顺序基线为空或格式错误');
  if (isDeepStrictEqual(actual, expected)) return;
  const index = actual.findIndex((step, i) => !isDeepStrictEqual(step, expected[i]));
  const position = index < 0 ? actual.length : index;
  throw new Error(`装配顺序或参数变化（第 ${position + 1} 步）：\n实际 ${JSON.stringify(actual[position])}\n基线 ${JSON.stringify(expected[position])}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const source = fs.readFileSync(path.join(ROOT, 'src/engine/modules/runtime/index.js'), 'utf8');
    const expected = JSON.parse(fs.readFileSync(path.join(ROOT, 'artifacts/initialization-order.json'), 'utf8'));
    const actual = readInitializationPlan(source);
    verifyInitializationPlan(actual, expected);
    const initializers = actual.filter(step => step.name.startsWith('initialize')).length;
    console.log(`✓ 初始化顺序：${initializers} 个 initialize + ${actual.length - initializers} 个 bind，来源、顺序、次数和参数均匹配`);
  } catch (error) {
    console.error(`✗ 初始化顺序：${error.message}`);
    process.exitCode = 1;
  }
}
