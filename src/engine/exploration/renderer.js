import { drawFrame, resolveSpriteFrame, frameGeometry } from '../modules/rendering/frame.js';
import { projectMap, visualDepthPosition } from '../modules/rendering/projection.js';
import { resolveEntityVisual, resolveSceneVisual } from '../modules/rendering/entity-visual.js';
import { cellKey } from './navigation.js';
import { orderSceneCommands } from './occlusion.js';
import { FOREST_VILLAGE_GROUND, FOREST_VILLAGE_BLENDS, FOREST_VILLAGE_SURFACES } from './theme.js';
import { buildGroundPatches } from './terrain-contours.js';
import { TILE_SIZE, HALF_TILE_SIZE, VIEWPORT_HALF_WIDTH, VIEWPORT_HALF_HEIGHT } from '../modules/core/screen-layout.js';
import { EXPEDITION_ITEMS } from '../../data/expedition-items.js';

/** 资源只在此解析成绘制帧。生成器没有图片路径、裁切坐标或绘制命令。 */
export class ExplorationRenderer {
  constructor(canvas, assets, heroes) {
    this.canvas = canvas; this.context = canvas.getContext('2d'); this.assets = assets; this.heroes = heroes;
    this.actorStates = heroes.map(() => ({})); this.overview = false; this.commands = []; this.hiddenRoofs = 0;
    this.camera = null;
  }

