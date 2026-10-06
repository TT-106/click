// 原野记录的备份与 fail-closed（R56 第一片）。
//
// 切片前：controller.js 每 1.5 秒把 session.serialize() 原地写进 C2_OPEN_WORLD_V1，
// 全库没有任何备份键（经典档 C2_V1_001_backup 一直有）。载入失败时 saveBlocked 会挡住写入，
// 但 restart() 是唯一能覆盖坏记录的入口，它直接 save() 覆盖——原始字节没有任何回退点。
//
// 切片后：内容变化前先把上一版写进 C2_OPEN_WORLD_V1_backup；restart 解除停机前先留档；
// restoreBackup() 保留好备份，并把被替换的主记录另行留档——备份是那份好数据的
// 唯一副本，绝不能让主键上的坏记录经 save() 的留档分支把它顶掉。
//
// 覆盖六件事：
//   1) 内容变化时先备份旧值；内容未变时不产生备份；
//   2) 载入失败进入停机后 checkpoint 拒绝写入；
//   3) restart 覆盖坏记录之前先把它留档，原始字节不丢；
//   4) restoreBackup 恢复成功，且**不**把主键上的坏记录推进备份；
//   5) 没有备份 / 备份本身也坏时返回 false 且不改动主记录；
//   6) 备份键沿用经典档的 _backup 后缀约定。
import test from 'node:test';
import assert from 'node:assert/strict';
import { OPEN_WORLD_SAVE_KEY, OPEN_WORLD_BACKUP_KEY, OPEN_WORLD_RECOVERY_KEY } from '../../src/engine/exploration/open-world-session.js';
import { createDesktopStorage } from '../../src/services/desktop-storage.js';
import { checkedStorage } from '../../desktop/policy.mjs';

class Element {
  constructor() {
    this.style = {}; this.children = []; this.className = ''; this.id = '';
    this.innerHTML = ''; this.width = 0; this.height = 0;
  }
  get firstChild() { return this.children[0]; }
  appendChild(child) { this.children.push(child); return child; }
  removeChild(child) { this.children.splice(this.children.indexOf(child), 1); }
  getContext() {
    return {
      imageSmoothingEnabled: false, drawImage() {}, clearRect() {}, save() {}, restore() {},
      translate() {}, scale() {}, fillRect() {}, beginPath() {}, moveTo() {}, lineTo() {},
      stroke() {}, fill() {}, fillText() {}, rect() {}, arc() {}, closePath() {}, clip() {},
      setTransform() {}, putImageData() {},
      measureText: () => ({ width: 0 }),
      createImageData: () => ({ data: new Uint8ClampedArray(4) }),
    };
  }
  toDataURL() { return 'data:,'; }
}

globalThis.Image = class {
  constructor() { this.width = 0; this.height = 0; this.complete = true; }
  set src(value) { this._src = value; }
  get src() { return this._src || ''; }
  addEventListener() {} removeEventListener() {} decode() { return Promise.resolve(); }
};
globalThis.window = { addEventListener() {}, removeEventListener() {}, devicePixelRatio: 1 };
globalThis.document = {
  createElement: () => new Element(), getElementById: () => null,
  addEventListener() {}, removeEventListener() {}, hidden: false,
};
globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => {};

const { createVillageExplorer } = await import('../../src/engine/exploration/controller.js');

function makeStorage(initial = {}, { failMainWrite = false } = {}) {
  const entries = new Map(Object.entries(initial));
  const writes = [];
  return {
    writes,
    getItem: key => (entries.has(key) ? entries.get(key) : null),
    setItem: (key, value) => {
      // 模拟浏览器存储在恢复那一刻拒绝写入（配额满 / 隐私模式）。
      if (failMainWrite && key === OPEN_WORLD_SAVE_KEY) throw new Error('QuotaExceededError');
      entries.set(key, String(value)); writes.push([key, String(value)]);
    },
    removeItem: key => { entries.delete(key); writes.push([key, null]); },
    raw: key => (entries.has(key) ? entries.get(key) : null),
  };
}

const HEROES = [{ name: '阿尔法', sprite: null }, { name: '贝塔', sprite: null }];
function explore(storage) {
  return createVillageExplorer(new Element(), { heroes: HEROES, storage, onUpdate() {}, isVisible: () => true });
}

// 版本号对不上的记录：JSON 合法但 restore 会抛错，用来制造"坏记录"。
const BROKEN_RECORD = JSON.stringify({ generatorVersion: 999, seed: '原野-01' });

