/** 显式 asset.json 包导入。自动发现帧只发生在开发期；发布静态 ESM 清单。 */
import { readdir, readFile, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ANIMATION_STATES, validateAssetDefinition } from '../src/engine/modules/rendering/asset-catalog.js';
import actorsAtlas from '../src/data/monsters-atlas.js';
import terrainAtlas from '../src/data/terrain-atlas.js';
import itemsAtlas from '../src/data/items-atlas.js';

const projectRoot = path.resolve(import.meta.dirname, '..');
const legacyNames = { actors: new Set(actorsAtlas.map(entry => entry.name)), terrain: new Set(terrainAtlas.map(entry => entry.name)), items: new Set(itemsAtlas.map(entry => entry.name)) };
const mediaExtensions = new Set(['.png', '.svg', '.webp']);
const allowedKeys = new Set(['id', 'group', 'bundle', 'enabled', 'replace', 'saveName', 'aliases', 'source', 'size', 'anchor', 'offset', 'origin', 'depthOffset', 'footprint', 'layer', 'frames', 'clips', 'fps']);
const frameKeys = new Set(['source', 'size', 'anchor', 'offset', 'origin', 'depthOffset', 'footprint', 'layer']);
const slash = value => value.split(path.sep).join('/');
const within = (base, file) => { const relative = path.relative(base, file); return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative); };
function invalid(message) { throw new Error(`素材导入失败: ${message}`); }
function checkKeys(object, allowed, label) { for (const key of Object.keys(object)) if (!allowed.has(key)) invalid(`${label}: 未知配置字段 ${key}`); }

