import { resolveAnimationFrame, resolveSpriteFrame } from './frame.js';

// 历史 UI 的裁切窗口集中在兼容适配器；独图和新 atlas 都使用归一帧预览。
const presets = {
  portrait: { group: 'actors', x: 10, y: 12, width: 35, height: 35 },
  monster: { group: 'actors', x: 0, y: 10, width: 52, height: 30 },
  expedition: { group: 'actors', x: 0, y: 8, width: 54, height: 35 },
  terrain: { group: 'terrain', x: 0, y: 0, width: 54, height: 54 },
  icon: { group: 'items', x: 0, y: 0, width: 32, height: 32 },
  effect: { group: 'items', x: 0, y: 0, width: 30, height: 30 },
  spell: { group: 'items', x: 0, y: 0, width: 29, height: 29 },
  summon: { group: 'actors', x: 10, y: 12, width: 29, height: 29 },
  sacrifice: { group: 'terrain', x: 12, y: 25, width: 30, height: 15 },
  goldCost: { group: 'items', x: 0, y: 3, width: 30, height: 15 }
};
const legacyUrls = { actors: 'spritesheet/monsters.png', terrain: 'spritesheet/terrain.png', items: 'spritesheet/items.png' };
const previewCache = new WeakMap();
let previewCatalog = null;

/** 组合根提供稳定目录；预览不依赖游戏实例。 @param {any} catalog */
export function bindAssetPreviews(catalog) { previewCatalog = catalog; }

/** @param {any} sprite */
export function getSpritePreview(sprite, presetName = 'portrait') {
  const preset = presets[presetName];
  if (!preset) throw new Error(`未知素材预览类型: ${presetName}`);
  sprite = previewCatalog?.resolve(sprite, preset.group) || sprite;
  if (!sprite.frame) {
    return {
      url: sprite.getSheetImage?.()?.src || legacyUrls[preset.group],
      x: sprite.sourceX + preset.x, y: sprite.sourceY + preset.y,
      width: preset.width, height: preset.height
    };
  }
  const frame = resolveSpriteFrame(sprite);
  let previews = previewCache.get(frame);
  if (!previews) { previews = new Map(); previewCache.set(frame, previews); }
  if (!previews.has(presetName)) {
    const canvas = document.createElement('canvas');
    canvas.width = preset.width; canvas.height = preset.height;
    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;
    const source = frame.source;
    const scale = Math.min(preset.width / frame.size.width, preset.height / frame.size.height);
    const width = frame.size.width * scale, height = frame.size.height * scale;
    context.drawImage(frame.image, source.x, source.y, source.width, source.height, (preset.width - width) / 2, (preset.height - height) / 2, width, height);
    previews.set(presetName, { url: canvas.toDataURL(), x: 0, y: 0, width: preset.width, height: preset.height });
  }
  return previews.get(presetName);
}

/** @param {any} sprite */
export function spriteBackground(sprite, presetName = 'portrait') {
  const preview = getSpritePreview(sprite, presetName);
  return `url(${JSON.stringify(preview.url)}) -${preview.x}px -${preview.y}px`;
}

/** 动画图标只消费帧；旧特效的播放时序和伤害结算保持在模拟层。 @param {any} animation */
export function animationBackground(animation, index, presetName = 'effect') {
  const frame = resolveAnimationFrame(animation, index);
  if (animation.frames[index].image) return spriteBackground({ frame }, presetName);
  return `url(${JSON.stringify(frame.image.src)}) -${frame.source.x}px -${frame.source.y}px`;
}