test('内容变化时先把上一版写进备份键；内容未变时不产生备份', async () => {
  const storage = makeStorage();
  const explorer = explore(storage);
  explorer.checkpoint();
  const first = storage.raw(OPEN_WORLD_SAVE_KEY);
  assert.ok(first, '首次保存应写入主键');
  assert.equal(storage.raw(OPEN_WORLD_BACKUP_KEY), null, '首次保存不应凭空产生备份');

  // 同一帧内容未变（再次 checkpoint 序列化的结果相同）→ 不应写备份
  explorer.checkpoint();
  assert.equal(storage.raw(OPEN_WORLD_BACKUP_KEY), null, '内容未变却产生了备份');

  // 制造一次真实内容变化：换种子重启
  assert.equal(await explorer.restart('原野-02'), true);
  const second = storage.raw(OPEN_WORLD_SAVE_KEY);
  assert.notEqual(second, first, '重启换种子后内容应当变化');
  assert.equal(storage.raw(OPEN_WORLD_BACKUP_KEY), first, '变化后备份里应是上一版原文');
});

test('备份键沿用经典档的 _backup 后缀约定', () => {
  assert.equal(OPEN_WORLD_BACKUP_KEY, OPEN_WORLD_SAVE_KEY + '_backup');
});

test('载入失败进入停机后 checkpoint 拒绝写入，主记录字节不变', () => {
  const storage = makeStorage({ [OPEN_WORLD_SAVE_KEY]: BROKEN_RECORD });
  const explorer = explore(storage);
  assert.throws(() => explorer.checkpoint(), /原野记录无法载入/);
  assert.equal(storage.raw(OPEN_WORLD_SAVE_KEY), BROKEN_RECORD, '停机期间主记录被改动了');
  assert.equal(storage.raw(OPEN_WORLD_BACKUP_KEY), null, '停机期间不该产生备份');
});

test('restart 覆盖坏记录之前单独留档，原始字节不丢', async () => {
  const storage = makeStorage({ [OPEN_WORLD_SAVE_KEY]: BROKEN_RECORD });
  const explorer = explore(storage);
  assert.equal(await explorer.restart('原野-02'), true);
  assert.notEqual(storage.raw(OPEN_WORLD_SAVE_KEY), BROKEN_RECORD, 'restart 应已写入新记录');
  assert.equal(storage.raw(OPEN_WORLD_RECOVERY_KEY), BROKEN_RECORD, 'restart 覆盖前没有把原始记录留档');
});

test('restoreBackup 恢复成功，且不把主键上的坏记录推进备份', async () => {
  // 先用一个正常控制器造一份合法记录当作"好数据"
  const seedStorage = makeStorage();
  const seedExplorer = explore(seedStorage);
  seedExplorer.checkpoint();
  const good = seedStorage.raw(OPEN_WORLD_SAVE_KEY);
  assert.ok(good, '需要一份合法记录');

  // 现在的主键是坏记录，备份里是那份好数据
  const storage = makeStorage({ [OPEN_WORLD_SAVE_KEY]: BROKEN_RECORD, [OPEN_WORLD_BACKUP_KEY]: good });
  const explorer = explore(storage);
  assert.throws(() => explorer.checkpoint(), /原野记录无法载入/);

  assert.equal(await explorer.restoreBackup(), true, 'restoreBackup 应当成功');
  assert.equal(storage.raw(OPEN_WORLD_SAVE_KEY), good, '主键应被好数据覆盖');
  assert.equal(storage.raw(OPEN_WORLD_BACKUP_KEY), good, '恢复后好备份仍应保留');
  assert.equal(storage.raw(OPEN_WORLD_RECOVERY_KEY), BROKEN_RECORD, '被替换的坏记录应单独留档');
  // 恢复后不再处于停机：可以继续保存
  assert.doesNotThrow(() => explorer.checkpoint());
  // 关键不变量：备份里永远不该出现那份坏记录（否则好数据已被顶掉，恢复就白做了）。
  // 恢复后的保存要么不产生备份（内容与刚写入的相同），要么把当前内容留作新备份——两者都合法。
  assert.notEqual(storage.raw(OPEN_WORLD_BACKUP_KEY), BROKEN_RECORD, '坏记录被写进了备份');
});

