import { NaturalWorld } from './natural-world.js';
import { TileHistory } from './tile-history.js';
import { WORLD_CHUNK_SIZE, WORLD_GENERATOR_VERSION } from './natural-terrain.js';
import { cellAt, cellKey, neighbors, pathField, pathFrom } from './navigation.js';
import { Expedition } from './expedition.js';
import { resourceAt } from './resources.js';

export const OPEN_WORLD_SAVE_KEY = 'C2_OPEN_WORLD_V1';
// 备份键与经典档 C2_V1_001_backup 同一套纪律：原野记录原先每 1.5 秒原地覆盖且无任何备份，
// 迁移或版本升级一旦出错就没有回退点。
export const OPEN_WORLD_BACKUP_KEY = OPEN_WORLD_SAVE_KEY + '_backup';
// 最近一次恢复/坏档重开前的原文；与可用备份分开，坏档不能顶掉恢复点。
export const OPEN_WORLD_RECOVERY_KEY = OPEN_WORLD_SAVE_KEY + '_before_recovery';
const BIOMES = { forest: '林地', meadow: '草原', wetland: '河岸湿地', highland: '高地' };
const validPosition = value => value && Number.isInteger(value.x) && Number.isInteger(value.y) && Math.abs(value.x) <= 999900 && Math.abs(value.y) <= 999900;
const adjacent = (left, right) => Math.abs(left.x - right.x) + Math.abs(left.y - right.y);

/** 自动探索连续世界；逻辑位置用全局格坐标，活动窗口只供导航和绘制。 */
export class OpenWorldSession {
  constructor(seed = '原野-01', count = 4, { expedition = false, ownerIds } = {}) {
    this.generator = new NaturalWorld(seed);
    const entrance = this.generator.findEntrance();
    this.members = Array.from({ length: Math.min(6, Math.max(1, count)) }, () => ({ ...entrance }));
    this.world = this.generator.ensureAround(entrance);
    this.discovered = new TileHistory(); this.visited = new TileHistory();
    this.knownPoints = new Set(); this.completedPoints = new Set();
    this.path = []; this.target = null; this.trail = []; this.progress = 0; this.timeMs = 0;
    this.paused = false; this.complete = false; this.waiting = false; this.inside = new Set(); this.log = [];
    this.expedition = expedition ? new Expedition(entrance, this.members.length, ownerIds) : null;
    this.reveal();
  }

  reveal() {
    const leader = this.members[0];
    this.world = this.generator.ensureAround(leader);
    this.visited.add(cellKey(leader.x, leader.y));
    const sight = pathField(this.world, leader, () => true, 4);
    for (const key of sight.distances.keys()) {
      this.discovered.add(key);
      const [x, y] = key.split(',').map(Number);
      for (const [column, row] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        const cell = cellAt(this.world, column, row);
        if (cell && !cell.walkable) this.discovered.add(cellKey(column, row));
      }
    }
    this.inside = new Set(this.members.map(member => cellAt(this.world, member.x, member.y)?.area).filter(area => this.world.buildings.some(building => building.id === area)));
    for (const point of this.world.points) {
      if (this.discovered.has(cellKey(point.x, point.y))) this.knownPoints.add(point.id);
      if (point.x === leader.x && point.y === leader.y && !this.completedPoints.has(point.id)) {
        this.completedPoints.add(point.id); this.log.unshift(`到访 ${point.label}`); this.log.length = Math.min(8, this.log.length);
      }
    }
  }

