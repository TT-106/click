/** 角色的显示动画。播放状态留在 WeakMap 中，不写入实体、存档或战斗特效。 */
const playbackByEntity = new WeakMap();
const DEFAULT_FPS = 8;

/** frameNumber 是推进调用次数；这里使用实际累计模拟单位，暂停时自然停帧。 */
export function presentationTimeMs(turnNumber, turnTimeAccumulator) {
  return (turnNumber * 15 + turnTimeAccumulator) * (1000 / 60);
}

/** 名称表示投影后的屏幕方位。世界 +x 指向 SE，世界 +y 指向 SW。 */
export function entityDirection(deltaX, deltaY, fallback = 'SE') {
  if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY) || Math.abs(deltaX) + Math.abs(deltaY) < 1e-6) return fallback;
  if (Math.abs(deltaX) >= Math.abs(deltaY)) return deltaX >= 0 ? 'SE' : 'NW';
  return deltaY >= 0 ? 'SW' : 'NE';
}

function clipFrames(clip, direction) {
  const directional = clip?.directions?.[direction];
  return directional?.length ? directional : clip?.frames;
}

function clipDuration(clip, direction) {
  const frames = clipFrames(clip, direction);
  const fps = Number.isFinite(clip?.fps) && clip.fps > 0 ? clip.fps : DEFAULT_FPS;
  return frames?.length ? frames.length * 1000 / fps : 0;
}

function hasClip(sprite, state, direction) {
  return Boolean(clipFrames(sprite.clips[state], direction)?.length);
}

function startState(playback, state, timeMs) {
  if (state !== playback.state) {
    playback.state = state;
    playback.startedAt = timeMs;
  }
}

/** 墙壁、门、家具等物件的 idle 动画以会话时钟播放，无实体或额外播放状态。 */
export function resolveSceneVisual(sprite, timeMs, direction = 'SE') {
  const clip = sprite?.clips?.idle;
  const frames = clipFrames(clip, direction);
  if (!frames?.length) return sprite;
  const fps = Number.isFinite(clip.fps) && clip.fps > 0 ? clip.fps : DEFAULT_FPS;
  const elapsedIndex = Math.max(0, Math.floor(timeMs * fps / 1000));
  const frameIndex = clip.loop !== false ? elapsedIndex % frames.length : Math.min(elapsedIndex, frames.length - 1);
  return {
    frame: frames[frameIndex], name: sprite.name, visualResolved: true,
    getName: () => sprite.getName ? sprite.getName() : sprite.name,
    visualState: 'idle', direction, frameIndex,
  };
}

/**
 * 只读取实体的位置、死亡标记和 lastAttackTurn。没有动画时返回原精灵。
 * clips[state] = { frames, fps, loop, directions?: { NE, NW, SE, SW } }。
 * visualState 可由未来的 hurt/cast/interact 显示事件提供；同一状态默认连续播放，
 * visualToken 改变可以重播一次，方向通过 direction 显式覆盖。缺失方向回退到 frames。
 * 返回的 frame 由通用资源绘制层处理，帧尺寸、脚点锚点与朝向不影响游戏规则。
 */
export function resolveEntityVisual(entity, sprite, options) {
  if (!sprite?.clips || !entity || typeof entity !== 'object') return sprite;
  const { timeMs = 0, worldActive = false, visualState, visualToken, direction } = options || {};
  const position = worldActive ? entity.position?.worldPosition : entity.position?.levelPosition;
  const positionX = options?.x ?? position?.x ?? 0;
  const positionY = options?.y ?? position?.y ?? 0;
  let playback = playbackByEntity.get(entity);
  if (!playback || playback.sprite !== sprite || playback.worldActive !== worldActive || timeMs < playback.timeMs) {
    playback = {
      sprite, worldActive, x: positionX, y: positionY, timeMs, direction: direction || 'SE', moving: false,
      state: null, startedAt: timeMs, lastAttackTurn: entity.lastAttackTurn,
      attackStartedAt: null, explicitState: undefined, visualToken: undefined,
    };
    playbackByEntity.set(entity, playback);
  }
  if (timeMs !== playback.timeMs) {
    const deltaX = positionX - playback.x, deltaY = positionY - playback.y;
    playback.moving = Math.abs(deltaX) + Math.abs(deltaY) > 1e-6;
    playback.direction = entityDirection(deltaX, deltaY, playback.direction);
  }
  playback.direction = direction || playback.direction;
  playback.x = positionX; playback.y = positionY; playback.timeMs = timeMs;

  if (entity.lastAttackTurn !== playback.lastAttackTurn) {
    // 回退是恢复/重置，不能把历史攻击当作新一次攻击。
    if (Number.isFinite(entity.lastAttackTurn) && entity.lastAttackTurn > playback.lastAttackTurn && hasClip(sprite, 'attack', playback.direction)) {
      playback.attackStartedAt = timeMs;
      playback.state = 'attack';
      playback.startedAt = timeMs;
    }
    playback.lastAttackTurn = entity.lastAttackTurn;
  }
  let state = playback.moving ? 'walk' : 'idle';
  if (playback.attackStartedAt !== null) {
    const elapsed = timeMs - playback.attackStartedAt;
    if (elapsed < clipDuration(sprite.clips.attack, playback.direction)) state = 'attack';
    else playback.attackStartedAt = null;
  }
  if (entity.isDead) state = 'death';
  if (visualState) state = visualState;
  if (visualState !== playback.explicitState || visualToken !== playback.visualToken) {
    if (visualState) {
      playback.state = null;
      playback.startedAt = timeMs;
    }
    playback.explicitState = visualState;
    playback.visualToken = visualToken;
  }
  if (!hasClip(sprite, state, playback.direction)) state = hasClip(sprite, 'idle', playback.direction) ? 'idle' : null;
  if (!state) return sprite;
  startState(playback, state, timeMs);
  const clip = sprite.clips[state], frames = clipFrames(clip, playback.direction);
  const fps = Number.isFinite(clip.fps) && clip.fps > 0 ? clip.fps : DEFAULT_FPS;
  const loop = clip.loop ?? (state === 'idle' || state === 'walk');
  const elapsedIndex = Math.max(0, Math.floor((timeMs - playback.startedAt) * fps / 1000));
  const frameIndex = loop ? elapsedIndex % frames.length : Math.min(elapsedIndex, frames.length - 1);
  return {
    frame: frames[frameIndex], name: sprite.name, visualResolved: true,
    getName: () => sprite.getName ? sprite.getName() : sprite.name,
    visualState: state, direction: playback.direction, frameIndex,
  };
}