  draw(session) {
    const { canvas, context, assets } = this, { world } = session;
    const width = Math.max(1, canvas.clientWidth), height = canvas.clientHeight || 520, density = Math.min(3, window.devicePixelRatio || 1);
    if (canvas.width !== Math.round(width * density) || canvas.height !== Math.round(height * density)) { canvas.width = Math.round(width * density); canvas.height = Math.round(height * density); }
    context.setTransform(density, 0, 0, density, 0, 0); context.fillStyle = '#31452c'; context.fillRect(0, 0, width, height);
    const positions = session.displayMembers(), leader = positions[0];
    const zoom = this.overview ? Math.min(width / ((world.width + world.height) * TILE_SIZE + 70), height / ((world.width + world.height) * HALF_TILE_SIZE + 130)) : 1.25;
    const center = this.overview ? { x: (world.originX || 0) + (world.width - 1) / 2, y: (world.originY || 0) + (world.height - 1) / 2 } : leader;
    context.translate(width / 2 - VIEWPORT_HALF_WIDTH * zoom, height / 2 - VIEWPORT_HALF_HEIGHT * zoom); context.scale(zoom, zoom);
    this.camera = { x: center.x * TILE_SIZE, y: center.y * TILE_SIZE };
    const project = (x, y) => projectMap(x * TILE_SIZE, y * TILE_SIZE, this.camera.x, this.camera.y);
    const tile = (x, y, color) => {
      const point = project(x, y), paint = this.context;
      paint.beginPath(); paint.moveTo(point.x, point.y - HALF_TILE_SIZE); paint.lineTo(point.x + TILE_SIZE, point.y);
      paint.lineTo(point.x, point.y + HALF_TILE_SIZE); paint.lineTo(point.x - TILE_SIZE, point.y); paint.closePath(); paint.fillStyle = color; paint.fill();
    };
    const radius = (width / (2 * zoom) + 70) / (2 * TILE_SIZE) + (height / (2 * zoom) + 200) / (2 * HALF_TILE_SIZE);
    const bounds = { left: Math.max(world.originX || 0, Math.floor(center.x - radius)), top: Math.max(world.originY || 0, Math.floor(center.y - radius)),
      right: Math.min((world.originX || 0) + world.width, Math.ceil(center.x + radius)), bottom: Math.min((world.originY || 0) + world.height, Math.ceil(center.y + radius)) };
    const visible = (x, y, margin = 240) => {
      const point = project(x, y);
      return Math.abs(point.x - VIEWPORT_HALF_WIDTH) * zoom < width / 2 + margin * zoom
        && Math.abs(point.y - VIEWPORT_HALF_HEIGHT) * zoom < height / 2 + margin * zoom;
    };
    this.drawGroundSurface(session, project, tile, bounds, visible, { width, height, density, zoom });
    const commands = []; this.hiddenRoofs = 0;
    const add = (sprite, x, y, id, type, extra = {}) => {
      if (!sprite) return;
      const frame = resolveSpriteFrame(sprite), point = project(x, y), depth = visualDepthPosition(x * TILE_SIZE, y * TILE_SIZE, frame);
      commands.push({ frame, x: point.x, y: point.y, worldX: x, worldY: y, depth: depth.x + depth.y, id, type, ...extra });
    };
    for (const object of world.objects) {
      if (!visible(object.x, object.y)) continue;
      if (!session.discovered.has(cellKey(object.x, object.y))) continue;
      const inside = session.inside.has(object.building);
      if (object.exterior && inside) { this.hiddenRoofs++; continue; }
      if (object.building && !object.exterior && !inside) continue;
      const sprite = assets.resolve(object.door ? 'village.door.se' : object.visualId, 'terrain');
      const building = object.exterior ? world.buildings.find(entry => entry.id === object.building) : null;
      const occlusionBounds = building ? { left: building.left - .5, top: building.top - .5, right: building.left + building.width - .5, bottom: building.top + building.height - .5 } : null;
      add(resolveSceneVisual(sprite, session.timeMs), object.x, object.y, object.id, object.exterior ? 'building' : 'object', { occlusionBounds, canopy: object.canopy, alpha: object.cutaway && inside ? .2 : 1 });
    }
    for (const node of session.resources?.() || []) {
      if (!visible(node.x, node.y) || !session.discovered.has(cellKey(node.x, node.y))) continue;
      const area = world.cells[(node.y - world.originY) * world.width + node.x - world.originX]?.area;
      if (area?.startsWith('structure:') && !session.inside.has(area)) continue;
      const frame = assets.resolve(EXPEDITION_ITEMS[node.itemId].icon, 'items')?.frame;
      if (frame) add({ frame: { ...frame, size: { width: 22, height: 22 }, anchor: { x: 11, y: 18 }, origin: { x: 0, y: 0 } } }, node.x, node.y, node.id, 'object');
    }
    positions.forEach((position, index) => {
      const hero = this.heroes[index];
      const gathering = session.expedition?.holdMs > 0 && session.expedition.lastPickup?.member === index;
      const sprite = resolveEntityVisual(this.actorStates[index], hero.sprite, { timeMs: session.timeMs, x: position.x, y: position.y, visualState: gathering ? 'interact' : undefined, visualToken: gathering ? session.expedition.lastPickup.timeMs : undefined });
      const original = resolveSpriteFrame(sprite);
      // 经典角色描述使用左上角基点；这里明确适配为脚点。新角色帧直接使用自己的锚点。
      const frame = hero.sprite.id ? { ...original, origin: { x: 0, y: 0 } } : { ...original, origin: { x: 0, y: 0 }, anchor: { x: 27, y: 40 } };
      add({ frame }, position.x, position.y, `hero-${index}`, 'actor');
    });
    const sorted = orderSceneCommands(commands);
    const actors = [];
    for (const command of sorted) {
      const rectangle = frameGeometry(command.frame, command.x, command.y);
      const coversParty = command.canopy && actors.some(actor => actor.x < rectangle.x + rectangle.width && actor.x + actor.width > rectangle.x
        && actor.y < rectangle.y + rectangle.height && actor.y + actor.height > rectangle.y);
      context.globalAlpha = coversParty ? .35 : command.alpha ?? 1;
      drawFrame(context, command.frame, command.x, command.y);
      if (command.type === 'actor') actors.push(rectangle);
    }
    context.globalAlpha = 1;
    if (session.expedition && visible(session.expedition.camp.x, session.expedition.camp.y) && session.discovered.has(cellKey(session.expedition.camp.x, session.expedition.camp.y))) {
      const camp = project(session.expedition.camp.x, session.expedition.camp.y);
      context.strokeStyle = '#d1ba80'; context.lineWidth = 1;
      context.beginPath(); context.ellipse(camp.x, camp.y, 19, 9, 0, 0, Math.PI * 2); context.stroke();
      context.font = '10px "Microsoft YaHei", sans-serif'; context.textAlign = 'center'; context.fillStyle = '#ffe1a0'; context.fillText('营地', camp.x, camp.y + 20);
    }
    // 标记只显示已知兴趣点；用脚点投影避免绑定某张图片的高度。
    context.font = '10px "Microsoft YaHei", sans-serif'; context.textAlign = 'center';
    for (const point of world.points) {
      if (!visible(point.x, point.y)) continue;
      if (!session.discovered.has(cellKey(point.x, point.y))) continue;
      const screen = project(point.x, point.y); const done = session.completedPoints.has(point.id);
      context.fillStyle = done ? '#cfdfaa' : '#ffe1a0'; context.fillText(done ? `✓ ${point.label}` : point.label, screen.x, screen.y - 42);
    }
    this.commands = sorted;
    context.setTransform(density, 0, 0, density, 0, 0);
    // 小地图只投影已经发现的地表，避免提前泄漏河与桥的位置。
    const size = Math.min(3, 120 / world.width), left = width - world.width * size - 16, top = 16;
    context.fillStyle = '#101912d9'; context.fillRect(left - 6, top - 6, world.width * size + 12, world.height * size + 12);
    if (this.minimapWorld !== world || this.minimapDiscovered !== session.discovered.size) {
      this.minimapWorld = world; this.minimapDiscovered = session.discovered.size;
      this.minimap ||= document.createElement('canvas'); this.minimap.width = Math.ceil(world.width * size); this.minimap.height = Math.ceil(world.height * size);
      const miniature = this.minimap.getContext('2d');
      for (const cell of world.cells) if (session.discovered.has(cellKey(cell.x, cell.y))) {
        miniature.fillStyle = cell.kind === 'water' ? '#5b8fa4' : cell.walkable ? '#aab680' : '#43553c';
        miniature.fillRect((cell.x - (world.originX || 0)) * size, (cell.y - (world.originY || 0)) * size, size, size);
      }
    }
    context.drawImage(this.minimap, left, top);
    context.fillStyle = '#ffe3ac'; context.fillRect(left + (leader.x - (world.originX || 0)) * size - 1, top + (leader.y - (world.originY || 0)) * size - 1, 5, 5);
  }

