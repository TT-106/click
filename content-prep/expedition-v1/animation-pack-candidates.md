# T8 角色/怪物动画包候选筛选表(研究性,未下载)

筛选标准:四方向**真实存在**(左右镜像不算)、idle/walk/attack(/cast)帧数、PNG 透明背景、尺寸、脚点一致性、许可明确、与项目二次元手绘风格的契合度。**本表只研究未下载**;实际引入须先核验许可原文并走 T4 同款视觉检查。

> 站点全景、许可核验等级(VERIFIED/PARTIAL/pending)与待核验队列见 [素材来源经验库](../../docs/research/ASSET-SOURCE-EXPERIENCE.md)(2026-10-05 调研:四方向二次元角色尚无 VERIFIED 命中,下一步主攻 BOOTH/日系站点)。

## 候选 1:Universal LPC Spritesheet Character Generator(LiberatedPixelCup 组织仓库)

- 来源:https://github.com/sanderfrenken/Universal-LPC-Spritesheet-Character-Generator(已迁至 LiberatedPixelCup 组织)
- 许可:仓库 GPL-3.0 + 内含 cc-by-sa-3.0.txt —— **素材为 CC BY-SA 3.0 / GPL 双许可(逐素材核验后才能用)**;Copyleft 对商业分发有传染性,需法务确认。
- 动画/方向:页面 README 未在抓取中展开;LPC 标准为 **4 方向 + spellcast/thrust/walk/slash/shoot/idle/run** 等(需读仓库 `sheet_definitions/` 逐项核实,未核实项标 UNRESOLVED)。
- 输出:组合 spritesheet(传统 64×64 布局,未核实)。
- 风格:像素 RPG,**与精致二次元目标不符**;只适合过渡/占位。
- 结论:`usable-as-transition-only`;cast 存在是该候选最大优点。

## 候选 2:4 Direction Animated Warrior(Calciumtrice)

- 来源:https://opengameart.org/content/4-direction-animated-warrior(2026-10-05 抓取核验)
- 许可:**CC BY 4.0**(页面原文 "usable under Creative Commons Attribution 4.0 license")——商用可用,需署名。
- 方向:页面明确 "every animation comes in unique left, right, up and down facing versions"(死亡动画除外)→ 四方向真实存在。
- 动画:idle、movement(=walk)、attack、death;**cast 无**。
- 帧数/尺寸:页面未列(有 labelled reference 图);下载后需数帧核实(UNRESOLVED)。
- 透明背景:PNG,页面未明示(UNRESOLVED)。
- 风格:像素战士,**非二次元**;单角色非成套。
- 结论:`usable-as-reference`;attack/idle 的四方向布局可作帧表参考。

## 候选 3:Character Sprite Base(kostopher,itch.io)

- 来源:https://kostopher.itch.io(搜索结果页信息,未打开商品页 → 部分未核验)
- 声称:8 帧动画(idle/walk/run/jump)、4 方向(Front/Left/Right/Back)、6 配色、RPG Maker 兼容。
- 缺:attack/cast 未提及;许可证未在搜索结果中展示(**itch.io 免费包许可逐页不同,必须打开页面核验**)。
- 风格:待目检;候选按二次元向继续筛选。
- 结论:`pending(license UNRESOLVED)`。

## 候选 4:Sora - Free Character Sprite(NoranekoGames,itch.io)

- 来源:https://noranekogames.itch.io(搜索结果页信息,未打开商品页)
- 声称:二次元风格、多表情多服装;**动画/方向/帧数未核验**,许可未核验(页面 FAQ 提到 18+ 内容许可,说明有明确 EULA)。
- 结论:`pending`;若风格达标值得打开核验许可与动画表。

## 候选 5:Animated Slime / 16x16 Animated Slimes(OpenGameArt 怪物方向)

- 来源:https://opengameart.org/content/animated-slime(四色,idle/gesture/walk/attack/death);https://opengameart.org/content/16x16-animated-slimes(2种×4方向×3色,手绘)
- 许可:页面未抓取(UNRESOLVED);OGA 每页标注 CC0/CC-BY/OGA-BY,需逐页确认。
- 方向:16x16 版明确 4 方向;Animated Slime 方向数未核验。
- 风格:手绘感史莱姆,接近"普通遭遇"的过渡怪物;尺寸 16px 对本项目地图偏小,需放大评估。
- 结论:`usable-with-work(作为普通怪物过渡)`。

## 结论与缺口

1. **没有找到符合"精致二次元 + 全动作(含 cast)+ 四方向 + 宽松许可"的现成开源包**——与用户期望的差距如实记录;建议提交**定向美术规格**(同 T8 物品图标规格一并向后续美术任务提交),而不是用像素包塞满目录。
2. 若需要**过渡期**占位:LPC 生成器(cast 齐全,CC BY-SA 需法务确认)> 4-Direction Warrior(CC BY 4.0,无 cast)> 手绘史莱姆。
3. 所有候选引入前都要:下载原包留档(assets/vendor/glm-r52-*,保留许可与 SHA256)、数帧核验、T4 式三背景视觉检查、脚点一致性检查;**本表未下载任何文件**(0 字节新增,未产生许可义务)。

## 核验方式记录

- 候选1/2/5:WebSearch + WebFetch 页面原文(2026-10-05);候选2的许可/四方向为页面原文确认。
- 候选3/4:仅搜索结果摘要,商品页未打开——标 pending,不冒充已核验。
