const panelURL = name => new URL(`./panels/${name}`, import.meta.url);
async function readPanel(name) {
  const response = await fetch(panelURL(name));
  if (!response.ok) throw new Error(`无法加载游戏面板：${name}`);
  return response.text();
}

/** 一次性组合引擎需要的 DOM。所有职业共用同一份角色模板。 */
export async function loadGamePanels() {
  const [shell, character, manifest] = await Promise.all(['shell.html','character.html','manifest.json'].map(readPanel));
  const panels = await Promise.all(JSON.parse(manifest).map(readPanel));
  const characters = Array.from({length:5},(_,index)=>character.replaceAll('{{index}}',String(index)));
  return shell.replace('<!-- GAME_PANELS -->',[...panels,...characters].join('\n'));
}