  chooseTarget() {
    if (this.expedition?.phase === 'returning') {
      this.target = { ...this.expedition.camp, label: '带着收获返回营地' };
      this.path = this.expedition.route.slice(0, -1).reverse().map(point => ({ ...point }));
      this.waiting = false; return;
    }
    const leader = this.members[0], known = key => this.discovered.has(key);
    const field = pathField(this.world, leader, known), frontiers = [];
    for (const key of field.distances.keys()) {
      const [x, y] = key.split(',').map(Number);
      const unexplored = neighbors(this.world, x, y).some(([column, row]) => !known(cellKey(column, row)));
      const boundary = x === this.world.originX || y === this.world.originY || x === this.world.originX + this.world.width - 1 || y === this.world.originY + this.world.height - 1;
      if (unexplored || boundary) frontiers.push({ x, y, label: '探索新地貌' });
    }
    const nearest = candidates => candidates.filter(point => field.distances.has(cellKey(point.x, point.y)))
      .sort((a, b) => field.distances.get(cellKey(a.x, a.y)) - field.distances.get(cellKey(b.x, b.y)) || a.y - b.y || a.x - b.x)[0];
    const points = this.world.points.filter(point => known(cellKey(point.x, point.y)) && !this.completedPoints.has(point.id));
    const resources = this.resources().filter(node => known(cellKey(node.x, node.y)) && (node.x !== leader.x || node.y !== leader.y)).map(node => ({ ...node, label: '收集沿途资源' }));
    this.target = nearest(resources) || nearest(points) || nearest(frontiers) || null;
    this.path = this.target ? pathFrom(field, this.target) : [];
    this.waiting = !this.target;
    if (this.waiting && this.expedition && (this.expedition.route.length > 1 || this.expedition.snapshot().carried > 0)) {
      this.returnToCamp('附近已探索完，先带回这趟收获'); this.chooseTarget(); return;
    }
    if (this.waiting) { this.log.unshift('附近没有可达的新区域，水面和障碍仍不可穿越'); this.log.length = Math.min(8, this.log.length); }
  }

  tick(deltaMs, speed = 1) {
    if (this.paused || this.waiting || !Number.isFinite(deltaMs) || deltaMs < 0 || !Number.isFinite(speed) || speed <= 0) return;
    const elapsed = deltaMs * speed;
    this.timeMs += elapsed;
    const expedition = this.expedition;
    if (expedition?.phase === 'resting') {
      expedition.restMs = Math.max(0, expedition.restMs - elapsed);
      if (!expedition.restMs) {
        expedition.phase = 'exploring'; expedition.elapsedMs = 0; expedition.outing++; expedition.reason = '';
        this.path = []; this.target = null;
      }
      return;
    }
    if (expedition) {
      expedition.elapsedMs += elapsed;
      if (expedition.phase === 'exploring' && expedition.shouldReturn()) this.returnToCamp('收好材料，回营地休整');
      if (expedition.holdMs > 0) { expedition.holdMs = Math.max(0, expedition.holdMs - elapsed); return; }
      if (expedition.phase === 'returning' && expedition.route.length === 1) { this.arriveAtCamp(); return; }
    }
    this.progress += elapsed / 240;
    let budget = 60;
    while (this.progress >= 1 && budget-- > 0) {
      if (!this.path.length) this.chooseTarget();
      if (!this.path.length) { this.progress = 0; break; }
      const next = this.path.shift();
      if (!neighbors(this.world, this.members[0].x, this.members[0].y).some(([x, y]) => x === next.x && y === next.y)) { this.path = []; this.progress = 0; break; }
      this.trail.unshift({ ...this.members[0] }); Object.assign(this.members[0], next);
      for (let index = 1; index < this.members.length; index++) { const follow = this.trail[index - 1]; if (follow) Object.assign(this.members[index], follow); }
      this.trail.length = Math.min(this.trail.length, this.members.length);
      this.progress--; this.reveal();
      if (expedition) {
        expedition.track(this.members[0]);
        if (expedition.phase === 'returning' && expedition.route.length === 1) { this.arriveAtCamp(); break; }
        const atCamp = next.x === expedition.camp.x && next.y === expedition.camp.y;
        const pickup = expedition.collect(atCamp ? null : resourceAt(this.generator, cellAt(this.world, next.x, next.y)), this.timeMs);
        if (pickup) { this.progress = 0; break; }
      }
    }
  }