test('没有备份 / 备份本身也坏时 restoreBackup 返回 false 且不改动主记录', async () => {
  const noBackup = makeStorage({ [OPEN_WORLD_SAVE_KEY]: BROKEN_RECORD });
  const first = explore(noBackup);
  assert.equal(await first.restoreBackup(), false, '没有备份时不应谎报成功');
  assert.equal(noBackup.raw(OPEN_WORLD_SAVE_KEY), BROKEN_RECORD, '没有备份时主记录被改动了');

  // 备份本身也无法载入：主键上的坏记录必须原样保留
  const badBackup = makeStorage({ [OPEN_WORLD_SAVE_KEY]: BROKEN_RECORD, [OPEN_WORLD_BACKUP_KEY]: '{"generatorVersion":998}' });
  const second = explore(badBackup);
  assert.equal(await second.restoreBackup(), false, '备份也坏时不应谎报成功');
  assert.equal(badBackup.raw(OPEN_WORLD_SAVE_KEY), BROKEN_RECORD, '备份也坏时主记录被改动了');
  assert.equal(badBackup.raw(OPEN_WORLD_BACKUP_KEY), '{"generatorVersion":998}', '备份也坏时备份被改动了');
});

test('写回失败时 restoreBackup 不得谎报成功，且必须保住备份', async () => {
  // 先造一份合法记录当作"好数据"
  const seedStorage = makeStorage();
  const seedExplorer = explore(seedStorage);
  seedExplorer.checkpoint();
  const good = seedStorage.raw(OPEN_WORLD_SAVE_KEY);
  assert.ok(good, '需要一份合法记录');

  // 恢复那一刻浏览器开始拒绝写主键（配额满 / 隐私模式）
  const storage = makeStorage(
    { [OPEN_WORLD_SAVE_KEY]: BROKEN_RECORD, [OPEN_WORLD_BACKUP_KEY]: good },
    { failMainWrite: true }
  );
  const explorer = explore(storage);

  assert.equal(await explorer.restoreBackup(), false, '写回失败时不应谎报成功');
  // 关键：备份必须还在，否则好数据既没写回主键、又被清掉，就两头落空。
  assert.equal(storage.raw(OPEN_WORLD_BACKUP_KEY), good, '写回失败却把备份清掉了');
  assert.equal(storage.raw(OPEN_WORLD_SAVE_KEY), BROKEN_RECORD, '写回失败却动了主记录');
  // 仍处于停机：不能因为一次失败的恢复就解除保护去覆盖原记录。
  // 提示语此时是"备份仍然保留"而不是载入失败——那是对玩家更有用的信息。
  assert.throws(() => explorer.checkpoint(), /原记录与备份已保留/);
});

function goodRecord() {
  const storage = makeStorage(); explore(storage).checkpoint();
  return storage.raw(OPEN_WORLD_SAVE_KEY);
}

test('手动保存时存储拒写必须抛错，不能冒充成功', () => {
  const storage = makeStorage({}, { failMainWrite: true }), explorer = explore(storage);
  assert.throws(() => explorer.checkpoint(), /无法保存探索记录/);
  assert.equal(storage.raw(OPEN_WORLD_SAVE_KEY), null);
  assert.match(explorer.snapshot().persistence.error, /无法保存/);
});

test('读取备份失败与不可用存储均返回失败，保持保存保护', async () => {
  const storage = makeStorage({ [OPEN_WORLD_SAVE_KEY]: BROKEN_RECORD });
  const originalGet = storage.getItem;
  storage.getItem = key => { if (key === OPEN_WORLD_BACKUP_KEY) throw new Error('denied'); return originalGet(key); };
  const explorer = explore(storage);
  assert.equal(await explorer.restoreBackup(), false);
  assert.match(explorer.snapshot().notice, /无法读取探索备份/);
  assert.equal(storage.raw(OPEN_WORLD_SAVE_KEY), BROKEN_RECORD);
  const temporary = explore(null);
  assert.equal(await temporary.restart('原野-02'), false);
  assert.throws(() => temporary.checkpoint(), /无法保存/);
});

test('坏档重开不会顶掉可用备份，失败时仍保留原会话', async () => {
  const good = goodRecord();
  const storage = makeStorage({ [OPEN_WORLD_SAVE_KEY]: BROKEN_RECORD, [OPEN_WORLD_BACKUP_KEY]: good });
  const explorer = explore(storage);
  assert.equal(await explorer.restart('原野-02'), true);
  assert.equal(storage.raw(OPEN_WORLD_BACKUP_KEY), good);
  assert.equal(storage.raw(OPEN_WORLD_RECOVERY_KEY), BROKEN_RECORD);
  assert.equal(await explorer.restoreBackup(), true);
  assert.equal(explorer.snapshot().seed, '原野-01');
  const failed = makeStorage({ [OPEN_WORLD_SAVE_KEY]: BROKEN_RECORD, [OPEN_WORLD_BACKUP_KEY]: good }, { failMainWrite: true });
  const blocked = explore(failed);
  assert.equal(await blocked.restart('原野-02'), false);
  assert.equal(blocked.snapshot().seed, '原野-01');
  assert.equal(blocked.snapshot().persistence.blocked, true);
  assert.equal(failed.raw(OPEN_WORLD_SAVE_KEY), BROKEN_RECORD);
  assert.equal(failed.raw(OPEN_WORLD_BACKUP_KEY), good);
});

