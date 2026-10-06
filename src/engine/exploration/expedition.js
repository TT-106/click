import { EXPEDITION_ITEMS, EXPEDITION_RULES as RULES } from '../../data/expedition-items.js';
import { TileHistory } from './tile-history.js';
import { cellKey } from './navigation.js';
import { resourceAt, RESOURCE_VERSION } from './resources.js';

const same = (left, right) => left.x === right.x && left.y === right.y;
const distance = (left, right) => Math.abs(left.x - right.x) + Math.abs(left.y - right.y);
const amount = value => Number.isSafeInteger(value) && value >= 0 && value <= 1000000000;
export const bagWeight = stacks => Object.entries(stacks).reduce((total, [id, count]) => total + EXPEDITION_ITEMS[id].weight * count, 0);
export const itemCount = stacks => Object.values(stacks).reduce((total, count) => total + count, 0);
const validStacks = stacks => stacks && !Array.isArray(stacks) && typeof stacks === 'object' && Object.entries(stacks).every(([id, count]) => Object.hasOwn(EXPEDITION_ITEMS, id) && amount(count) && count > 0);

/** 一次远征的携带、已采集覆盖层、可回溯路线和原子归仓；不依赖渲染或宿主。 */
export class Expedition {
  constructor(camp, count, ownerIds = []) {
    this.camp = { ...camp }; this.bags = Array.from({ length: count }, () => ({})); this.warehouse = {};
    this.ownerIds = Array.from({ length: count }, (_, index) => ownerIds[index] || `member-${index}`);
    this.collected = new TileHistory(); this.route = [{ ...camp }]; this.routeIndex = new Map([[cellKey(camp.x, camp.y), 0]]);
    this.phase = 'exploring'; this.reason = ''; this.outing = 1; this.completed = 0; this.elapsedMs = 0;
    this.restMs = 0; this.holdMs = 0; this.cursor = 0; this.journal = []; this.lastPickup = null;
  }

  resources(world, generator) {
    if (this.nodeWorld !== world) { this.nodeWorld = world; this.nodes = world.cells.map(cell => resourceAt(generator, cell)).filter(Boolean); }
    return this.nodes.filter(node => !same(node, this.camp) && !this.collected.has(cellKey(node.x, node.y)));
  }

  track(position) {
    const key = cellKey(position.x, position.y), existing = this.routeIndex.get(key);
    if (existing !== undefined) {
      for (const point of this.route.splice(existing + 1)) this.routeIndex.delete(cellKey(point.x, point.y));
    } else { this.routeIndex.set(key, this.route.length); this.route.push({ ...position }); }
  }

  collect(node, timeMs) {
    if (this.phase !== 'exploring' || !node || this.collected.has(cellKey(node.x, node.y))) return null;
    const weight = EXPEDITION_ITEMS[node.itemId].weight * node.amount;
    for (let offset = 0; offset < this.bags.length; offset++) {
      const index = (this.cursor + offset) % this.bags.length, bag = this.bags[index];
      if (bagWeight(bag) + weight > RULES.capacity) continue;
      bag[node.itemId] = (bag[node.itemId] || 0) + node.amount;
      this.collected.add(cellKey(node.x, node.y)); this.cursor = (index + 1) % this.bags.length; this.holdMs = RULES.gatherMs;
      this.lastPickup = { member: index, itemId: node.itemId, amount: node.amount, x: node.x, y: node.y, timeMs: timeMs };
      return this.lastPickup;
    }
    return null;
  }

  shouldReturn() {
    return this.bags.reduce((total, bag) => total + bagWeight(bag), 0) >= this.bags.length * RULES.capacity * RULES.returnAt
      || this.elapsedMs >= RULES.maximumOutingMs || this.route.length >= RULES.maximumRoute;
  }

  requestReturn(reason = '带着收获回营地') {
    if (this.phase !== 'exploring') return false;
    this.phase = 'returning'; this.reason = reason; this.holdMs = 0; return true;
  }

  bank(timeMs) {
    if (this.phase !== 'returning') return null;
    const brought = {};
    for (const bag of this.bags) for (const [id, count] of Object.entries(bag)) {
      brought[id] = (brought[id] || 0) + count;
      this.warehouse[id] = (this.warehouse[id] || 0) + count;
    }
    this.bags = this.bags.map(() => ({})); this.completed++;
    const record = { outing: this.outing, items: brought, timeMs: timeMs };
    this.journal.unshift(record); this.journal.length = Math.min(6, this.journal.length);
    this.phase = 'resting'; this.restMs = RULES.restMs; this.holdMs = 0; return record;
  }

  snapshot() {
    return { phase: this.phase, reason: this.reason, camp: { ...this.camp }, outing: this.outing, completed: this.completed,
      elapsedMs: this.elapsedMs, restMs: this.restMs, gathering: this.holdMs > 0, capacity: RULES.capacity,
      bags: this.bags.map(stacks => ({ stacks: { ...stacks }, weight: bagWeight(stacks), count: itemCount(stacks) })),
      warehouse: { ...this.warehouse }, carried: this.bags.reduce((sum, bag) => sum + itemCount(bag), 0),
      stored: itemCount(this.warehouse), journal: this.journal.map(record => ({ ...record, items: { ...record.items } })), lastPickup: this.lastPickup ? { ...this.lastPickup } : null };
  }

