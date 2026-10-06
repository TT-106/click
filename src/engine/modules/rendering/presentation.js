import { frameGeometry, resolveAnimationFrame, resolveSpriteFrame } from './frame.js';
/** 产品画面样式：只处理像素和绘制，不接触游戏状态、随机流或存档。 */
export function createMapPresentation() {
  const groundCache = new WeakMap();
  const sceneryCache = new WeakMap();
  const spriteCache = new WeakMap();
  const frameCache = new WeakMap();
  const rasterCache = new WeakMap();
  let scaleX = 1, scaleY = 1;
  const metrics = { cachedSprites: 0, drawnSprites: 0, culledSprites: 0 };

  function terrainImage(sprite, ground) {
    const cache = ground ? groundCache : sceneryCache;
    const frame = resolveSpriteFrame(sprite);
    let image = cache.get(frame);
    if (image) return image;
    image = document.createElement('canvas');
    image.width = frame.source.width; image.height = frame.source.height;
    const context = image.getContext('2d');
    const source = frame.source;
    context.drawImage(frame.image, source.x, source.y, source.width, source.height, 0, 0, image.width, image.height);
    cache.set(frame, image);
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

  function sourceImage(frame, cache) {
    let image = cache.get(frame);
    if (!image) {
      image = document.createElement('canvas');
      const source = frame.source;
      image.width = source.width; image.height = source.height;
      image.getContext('2d').drawImage(frame.image, source.x, source.y, source.width, source.height, 0, 0, source.width, source.height);
      cache.set(frame, image);
    }
    return image;
  }

  function rasterImage(image, width, height, ground) {
    if (image.width === width && image.height === height) return image;
    let raster = rasterCache.get(image);
    if (!raster || raster.width !== width || raster.height !== height) {
      raster = document.createElement('canvas');
      raster.width = width; raster.height = height;
      const context = raster.getContext('2d');
      context.imageSmoothingEnabled = false;
      context.drawImage(image, 0, 0, width, height);
      if (ground && (width % image.width || height % image.height)) {
        // 缩放后的菱形透明边缘可能留下 1px 接缝；只为地面缓存补一圈邻色像素。
        const pixels = context.getImageData(0, 0, width, height);
        const source = new Uint8ClampedArray(pixels.data);
        for (let row = 0; row < height; row++) for (let column = 0; column < width; column++) {
          const offset = (row * width + column) * 4;
          if (source[offset + 3]) continue;
          const neighbors = [column > 0 ? offset - 4 : -1, column + 1 < width ? offset + 4 : -1, row > 0 ? offset - width * 4 : -1, row + 1 < height ? offset + width * 4 : -1];
          const adjacent = neighbors.find(neighbor => neighbor >= 0 && source[neighbor + 3]);
          if (adjacent !== undefined) pixels.data.set(source.subarray(adjacent, adjacent + 4), offset);
        }
        context.putImageData(pixels, 0, 0);
      }
      rasterCache.set(image, raster);
    }
    return raster;
  }

  function paint(context, image, screenX, screenY, renderWidth, renderHeight, ground = false) {
    const left = Math.round(screenX * scaleX), top = Math.round(screenY * scaleY);
    const width = Math.max(1, Math.round(renderWidth * scaleX)), height = Math.max(1, Math.round(renderHeight * scaleY));
    if (outside(context, left, top, width, height)) return;
    // 精灵固定重采样一次，再按物理像素平移，避免采样相位随位置改变。
    const raster = rasterImage(image, width, height, ground);
    context.save();
    context.resetTransform();
    context.drawImage(raster, left, top);
    context.restore();
    metrics.drawnSprites++;
  }

  return {
    metrics,
    beginFrame(context) {
      const transform = context.getTransform();
      scaleX = transform.m11; scaleY = transform.m22;
    },
    // 等角视角的前后关系只由世界坐标决定，静态墙面不能随相机参考点交换顺序。
    depthKey(worldX, worldY) { return -(worldX + worldY); },
    // 世界地形锚点和相机偏移分别吸附屏幕像素，整层地形共用平移，不逐块改变采样相位。
    tileScreenX(column, row, centerX, centerY, tileSize, viewportHalfWidth) {
      return (Math.round((column - row) * tileSize * scaleX) + Math.round((viewportHalfWidth - centerX + centerY) * scaleX)) / scaleX;
    },
    tileScreenY(column, row, centerX, centerY, tileSize, halfTileSize, viewportHalfHeight) {
      const cameraY = viewportHalfHeight - (centerX + centerY) / tileSize * halfTileSize;
      return (Math.round((column + row) * halfTileSize * scaleY) + Math.round(cameraY * scaleY)) / scaleY;
    },
    drawSprite(context, sprite, screenX, screenY, size, layer = 'actor') {
      const frame = resolveSpriteFrame(sprite);
      const bounds = frameGeometry(frame, screenX, screenY, size);
      if (outside(context, Math.round(bounds.x * scaleX), Math.round(bounds.y * scaleY), Math.round(bounds.width * scaleX), Math.round(bounds.height * scaleY))) return;
      let image;
      if (layer === 'ground' || layer === 'scenery') {
        image = terrainImage(sprite, layer === 'ground');
      } else {
        image = sourceImage(frame, spriteCache);
      }
      paint(context, image, bounds.x, bounds.y, bounds.width, bounds.height, layer === 'ground');
    },
    drawAnimation(context, animation, frameIndex, screenX, screenY, size) {
      const frame = resolveAnimationFrame(animation, frameIndex);
      const bounds = frameGeometry(frame, screenX, screenY, size);
      if (outside(context, Math.round(bounds.x * scaleX), Math.round(bounds.y * scaleY), Math.round(bounds.width * scaleX), Math.round(bounds.height * scaleY))) return;
      const image = sourceImage(frame, frameCache);
      const alpha = context.globalAlpha;
      context.globalAlpha = alpha * .68;
      paint(context, image, bounds.x, bounds.y, bounds.width, bounds.height);
      context.globalAlpha = alpha;
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
