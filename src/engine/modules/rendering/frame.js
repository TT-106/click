/** 绘制只消费帧描述；旧图集的方格和坐标在此适配，不传播到场景或 UI。 */
const legacySprites = new WeakMap();
const legacyAnimations = new WeakMap();

/** @param {any} sprite */
export function resolveSpriteFrame(sprite) {
  if (sprite.frame) return sprite.frame;
  let frame = legacySprites.get(sprite);
  if (!frame) {
    const size = sprite.spriteSheet.spriteSize;
    frame = legacyFrame(sprite.getSheetImage(), sprite.sourceX, sprite.sourceY, size);
    legacySprites.set(sprite, frame);
  }
  return frame;
}

/** @param {any} animation @param {number} index */
export function resolveAnimationFrame(animation, index) {
  const source = animation.frames[index];
  if (!source) throw new Error(`动画 ${animation.animationName || animation.id || ''} 缺少第 ${index} 帧`);
  if (source.image && source.source) return source;
  let frame = legacyAnimations.get(source);
  if (!frame) {
    frame = legacyFrame(animation.getSheetImage(), source.frameSourceX, source.frameSourceY, animation.spriteSheet.spriteSize);
    legacyAnimations.set(source, frame);
  }
  return frame;
}

function legacyFrame(image, sourceX, sourceY, size) {
  return {
    image, source: { x: sourceX, y: sourceY, width: size, height: size },
    size: { width: size, height: size }, anchor: { x: 0, y: 0 },
    origin: { x: 0, y: 0 }, offset: { x: 0, y: 0 }, depthOffset: { x: 0, y: 0 },
    footprint: { columns: 1, rows: 1 }
  };
}

/** @param {any} sprite */
export function spriteRenderSize(sprite) { return resolveSpriteFrame(sprite).size.width; }
/** @param {any} animation */
export function animationRenderSize(animation) { return resolveAnimationFrame(animation, 0).size.width; }

/** 锚点使用目标逻辑像素；renderSize 仅兼容旧调用的等比缩放，省略即自然尺寸。
 * @param {any} frame
 */
export function frameGeometry(frame, screenX, screenY, renderSize = frame.size.width) {
  const scale = renderSize / frame.size.width;
  return {
    x: screenX + frame.origin.x + (frame.offset.x - frame.anchor.x) * scale,
    y: screenY + frame.origin.y + (frame.offset.y - frame.anchor.y) * scale,
    width: frame.size.width * scale, height: frame.size.height * scale
  };
}

/** @param {CanvasRenderingContext2D} context @param {any} frame */
export function drawFrame(context, frame, screenX, screenY, renderSize = frame.size.width) {
  const bounds = frameGeometry(frame, screenX, screenY, renderSize);
  const source = frame.source;
  context.drawImage(frame.image, source.x, source.y, source.width, source.height, bounds.x, bounds.y, bounds.width, bounds.height);
}

/** @param {CanvasRenderingContext2D} context @param {any} sprite */
export function drawSpriteFrame(context, sprite, screenX, screenY, renderSize) {
  drawFrame(context, resolveSpriteFrame(sprite), screenX, screenY, renderSize);
}

/** @param {CanvasRenderingContext2D} context @param {any} animation */
export function drawAnimationFrame(context, animation, index, screenX, screenY, renderSize) {
  drawFrame(context, resolveAnimationFrame(animation, index), screenX, screenY, renderSize);
}
