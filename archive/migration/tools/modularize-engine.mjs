// 一次性 AST 迁移工具。输出是真正的 ES modules，构建/运行不依赖旧包。
// 采用词法绑定而非文本替换，保留函数提升、var 语义与初始化次序。
import fs from 'node:fs/promises';
import path from 'node:path';
import { parse } from '@babel/parser';
import traversePackage from '@babel/traverse';
import generatePackage from '@babel/generator';
import * as t from '@babel/types';
import { names, sections } from './refactor-map.mjs';
const traverse = traversePackage.default || traversePackage;
const generate = generatePackage.default || generatePackage;
const input = 'src/engine/recovered-runtime.js';
const source = await fs.readFile(input, 'utf8');
const ast = parse(source, { sourceType:'module' });
const origin = new Map();
const ownership = new Map();
function sectionAt(line) { return [...sections].reverse().find(([start]) => line >= start)?.[1] || 'core/bootstrap-data'; }
const camel = value => value.replace(/[^\w$]+(.)?/g, (_,letter) => letter ? letter.toUpperCase() : '').replace(/^\d/, n => 'value' + n);
const used = new Set(Object.values(names));
function unique(candidate) { let result = candidate, n = 2; while(used.has(result)) result = candidate + n++; used.add(result); return result; }

// e 是编译器反复使用的 prototype 游标，展开为所属构造器后再拆模块。
let prototype = null;
const expanded = [];
for (const node of ast.program.body) {
  if (t.isExportNamedDeclaration(node)) continue;
  if (t.isVariableDeclaration(node) && node.declarations.length === 1 && ['e','persistence'].includes(node.declarations[0].id.name)) continue;
  if (t.isExpressionStatement(node) && t.isAssignmentExpression(node.expression) && t.isIdentifier(node.expression.left, {name:'e'})) { prototype = node.expression.right; continue; }
  if (prototype) traverse(t.file(t.program([node])), { noScope:true, Identifier(p) { if(p.node.name === 'e' && p.isReferencedIdentifier()) p.replaceWith(t.cloneNode(prototype)); } });
  expanded.push(node);
}
ast.program.body = expanded;

// 分离数据声明，便于每个技能/配置拥有独立名称。
ast.program.body = ast.program.body.flatMap(node => t.isVariableDeclaration(node) ? node.declarations.map(decl => { const result=t.variableDeclaration(node.kind,[decl]); result.loc=decl.loc || node.loc; return result; }) : [node]);
for(const node of ast.program.body) {
  if(t.isVariableDeclaration(node)) for(const decl of node.declarations) {
    const old = decl.id.name;
    ownership.set(old, sectionAt(node.loc?.start.line || 0));
    if(!names[old] && t.isObjectExpression(decl.init)) {
      const id = decl.init.properties.find(p=>t.isObjectProperty(p) && t.isIdentifier(p.key,{name:'c'}) && t.isStringLiteral(p.value));
      if(id) names[old] = unique(camel(id.value.value) + 'Definition');
    }
    if(!names[old] && t.isStringLiteral(decl.init) && /\.PNG$/i.test(decl.init.value)) names[old] = unique(camel(decl.init.value.replace(/\.PNG$/i,''))+'Sprite');
  }
  if(t.isFunctionDeclaration(node)) ownership.set(node.id.name,sectionAt(node.loc.start.line));
}

// 名称不明的绑定不伪造语义：在迁移报告中列出，随后人工补足。
traverse(ast, { Program(p) {
  for (const [old,binding] of Object.entries(p.scope.bindings)) {
    origin.set(names[old] || old, { original:old, line:binding.identifier.loc?.start.line, module:ownership.get(old), renamed:Boolean(names[old]) });
  }
  const targets = new Map(Object.entries(p.scope.bindings).filter(([old])=>names[old]).map(([old,binding])=>[binding,names[old]]));
  p.traverse({ Identifier(identifierPath) {
    const binding=identifierPath.scope.getBinding(identifierPath.node.name), replacement=targets.get(binding);
    if(!replacement) return;
    if(identifierPath.isReferencedIdentifier() || identifierPath.isBindingIdentifier() || (identifierPath.parentPath.isAssignmentExpression() && identifierPath.key==='left') || identifierPath.parentPath.isUpdateExpression()) {
      if(identifierPath.parentPath.isObjectProperty() && identifierPath.parent.shorthand) identifierPath.parent.shorthand=false;
      identifierPath.node.name=replacement;
    }
  } });
  p.stop();
} });

