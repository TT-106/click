/** 产品画面样式：只处理像素和绘制，不接触游戏状态、随机流或存档。 */
export function createMapPresentation() {
  const groundCache = new WeakMap();
  const sceneryCache = new WeakMap();
  const metrics = { cachedSprites: 0, drawnSprites: 0, culledSprites: 0 };

  function terrainImage(sprite, ground) {
    const cache = ground ? groundCache : sceneryCache;
    let image = cache.get(sprite);
    if (image) return image;
    const size = sprite.spriteSheet.spriteSize;
    image = document.createElement('canvas');
    image.width = image.height = size;
    const context = image.getContext('2d', { willReadFrequently: true });
    context.drawImage(sprite.getSheetImage(), sprite.sourceX, sprite.sourceY, size, size, 0, 0, size, size);
    const pixels = context.getImageData(0, 0, size, size);
    const source = new Uint8ClampedArray(pixels.data);
    let red = 0, green = 0, blue = 0, weight = 0;
    for (let offset = 0; offset < source.length; offset += 4) {
      const alpha = source[offset + 3] / 255;
      red += source[offset] * alpha;
      green += source[offset + 1] * alpha;
      blue += source[offset + 2] * alpha;
      weight += alpha;
    }
    if (weight) {
      red /= weight; green /= weight; blue /= weight;
      const luminance = .2126 * red + .7152 * green + .0722 * blue;
      const base = [.2 * red + .35 * luminance + 10, .2 * green + .35 * luminance + 13, .2 * blue + .35 * luminance + 17];
      const detail = ground ? .16 : .48;
      const blockSize = ground ? 2 : 1;
      for (let top = 0; top < size; top += blockSize) {
        for (let left = 0; left < size; left += blockSize) {
          let blockLight = 0, blockWeight = 0;
          for (let row = top; row < Math.min(size, top + blockSize); row++) {
            for (let column = left; column < Math.min(size, left + blockSize); column++) {
              const offset = (row * size + column) * 4;
              const alpha = source[offset + 3] / 255;
              blockLight += (.2126 * source[offset] + .7152 * source[offset + 1] + .0722 * source[offset + 2]) * alpha;
              blockWeight += alpha;
            }
          }
          const variation = blockWeight ? (blockLight / blockWeight - luminance) * detail : 0;
          for (let row = top; row < Math.min(size, top + blockSize); row++) {
            for (let column = left; column < Math.min(size, left + blockSize); column++) {
              const offset = (row * size + column) * 4;
              for (let channel = 0; channel < 3; channel++) pixels.data[offset + channel] = base[channel] + variation;
              // 保留逐像素 alpha，通道、墙边和透明轮廓不会被方块采样填平。
            }
          }
        }
      }
      context.putImageData(pixels, 0, 0);
    }
    cache.set(sprite, image);
    metrics.cachedSprites++;
    return image;
  }

  function outside(context, screenX, screenY, width, height) {
    if (screenX + width <= 0 || screenY + height <= 0 || screenX >= context.canvas.width || screenY >= context.canvas.height) {
      metrics.culledSprites++;
      return true;
    }
    return false;
  }

  return {
    metrics,
    // 等角视角的前后关系只由世界坐标决定，静态墙面不能随相机参考点交换顺序。
    depthKey(worldX, worldY) { return -(worldX + worldY); },
    // 使用连续相机坐标和原格子间距，避免 27px 格边界处 13px 半格与取整余数产生反向跳动。
    cameraOffsetY(centerX, centerY, tileSize, halfTileSize) { return (centerX + centerY) / tileSize * halfTileSize; },
    drawSprite(context, sprite, screenX, screenY, size, layer = 'actor') {
      if (outside(context, screenX, screenY, size, size)) return;
      screenX = Math.round(screenX); screenY = Math.round(screenY);
      if (layer === 'ground' || layer === 'scenery') {
        context.drawImage(terrainImage(sprite, layer === 'ground'), screenX, screenY, size, size);
      } else {
        const sourceSize = sprite.spriteSheet.spriteSize;
        context.drawImage(sprite.getSheetImage(), sprite.sourceX, sprite.sourceY, sourceSize, sourceSize, screenX, screenY, size, size);
      }
      metrics.drawnSprites++;
    },
    drawAnimation(context, animation, frameIndex, screenX, screenY, size) {
      if (outside(context, screenX, screenY, size, size)) return;
      const frame = animation.frames[frameIndex];
      const sourceSize = animation.spriteSheet.spriteSize;
      const alpha = context.globalAlpha;
      context.globalAlpha = alpha * .68;
      context.drawImage(animation.getSheetImage(), frame.frameSourceX, frame.frameSourceY, sourceSize, sourceSize, Math.round(screenX), Math.round(screenY), size, size);
      context.globalAlpha = alpha;
      metrics.drawnSprites++;
    },
    drawHealthBar(context, screenX, screenY, health, maxHealth, color) {
      const party = color === '#8B008B';
      if (!party && health >= maxHealth) return;
      const left = Math.round(screenX) + 12, top = Math.round(screenY) + 2;
      context.fillStyle = '#182124';
      context.fillRect(left - 1, top - 1, 28, 4);
      context.fillStyle = party ? '#a4c48c' : color === 'red' ? '#d58b79' : '#89aec4';
      context.fillRect(left, top, Math.round(Math.max(0, Math.min(1, health / Math.max(1, maxHealth))) * 26), 2);
    },
    drawCombatText(context, texts) {
      const occupied = new Map();
      context.save();
      context.font = '11px "Microsoft YaHei UI", sans-serif';
      context.lineWidth = 3;
      context.lineJoin = 'round';
      context.strokeStyle = '#121b21';
      for (const text of texts.slice(-20)) {
        const left = Math.round(text.screenX), top = Math.round(text.screenY);
        const cell = `${Math.floor(left / 42)}:${Math.floor(top / 24)}`;
        const count = occupied.get(cell) || 0;
        if (count >= 3) continue;
        occupied.set(cell, count + 1);
        const baseline = top - count * 13;
        context.fillStyle = text.color === '#FF4444' ? '#e8a38f' : text.color === '#00FF00' ? '#b1d39b' : '#dedac2';
        context.strokeText(text.text, left, baseline);
        context.fillText(text.text, left, baseline);
      }
      context.restore();
    }
  };
}
