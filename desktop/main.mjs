import { app, BrowserWindow, Menu, Tray, nativeImage, protocol, net, ipcMain, screen, shell, dialog, powerMonitor } from 'electron';
import Store from 'electron-store';
import { existsSync, copyFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { APP_ORIGIN, resourcePath, checkedStorage, windowBounds } from './policy.mjs';

app.setName('原野陪伴');
// 测试/开发可使用独立目录，真实用户进度不会被自动化验证覆盖。
const profile = process.argv.find(argument => argument.startsWith('--desktop-profile='));
const userData = profile ? path.resolve(profile.slice('--desktop-profile='.length)) : path.join(app.getPath('appData'), 'ClickpocalypseCompanion');
mkdirSync(userData, { recursive: true });
app.setPath('userData', userData);
protocol.registerSchemesAsPrivileged([{ scheme: 'companion', privileges: { standard: true, secure: true, supportFetchAPI: true } }]);

let window, tray, preferences, checkpoint, storageError = '', rendererReady = false, quitting = false, quittingPromise;
let mode = 'companion', pinned = false, suspended = false, boundsTimer, requestId = 0;
const pending = new Map();
const appRoot = app.getAppPath();
const webRoot = app.isPackaged || process.argv.includes('--desktop-dist') ? path.join(appRoot, 'dist') : appRoot;
const state = () => ({ mode, pinned, visible: Boolean(window?.isVisible() && !window.isMinimized()), suspended });
const publish = () => { if (window && !window.isDestroyed()) window.webContents.send('desktop:state', state()); };

function trusted(event) {
  if (event.sender !== window?.webContents || event.senderFrame !== window.webContents.mainFrame || !event.senderFrame.url.startsWith(APP_ORIGIN + '/')) throw new Error('拒绝非产品窗口的桌面操作');
}
function rememberBounds() {
  if (!window || window.isDestroyed() || window.isMinimized()) return;
  preferences.set(`bounds.${mode}`, window.getContentBounds());
}
function setMode(next) {
  if (!['companion', 'full'].includes(next)) throw new Error('未知窗口模式');
  if (next !== mode) {
    clearTimeout(boundsTimer); rememberBounds(); mode = next;
    const saved = preferences.get(`bounds.${mode}`);
    const area = screen.getDisplayMatching(saved || window.getBounds()).workArea;
    window.setMinimumSize(mode === 'companion' ? 480 : 800, mode === 'companion' ? 320 : 600);
    window.setContentBounds(windowBounds(saved, area, mode));
    preferences.set('mode', mode);
  }
  publish(); updateTray(); return state();
}
function setPinned(value) {
  if (typeof value !== 'boolean') throw new Error('置顶状态无效');
  pinned = value; window.setAlwaysOnTop(pinned); preferences.set('pinned', pinned); publish(); updateTray(); return state();
}
function show(next) {
  if (next) setMode(next);
  if (window.isMinimized()) window.restore();
  window.show(); window.focus(); publish();
}
function command(action) { window.webContents.send('desktop:command', { action }); }
function updateTray() {
  if (!tray) return;
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '显示观赏小窗', click: () => show('companion') },
    { label: '打开管理界面', click: () => show('full') },
    { label: '窗口置顶', type: 'checkbox', checked: pinned, click: item => setPinned(item.checked) },
    { type: 'separator' },
    { label: '暂停 / 继续探索', click: () => command('pause') },
    { label: '打开存档文件夹', click: () => { void shell.openPath(app.getPath('userData')); } },
    { type: 'separator' },
    { label: '保存并退出', click: () => { void requestQuit(); } },
  ]));
}
async function saveBeforeExit() {
  if (!rendererReady || window.isDestroyed()) return;
  const id = ++requestId;
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('保存响应超时')); }, 8000);
    pending.set(id, { resolve, reject, timer });
    window.webContents.send('desktop:command', { action: 'checkpoint', id });
  });
}
function requestQuit() {
  if (quittingPromise) return quittingPromise;
  quittingPromise = (async () => {
    try {
      await saveBeforeExit(); rememberBounds(); quitting = true; app.quit();
    } catch (error) {
      show(); dialog.showErrorBox('进度暂未写入磁盘', `${error.message}。应用已保持运行，请备份进度后重试退出。`);
    } finally { quittingPromise = null; }
  })();
  return quittingPromise;
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (window) show(); });
  app.on('before-quit', event => { if (!quitting && window) { event.preventDefault(); void requestQuit(); } });
  app.on('window-all-closed', () => { if (quitting) app.quit(); });
  app.whenReady().then(async () => {
    preferences = new Store({ name: 'window-settings', defaults: { mode: 'companion', pinned: false }, clearInvalidConfig: true });
    mode = preferences.get('mode') === 'full' ? 'full' : 'companion'; pinned = preferences.get('pinned') === true;
    try {
      checkpoint = new Store({ name: 'adventure', defaults: { version: 1, storage: {} }, clearInvalidConfig: false });
      if (checkpoint.get('version') !== 1) throw new Error('桌面存档版本不支持');
      checkedStorage(checkpoint.get('storage'));
    } catch (error) { checkpoint = null; storageError = `桌面存档无法读取，原文件已保留：${error.message}`; }

    protocol.handle('companion', async request => {
      if (request.method !== 'GET') return new Response('Method not allowed', { status: 405 });
      const file = resourcePath(webRoot, request.url);
      if (!file) return new Response('Not found', { status: 404 });
      try {
        const response = await net.fetch(pathToFileURL(file).href);
        const headers = new Headers(response.headers);
        headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; worker-src 'self' blob:; connect-src 'self'; object-src 'none'; frame-src 'none'");
        return new Response(response.body, { status: response.status, headers });
      } catch { return new Response('Not found', { status: 404 }); }
    });
    const savedBounds = preferences.get(`bounds.${mode}`);
    const restoredBounds = windowBounds(savedBounds, screen.getDisplayMatching(savedBounds || screen.getPrimaryDisplay().workArea).workArea, mode);
    window = new BrowserWindow({
      ...restoredBounds,
      minWidth: mode === 'companion' ? 480 : 800, minHeight: mode === 'companion' ? 320 : 600,
      frame: false, useContentSize: true, show: false, backgroundColor: '#17221b', title: '原野陪伴', alwaysOnTop: pinned,
      webPreferences: { preload: path.join(appRoot, 'desktop/preload.cjs'), contextIsolation: true, sandbox: true, nodeIntegration: false, backgroundThrottling: false },
    });
    // Windows 无边框窗口创建时会计入不可见边框；用内容区域再应用一次，避免重启尺寸漂移。
    window.setContentBounds(restoredBounds);
    Menu.setApplicationMenu(null);
    window.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    window.webContents.session.setPermissionCheckHandler(() => false);
    window.webContents.setWindowOpenHandler(({ url }) => {
      if (/^https:\/\/(www\.)?(creativecommons\.org|minmaxia\.com|github\.com|opengameart\.org|kenney\.nl)\//.test(url)) void shell.openExternal(url);
      return { action: 'deny' };
    });
    window.webContents.on('will-navigate', event => event.preventDefault());
    window.webContents.on('will-attach-webview', event => event.preventDefault());
    window.webContents.on('render-process-gone', () => { rendererReady = false; });
    for (const event of ['show', 'hide', 'minimize', 'restore']) window.on(event, publish);
    for (const event of ['move', 'resize']) window.on(event, () => { clearTimeout(boundsTimer); boundsTimer = setTimeout(rememberBounds, 500); });
    window.on('close', event => {
      if (quitting) return;
      event.preventDefault(); command('checkpoint'); window.hide(); publish();
    });
    window.once('ready-to-show', () => { window.show(); publish(); });

    const trayIcon = nativeImage.createFromPath(path.join(webRoot, 'assets/vendor/rubberduck-isometric-plants/bush.png')).resize({ width: 20, height: 20 });
    tray = new Tray(trayIcon); tray.setToolTip('原野陪伴 · 随时看看队伍的旅途'); tray.on('double-click', () => show()); updateTray();

    const handle = (name, callback) => ipcMain.handle(`desktop:${name}`, (event, ...args) => { trusted(event); return callback(...args); });
    handle('load', () => ({ storage: checkpoint ? checkpoint.get('storage') : {}, error: storageError }));
    handle('commit', value => {
      if (!checkpoint) throw new Error(storageError);
      const storage = checkedStorage(value);
      if (JSON.stringify(storage) === JSON.stringify(checkpoint.get('storage'))) return;
      if (existsSync(checkpoint.path)) copyFileSync(checkpoint.path, checkpoint.path + '.bak');
      checkpoint.store = { version: 1, storage };
    });
    handle('window', state); handle('mode', setMode); handle('pin', setPinned);
    handle('hide', () => { command('checkpoint'); window.hide(); publish(); });
    handle('minimize', () => window.minimize());
    handle('quit', () => { void requestQuit(); });
    handle('save-folder', () => shell.openPath(app.getPath('userData')));
    ipcMain.on('desktop:ready', event => { trusted(event); rendererReady = true; publish(); });
    ipcMain.on('desktop:checkpoint-result', (event, result) => {
      trusted(event); const item = pending.get(result?.id); if (!item) return;
      clearTimeout(item.timer); pending.delete(result.id);
      if (result.error) item.reject(new Error(String(result.error).slice(0, 300))); else item.resolve();
    });
    powerMonitor.on('suspend', () => { suspended = true; command('checkpoint'); publish(); });
    powerMonitor.on('resume', () => { suspended = false; publish(); });
    await window.loadURL(APP_ORIGIN + '/index.html');
  }).catch(error => { dialog.showErrorBox('桌面应用无法启动', error.message); quitting = true; app.quit(); });
}