  /** 缓存视口周围的一圈静态地表；相机平移只搬运缓存，不逐帧重画数千条轮廓。 */
  drawGroundSurface(session, project, tile, bounds, visible, { width, height, density, zoom }) {
    const padding = 120, origin = project(0, 0);
    const key = `${session.discovered.size}:${[...session.inside].sort().join(',')}:${width},${height},${density},${zoom}`;
    const shifted = this.surfaceOrigin && (Math.abs(origin.x - this.surfaceOrigin.x) * zoom > padding / 2 || Math.abs(origin.y - this.surfaceOrigin.y) * zoom > padding / 2);
    if (this.surfaceWorld !== session.world || this.surfaceKey !== key || shifted) {
      this.surface ||= document.createElement('canvas');
      this.surface.width = Math.ceil((width + padding * 2) * density); this.surface.height = Math.ceil((height + padding * 2) * density);
      const surface = this.surface.getContext('2d'), main = this.context;
      surface.setTransform(density, 0, 0, density, 0, 0); surface.fillStyle = '#31452c'; surface.fillRect(0, 0, width + padding * 2, height + padding * 2);
      surface.translate(padding + width / 2 - VIEWPORT_HALF_WIDTH * zoom, padding + height / 2 - VIEWPORT_HALF_HEIGHT * zoom); surface.scale(zoom, zoom);
      const extra = Math.ceil(padding / (2 * zoom * TILE_SIZE) + padding / (2 * zoom * HALF_TILE_SIZE));
      const extended = { left: bounds.left - extra, top: bounds.top - extra, right: bounds.right + extra, bottom: bounds.bottom + extra };
      this.context = surface;
      try { this.drawGround(session, project, tile, extended, (x, y, margin) => visible(x, y, margin + padding / zoom)); }
      finally { this.context = main; }
      this.surfaceWorld = session.world; this.surfaceKey = key; this.surfaceOrigin = origin;
    }
    const context = this.context;
    context.save(); context.setTransform(density, 0, 0, density, 0, 0);
    context.drawImage(this.surface, (origin.x - this.surfaceOrigin.x) * zoom - padding, (origin.y - this.surfaceOrigin.y) * zoom - padding,
      this.surface.width / density, this.surface.height / density);
    context.restore();
  }