  displayMembers() {
    return this.members.map((member, index) => {
      const next = index === 0 ? this.path[0] : this.trail[index - 1], fraction = this.expedition?.holdMs || this.expedition?.phase === 'resting' ? 0 : Math.min(1, this.progress);
      return { x: member.x + ((next?.x ?? member.x) - member.x) * fraction, y: member.y + ((next?.y ?? member.y) - member.y) * fraction };
    });
  }

  snapshot() {
    const cell = cellAt(this.world, this.members[0].x, this.members[0].y);
    return { seed: this.world.seed, layout: BIOMES[cell.biome] || '原野', continuous: true, paused: this.paused, complete: false, waiting: this.waiting,
      target: this.target?.label || '寻找新地貌', discovered: this.discovered.size, visited: this.visited.size,
      generatedChunks: this.generator.generated.size, loadedChunks: 9, points: this.completedPoints.size, pointTotal: this.knownPoints.size,
      inside: [...this.inside], members: this.members.map(member => ({ ...member })), log: [...this.log], expedition: this.expedition?.snapshot() || null };
  }

  resources() { return this.expedition?.resources(this.world, this.generator) || []; }

  returnToCamp(reason) {
    if (!this.expedition?.requestReturn(reason)) return false;
    this.path = []; this.target = null; this.waiting = false; this.progress = 0;
    return true;
  }

  arriveAtCamp() {
    const record = this.expedition.bank(this.timeMs);
    if (record) { this.path = []; this.target = null; this.progress = 0; this.log.unshift(`第 ${record.outing} 趟归来，收获已存入营地`); this.log.length = Math.min(8, this.log.length); }
  }

  serialize() {
    return { generatorVersion: WORLD_GENERATOR_VERSION, seed: this.world.seed, members: this.members.map(member => ({ ...member })),
      discovered: this.discovered.serialize(), visited: this.visited.serialize(), knownPoints: [...this.knownPoints], completedPoints: [...this.completedPoints],
      generated: [...this.generator.generated].sort(), paused: this.paused, waiting: this.waiting, timeMs: this.timeMs, progress: Math.min(1, this.progress),
      path: this.path.map(cell => ({ ...cell })), target: this.target ? { x: this.target.x, y: this.target.y, pointId: this.target.id?.startsWith('structure:') ? this.target.id : null } : null,
      ...(this.expedition ? { expedition: this.expedition.serialize() } : {}) };
  }

