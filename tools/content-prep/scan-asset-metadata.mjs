#!/usr/bin/env node
// T4:全量素材候选元数据扫描(只读原文件,输出 JSON+CSV 派生元数据)。
// 扫描三个候选目录:rubberduck-medieval-buildings-03 / rubberduck-medieval-props / feudalwars-buildings
// 记录:相对路径、来源包、SHA256、可解码、画布尺寸、alpha有无、alpha包围框、alpha>=128主体包围框。
// 用法: node tools/content-prep/scan-asset-metadata.mjs [output.json]
// 依赖 Node 内置 + Pillow 不需要;PNG 解码用自写轻量解析(避免新依赖),失败记 undecoded。
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = process.argv[2] || join(ROOT, 'output', 'glm-r52', 'asset-review', 'asset-candidates.json');
const SOURCES = [
  'assets/vendor/rubberduck-medieval-buildings-03',
  'assets/vendor/rubberduck-medieval-props',
  'assets/vendor/feudalwars-buildings',
];

// 轻量 PNG 解析:IHDR 尺寸 + 遍历 IDAT 用 zlib 解压,重建像素求 alpha 包围框。
import { inflateSync } from 'node:zlib';

function parsePng(buf) {
  if (buf.length < 8 || buf.readUInt32BE(0) !== 0x89504e47) return null;
  let pos = 8;
  let width = 0, height = 0, bitDepth = 0, colorType = 0, interlace = 0;
  const idat = [];
  let palette = null, trns = null;
  while (pos + 8 <= buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const dataStart = pos + 8;
    if (type === 'IHDR') {
      width = buf.readUInt32BE(dataStart);
      height = buf.readUInt32BE(dataStart + 4);
      bitDepth = buf[dataStart + 8];
      colorType = buf[dataStart + 9];
      interlace = buf[dataStart + 12];
    } else if (type === 'PLTE') palette = buf.subarray(dataStart, dataStart + len);
    else if (type === 'tRNS') trns = buf.subarray(dataStart, dataStart + len);
    else if (type === 'IDAT') idat.push(buf.subarray(dataStart, dataStart + len));
    else if (type === 'IEND') break;
    pos = dataStart + len + 4; // 跳过 CRC
  }
  if (!width || !height || !idat.length) return { width, height, bitDepth, colorType, pixels: null };
  if (bitDepth !== 8 || interlace !== 0) return { width, height, bitDepth, colorType, pixels: null };
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
  if (!channels) return { width, height, bitDepth, colorType, pixels: null };
  let raw;
  try { raw = inflateSync(Buffer.concat(idat)); } catch { return { width, height, bitDepth, colorType, pixels: null }; }
  const stride = width * channels;
  const expected = (stride + 1) * height;
  if (raw.length < expected) return { width, height, bitDepth, colorType, pixels: null };
  // 反滤波
  const out = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const rowStart = y * stride;
    const fStart = y * (stride + 1) + 1;
    for (let x = 0; x < stride; x++) {
      const left = x >= channels ? out[rowStart + x - channels] : 0;
      const up = y > 0 ? out[rowStart - stride + x] : 0;
      const ul = y > 0 && x >= channels ? out[rowStart - stride + x - channels] : 0;
      const v = raw[fStart + x];
      let rec;
      switch (filter) {
        case 0: rec = v; break;
        case 1: rec = v + left; break;
        case 2: rec = v + up; break;
        case 3: rec = v + ((left + up) >> 1); break;
        case 4: {
          const p = left + up - ul, pa = Math.abs(p - left), pb = Math.abs(p - up), pc = Math.abs(p - ul);
          rec = v + (pa <= pb && pa <= pc ? left : pb <= pc ? up : ul);
          break;
        }
        default: return { width, height, bitDepth, colorType, pixels: null };
      }
      out[rowStart + x] = rec & 0xff;
    }
  }
  // alpha 提取
  const alpha = new Uint8Array(width * height);
  const alphaAt = (x, y) => {
    const i = y * stride + x * channels;
    switch (colorType) {
      case 6: return out[i + 3];
      case 4: return out[i + 1];
      case 3: return palette && trns && out[i] < trns.length ? trns[out[i]] : 255;
      default: return 255;
    }
  };
  let hasAlpha = false, anyTransparent = false;
  let bb = null, bb128 = null; // {x0,y0,x1,y1}
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = alphaAt(x, y);
      alpha[y * width + x] = a;
      if (a !== 255) hasAlpha = true;
      if (a === 0) anyTransparent = true;
      if (a > 0) {
        if (!bb) bb = { x0: x, y0: y, x1: x, y1: y };
        else {
          if (x < bb.x0) bb.x0 = x; if (x > bb.x1) bb.x1 = x;
          if (y < bb.y0) bb.y0 = y; if (y > bb.y1) bb.y1 = y;
        }
      }
      if (a >= 128) {
        if (!bb128) bb128 = { x0: x, y0: y, x1: x, y1: y };
        else {
          if (x < bb128.x0) bb128.x0 = x; if (x > bb128.x1) bb128.x1 = x;
          if (y < bb128.y0) bb128.y0 = y; if (y > bb128.y1) bb128.y1 = y;
        }
      }
    }
  }
  return { width, height, bitDepth, colorType, pixels: { hasAlpha, anyTransparent, alphaBBox: bb, alpha128BBox: bb128 } };
}

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(abs);
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.png')) yield abs;
  }
}

const records = [];
for (const src of SOURCES) {
  const absDir = join(ROOT, src);
  if (!existsSync(absDir)) { console.error(`缺目录: ${src}`); continue; }
  for (const f of walk(absDir)) {
    const rel = relative(ROOT, f).split(sep).join('/');
    const buf = readFileSync(f);
    const sha = createHash('sha256').update(buf).digest('hex').toUpperCase();
    const parsed = parsePng(buf);
    const rec = {
      path: rel,
      sourcePack: src.replace('assets/vendor/', ''),
      sha256: sha,
      bytes: buf.length,
      decodable: !!(parsed && parsed.width),
      width: parsed?.width ?? null,
      height: parsed?.height ?? null,
      colorType: parsed?.colorType ?? null,
      hasAlphaChannel: parsed?.colorType === 4 || parsed?.colorType === 6 || parsed?.pixels?.hasAlpha || false,
      alphaBBox: parsed?.pixels?.alphaBBox ?? null,
      alpha128BBox: parsed?.pixels?.alpha128BBox ?? null,
    };
    records.push(rec);
  }
}

writeFileSync(OUT, JSON.stringify({ schema: 1, generatedAt: new Date().toISOString(), count: records.length, records }, null, 2) + '\n', 'utf8');
console.log(`扫描完成: ${records.length} 张 PNG → ${OUT}`);
const undecoded = records.filter((r) => !r.decodable);
if (undecoded.length) console.log(`其中 ${undecoded.length} 张不可解码(记录为 null 尺寸)`);