// 内容数组从组合根提取：怪物名录和动画图集不再掩埋在初始化逻辑中。
const gameNode=ast.program.body.find(node=>t.isVariableDeclaration(node)&&node.declarations[0].id.name==='game');
const gameProperties=gameNode.declarations[0].init.properties;
const effectsProperty=gameProperties.find(p=>p.key.name==='Dj');
const extraModules=[];
if(effectsProperty) {
  const initializer=t.functionDeclaration(t.identifier('createAnimationCatalog'),[],t.blockStatement([t.returnStatement(effectsProperty.value)]));
  initializer.loc=gameNode.loc;
  extraModules.push({module:'content/animations',node:initializer});
  effectsProperty.value=t.callExpression(t.identifier('createAnimationCatalog'),[]);
  ownership.set('createAnimationCatalog','content/animations');
}
const initializeWorld=gameProperties.find(p=>p.key.name==='eA').value;
const monsterStatements=initializeWorld.body.body.filter(node=>t.isExpressionStatement(node) && t.isCallExpression(node.expression) && generate(node.expression.callee).code==='a.n.push');
if(monsterStatements.length) {
  const monsters=t.arrayExpression(monsterStatements.map(node=>node.expression.arguments[0]));
  const monsterDefinition=t.variableDeclaration('var',[t.variableDeclarator(t.identifier('monsterDefinitions'),monsters)]);
  monsterDefinition.loc=gameNode.loc;
  extraModules.push({module:'content/monsters',node:monsterDefinition});
  ownership.set('monsterDefinitions','content/monsters');
  const first=initializeWorld.body.body.indexOf(monsterStatements[0]);
  initializeWorld.body.body=initializeWorld.body.body.filter(node=>!monsterStatements.includes(node));
  initializeWorld.body.body.splice(first,0,t.expressionStatement(t.callExpression(t.memberExpression(t.memberExpression(t.identifier('a'),t.identifier('n')),t.identifier('push')),[t.spreadElement(t.identifier('monsterDefinitions'))])));
}