test('留档写入失败时不能先覆盖主记录', async () => {
  const good = goodRecord(), storage = makeStorage({ [OPEN_WORLD_SAVE_KEY]: BROKEN_RECORD, [OPEN_WORLD_BACKUP_KEY]: good });
  const write = storage.setItem;
  storage.setItem = (key, value) => { if (key === OPEN_WORLD_RECOVERY_KEY) throw new Error('full'); write(key, value); };
  const explorer = explore(storage);
  assert.equal(await explorer.restoreBackup(), false);
  assert.equal(storage.raw(OPEN_WORLD_SAVE_KEY), BROKEN_RECORD);
  assert.equal(storage.raw(OPEN_WORLD_BACKUP_KEY), good);
});

test('恢复须等待磁盘确认，进行中拒绝重复恢复、重开和手动保存', async () => {
  const good = goodRecord(), storage = makeStorage({ [OPEN_WORLD_SAVE_KEY]: BROKEN_RECORD, [OPEN_WORLD_BACKUP_KEY]: good });
  let release; storage.flush = () => new Promise(resolve => { release = resolve; });
  const explorer = explore(storage), operation = explorer.restoreBackup();
  assert.equal(explorer.snapshot().persistence.recovering, true);
  assert.equal(explorer.snapshot().persistence.blocked, true);
  assert.equal(await explorer.restoreBackup(), false);
  assert.equal(await explorer.restart('原野-02'), false);
  const paused = explorer.snapshot().paused; explorer.pause(); assert.equal(explorer.snapshot().paused, paused);
  assert.throws(() => explorer.checkpoint());
  release(); assert.equal(await operation, true);
  assert.equal(explorer.snapshot().persistence.recovering, false);
  assert.equal(explorer.snapshot().persistence.blocked, false);
});

test('真实桌面适配器拒写时回滚缓存，重试经保存键校验后才能解除保护', async () => {
  const good = goodRecord(), original = { [OPEN_WORLD_SAVE_KEY]: BROKEN_RECORD, [OPEN_WORLD_BACKUP_KEY]: good, C2_V1_001: 'classic-unchanged' };
  let disk = { ...original }, failed = true;
  const storage = await createDesktopStorage({ load: async () => ({ storage: disk }), commit: async value => {
    const validated = checkedStorage(value); if (failed) throw new Error('disk full'); disk = validated;
  } }, () => {});
  const explorer = explore(storage);
  assert.equal(await explorer.restoreBackup(), false);
  assert.deepEqual(disk, original);
  assert.equal(storage.getItem(OPEN_WORLD_SAVE_KEY), BROKEN_RECORD);
  assert.equal(storage.getItem(OPEN_WORLD_BACKUP_KEY), good);
  assert.equal(explorer.snapshot().persistence.blocked, true);
  failed = false;
  assert.equal(await explorer.restoreBackup(), true);
  assert.equal(disk[OPEN_WORLD_SAVE_KEY], good);
  assert.equal(disk[OPEN_WORLD_BACKUP_KEY], good);
  assert.equal(disk[OPEN_WORLD_RECOVERY_KEY], BROKEN_RECORD);
  assert.equal(disk.C2_V1_001, original.C2_V1_001);
  explorer.dispose(); await storage.flush();
});

test('主键不存在时桌面恢复失败要撤销缓存新增，随后可安全重试', async () => {
  const good = goodRecord(); let failed = true, disk = { [OPEN_WORLD_BACKUP_KEY]: good };
  const storage = await createDesktopStorage({ load: async () => ({ storage: disk }), commit: async value => {
    if (failed) throw new Error('disk full'); disk = checkedStorage(value);
  } }, () => {});
  const explorer = explore(storage);
  assert.equal(await explorer.restoreBackup(), false);
  assert.equal(storage.getItem(OPEN_WORLD_SAVE_KEY), null);
  failed = false; assert.equal(await explorer.restoreBackup(), true);
  assert.equal(disk[OPEN_WORLD_SAVE_KEY], good);
  explorer.dispose(); await storage.flush();
});