  drawGround(session, project, tile, bounds, visible) {
    const { world, discovered, inside } = session, { context, assets } = this;
    const key = `${discovered.size}:${[...inside].sort().join(',')}:${bounds.left},${bounds.top},${bounds.right},${bounds.bottom}`;
    // 地图在会话内不变；只在发现范围或室内状态变化时重建地表连接，不逐帧计算。
    if (this.groundWorld !== world) {
      this.groundWorld = world; this.groundKey = null;
      this.groundCells = [...world.cells].sort((a, b) => a.x + a.y - b.x - b.y || a.y - b.y);
    }
    if (this.groundKey !== key) { this.groundKey = key; this.groundPatches = buildGroundPatches(world, discovered, inside, FOREST_VILLAGE_BLENDS, bounds); }
    const paint = (kind, variant, x, y) => {
      const variants = FOREST_VILLAGE_GROUND[kind] || [], sprite = assets.resolve(variants[variant % variants.length], 'terrain');
      const point = project(x, y);
      if (sprite) { const frame = resolveSpriteFrame(sprite); drawFrame(context, frame, point.x, point.y, frame.size.width + .65); }
      else tile(x, y, '#77894e');
    };
    for (const cell of this.groundCells) {
      if (!visible(cell.x, cell.y, 35)) continue;
      if (!discovered.has(cellKey(cell.x, cell.y))) { tile(cell.x, cell.y, '#31452c'); continue; }
      paint('grass', cell.variant || 0, cell.x, cell.y);
    }
    for (const style of FOREST_VILLAGE_BLENDS) {
      const patches = this.groundPatches.filter(patch => patch.layer === style.kind);
      context.save(); context.beginPath();
      for (const patch of patches) for (const contour of patch.contours) for (const [operation, ...coordinates] of contour) {
        if (operation === 'Z') { context.closePath(); continue; }
        const point = project(patch.x + coordinates[0], patch.y + coordinates[1]);
        if (operation === 'M') context.moveTo(point.x, point.y);
        else if (operation === 'L') context.lineTo(point.x, point.y);
        else { const end = project(patch.x + coordinates[2], patch.y + coordinates[3]); context.quadraticCurveTo(point.x, point.y, end.x, end.y); }
      }
      if (style.gradient && !world.continuous) {
        const start = project(world.originX || 0, world.originY || 0), end = project((world.originX || 0) + world.width, (world.originY || 0) + world.height), gradient = context.createLinearGradient(start.x, start.y, end.x, end.y);
        gradient.addColorStop(0, style.gradient[0]); gradient.addColorStop(1, style.gradient[1]); context.fillStyle = gradient;
      } else context.fillStyle = style.color;
      context.fill(); context.clip();
      const texture = (kind, alpha) => {
        if (!alpha) return;
        const pattern = this.groundPattern(kind);
        if (!pattern) return;
        const origin = project(0, 0);
        pattern.setTransform(new DOMMatrix().translate(origin.x - TILE_SIZE, origin.y - HALF_TILE_SIZE).scale(.5));
        context.globalAlpha = alpha; context.fillStyle = pattern; context.fill();
      };
      // 整层一次填充，避免逐块半透明叠加造成方格线；纹理固定在世界坐标，不随相机滑动。
      texture(style.kind, style.textureAlpha);
      if (style.detail) texture(style.detail.kind, style.detail.alpha);
      if (style.ripples) {
        context.globalAlpha = style.ripples.alpha; context.strokeStyle = style.ripples.color; context.lineWidth = .6; context.beginPath();
        for (const patch of patches) {
          const length = style.ripples.length, center = { x: patch.x + .5, y: patch.y + .5 };
          const start = project(center.x - length, center.y + length), middle = project(center.x, center.y + .07), end = project(center.x + length, center.y - length);
          context.moveTo(start.x, start.y); context.quadraticCurveTo(middle.x, middle.y, end.x, end.y);
        }
        context.stroke();
      }
      context.restore();
    }
    // 完整桥面和室内地板在连续自然地表上方，脚点仍落在同一投影平面。
    for (const cell of this.groundCells) {
      if (!visible(cell.x, cell.y, 80)) continue;
      if (!discovered.has(cellKey(cell.x, cell.y))) continue;
      const kind = cell.outsideKind && !inside.has(cell.area) ? cell.outsideKind : cell.kind;
      if (FOREST_VILLAGE_SURFACES.includes(kind)) paint(kind, cell.variant || 0, cell.x, cell.y);
    }
  }

  groundPattern(kind) {
    const id = FOREST_VILLAGE_GROUND[kind]?.[0], sprite = this.assets.resolve(id, 'terrain');
    if (!sprite) return null;
    const frame = resolveSpriteFrame(sprite);
    this.groundTextures ||= new WeakMap();
    if (!this.groundTextures.has(frame)) {
      const texture = document.createElement('canvas'); texture.width = TILE_SIZE * 4; texture.height = HALF_TILE_SIZE * 4;
      const context = texture.getContext('2d'); context.scale(2, 2);
      // 五个同源菱形覆盖一个矩形重复单元；原 PNG 和 atlas 描述不变。
      for (const [x, y] of [[TILE_SIZE, HALF_TILE_SIZE], [0, 0], [TILE_SIZE * 2, 0], [0, HALF_TILE_SIZE * 2], [TILE_SIZE * 2, HALF_TILE_SIZE * 2]]) drawFrame(context, frame, x, y, frame.size.width + .65);
      this.groundTextures.set(frame, this.context.createPattern(texture, 'repeat'));
    }
    return this.groundTextures.get(frame);
  }
}