// 全局字段的双射重命名。只选已核实的领域字段，不改存档 JSON 公共键。
const fields={
  zb:'characterType',Yg:'equipment',Ld:'inventory',gk:'spells',de:'skillPoints',Ci:'initialSpellSkillPoint',ei:'skillTree1',fi:'skillTree2',gi:'skillTree3',hi:'skillTree4',Fh:'behaviors',yg:'summonedMinions',En:'companion',xg:'summoner',QB:'summonedAtTurn',RB:'lifetimeTurns',Zi:'hasUnspentSkills',
  im:'kills',Ff:'minionKills',rj:'damageGiven',sj:'damageReceived',vq:'stunCount',ap:'healthRegenBonus',pq:'spiritRegenBonus',Pr:'baseHealthRegenPercent',ot:'baseSpiritRegenPercent',Tq:'baseAttackCooldown',ao:'attackCooldownReduction',mt:'spellSpiritCost',xn:'spellCostReduction',gl:'maxSummonedMinions',Wi:'chainChance',Df:'chainCount',Oj:'extraAttackCount',Wn:'extraAttackChance',za:'defaultName',
  GB:'resourcesReady',Os:'lastTickAt',XA:'lastFrameAt',fD:'frameDuration',kz:'turnDuration',sD:'requestTick',Hr:'tick',Fr:'fpsFrameCount',Gr:'fpsElapsed',
  Zp:'saveKey',qs:'lastSavedAt',UC:'autoSaveInterval',AE:'statisticsAdapter',eE:'monsterAdapter',
  Xc:'stateSize',Gq:'periodOffset',uy:'matrixConstant',Kt:'upperMask',Jt:'lowerMask',jd:'stateWords',hg:'stateIndex',sE:'unitScale',tp:'twistTable',
  Fd:'power',Ed:'coefficient',Vd:'growth',Xd:'base',

  K:'stats',D:'adventurers',gg:'leader',ce:'scrollCaster',da:'party',Ih:'runStatistics',Ua:'lifetimeStatistics',Ig:'achievements',Bg:'victoryStatistics',wh:'victoryCount',$a:'turnNumber',Gj:'frameNumber',Xg:'encounter',
  Sa:'health',Yc:'spirit',Jb:'maxHealth',Ke:'maxSpirit',sd:'damage',je:'armor',xe:'attackRating',Ae:'defenceRating',Eb:'characterLevel',
  va:'itemValue',Pc:'levelValue',Xh:'spellBonusPercent',wc:'skillBonusPercent',pa:'characterClass',Xt:'adventurerName',Kc:'classDefinition',
  fd:'gold',Je:'kills',cg:'experiencePoints',Za:'stairs',Ka:'className',vg:'shortName',yb:'descriptionText',Le:'requiredVictories',
  qb:'heightInTiles',rb:'widthInTiles',ia:'tileColumn',ja:'tileRow',fk:'roomId',Or:'hallwayId',
  ub:'sourceX',vb:'sourceY',ue:'spriteSize',qq:'frames',qt:'frameSourceX',rt:'frameSourceY',
  ag:'dungeonId',Eo:'dungeonName',Go:'dungeonType',Nk:'farmCost',Lc:'cleared',qf:'discovered',oe:'isFarm',Mg:'clearedTurn',zi:'farmStartTurn',rs:'levelCount',ri:'currentLevelIndex',
  lo:'castleId',mi:'castleName',Jf:'requiredMonsterLevel',Qn:'worldColumn',Tn:'worldRow',
  Xe:'combatQueue',Sm:'itemGenerator',fh:'monsterSprites',Kj:'itemSprites',Dj:'animations',
  Mc:'currentDungeon',Em:'initialized',lg:'partyCreated',Fe:'gameWon',Mh:'paused',wb:'worldActive',ig:'processingOffline',Tw:'lastActiveAt',jf:'offlineDuration',Vj:'offlineProcessed',Mz:'renderEnabled',
  eA:'initializeWorld',jE:'handleVisibility',CE:'bindVisibility',ix:'resetRun',wE:'resetContinuation',kD:'beginOfflineProgress',xu:'finishOfflineProgress',hE:'importSave',iE:'saveNow',OA:'restartRun',gE:'resetGame',
  FC:'lastAvailabilityFrame',Iw:'lastChangeFrame',Ha:'upgrades',HC:'upgradeRows',Eq:'sortedUpgrades',JE:'sortEnabled',cx:'lastSortFrame',
  Qe:'locked',mh:'quantity',tg:'upgradeCount',qg:'scrollId',ic:'potionId',Oe:'active',Vl:'activationTurn',
  Ym:'minMonsters',Pj:'maxMonsters',ls:'itemDropChance',Yl:'itemQualityChance',lp:'higherLevelItemChance',Et:'treasureChance',
  F:'elementId',J:'reset',ba:'update',Xa:'render',Me:'onGameWon',Zd:'onOfflineStart',Ne:'onOfflineFinish',Ya:'visible',Pm:'isVisible',qa:'enabled',ha:'selected',qh:'highlighted',IC:'initiallyEnabled',
  Vb:'selectedCharacters',Qy:'classIndex',Ww:'validParty',$i:'startButton',Tc:'panels',Bd:'tabBar',Fn:'tabs',
  Mm:'showCombatText',nq:'showSpellEffects',up:'showMapOverlay',Jp:'allowOfflineProgress',bp:'allowBackgroundProgress',rq:'depthSortSprites',Po:'showFps',
};
const gameFields={B:'tileSize',Nh:'halfTileSize',iu:'viewportWidth',Yq:'viewportHeight',Sf:'viewportHalfWidth',Tf:'viewportHalfHeight',I:'terrainSprites',vl:'camera',Qo:'lifecycle',S:'world',Gf:'monsters',Ni:'minions',$h:'allies',Aa:'dungeons',Pe:'regions',kb:'castles',Bm:'farms',ug:'shops',Ba:'level',le:'currentCastle',Hr:'loop',Ee:'view',Nb:'options',Cz:'pathfinder',yE:'decorations',ob:'monsterCatalog',ff:'goldDrops',Uh:'scrollDrops',Ti:'potionDrops',th:'treasure',dh:'itemDrops',Di:'inventories',nh:'scrolls',Yj:'potions',eq:'scrollTargets',lD:'monsterNames',df:'effects',RC:'upgradeRegistry',pc:'floatingText',dF:'extensions',pg:'saves',i:'state',Kw:'restoreRuntimeState'};
function renameGameFields(tree){traverse(tree,{MemberExpression(p){if(t.isIdentifier(p.node.object,{name:'game'})&&!p.node.computed&&Object.hasOwn(gameFields,p.node.property.name))p.node.property.name=gameFields[p.node.property.name];}});}
renameGameFields(ast);
for(const property of gameProperties)if(Object.hasOwn(gameFields,property.key.name))property.key.name=gameFields[property.key.name];
for(const item of extraModules)renameGameFields(t.file(t.program([item.node])));
const existingProperties=new Set();
traverse(ast,{ObjectProperty(p){if(!p.node.computed&&t.isIdentifier(p.node.key))existingProperties.add(p.node.key.name);},MemberExpression(p){if(!p.node.computed&&t.isIdentifier(p.node.property))existingProperties.add(p.node.property.name);}});
// 同一对象不能把两个已有键合并。序列化对象里同语义的可读键无需避让。
traverse(ast,{ObjectExpression(p){const keys=new Set(p.node.properties.filter(t.isObjectProperty).map(p=>p.key.name));for(const [old,name] of Object.entries(fields))if(keys.has(old)&&keys.has(name))delete fields[old];}});
function renameFields(tree) { traverse(tree,{MemberExpression(p){if(!p.node.computed && Object.hasOwn(fields,p.node.property.name))p.node.property.name=fields[p.node.property.name];},ObjectProperty(p){if(!p.node.computed && t.isIdentifier(p.node.key) && Object.hasOwn(fields,p.node.key.name)) {p.node.key.name=fields[p.node.key.name];p.node.shorthand=false;}},StringLiteral(p){if(p.parentPath.isMemberExpression() && p.parent.computed && p.key==='property' && Object.hasOwn(fields,p.node.value))p.node.value=fields[p.node.value];}}); }
renameFields(ast);
for(const item of extraModules) renameFields(t.file(t.program([item.node])));

