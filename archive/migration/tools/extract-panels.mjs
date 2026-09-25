// 一次性模板迁移：从原 DOM 合约提取各面板，并合并五份角色模板。
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
const browser = await chromium.launch({ channel:'chrome', headless:true });
try {
  const page = await browser.newPage();
  await page.setContent(await fs.readFile('src/legacy-dom.html','utf8'));
  const result = await page.evaluate(() => {
    for (const id of ['recentChanges','information','contactInfo','gameCredits','loadJB']) document.getElementById(id)?.remove();
    const container = document.querySelector('.mainTabContainer');
    const panels = [...container.children].map(node => ({id:node.id, html:node.outerHTML}));
    const characters = [...container.querySelectorAll('[id^="characterTabContent"]')];
    const characterTemplates = characters.map((node,index) => {
      for (const element of [node,...node.querySelectorAll('[id]')]) element.id = element.id.replace(new RegExp(index+'$'),'{{index}}');
      return node.outerHTML.replace(/<!--.*?-->/gs, "").replace(/\n\s*\n/g,"\n");
    });
    container.innerHTML='<!-- GAME_PANELS -->';
    return { panels, characterTemplates, shell:document.body.innerHTML };
  });
  await fs.writeFile('output/analysis/character-templates.json',JSON.stringify(result.characterTemplates,null,2));
  if (new Set(result.characterTemplates).size !== 1) throw new Error('角色模板存在差异，不能直接合并');
  await fs.mkdir('src/ui/panels',{recursive:true});
  const files=[];
  for (const panel of result.panels) {
    if (panel.id.startsWith('characterTabContent')) continue;
    const name=panel.id.replace(/TabContent$/, '').replace(/[A-Z]/g,l=>'-'+l.toLowerCase())+'.html';
    files.push(name);
    await fs.writeFile('src/ui/panels/'+name,panel.html+'\n');
  }
  await fs.writeFile('src/ui/panels/character.html',result.characterTemplates[0]+'\n');
  await fs.writeFile('src/ui/panels/shell.html',result.shell+'\n');
  await fs.writeFile('src/ui/panels/manifest.json',JSON.stringify(files,null,2)+'\n');
  console.log('已提取',files.length,'个面板和一个共享角色模板');
} finally { await browser.close(); }
