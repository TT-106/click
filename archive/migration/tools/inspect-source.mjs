import fs from 'node:fs/promises';
import { parse } from '@babel/parser';
import traversePackage from '@babel/traverse';
import generatePackage from '@babel/generator';
const traverse = traversePackage.default || traversePackage;
const generate = generatePackage.default || generatePackage;
const source = await fs.readFile('src/engine/recovered-runtime.js','utf8');
const ast = parse(source,{sourceType:'module'});
const functions = [], variables = [];
for (const node of ast.program.body) {
  if (node.type === 'FunctionDeclaration') functions.push({name:node.id.name,line:node.loc.start.line,code:generate(node,{compact:true}).code});
  if (node.type === 'VariableDeclaration') for(const decl of node.declarations) variables.push({name:decl.id.name,line:node.loc.start.line,code:decl.init ? generate(decl.init,{compact:true}).code.slice(0,420):''});
}
await fs.mkdir('output/analysis',{recursive:true});
await fs.writeFile('output/analysis/functions.json',JSON.stringify(functions,null,2));
await fs.writeFile('output/analysis/variables.json',JSON.stringify(variables,null,2));
traverse(ast,{Program(p){console.log('bindings',Object.keys(p.scope.bindings).length); console.log('reassignments',Object.values(p.scope.bindings).filter(b=>b.constantViolations.length).map(b=>({name:b.identifier.name,lines:b.constantViolations.map(p=>p.node.loc.start.line)})).filter(b=>b.name!=='e')); p.stop();}});
console.log('functions',functions.length,'variables',variables.length);