// 反压缩控制流，避免逗号链、布尔常量技巧和单行嵌套妨碍维护。
function normalizeStatement(expression) {
  if(t.isSequenceExpression(expression)) return expression.expressions.flatMap(normalizeStatement);
  if(t.isConditionalExpression(expression)) return [t.ifStatement(expression.test,t.blockStatement(normalizeStatement(expression.consequent)),t.blockStatement(normalizeStatement(expression.alternate)))];
  if(t.isLogicalExpression(expression)) return [t.ifStatement(expression.operator==='&&'?expression.left:t.unaryExpression('!',expression.left,true),t.blockStatement(normalizeStatement(expression.right)))];
  return [t.expressionStatement(expression)];
}
function makeReadable(tree) {
  traverse(tree,{
    UnaryExpression(p){if(p.node.operator==='!'&&t.isNumericLiteral(p.node.argument))p.replaceWith(t.booleanLiteral(!p.node.argument.value));else if(p.node.operator==='void'&&t.isNumericLiteral(p.node.argument,{value:0}))p.replaceWith(t.identifier('undefined'));},
    ExpressionStatement:{exit(p){if(t.isSequenceExpression(p.node.expression)||t.isConditionalExpression(p.node.expression)||t.isLogicalExpression(p.node.expression)){const replacements=normalizeStatement(p.node.expression);p.replaceWithMultiple(replacements);p.skip();}}},
    EmptyStatement(p){p.remove();},
    'ForStatement|ForInStatement|ForOfStatement|WhileStatement|DoWhileStatement'(p){if(!t.isBlockStatement(p.node.body))p.node.body=t.blockStatement([p.node.body]);},
    IfStatement(p){if(!t.isBlockStatement(p.node.consequent))p.node.consequent=t.blockStatement([p.node.consequent]);if(p.node.alternate&&!t.isIfStatement(p.node.alternate)&&!t.isBlockStatement(p.node.alternate))p.node.alternate=t.blockStatement([p.node.alternate]);}
  });
}
makeReadable(ast);
for(const item of extraModules) makeReadable(t.file(t.program([item.node])));

