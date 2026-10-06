#!/usr/bin/env node
// T6 诊断夹具:为 6 个种子(3正常+3最差)渲染真实会话的轨迹/资源分布诊断图。
// 输出 PNG 标注「诊断夹具」——不是真实玩家探索视野,只用于分析缺货原因。
// 用法: node tools/content-prep/diagnostic-trajectory.mjs <seed> <out.png> [maxTrips=8]
import { OpenWorldSession } from '../../src/engine/exploration/open-world-session.js';
import { cellAt } from '../../src/engine/exploration/navigation.js';
import { EXPEDITION_ITEMS } from '../../src/data/expedition-items.js';
import { writeFileSync } from 'node:fs';

const seed = process.argv[2];
const outPath = process.argv[3];
const maxTrips = Number(process.argv[4] || 8);
if (!seed || !outPath) { console.error('usage: diagnostic-trajectory.mjs <seed> <out.png> [maxTrips]'); process.exit(2); }

const session = new OpenWorldSession(seed, 4, { expedition: true, ownerIds: ['d1', 'd2', 'd3', 'd4'] });
const trail = []; // {x,y,phase}
let trips = 0, ticks = 0, lastPhase = null;
while (trips < maxTrips && ticks++ < 100000) {
  const expedition = session.expedition;
  const before = { ...session.members[0] };
  session.tick(240);
  if (session.waiting && expedition.phase === 'exploring') break;
  if (lastPhase === 'resting' && expedition.phase === 'exploring') trips++;
  lastPhase = expedition.phase;
  if (before.x !== session.members[0].x || before.y !== session.members[0].y) {
    trail.push({ x: session.members[0].x, y: session.members[0].y, phase: expedition.phase });
  }
}

// 世界网格扫描
const world = session.world;
const W = world.width, H = world.height;
const CELL = 6;
const img = {
  width: W * CELL, height: H * CELL + 60,
};
// Pillow via stdout? 直接输出 PPM 文本太大;写 PPM 二进制(Buffer)
const px = Buffer.alloc(img.width * img.height * 3, 18);
const set = (x, y, r, g, b) => {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
  const i = (y * img.width + x) * 3;
  px[i] = r; px[i + 1] = g; px[i + 2] = b;
};
const BIOME_COLOR = { forest: [46, 84, 52], grassland: [92, 118, 62], highland: [110, 104, 88], wetland: [58, 88, 102], water: [32, 52, 88], default: [70, 70, 70] };
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const c = cellAt(world, x, y);
    const base = (BIOME_COLOR[c?.biome] || BIOME_COLOR.default);
    const shade = c?.walkable ? 1 : 0.55;
    for (let dy = 0; dy < CELL; dy++) for (let dx = 0; dx < CELL; dx++) {
      set(x * CELL + dx, y * CELL + dy, Math.round(base[0] * shade), Math.round(base[1] * shade), Math.round(base[2] * shade));
    }
  }
}
// 结构格高亮
let structures = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const c = cellAt(world, x, y);
  if (c?.area?.startsWith('structure:')) {
    structures++;
    set(x * CELL, y * CELL, 200, 160, 80); set(x * CELL + 1, y * CELL + 1, 200, 160, 80);
  }
}
// 营地
const camp = session.expedition.camp;
for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
  if (Math.abs(dx) + Math.abs(dy) <= 4) set(camp.x * CELL + dx + 2, camp.y * CELL + dy + 2, 255, 255, 255);
}
// 轨迹:探索绿→返程橙
let px0 = null, py0 = null;
for (const p of trail) {
  const X = p.x * CELL + 2, Y = p.y * CELL + 2;
  if (px0 != null) {
    const steps = Math.max(Math.abs(X - px0), Math.abs(Y - py0));
    for (let s = 0; s <= steps; s++) {
      const ix = px0 + Math.round((X - px0) * s / Math.max(1, steps));
      const iy = py0 + Math.round((Y - py0) * s / Math.max(1, steps));
      if (p.phase === 'returning') set(ix, iy, 255, 140, 60); else set(ix, iy, 120, 220, 120);
    }
  }
  px0 = X; py0 = Y;
}
// 文本条:写简单 5x7 点阵太重,用 PPM+后处理标注:保存后由 Pillow 加字
writeFileSync(outPath, Buffer.concat([Buffer.from(`P6\n${img.width} ${img.height}\n255\n`), px]));

// 用 stderr 报告数据,文本条由 python 后处理
const totals = session.expedition.warehouse;
const itemLine = Object.entries(totals).filter(([, v]) => v > 0).map(([k, v]) => `${k}:${v}`).join(' ');
console.log(JSON.stringify({ seed, trips: Math.min(trips + 1, maxTrips), waiting: session.waiting || null, structures, trailPoints: trail.length, warehouse: itemLine }));