  static restore(save, count = 4, { expedition = false, ownerIds } = {}) {
    if (!save || save.generatorVersion !== WORLD_GENERATOR_VERSION || typeof save.seed !== 'string' || !save.seed.trim() || save.seed.length > 64) throw new Error('开放世界版本或种子无效');
    const session = new OpenWorldSession(save.seed, count);
    const walkable = position => validPosition(position) && session.generator.getCell(position.x, position.y).walkable;
    if (!Array.isArray(save.members) || !save.members.length || save.members.length > 6 || save.members.some(member => !walkable(member))
      || save.members.some((member, index) => index > 0 && adjacent(member, save.members[index - 1]) > 1)) throw new Error('开放世界队伍位置无效');
    const discovered = TileHistory.restore(save.discovered), visited = TileHistory.restore(save.visited);
    // 以位图检验包含关系，不为了校验长途历史加载所有旧区块。
    for (const [key, bytes] of visited.chunks) {
      const visible = discovered.chunks.get(key);
      if (!visible || bytes.some((byte, index) => (byte & visible[index]) !== byte)) throw new Error('开放世界巡访历史无效');
    }
    if (save.members.some(member => !visited.has(cellKey(member.x, member.y)))) throw new Error('开放世界队伍没有探索历史');
    const validatePoints = records => {
      if (!Array.isArray(records) || records.length > 10000 || new Set(records).size !== records.length) throw new Error('开放世界地点记录无效');
      for (const id of records) { const point = session.generator.resolvePoint(id); if (!point || !discovered.has(cellKey(point.x, point.y))) throw new Error('开放世界地点不存在或未发现'); }
      return new Set(records);
    };
    const knownPoints = validatePoints(save.knownPoints), completedPoints = validatePoints(save.completedPoints);
    for (const id of completedPoints) { const point = session.generator.resolvePoint(id); if (!knownPoints.has(id) || !visited.has(cellKey(point.x, point.y))) throw new Error('开放世界地点未到访'); }
    if (!Array.isArray(save.generated) || save.generated.length > 8192 || new Set(save.generated).size !== save.generated.length
      || save.generated.some(key => typeof key !== 'string' || !/^-?\d+,-?\d+$/.test(key) || key.split(',').some(value => !Number.isInteger(Number(value)) || Math.abs(Number(value) * WORLD_CHUNK_SIZE) > 1000000))) throw new Error('开放世界区块记录无效');
    if (typeof save.paused !== 'boolean' || typeof save.waiting !== 'boolean' || !Number.isFinite(save.timeMs) || save.timeMs < 0 || !Number.isFinite(save.progress) || save.progress < 0 || save.progress > 1) throw new Error('开放世界时钟无效');
    if (!Array.isArray(save.path) || save.path.length > WORLD_CHUNK_SIZE ** 2 * 9) throw new Error('开放世界路线无效');
    let cursor = save.members[0];
    for (const step of save.path) {
      if (!walkable(step) || !discovered.has(cellKey(step.x, step.y)) || adjacent(cursor, step) !== 1) throw new Error('开放世界路线穿过障碍或未知区域');
      cursor = step;
    }
    if (save.target && (!walkable(save.target) || cursor.x !== save.target.x || cursor.y !== save.target.y
      || (save.target.pointId && (() => { const point = session.generator.resolvePoint(save.target.pointId); return !point || point.x !== cursor.x || point.y !== cursor.y; })()))) throw new Error('开放世界目标无效');
    if (save.path.length && !save.target) throw new Error('开放世界路线缺少目标');
    session.members = save.members.slice(0, session.members.length).map(member => ({ x: member.x, y: member.y }));
    while (session.members.length < Math.min(6, Math.max(1, count))) session.members.push({ ...session.members[session.members.length - 1] });
    const generated = new Set(save.generated);
    if ([...discovered.chunks.keys()].some(key => !generated.has(key))) throw new Error('探索历史缺少生成区块');
    session.generator.generated = generated;
    session.generator.view = null;
    session.world = session.generator.ensureAround(session.members[0]);
    session.discovered = discovered; session.visited = visited; session.knownPoints = knownPoints; session.completedPoints = completedPoints;
    session.path = save.path.map(step => ({ x: step.x, y: step.y })); session.progress = save.progress; session.timeMs = save.timeMs; session.paused = save.paused;
    session.target = save.target ? session.generator.resolvePoint(save.target.pointId) || { x: save.target.x, y: save.target.y, label: '探索新地貌' } : null;
    session.trail = session.members.slice(1).map(member => ({ ...member })); session.reveal();
    if (save.expedition) session.expedition = Expedition.restore(save.expedition, session, session.members.length, ownerIds);
    else if (expedition) session.expedition = new Expedition(session.members[0], session.members.length, ownerIds);
    // 旧原野记录以当前位置建立营地，不移动队伍或改写旧地形。
    if (session.target && session.expedition?.phase === 'returning') session.target = { ...session.expedition.camp, label: '带着收获返回营地' };
    if (save.waiting) {
      if (save.path.length || save.target) throw new Error('等待状态不能包含进行中的路线');
      session.chooseTarget();
      if (!session.waiting) throw new Error('等待状态与可达区域不符');
    }
    return session;
  }
}