// 装备模板与注册顺序独立于会话生命周期，保留原装备 ID 与掉落顺序。
const worldStatements = initializeWorld.body.body;
const itemStart = worldStatements.findIndex(node => t.isVariableDeclaration(node) && node.declarations.some(decl => generate(decl.init).code === 'game.itemGenerator'));
let itemEnd = -1;
worldStatements.forEach((node, index) => { if(t.isExpressionStatement(node) && t.isCallExpression(node.expression) && t.isIdentifier(node.expression.callee,{name:'registerItemType'})) itemEnd=index; });
if(itemStart < 0 || itemEnd < itemStart) throw new Error('装备配置迁移边界不匹配');
const itemNodes = worldStatements.splice(itemStart,itemEnd-itemStart+1,t.expressionStatement(t.callExpression(t.identifier('initializeItemCatalog'),[])));
extraModules.push({ module:'content/equipment', node:t.functionDeclaration(t.identifier('initializeItemCatalog'),[],t.blockStatement(itemNodes)) });

const regionStart = worldStatements.findIndex(node => t.isVariableDeclaration(node) && node.declarations.some(decl => decl.init && generate(decl.init).code === 'game.regions'));
if(regionStart < 0) throw new Error('世界配置迁移边界不匹配');
const regionNodes=worldStatements.splice(regionStart,worldStatements.length-regionStart,t.expressionStatement(t.callExpression(t.identifier('initializeRegionsAndCastles'),[])));
extraModules.push({ module:'world/initialization', node:t.functionDeclaration(t.identifier('initializeRegionsAndCastles'),[],t.blockStatement(regionNodes)) });

const moduleNodes=new Map();
function add(module,node) { if(!moduleNodes.has(module))moduleNodes.set(module,[]);moduleNodes.get(module).push(node); }
for(const node of ast.program.body) {
  if(t.isImportDeclaration(node))continue;
  add(sectionAt(node.loc?.start.line||0),node);
}
for(const item of extraModules)add(item.module,item.node);

