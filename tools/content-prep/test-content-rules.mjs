import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { inspectItems, inspectRecipes, inspectBuildings } from './validate.mjs';
import { selectedInputs, availableContent, longestZeroStreak } from './content-rules.mjs';
import { expand } from './analyze-costs.mjs';

const load = name => JSON.parse(readFileSync(new URL(`../../content-prep/expedition-v1/${name}.json`, import.meta.url), 'utf8'));
const items = load('items'), recipes = load('recipes'), buildings = load('buildings');
const clone = value => structuredClone(value);
const badRecipe = mutate => { const data = clone(recipes); mutate(data); return inspectRecipes(data, items); };
const badBuilding = mutate => { const data = clone(buildings); mutate(data); return inspectBuildings(data, items, recipes); };
const group = [{options:[{id:'copper_ingot',qty:600},{id:'iron_ingot',qty:600}]}];

test('完整草案可从假定可采原料及初始工位启动', () => {
  assert.deepEqual(inspectRecipes(recipes,items),[]);
  assert.deepEqual(inspectBuildings(buildings,items,recipes),[]);
  const available = availableContent(items.items,recipes.recipes,buildings);
  assert.equal(available.availableLevels.length,26); // 24建筑等级+2初始工位
  assert.equal(available.availableRecipes.length,53);
});
test('一组两选项只选择一种', () => assert.deepEqual(selectedInputs([],group,{0:'iron_ingot'}),[{id:'iron_ingot',qty:600}]));
test('多组为AND但每组为OR', () => assert.deepEqual(selectedInputs([], [...group,{options:[{id:'wood',qty:1},{id:'stone',qty:1}]}],{0:'iron_ingot',1:'stone'}).map(x=>x.id),['iron_ingot','stone']));
test('不允许未知替代偏好静默回退', () => assert.throws(()=>selectedInputs([],group,{0:'silver_ingot'}),/不存在/));
test('旧两组单选项表示会被拒绝', () => assert.ok(badRecipe(d=>{d.recipes.find(r=>r.id==='nails').anyOf=group[0].options.map(o=>({options:[o]}));}).some(e=>e.includes('至少两个'))));
test('普通输入与替代输入重叠会被拒绝', () => assert.ok(badRecipe(d=>d.recipes.find(r=>r.id==='nails').inputs.push({id:'iron_ingot',qty:600})).some(e=>e.includes('双扣'))));
test('不同替代组重复物品会被拒绝', () => assert.ok(badRecipe(d=>d.recipes.find(r=>r.id==='nails').anyOf.push(group[0])).some(e=>e.includes('重复'))));
test('同一输入重复扣料会被拒绝', () => assert.ok(badRecipe(d=>d.recipes[0].inputs.push(d.recipes[0].inputs[0])).some(e=>e.includes('重复'))));
test('量纲不一致会被拒绝', () => assert.ok(badRecipe(d=>{d.recipes[0].inputs[0].kind='count';}).some(e=>e.includes('量纲'))));
test('不安全整数会被拒绝', () => assert.ok(badRecipe(d=>{d.recipes[0].inputs[0].qty=Number.MAX_SAFE_INTEGER+1;}).length));
test('实例升级不能以散装材料为目标', () => assert.ok(badRecipe(d=>{d.recipes.find(r=>r.operation==='upgrade-instance').targetItemId='wood';}).some(e=>e.includes('instance'))));
test('实例升级不能额外输出复制件', () => assert.ok(badRecipe(d=>{d.recipes.find(r=>r.operation==='upgrade-instance').outputs=[{id:'staff',qty:1}];}).some(e=>e.includes('复制'))));
test('实例升级保留旧实例身份', () => assert.ok(badRecipe(d=>{d.recipes.find(r=>r.operation==='upgrade-instance').outputInstanceId='new';}).some(e=>e.includes('原实例'))));
test('产物自循环无法从空加工库存启动', () => {
  const r={id:'self',name:'self',station:'handcraft',level:0,phase:'A',inputs:[{id:'plank',qty:1}],outputs:[{id:'plank',qty:1}],baseTimeMs:60000,designRef:'test'};
  assert.ok(inspectRecipes({...recipes,expectTotal:1,recipes:[r]},items).some(e=>e.includes('无法启动')));
});
test('循环中加入普通原料仍缺必需环内产物', () => {
  const make=(id,input,output,raw=[])=>({id,name:id,station:'handcraft',level:0,phase:'A',inputs:[{id:input,qty:1},...raw],outputs:[{id:output,qty:1}],baseTimeMs:60000,designRef:'test'});
  const data={...recipes,expectTotal:2,recipes:[make('a','cloth','rope',[{id:'fiber',qty:500}]),make('b','rope','cloth')]};
  assert.equal(inspectRecipes(data,items).filter(e=>e.includes('无法启动')).length,2);
});
test('存在真正的OR逃生路线时不会误报循环', () => {
  const data={...recipes,expectTotal:2,recipes:[
    {id:'a',name:'a',station:'handcraft',level:0,phase:'A',inputs:[],anyOf:[{options:[{id:'cloth',qty:1},{id:'fiber',qty:600}]}],outputs:[{id:'rope',qty:1}],baseTimeMs:60000,designRef:'test'},
    {id:'b',name:'b',station:'handcraft',level:0,phase:'A',inputs:[{id:'rope',qty:1}],outputs:[{id:'cloth',qty:1}],baseTimeMs:60000,designRef:'test'}]};
  assert.deepEqual(inspectRecipes(data,items),[]);
});
test('未知建筑前置会被拒绝', () => assert.ok(badBuilding(d=>d.buildings[2].levels[0].prereq.push('missing:1')).some(e=>e.includes('未知前置'))));
test('建筑互相前置会被拒绝', () => assert.ok(badBuilding(d=>{d.buildings[2].levels[0].prereq.push('smelter:1');d.buildings[3].levels[0].prereq.push('workshop:1');}).some(e=>e.includes('无法启动'))));
test('同建筑重复等级会被拒绝', () => assert.ok(badBuilding(d=>{d.buildings[2].levels[1].level=1;}).some(e=>e.includes('重复等级'))));
test('工坊一级不能要求只有工坊一级能产出的布料', () => assert.ok(badBuilding(d=>d.buildings[2].levels[0].cost.push({id:'cloth',qty:1})).some(e=>e.includes('无法启动'))));
test('免费设施不能带隐含前置', () => assert.ok(badBuilding(d=>d.buildings[0].levels[0].prereq.push('smelter:1')).some(e=>e.includes('初始免费'))));
test('地图室纤维替代已机器化且不会扣羽毛', () => {
  const level=buildings.buildings.find(b=>b.id==='cartography').levels[0];
  const selected=selectedInputs(level.cost,level.costAnyOf,{0:'fiber'});
  assert.equal(selected.find(i=>i.id==='fiber').qty,300);
  assert.ok(!selected.some(i=>i.id==='feather'));
});
test('五金成本展开只扣默认铁，不扣铜', () => {
  const result=expand([{id:'nails',qty:500}],{leftovers:{}});
  assert.equal(result.raw.iron,2000); assert.equal(result.raw.copper,undefined);
  assert.deepEqual(result.batches[0].selectedInputs,[{id:'iron_ingot',qty:600}]);
});
test('批余量供下一需求复用，不重复冶炼', () => {
  const result=expand([{id:'nails',qty:200},{id:'nails',qty:200}],{leftovers:{}});
  assert.equal(result.batches.filter(b=>b.recipeId==='nails').length,1);
  assert.equal(result.leftovers.nails,100);
});
test('成本路线循环及时报出路径', () => {
  const loop={id:'loop',station:'workshop',inputs:[{id:'plank',qty:1}],outputs:[{id:'plank',qty:1}],baseTimeMs:60000};
  assert.throws(()=>expand([{id:'plank',qty:1}],{leftovers:{}},{routes:{plank:'loop'},recipesById:new Map([['loop',loop]])}),/plank → plank/);
});
test('跨种子缺货不能串成一趟连续事件', () => {
  const seed=values=>({trips:values.map(value=>({items:{leather:value}}))});
  assert.equal(longestZeroStreak([seed([1,0,0]),seed([0,0,1])],'leather'),2);
  assert.equal(longestZeroStreak([seed(Array(8).fill(0)),seed(Array(8).fill(0))],'leather'),8);
});
test('候选素材文件确实存在', () => assert.deepEqual(inspectItems(items),[]));
test('候选素材不允许越过项目路径', () => {
  const data=clone(items); data.items.find(i=>i.id==='stone').icon={status:'candidate',candidatePath:'../outside.png'};
  assert.ok(inspectItems(data).some(e=>e.includes('项目内')));
});
test('候选状态不能掩盖缺失原图', () => {
  const data=clone(items); data.items.find(i=>i.id==='stone').icon={status:'candidate',candidatePath:'output/not-real.png'};
  assert.ok(inspectItems(data).some(e=>e.includes('不存在')));
});
