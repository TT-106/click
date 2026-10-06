// 素材引用完整性审计（零第三方依赖）。
//
// 为什么需要：给游戏加内容时，最贵的一类错误不是崩溃，而是**静默失效**——
//   * 主题表/职业表/怪物表里把一个精灵名拼错（`L2_WallBrickNS.PNG` 写成 `L2_WallBrickNS.PNG` 之外的东西）；
//   * 把地形图块名写进怪物目录（或反过来）——`getSprite` 返回 undefined，运行时不报错，只画空白；
//   * 新素材包声明了 `replace`/`alias` 但目标根本不在图集里。
// 这些错误在 60 秒游玩里都不一定看得见，但会在扩展内容时持续放大。本审计把"代码引用的名字"
// 与"真实存在的名字"（原版图集 + 素材包清单）全部对账，失败即退出码 1 并逐条打印 file:line。
//
// 口径：
//   图集名 = src/data/{terrain,monsters,items}-atlas.js（原版冻结资源，1183/939/714 条）；
//   素材包 = src/data/assets.generated.js（由 npm run import:assets 生成，提供 id/alias/replace/saveName）。
//   资源组：terrain → 地形图集；actors → 怪物图集（角色与怪物共用）；items → 物品图集。
//   调用点 `X.getSprite("名")` 中 X 可判定组时做**同组**校验（防跨组错用）。
//
// 用法: node scripts/audit-asset-refs.mjs        （npm run audit:asset-refs）
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const GROUP_ATLAS = { terrain: 'terrain-atlas.js', actors: 'monsters-atlas.js', items: 'items-atlas.js' };
// 源里 `XSprites` 后缀 → 资源组（见 runtime/game.js：monsterSprites=group('actors')）
const RECEIVER_GROUP = [['terrainSprites', 'terrain'], ['monsterSprites', 'actors'], ['itemSprites', 'items']];
const NAME_LITERAL = /(["'])([A-Za-z0-9_][A-Za-z0-9_.\-]*\.(?:PNG|png|WEBP|webp|SVG|svg))\1/g;
const GETSPRITE_CALL = /([A-Za-z_$][\w$.]*)\.getSprite\(\s*(["'])([^"']+)\2/g;

function fail(message) { console.error(`✗ 素材引用审计失败：${message}`); process.exit(1); }

async function loadAtlas(file) {
  const mod = await import(`../src/data/${file}`);
  return new Set(mod.default.map((entry) => entry.name));
}

const atlasNames = {};
for (const [group, file] of Object.entries(GROUP_ATLAS)) atlasNames[group] = await loadAtlas(file);
const allLegacyNames = new Set([...Object.values(atlasNames)].flatMap((set) => [...set]));

// 素材包：每个名字（id/alias/saveName/replace）都成为其组内可解析名
const manifest = (await import('../src/data/assets.generated.js')).default;
const manifestByGroup = new Map();
const allManifestNames = new Set();
const idSeen = new Set();
for (const definition of manifest) {
  const group = definition.group;
  if (!manifestByGroup.has(group)) manifestByGroup.set(group, new Set());
  const set = manifestByGroup.get(group);
  if (idSeen.has(definition.id)) fail(`素材包重复 id：${definition.id}`);
  idSeen.add(definition.id);
  for (const name of [definition.id, definition.replace, definition.saveName, ...(definition.aliases || [])].filter(Boolean)) {
    set.add(name);
    allManifestNames.add(name);
  }
  if (definition.replace && !allLegacyNames.has(definition.replace)) {
    fail(`素材包 ${definition.id} 的 replace 目标不存在于任何图集：${definition.replace}`);
  }
}

function groupsFor(name) {
  const groups = [];
  for (const group of Object.keys(GROUP_ATLAS)) {
    if (atlasNames[group].has(name) || manifestByGroup.get(group)?.has(name)) groups.push(group);
  }
  return groups;
}

function listFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) listFiles(full, out);
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

const problems = [];
let literalRefs = 0, groupRefs = 0, filesScanned = 0;

// 图集/清单文件本身是"事实来源"，不作为引用方扫描
const DATA_SOURCES = new Set(['src/data/assets.generated.js', ...Object.values(GROUP_ATLAS).map((f) => `src/data/${f}`)]);
for (const rel of listFiles('src').map((f) => path.relative(ROOT, f).split(path.sep).join('/'))) {
  if (DATA_SOURCES.has(rel)) continue;
  const text = fs.readFileSync(rel, 'utf8');
  filesScanned++;
  const lines = text.split(/\r?\n/);

  // 逐行给出行号，便于定位
  lines.forEach((line, index) => {
    if (line.trimStart().startsWith('//')) return; // 行注释里的示例名不算引用
    let m;
    NAME_LITERAL.lastIndex = 0;
    while ((m = NAME_LITERAL.exec(line))) {
      const name = m[2];
      literalRefs++;
      if (allLegacyNames.has(name) || allManifestNames.has(name)) continue;
      problems.push(`${rel}:${index + 1} 引用了不存在的素材名 "${name}"（既不在任何图集，也不在素材包清单）`);
    }
    GETSPRITE_CALL.lastIndex = 0;
    while ((m = GETSPRITE_CALL.exec(line))) {
      const receiver = m[1];
      const name = m[3];
      const mapped = RECEIVER_GROUP.find(([suffix]) => receiver.endsWith(suffix));
      if (!mapped) continue; // 接收者不可判定组（参数/局部变量）→ 交给上面的全局校验
      if (!allLegacyNames.has(name) && !allManifestNames.has(name)) continue; // 已由全局校验报告
      groupRefs++;
      const group = mapped[1];
      const belongs = atlasNames[group].has(name) || manifestByGroup.get(group)?.has(name);
      if (!belongs) {
        problems.push(`${rel}:${index + 1} ${receiver}.getSprite("${name}") 跨组引用：该名存在但不在 ${group} 组（存在于 ${groupsFor(name).join('/') || '未知'}）`);
      }
    }
  });
}

console.log('素材引用审计（实测口径）：');
console.log(`  扫描源文件 ${filesScanned} 个、名字字面量 ${literalRefs} 处、可判定组调用 ${groupRefs} 处`);
console.log(`  图集名 terrain=${atlasNames.terrain.size} actors=${atlasNames.actors.size} items=${atlasNames.items.size}；素材包 ${manifest.length} 个定义`);
if (problems.length) {
  console.log(`\n✗ ${problems.length} 处引用有问题：`);
  for (const p of problems) console.log(`  - ${p}`);
  process.exit(1);
}
console.log('✓ 全部素材引用可解析（无缺失、无跨组错用）。');