async function walkFiles(base) {
  let entries;
  try { entries = await readdir(base, { withFileTypes: true }); } catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    if (entry.isSymbolicLink()) invalid(`不扫描符号链接 ${path.join(base, entry.name)}`);
    const full = path.join(base, entry.name);
    if (entry.isDirectory()) files.push(...await walkFiles(full));
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

/** 无额外图像依赖，读取 PNG/SVG/WebP 的真实像素画布尺寸。 */
export async function readImageSize(file) {
  const buffer = await readFile(file);
  const extension = path.extname(file).toLowerCase();
  let width, height;
  if (extension === '.png' && buffer.length >= 24 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && buffer.toString('ascii', 12, 16) === 'IHDR') {
    width = buffer.readUInt32BE(16); height = buffer.readUInt32BE(20);
  } else if (extension === '.svg') {
    const tag = buffer.toString('utf8').match(/<svg\b[^>]*>/i)?.[0];
    if (!tag) invalid(`${file}: 缺少 SVG 根元素`);
    width = Number(tag.match(/\bwidth\s*=\s*["']([\d.]+)(?:px)?["']/i)?.[1]);
    height = Number(tag.match(/\bheight\s*=\s*["']([\d.]+)(?:px)?["']/i)?.[1]);
    // viewBox 是用户坐标系，不能拿它冒充 Image.naturalWidth/Height。
    // 只有 viewBox 的 SVG 会由浏览器选默认 intrinsic 尺寸，直接裁切会截掉图像。
    if (!(width > 0 && height > 0)) invalid(`${file}: SVG 必须显式写出像素 width/height，不能只依赖 viewBox`);
  } else if (extension === '.webp' && buffer.length >= 30 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = buffer.toString('ascii', 12, 16);
    if (chunk === 'VP8X') { width = 1 + buffer.readUIntLE(24, 3); height = 1 + buffer.readUIntLE(27, 3); }
    else if (chunk === 'VP8L' && buffer[20] === 0x2f) { const bits = buffer.readUInt32LE(21); width = 1 + (bits & 0x3fff); height = 1 + ((bits >>> 14) & 0x3fff); }
    else if (chunk === 'VP8 ' && buffer[23] === 0x9d && buffer[24] === 0x01 && buffer[25] === 0x2a) { width = buffer.readUInt16LE(26) & 0x3fff; height = buffer.readUInt16LE(28) & 0x3fff; }
  }
  if (!(Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0)) invalid(`${file}: 不是支持的 PNG/SVG/WebP 图片或缺少有效尺寸`);
  return { width, height };
}

export async function loadAssetDefinitions(root = projectRoot, { includeDisabled = false } = {}) {
  const rootReal = await realpath(root);
  const assetsRoot = path.join(root, 'assets');
  const files = await walkFiles(assetsRoot);
  const packages = files.filter(file => path.basename(file) === 'asset.json');
  const definitions = [];
  const imageSizes = new Map();
  const ids = new Set();
  const namesByGroup = new Map(['actors', 'terrain', 'items'].map(group => [group, new Map()]));
  for (const manifest of packages) {
    const directory = path.dirname(manifest);
    const parsed = JSON.parse(await readFile(manifest, 'utf8'));
    const packageDefinitions = Array.isArray(parsed) ? parsed : [parsed];
    for (const raw of packageDefinitions) {
      checkKeys(raw, allowedKeys, manifest);
      if (raw.enabled !== undefined && typeof raw.enabled !== 'boolean') invalid(`${manifest}: enabled 必须是布尔值`);
      // 禁用示例仍校验媒体和配置，但不写入产品清单。
      const definition = { ...raw };
      delete definition.enabled;
      const defaultFps = definition.fps ?? 8;
      delete definition.fps;
      if (!definition.source && !definition.frames) {
        const packageFiles = files.filter(file => path.dirname(file) === directory || path.dirname(path.dirname(file)) === directory);
        const frames = {};
        const groups = new Map();
        for (const file of packageFiles.filter(file => mediaExtensions.has(path.extname(file).toLowerCase()))) {
          const match = path.basename(file).match(/^([a-z]+)_(\d+)\.(png|svg|webp)$/i);
          if (!match || !ANIMATION_STATES.includes(match[1].toLowerCase())) invalid(`${file}: 自动帧命名必须是 idle_01、walk_01 等已知动画状态`);
          const direction = path.dirname(file) === directory ? '' : path.basename(path.dirname(file));
          if (direction && !['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'].includes(direction)) invalid(`${file}: 未知动画方向目录 ${direction}`);
          const state = match[1].toLowerCase();
          const frameId = `${state}_${match[2]}${direction ? `_${direction}` : ''}`;
          if (Object.hasOwn(frames, frameId)) invalid(`${manifest}: 重复帧 ${frameId}`);
          frames[frameId] = { source: { image: slash(path.relative(directory, file)) } };
          const key = `${state}:${direction}`;
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key).push({ id: frameId, index: Number(match[2]) });
        }
        definition.frames = frames;
        const clips = definition.clips || {};
        for (const [key, entries] of groups) {
          const [state, direction] = key.split(':');
          entries.sort((a, b) => a.index - b.index);
          if (new Set(entries.map(entry => entry.index)).size !== entries.length) invalid(`${manifest}: ${key} 帧编号重复`);
          clips[state] ||= { fps: defaultFps };
          if (direction) { clips[state].directions ||= {}; clips[state].directions[direction] = entries.map(entry => entry.id); }
          else clips[state].frames = entries.map(entry => entry.id);
        }
        definition.clips = clips;
      }
      const resolveSource = async (frame, label) => {
        checkKeys(frame, frameKeys, label);
        const source = frame.source;
        if (!source || typeof source.image !== 'string') invalid(`${label}: source.image 缺失`);
        checkKeys(source, new Set(['image', 'rect']), `${label}.source`);
        if (path.isAbsolute(source.image) || /^[a-z]+:/i.test(source.image) || source.image.includes('\\')) invalid(`${label}: source.image 必须是包内相对路径，使用 /`);
        const file = path.resolve(directory, source.image);
        const fileReal = await realpath(file);
        if (!within(rootReal, fileReal)) invalid(`${label}: 图片路径越出项目目录`);
        const projectPath = slash(path.relative(root, file));
        if (!['assets/', 'spritesheet/', 'images/'].some(prefix => projectPath.startsWith(prefix))) invalid(`${label}: 图片必须放在 assets/spritesheet/images 目录`);
        if (!mediaExtensions.has(path.extname(file).toLowerCase())) invalid(`${label}: 支持 PNG/SVG/WebP`);
        if (!imageSizes.has(file)) imageSizes.set(file, await readImageSize(file));
        const dimensions = imageSizes.get(file);
        const rect = source.rect || { x: 0, y: 0, ...dimensions };
        if (source.rect) checkKeys(rect, new Set(['x', 'y', 'width', 'height']), `${label}.rect`);
        if (!Number.isFinite(rect.x) || !Number.isFinite(rect.y) || rect.x < 0 || rect.y < 0 || !(rect.width > 0 && rect.height > 0) || rect.x + rect.width > dimensions.width || rect.y + rect.height > dimensions.height) invalid(`${label}: 裁切区域超出 ${dimensions.width}×${dimensions.height} 图片`);
        frame.source = { image: projectPath, rect: { ...rect } };
      };
      if (definition.source) {
        const base = Object.fromEntries([...frameKeys].filter(key => Object.hasOwn(definition, key)).map(key => [key, definition[key]]));
        await resolveSource(base, definition.id); definition.source = base.source;
      }
      for (const [name, frame] of Object.entries(definition.frames || {})) await resolveSource(frame, `${definition.id}.${name}`);
      for (const [state, clip] of Object.entries(definition.clips || {})) {
        checkKeys(clip, new Set(['frames', 'fps', 'loop', 'directions']), `${definition.id}.${state}`);
        for (const sequence of [clip.frames, ...Object.values(clip.directions || {})].filter(Boolean)) {
          if (!Array.isArray(sequence)) invalid(`${definition.id}.${state}: 帧列表应是数组`);
          for (const frame of sequence) if (typeof frame !== 'string') await resolveSource(frame, `${definition.id}.${state}`);
        }
      }
      validateAssetDefinition(definition);
      if (raw.enabled === false && !includeDisabled) continue;
      if (ids.has(definition.id)) invalid(`重复 id ${definition.id}`);
      ids.add(definition.id);
      const aliases = [definition.id, ...(definition.aliases || []), definition.saveName, definition.replace].filter(Boolean);
      const names = namesByGroup.get(definition.group);
      for (const alias of new Set(aliases)) {
        if (names.has(alias)) invalid(`重复 alias ${definition.group}/${alias}`);
        if (legacyNames[definition.group].has(alias) && definition.replace !== alias) invalid(`${alias} 已存在，请显式声明 replace`);
        names.set(alias, definition.id);
      }
      if (definition.replace && !legacyNames[definition.group].has(definition.replace)) invalid(`${definition.id}: replace 不是已有旧资源 ${definition.replace}`);
      definitions.push(definition);
    }
  }
  return definitions;
}

export async function importAssets({ root = projectRoot, check = false } = {}) {
  const definitions = await loadAssetDefinitions(root);
  const output = path.join(root, 'src', 'data', 'assets.generated.js');
  const content = `// 由 scripts/import-assets.mjs 生成。修改 assets/**/asset.json 后运行 npm run import:assets。\nexport default ${JSON.stringify(definitions, null, 2)};\n`;
  if (check) {
    let existing;
    try { existing = await readFile(output, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (existing !== content) invalid('assets.generated.js 与素材包不一致；运行 npm run import:assets 后重试');
  } else await writeFile(output, content);
  return { definitions: definitions.length, output };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const result = await importAssets({ check: process.argv.includes('--check') });
    console.log(`✓ 素材清单${process.argv.includes('--check') ? '一致' : '已生成'}：${result.definitions} 个启用资源`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
