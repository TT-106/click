import { cellAt, cellKey, neighbors, pathField, pathFrom } from './navigation.js';
import { generateForestVillage, GENERATOR_VERSION } from './forest-village.js';

export const EXPLORATION_SAVE_KEY = 'C2_FOREST_VILLAGE_V1';
const validCell = (world, value) => value && Number.isInteger(value.x) && Number.isInteger(value.y) && value.x >= 0 && value.y >= 0 && value.x < world.width && value.y < world.height && cellAt(world, value.x, value.y).walkable;

/** 一支队伍、一张小地图。会话不引用经典世界、RNG、战斗和存档。 */
export class ExplorationSession {
  constructor(seed = '旧村-01', count = 4, { generatorVersion = GENERATOR_VERSION } = {}) {
    this.world = generateForestVillage(seed, generatorVersion);
    this.members = Array.from({ length: Math.min(6, Math.max(1, count)) }, () => ({ ...this.world.entrance }));
    this.discovered = new Set(); this.visited = new Set(); this.completedPoints = new Set();
    this.path = []; this.target = null; this.trail = []; this.progress = 0; this.timeMs = 0;
    this.paused = false; this.complete = false; this.log = []; this.inside = new Set();
    this.reveal();
  }

  reveal() {
    const leader = this.members[0];
    this.visited.add(cellKey(leader.x, leader.y));
    // 可见性沿可走地表传播，墙后室内不会在门外透视；只露出邻接障碍轮廓。
    const sight = pathField(this.world, leader, () => true, 4);
    for (const [key, distance] of sight.distances) {
      if (distance > 4) continue;
      this.discovered.add(key);
      const [x, y] = key.split(',').map(Number);
      for (const [column, row] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (column >= 0 && row >= 0 && column < this.world.width && row < this.world.height && !cellAt(this.world, column, row).walkable) this.discovered.add(cellKey(column, row));
      }
    }
    this.inside = new Set(this.members.map(member => cellAt(this.world, member.x, member.y).area).filter(area => this.world.buildings.some(building => building.id === area)));
    for (const point of this.world.points) {
      if (point.x === leader.x && point.y === leader.y && !this.completedPoints.has(point.id)) {
        this.completedPoints.add(point.id); this.log.unshift(`发现 ${point.label}`); this.log.length = Math.min(this.log.length, 8);
      }
    }
  }

  chooseTarget() {
    const leader = this.members[0], known = key => this.discovered.has(key);
    const field = pathField(this.world, leader, known);
    const points = this.world.points.filter(point => known(cellKey(point.x, point.y)) && !this.completedPoints.has(point.id));
    const frontiers = [];
    for (const key of field.distances.keys()) {
      const [x, y] = key.split(',').map(Number);
      if (neighbors(this.world, x, y).some(([column, row]) => !known(cellKey(column, row)))) frontiers.push({ x, y, label: '探索林道' });
    }
    const nearest = candidates => candidates.filter(point => field.distances.has(cellKey(point.x, point.y)))
      .sort((a, b) => field.distances.get(cellKey(a.x, a.y)) - field.distances.get(cellKey(b.x, b.y)) || a.y - b.y || a.x - b.x)[0];
    // 探索完成以探明连通区域并访问兴趣点为准，不要求逐格踩遍已看清的草地。
    this.target = nearest(points) || nearest(frontiers) || null;
    this.path = this.target ? pathFrom(field, this.target) : [];
    if (!this.target) { this.complete = true; this.log.unshift('旧村探索完成'); this.log.length = Math.min(this.log.length, 8); }
  }

  tick(deltaMs, speed = 1) {
    if (this.paused || this.complete || !Number.isFinite(deltaMs) || deltaMs < 0) return;
    this.timeMs += deltaMs * speed; this.progress += deltaMs * speed / 240;
    // 最多处理一秒显示步长；调用者限制长时间后台帧，避免刷新追赶。
    let budget = 60;
    while (this.progress >= 1 && !this.complete && budget-- > 0) {
      if (!this.path.length) this.chooseTarget();
      if (this.complete) { this.progress = 0; break; }
      if (!this.path.length) { this.target = null; this.reveal(); break; }
      const next = this.path.shift();
      if (!neighbors(this.world, this.members[0].x, this.members[0].y).some(([x, y]) => x === next.x && y === next.y)) { this.path = []; this.progress = 0; break; }
      this.trail.unshift({ ...this.members[0] });
      Object.assign(this.members[0], next);
      for (let index = 1; index < this.members.length; index++) {
        // 队员逐格沿领队实际走过的路径跟随，禁止对角穿墙。
        const follow = this.trail[index - 1]; if (follow) Object.assign(this.members[index], follow);
      }
      this.trail.length = Math.min(this.trail.length, this.members.length);
      this.progress--; this.reveal();
    }
  }

  displayMembers() {
    return this.members.map((member, index) => {
      const next = index === 0 ? this.path[0] : this.trail[index - 1];
      const fraction = this.complete ? 0 : Math.min(1, this.progress);
      return { x: member.x + ((next?.x ?? member.x) - member.x) * fraction, y: member.y + ((next?.y ?? member.y) - member.y) * fraction };
    });
  }