// 重新解析格式化后的 AST，以建立变换后的正确词法绑定。
const allNodes=[...moduleNodes.values()].flat();
const combined=t.file(t.program(allNodes));
const symbolOwners=new Map();
for(const [module,nodes] of moduleNodes)for(const node of nodes){
  if(t.isFunctionDeclaration(node))symbolOwners.set(node.id.name,module);
  if(t.isVariableDeclaration(node))for(const decl of node.declarations)symbolOwners.set(decl.id.name,module);
}
const external={monstersAtlas:'../../data/monsters-atlas.js',terrainAtlas:'../../data/terrain-atlas.js',itemsAtlas:'../../data/items-atlas.js',saveCodec:'../save-codec.js'};
const graph={};
const mapEntries=[];
const outputRoot='src/engine/modules';
await fs.mkdir(outputRoot,{recursive:true});
function importPath(from,to){let relative=path.posix.relative(path.posix.dirname(from),to);return(relative.startsWith('.')?relative:'./'+relative)+'.js';}
for(const [module,nodes] of moduleNodes){
  const fileAst=t.file(t.program(nodes));
  const imports=new Map(),exports=new Set();
  traverse(fileAst,{ReferencedIdentifier(p){
    const name=p.node.name;
    if(p.scope.getBinding(name))return;
    const owner=symbolOwners.get(name);
    if(owner&&owner!==module){if(!imports.has(owner))imports.set(owner,new Set());imports.get(owner).add(name);}
  }});
  // 所有跨模块绑定均显式导出；本模块自己的绑定仍不暴露给产品层。
  for(const node of nodes){if(t.isFunctionDeclaration(node))exports.add(node.id.name);if(t.isVariableDeclaration(node))for(const decl of node.declarations)exports.add(decl.id.name);}
  const dependencies=[...imports.keys()];
  graph[module]=dependencies;
  const declarations=[],initialization=[],body=[];
  for(const node of nodes){
    if(t.isFunctionDeclaration(node)){body.push(t.exportNamedDeclaration(node));continue;}
    if(t.isVariableDeclaration(node)){for(const decl of node.declarations){declarations.push(t.variableDeclarator(decl.id));if(decl.init)initialization.push(t.expressionStatement(t.assignmentExpression('=',t.cloneNode(decl.id),decl.init)));}continue;}
    initialization.push(node);
  }
  const importNodes=[...imports].map(([owner,symbols])=>t.importDeclaration([...symbols].sort().map(name=>t.importSpecifier(t.identifier(name),t.identifier(name))),t.stringLiteral(importPath(module,owner))));
  const undefinedReferences=new Set();
  traverse(fileAst,{ReferencedIdentifier(p){if(!p.scope.getBinding(p.node.name)&&!symbolOwners.has(p.node.name))undefinedReferences.add(p.node.name);}});
  for(const name of Object.keys(external))if(undefinedReferences.has(name)){
    const target=name==='saveCodec'?'src/engine/save-codec.js':`src/data/${name==='monstersAtlas'?'monsters':name==='terrainAtlas'?'terrain':'items'}-atlas.js`;
    let relative=path.relative(path.dirname(path.join(outputRoot,module+'.js')),target).replaceAll('\\','/');
    if(!relative.startsWith('.'))relative='./'+relative;
    importNodes.push(t.importDeclaration([t.importDefaultSpecifier(t.identifier(name))],t.stringLiteral(relative)));
  }
  if(undefinedReferences.has('persistence'))importNodes.push(t.importDeclaration([t.importSpecifier(t.identifier('persistence'),t.identifier('persistence'))],t.stringLiteral(importPath(module,'runtime/storage-port'))));
  if(declarations.length)body.unshift(t.exportNamedDeclaration(t.variableDeclaration('var',declarations)));
  const initName='initialize'+module.split(/[/-]/).map(part=>part[0].toUpperCase()+part.slice(1)).join('');
  body.push(t.exportNamedDeclaration(t.functionDeclaration(t.identifier(initName),[],t.blockStatement(initialization))));
  const descriptor=sections.find(([,name])=>name===module)?.[2]||'从原始组合根独立出的配置数据';
  const code=generate(t.file(t.program([...importNodes,...body])),{comments:true,jsescOption:{minimal:true}}).code;
  await fs.mkdir(path.dirname(path.join(outputRoot,module+'.js')),{recursive:true});
  await fs.writeFile(path.join(outputRoot,module+'.js'),`/** ${descriptor}。\n * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。\n */\n${code}\n`);
  mapEntries.push({module,initName,bindings:exports.size,lines:code.split('\n').length});
}
// 原始顺序以 section 起点为准，纯内容工厂无副作用，提前初始化。
const ordered=[...mapEntries].sort((a,b)=>{
  const index=name=>name==='content/monsters'||name==='content/animations'?-2:name==='core/bootstrap-data'?-1:sections.findIndex(([,m])=>m===name);
  return index(a.module)-index(b.module);
});
const loader=ordered.map(({module,initName})=>`import { ${initName} } from '${importPath('runtime/index',module)}';`).join('\n');
await fs.writeFile(path.join(outputRoot,'runtime/index.js'),`${loader}\n\n// 模块初始化阶段只有这里拥有调用顺序；函数提升和原版初始值保持一致。\n${ordered.map(({initName})=>initName+'();').join('\n')}\nexport { game } from './game.js';\n`);
await fs.writeFile(path.join(outputRoot,'runtime/storage-port.js'),`// 持久化由宿主注入，引擎不直接依赖 localStorage。\nexport let persistence = { read: () => null, write: () => {}, remove: () => {} };\nexport function configurePersistence(port) { persistence = port; }\n`);
await fs.mkdir('docs',{recursive:true});
await fs.writeFile('docs/symbol-map.json',JSON.stringify({symbols:Object.fromEntries(origin),fields,gameFields,modules:mapEntries,dependencies:graph},null,2)+'\n');
await fs.writeFile('output/analysis/unresolved.json',JSON.stringify([...origin].filter(([,value])=>!value.renamed),null,2));
await fs.writeFile('output/analysis/field-map.json',JSON.stringify(fields,null,2));
await fs.writeFile('output/analysis/game-field-map.json',JSON.stringify(gameFields,null,2));
console.log(`已拆分 ${moduleNodes.size} 个模块，共 ${symbolOwners.size} 个绑定。未命名 ${[...origin].filter(([,v])=>!v.renamed).length} 个。`);
