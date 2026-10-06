// 准备层的共同语义。组间 AND、组内 OR；不读取游戏或存档。
export function selectedInputs(required, groups = [], preferred = {}) {
  const selected = [...required];
  for (const [index, group] of groups.entries()) {
    if (!Array.isArray(group.options) || group.options.length < 2) throw new Error('每个替代组至少有两个选项');
    const choice = preferred[index];
    const option = choice == null ? group.options[0] : group.options.find(o => o.id === choice);
    if (!option) throw new Error(`替代组选项不存在: ${choice}`);
    selected.push({ ...option });
  }
  return selected;
}

// 从可采原料/免费工位出发，反复解锁能真正启动的配方和建筑。
// SCC 中出现一个普通原料，并不代表整个循环就能启动；所有必需条件须同时满足。
// 此处假设所有 raw 均有足量来源，不验证地图分布、战斗条件、时序或库存调度。
export function availableContent(items, recipes, buildingData = null) {
  const availableItems = new Set(items.filter(i => i.category === 'raw').map(i => i.id));
  const availableLevels = new Set();
  const availableRecipes = new Set();
  const buildings = buildingData?.buildings || [];
  const levels = buildings.flatMap(b => b.levels.map(level => ({ ...level, building: b.id, key: `${b.id}:${level.level}` })));
  for (const station of buildingData?.freeStations || []) availableLevels.add(`${station.id}:0`);
  const inputsAvailable = (inputs, groups = []) => inputs.every(i => availableItems.has(i.id))
    && groups.every(group => group.options.some(option => availableItems.has(option.id)));
  let changed;
  do {
    changed = false;
    for (const level of levels) {
      if (availableLevels.has(level.key)) continue;
      if (level.level > 1 && !availableLevels.has(`${level.building}:${level.level - 1}`)) continue;
      if (!level.prereq.every(key => availableLevels.has(key))) continue;
      if (!inputsAvailable(level.cost, level.costAnyOf)) continue;
      availableLevels.add(level.key); changed = true;
    }
    for (const recipe of recipes) {
      if (availableRecipes.has(recipe.id)) continue;
      if (buildingData && !availableLevels.has(`${recipe.station}:${recipe.level}`)) continue;
      if (!inputsAvailable(recipe.inputs, recipe.anyOf)) continue;
      if (recipe.operation === 'upgrade-instance' && !availableItems.has(recipe.targetItemId)) continue;
      availableRecipes.add(recipe.id); changed = true;
      if (recipe.operation !== 'upgrade-instance') for (const output of recipe.outputs) availableItems.add(output.id);
    }
  } while (changed);
  return {
    availableItems: [...availableItems], availableLevels: [...availableLevels], availableRecipes: [...availableRecipes],
    unreachableRecipes: recipes.filter(r => !availableRecipes.has(r.id)).map(r => r.id),
    unreachableLevels: levels.filter(l => !availableLevels.has(l.key)).map(l => l.key),
  };
}

// 独立世界之间没有连续性，连续缺货计数必须在每个种子开始时归零。
export function longestZeroStreak(seeds, itemId) {
  let worst = 0;
  for (const seed of seeds) {
    let streak = 0;
    for (const trip of seed.trips) {
      streak = trip.items[itemId] === 0 ? streak + 1 : 0;
      worst = Math.max(worst, streak);
    }
  }
  return worst;
}