  serialize() {
    return { version: RESOURCE_VERSION, camp: { ...this.camp }, ownerIds: [...this.ownerIds], bags: this.bags.map(bag => ({ ...bag })), warehouse: { ...this.warehouse },
      collected: this.collected.serialize(), route: this.route.map(point => ({ ...point })), phase: this.phase, reason: this.reason,
      outing: this.outing, completed: this.completed, elapsedMs: this.elapsedMs, restMs: this.restMs, holdMs: this.holdMs,
      cursor: this.cursor, journal: this.journal.map(record => ({ ...record, items: { ...record.items } })), lastPickup: this.lastPickup ? { ...this.lastPickup } : null };
  }

  static restore(save, session, count, ownerIds = save?.ownerIds || []) {
    const fail = () => { throw new Error('远征背包或返程记录无效，原记录已保留'); };
    const walkable = point => point && Number.isInteger(point.x) && Number.isInteger(point.y) && Math.abs(point.x) < 999900 && Math.abs(point.y) < 999900 && session.generator.getCell(point.x, point.y).walkable;
    if (!save || save.version !== RESOURCE_VERSION || !walkable(save.camp) || !session.visited.has(cellKey(save.camp.x, save.camp.y))) fail();
    if (!Array.isArray(save.bags) || !save.bags.length || save.bags.length > 6 || save.bags.some(bag => !validStacks(bag) || bagWeight(bag) > RULES.capacity) || !validStacks(save.warehouse)) fail();
    if (!Array.isArray(save.ownerIds) || save.ownerIds.length !== save.bags.length || new Set(save.ownerIds).size !== save.ownerIds.length
      || save.ownerIds.some(id => typeof id !== 'string' || !id || id.length > 64)) fail();
    if (!['exploring', 'returning', 'resting'].includes(save.phase) || typeof save.reason !== 'string' || save.reason.length > 80
      || !amount(save.outing) || save.outing < 1 || !amount(save.completed) || save.outing !== save.completed + (save.phase === 'resting' ? 0 : 1)
      || !Number.isFinite(save.elapsedMs) || save.elapsedMs < 0 || !Number.isFinite(save.restMs) || save.restMs < 0 || save.restMs > RULES.restMs
      || !Number.isFinite(save.holdMs) || save.holdMs < 0 || save.holdMs > RULES.gatherMs || !Number.isInteger(save.cursor) || save.cursor < 0 || save.cursor >= save.bags.length) fail();
    if (!Array.isArray(save.route) || !save.route.length || save.route.length > RULES.maximumRoute || !same(save.route[0], save.camp)
      || !same(save.route[save.route.length - 1], session.members[0]) || new Set(save.route.map(point => cellKey(point.x, point.y))).size !== save.route.length
      || save.route.some((point, index) => !walkable(point) || !session.visited.has(cellKey(point.x, point.y)) || index > 0 && distance(point, save.route[index - 1]) !== 1)) fail();
    if (save.phase === 'resting' && (!same(save.camp, session.members[0]) || save.bags.some(bag => itemCount(bag)) || session.path.length)) fail();
    if (save.phase === 'returning' && session.path.some((point, index) => !same(point, save.route[save.route.length - index - 2] || {}))) fail();
    const collected = TileHistory.restore(save.collected);
    for (const [key, bytes] of collected.chunks) {
      const visited = session.visited.chunks.get(key);
      if (!visited || bytes.some((byte, index) => (byte & visited[index]) !== byte)) fail();
    }
    if (!Array.isArray(save.journal) || save.journal.length > 6 || save.journal.some(record => !record || !amount(record.outing) || record.outing < 1 || record.outing > save.completed
      || !validStacks(record.items) || !Number.isFinite(record.timeMs) || record.timeMs < 0 || record.timeMs > session.timeMs)) fail();
    const pickup = save.lastPickup;
    if (pickup && (!Object.hasOwn(EXPEDITION_ITEMS, pickup.itemId) || !Number.isInteger(pickup.member) || pickup.member < 0 || pickup.member >= save.bags.length
      || !amount(pickup.amount) || pickup.amount < 1 || !walkable(pickup) || !collected.has(cellKey(pickup.x, pickup.y))
      || !Number.isFinite(pickup.timeMs) || pickup.timeMs < 0 || pickup.timeMs > session.timeMs)) fail();
    const result = new Expedition(save.camp, count, ownerIds);
    Object.assign(result, { phase: save.phase, reason: save.reason, outing: save.outing, completed: save.completed, elapsedMs: save.elapsedMs,
      restMs: save.restMs, holdMs: save.holdMs, cursor: save.cursor % count, warehouse: { ...save.warehouse }, collected,
      route: save.route.map(point => ({ x: point.x, y: point.y })), journal: save.journal.map(record => ({ ...record, items: { ...record.items } })), lastPickup: pickup ? { ...pickup } : null });
    result.bags = result.ownerIds.map(id => ({ ...save.bags[save.ownerIds.indexOf(id)] }));
    // 队伍缩编也不丢材料：离队角色的携带物直接归入营地库存。
    for (const [index, bag] of save.bags.entries()) if (!result.ownerIds.includes(save.ownerIds[index])) {
      for (const [id, number] of Object.entries(bag)) result.warehouse[id] = (result.warehouse[id] || 0) + number;
    }
    if (result.lastPickup) {
      const member = result.ownerIds.indexOf(save.ownerIds[result.lastPickup.member]);
      result.lastPickup = member >= 0 ? { ...result.lastPickup, member } : null;
    }
    result.routeIndex = new Map(result.route.map((point, index) => [cellKey(point.x, point.y), index]));
    return result;
  }
}