  snapshot() {
    return { seed: this.world.seed, layout: this.world.layout?.label || '原版河畔村落', paused: this.paused, complete: this.complete, target: this.target?.label || '寻找路线',
      discovered: this.world.reachable.filter(key => this.discovered.has(key)).length, total: this.world.reachable.length,
      visited: this.visited.size, points: this.completedPoints.size, pointTotal: this.world.points.length,
      inside: [...this.inside], members: this.members.map(member => ({ ...member })), log: [...this.log] };
  }

  serialize() {
    return { generatorVersion: this.world.generatorVersion, seed: this.world.seed, members: this.members.map(member => ({ ...member })),
      discovered: [...this.discovered], visited: [...this.visited], completedPoints: [...this.completedPoints], paused: this.paused, timeMs: this.timeMs,
      path: this.path.map(cell => ({ ...cell })), target: this.target ? { x: this.target.x, y: this.target.y, pointId: this.target.id || null } : null, progress: Math.min(1, this.progress) };
  }

  /** 不信任本地 JSON。不支持的版本、未知格子、隔离地表、伪造兴趣点一律拒绝。 */
  static restore(save, count = 4) {
    if (!save || ![2, GENERATOR_VERSION].includes(save.generatorVersion) || typeof save.seed !== 'string' || !save.seed.trim() || save.seed.length > 64) throw new Error('探索存档版本或种子无效');
    const session = new ExplorationSession(save.seed, count, { generatorVersion: save.generatorVersion }), reachable = new Set(session.world.reachable);
    if (!Array.isArray(save.members) || !save.members.length || save.members.length > 6 || save.members.some(member => !validCell(session.world, member) || !reachable.has(cellKey(member.x, member.y)))) throw new Error('探索存档队伍位置无效');
    if (save.members.some((member, index) => index > 0 && Math.abs(member.x - save.members[index - 1].x) + Math.abs(member.y - save.members[index - 1].y) > 1)) throw new Error('探索存档队伍阵型无效');
    for (const key of ['discovered', 'visited', 'completedPoints']) if (!Array.isArray(save[key]) || save[key].length > session.world.cells.length) throw new Error('探索存档进度无效');
    for (const key of save.discovered) {
      if (typeof key !== 'string' || !/^\d+,\d+$/.test(key)) throw new Error('探索存档发现格无效');
      const [x, y] = key.split(',').map(Number);
      if (x >= session.world.width || y >= session.world.height) throw new Error('探索存档发现格越界');
    }
    if (save.visited.some(key => !reachable.has(key) || !save.discovered.includes(key))) throw new Error('探索存档巡访格无效');
    if (save.completedPoints.some(id => !session.world.points.some(point => point.id === id && save.visited.includes(cellKey(point.x, point.y))))) throw new Error('探索存档兴趣点无效');
    if (typeof save.paused !== 'boolean' || !Number.isFinite(save.timeMs) || save.timeMs < 0) throw new Error('探索存档时钟无效');
    if (!Array.isArray(save.path) || save.path.length > session.world.cells.length || !Number.isFinite(save.progress) || save.progress < 0 || save.progress > 1) throw new Error('探索存档路线无效');
    let cursor = save.members[0];
    for (const step of save.path) {
      if (!validCell(session.world, step) || !save.discovered.includes(cellKey(step.x, step.y)) || Math.abs(cursor.x - step.x) + Math.abs(cursor.y - step.y) !== 1) throw new Error('探索存档路线穿过障碍或未知区域');
      cursor = step;
    }
    if (save.target && (!validCell(session.world, save.target) || cursor.x !== save.target.x || cursor.y !== save.target.y || (save.target.pointId && !session.world.points.some(point => point.id === save.target.pointId && point.x === cursor.x && point.y === cursor.y)))) throw new Error('探索存档目标无效');
    if (save.path.length && !save.target) throw new Error('探索存档缺少路线目标');
    const members = save.members.slice(0, session.members.length);
    while (members.length < session.members.length) members.push({ ...members[0] });
    session.members = members.map(member => ({ x: member.x, y: member.y }));
    session.discovered = new Set(save.discovered); session.visited = new Set(save.visited); session.completedPoints = new Set(save.completedPoints);
    session.timeMs = save.timeMs; session.paused = save.paused;
    session.path = save.path.map(step => ({ x: step.x, y: step.y })); session.progress = save.progress;
    session.target = save.target ? session.world.points.find(point => point.id === save.target.pointId) || { x: save.target.x, y: save.target.y, label: '探索林道' } : null;
    // 队员站位即领队走过路径，故 trail[i-1] 必须等于 members[i]；不重建会让刷新后阵型散开。
    session.trail = session.members.slice(1).map(member => ({ x: member.x, y: member.y }));
    session.reveal();
    if (!session.path.length) session.chooseTarget();
    return session;
  }
}
