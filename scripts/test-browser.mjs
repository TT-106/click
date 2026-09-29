import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const baseURL = process.env.TEST_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ channel:'chrome', headless:true });
const errors = [];
await fs.mkdir('output/playwright', {recursive:true});
try {
  const context = await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
  const page = await context.newPage();
  page.on('pageerror',error=>errors.push(error.stack));
  page.on('console',message=>{ if(message.type()==='error'||message.text().startsWith('Caught error')) errors.push(message.text()); });
  await page.goto(baseURL);
  await page.locator('#app-content').waitFor({state:'visible'});
  const snapshot = () => page.evaluate(async()=> (await import('/src/engine/adapter.js')).engine.snapshot());
  // U132 负路径：adapter.startParty 的拒绝语义（在推荐阵容建队前断言，不影响后续流程）
  const startPartyResult = list => page.evaluate(async members => {
    const engine = (await import('/src/engine/adapter.js')).engine;
    try { engine.startParty(members); return 'ok'; } catch (error) { return error.message; }
  }, list);
  assert.equal(await startPartyResult([{id:0,name:'同名的'},{id:1,name:'同名的'}]), '每位队员需要不同的名字（1–15 字）。', '重名阵容未被拒绝');
  assert.equal(await startPartyResult([{id:6,name:'未解锁的野蛮人'}]), '该职业尚未解锁。', '未解锁职业未被拒绝');
  assert.equal(await startPartyResult([]), '请选择有效数量的队员。', '空阵容未被拒绝');
  await page.screenshot({path:'output/playwright/setup-desktop.png',fullPage:true});
  await page.locator('#recommended-party').click();
  await page.locator('[data-rename="0"]').fill('远征队长');
  await page.locator('#begin-adventure').click();
  await page.locator('#expedition-screen').waitFor({state:'visible'});
  // U132：开局后重复建队必须被拒绝（game.partyCreated 守卫）
  assert.equal(await startPartyResult([{id:0,name:'再次建队'}]), '当前冒险已经开始。', '开局后仍可重复建队');
  await page.waitForFunction(async()=> (await import('/src/engine/adapter.js')).engine.snapshot().turn>2);
  assert.equal((await snapshot()).heroes.length,4);
  assert.equal((await snapshot()).heroes[0].name,'远征队长');
  await page.locator('#toggle-pause').click();
  const paused = await snapshot();
  await page.waitForTimeout(700);
  assert.equal((await snapshot()).turn,paused.turn,'暂停时仍在推进');
  await page.screenshot({path:'output/playwright/game-desktop.png',fullPage:true});
  for (const name of ['heroes','monsters','dungeons','castles','points']) {
    await page.locator(`#main-nav [data-page="${name}"]`).click();
    assert.equal(await page.locator('#legacy-screen').isVisible(),true);
    const panelId={heroes:'characterTabContent0',monsters:'monstersTabContent',dungeons:'dungeonsTabContent',castles:'castlesTabContent',points:'pointsTabContent'}[name];
    assert.equal(await page.locator('#'+panelId).isVisible(),true,`${name} 面板未显示`);
  }
  // 角色分页 1-4 与信息页：14 个静态 TabState 中全部用户可达分页逐一断言可见
  // （创建队伍=setup 屏已在开战前覆盖；游戏结束/离线为状态门控面板，其门控状态 gameWon/offline 由引擎差分行断言）。
  for (const idx of [1, 2, 3]) {
    await page.locator('#main-nav [data-page="heroes"]').click();
    await page.locator('#hero-tabs [data-hero-tab="' + idx + '"]').click();
    assert.equal(await page.locator('#characterTabContent' + idx).isVisible(), true, '角色分页 ' + idx + ' 未显示');
  }
  await page.locator('#header-settings').click();
  await page.locator('#original-info').click();
  assert.equal(await page.locator('#infoTabContent').isVisible(), true, '统计资料面板未显示');

  // 外部自动化脚本 archive/original/c2c.user.js 依赖的 DOM 契约（U2）：
  // 它只按这些 id/class 观察与点击游戏，改名或改结构就会静默失效。
  await page.locator('#main-nav [data-page="points"]').click();
  const missing = await page.evaluate(()=>{
    const want = {
      '#encounterNotificationPanel':'遭遇面板',
      '#treasureChestLootButtonPanel':'宝箱拾取面板',
      '.gameTabLootButtonPanel':'标签页拾取按钮容器',
      '#adventurerEffectIconA0':'1 号位效果图标',
      '#adventurerEffectIconB0':'2 号位效果图标',
      '#potionButton_Row0_Col0':'药水槽 0',
      '.potionContentContainer':'药水槽容器',
      '#scrollButtonCell0':'卷轴槽 0',
      '#pointUpgradesContainer_0_0_0':'冒险点升级按钮',
      '[id^="characterSkillsContainer0_0_0_"]':'技能升级按钮',
    };
    return Object.entries(want).filter(([sel])=>document.querySelectorAll(sel).length===0).map(([, label])=>label);
  });
  assert.deepEqual(missing, [], 'c2c.user.js 依赖的外部 DOM 契约出现缺失');
  assert.ok(await page.locator('[id^="characterSkillsContainer0_0_1_"]').count() > 0,
    '角色技能第二列按钮未渲染');

  await page.locator('#header-settings').click();
  await page.locator('[data-option="effects"]').uncheck();
  await page.locator('[data-option="offline"]').uncheck();
  assert.equal((await snapshot()).options.effects,false);
  assert.equal((await snapshot()).options.effects,false);
  await page.locator('#settings-save').click();
  await page.locator('#open-saves').click();
  await page.locator('.import-section summary').click();
  const beforeInvalid = await page.evaluate(()=>localStorage.getItem('C2_V1_001'));
  await page.locator('#save-code').fill('invalid-save');
  await page.locator('#import-save').click();
  await page.waitForFunction(()=>document.querySelector('#import-error').textContent.length>0);
  assert.equal(await page.evaluate(()=>localStorage.getItem('C2_V1_001')),beforeInvalid,'无效导入覆盖了进度');
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#export-save').click();
  const download=await downloadPromise;
  await download.saveAs('output/playwright/exported.c2save');
  const exported=await fs.readFile('output/playwright/exported.c2save','utf8');
  await page.locator('#save-code').fill(exported);
  await page.locator('#import-save').click();
  await page.locator('#save-dialog').waitFor({state:'hidden'});
  assert.equal((await snapshot()).heroes[0].name,'远征队长');
  assert.ok(await page.evaluate(()=>localStorage.getItem('C2_V1_001_backup')));
  await page.reload();
  await page.locator('#expedition-screen').waitFor({state:'visible'});
  assert.equal((await snapshot()).heroes[0].name,'远征队长');
  assert.equal((await snapshot()).options.effects,false,'设置未持久化');
  for (const width of [1024,375]) {
    await page.setViewportSize({width,height:900});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${width}px 主体横向溢出`);
    await page.screenshot({path:`output/playwright/game-${width}.png`,fullPage:true});
    await page.locator('#main-nav [data-page="heroes"]').click();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'详细面板溢出主体');
    await page.locator('#main-nav [data-page="expedition"]').click();
  }
  await page.locator('#toggle-pause').click();
  await page.locator('#main').focus();
  await page.keyboard.press('Space');
  assert.equal((await snapshot()).paused,false,'空格没有恢复冒险');
  // U132 补课：载入**真实原版存档**（tests/fixtures/original.c2save，partyCreated=true）后，
  // adapter.startParty 必须被 game.partyCreated 守卫拒绝——放在收尾处，不扰动前序断言的状态。
  const originalSaveCode = (await fs.readFile('tests/fixtures/original.c2save', 'utf8')).trim();
  await page.locator('#open-saves').click();
  await page.locator('.import-section summary').click();
  await page.locator('#save-code').fill(originalSaveCode);
  await page.locator('#import-save').click();
  await page.locator('#save-dialog').waitFor({state:'hidden'});
  assert.equal((await snapshot()).started,true,'原版存档导入后 started 应为 true');
  // 拒绝断言在导入真正完成后执行（#save-dialog 隐藏即导入成功门），且同时校验
  // 被拒调用不触碰 localStorage 存档（adapter 守卫先于一切 mutation）。
  const beforeRejectedStart = await page.evaluate(()=>localStorage.getItem('C2_V1_001'));
  assert.equal(await startPartyResult([{id:0,name:'原版存档后再建队'}]), '当前冒险已经开始。', '载入原版存档后仍可重复建队');
  assert.equal(await page.evaluate(()=>localStorage.getItem('C2_V1_001')), beforeRejectedStart, '被拒的建队尝试改变了存档');
  assert.deepEqual(errors,[],'存在浏览器异常');
  console.log('✓ 新建队伍、自动战斗、暂停、五类面板、c2c 外部 DOM 契约、设置、导出/导入、错误存档、刷新恢复、原版存档导入后拒绝重复建队、键盘与三种视口');
} finally { await browser.close(); }
