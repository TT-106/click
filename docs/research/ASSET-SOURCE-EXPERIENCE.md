# 素材来源经验库 — 站点全景、许可核验与缺口对策

> **研究时点快照。** 下文“当前/推荐/已核验”指文内研究日期，治理时未重新核验外部规则。实现看 [WORKSTATE](../WORKSTATE.md)，导入/发行前重新核实具体来源。


> **性质**:研究性参考文档,不下载、不接入。本文记录 2026-10-05 一轮网络调研中**核验过的站点与许可事实**,
> 以及由此得出的选型经验和待核验队列。素材正式引入仍走 `ASSET-RENDERING-UPGRADE.md` 的协议、
> `research/BUILDING-ASSET-RESEARCH.md` 的建筑选型和 T4 视觉检查管线,本文不改变任何验收标准。
>
> **核验等级**:
> - **VERIFIED** — 抓取到页面/仓库原文(引用原文关键句);
> - **PARTIAL** — 只有搜索摘要或多源转述一致,未读到原文;
> - **pending** — 仅有线索,未核验。许可原文链接与抓取日期逐条给出,过期需复核。

## 1. 解决什么缺口

缺口清单来自 `content-prep/expedition-v1/` 的 T8 产出(`item-icon-coverage.md`、`animation-pack-candidates.md`)与建筑素材研究:

| 缺口 | 规模 | 本文最佳对策 |
|---|---|---|
| 物品图标 | 49 类缺 | game-icons.net(§3.2 首选)+ CraftPix 图标包;正式彩绘风格仍建议自产管线 |
| 建筑主题(园圃/地图室/专用炉窑/L2L3 外观) | 8 类 × 3 级 | LimeZu Modern Farm/Interiors(付费小额)+ 自产 image_gen 管线(ECONOMY-BASE-DESIGN-V1 §11.3) |
| 四方向二次元角色(idle/walk/attack/cast) | 最大缺口 | 仍无 VERIFIED 命中;BOOTH/日系站点是下一步主攻方向(§6) |
| 怪物形象 | 旧 atlas 覆盖一部分 | Aekashics Librarium(二次元战斗图,**非四方向行走精灵**) |
| VFX(炉烟/采集/施法) | 低优先 | OpenGameArt 按 CC0 过滤 + CraftPix 特效类;炉烟可程序化粒子,不依赖贴图 |

## 2. 一轮调研后沉淀的经验(比站点清单更重要)

1. **免费 ≠ 可商用,站点级许可 ≠ 包级许可。** Kenney/CraftPix 是站点级统一许可,读一次管全部;
   itch.io/BOOTH/OpenGameArt 逐包逐页各不相同,没有"这个平台都行"这回事。T8 对每个 itch.io
   候选单独核验的做法是唯一正确姿势。
2. **许可四档,负担递增**:CC0(零负担)< 自有/弱署名许可(商用 OK、禁转售素材本身、有时要署名)
   < copyleft(CC BY-SA/GPL,分发传染,LPC 生成器即此类,只配做占位)< 仅个人使用(完全不可商用)。
   选型先问档位,再看美术。
3. **素材标签只是粗分类,投影必须实测。** 本项目地图是 54×26 菱形 2:1 dimetric(BUILDING-ASSET-RESEARCH
   已有本地教训);本轮又确认 LimeZu Modern 系列虽常被当"等距素材"推荐,实为 **top-down 16x16**。
   任何"可直接贴上"的推断都无效,必须走脚点/占地/门位标定(ECONOMY-BASE-DESIGN-V1 §11.1)。
4. **战斗图与行走图是两个市场。** Aekashics 的二次元怪物是正面 battle sprite;四方向地图精灵要另找。
   反过来,LimeZu 角色生成器动作表很全(idle/run/shoot/punch/pick up/read/lift/throw),但是像素风
   top-down。**"二次元 + 四方向 + cast 动作 + 可商用"四个条件同时满足的免费包,本轮没有 VERIFIED 命中**——这就是最大缺口仍空着的原因。
5. **免费版常是试吃装。** LimeZu 免费版仅约全集 3% 且只许个人使用;商用要买完整版
   (本轮抓取页面原文:complete version ≥$1.50 起)。看许可时要先看清"哪个包的哪一档"。
6. **访问工程学**(本轮实操,对后续调研直接提效):
   - itch.io 直连超时(WebFetch 10s 不够)→ 换 `web_reader` 抓取可达,页面原文一样有效;
   - CraftPix 的许可页没有直觉路径(`/freebies-license/` 是 404),官方条款藏在 Terms/许可协议页,
     逐包下载内还会附 LICENSE 文件——以内附文件为最终依据;
   - 搜索 API 会限流,与其反复换词,不如抓一篇高质量聚合清单一次挖一片
     (本轮用 eagle.cool《47+ Best Websites》一次拿到 47 个站 + 许可标注);
   - 但**聚合站的"可商用"标注只是线索**,升级到 VERIFIED 必须读到权利人页面原文。
7. **记账格式沿用 T4/T8**:每个候选记 来源URL + 许可 + 抓取日期 + SHA256 + 署名要求,
   状态只能取 VERIFIED/PARTIAL/pending,不许写"应该可以"。
8. **自产 image_gen 管线是许可零负担的正式风格来源**(见 ECONOMY-BASE-DESIGN-V1 §11.3 的工坊样板
   与透明度校验),外部素材更适合占位、小物件和风格参考;最终建筑/图标若要风格统一,自产或定制
   比拼接多个来源更稳。

## 3. 站点全景表(按许可负担分组)

### 3.1 CC0 / 公有领域(零负担,可商用免署名)

| 站点 | 内容 | 与缺口匹配 | 核验 |
|---|---|---|---|
| [Kenney](https://kenney.nl/assets) | 海量 2D/3D/UI/等距微型系列,统一风格 | UI、过渡占位;等距建筑需按 §11.1 实测投影 | PARTIAL(eagle 转述 CC0;官网待直读) |
| [Glitch the Game 遗产](http://www.glitchthegame.com/public-domain-game-art/) | 已停运游戏开源的 1 万+ 手绘素材 | 建筑/物品风格独特, 可挑单件 | PARTIAL |
| [Openclipart](https://openclipart.org) | CC0 矢量剪贴画 | 弱匹配(风格偏办公剪贴) | PARTIAL |
| [Sparklinlabs 资产包](https://github.com/sparklinlabs/superpowers-asset-packs) | GitHub 上的 CC0 像素资产合集 | 过渡占位 | PARTIAL |

注:ambientCG / Poly Haven / cgbookcase / Free PBR 等 CC0 站是 3D 纹理向,本项目(Web 2D)不用,仅存目。

### 3.2 自有许可、可商用(禁转售素材本身;部分要署名)

| 站点 | 内容 | 许可要点 | 与缺口匹配 | 核验 |
|---|---|---|---|---|
| [game-icons.net](https://game-icons.net) | 约 4100 个**单色 SVG** 游戏图标(武器/物品/生物/UI) | **CC BY 3.0,按图标作者署名**(Lorc 1429 个、Delapouite 2022 个等,about 页原文);官网自带 Studio 调色/调尺寸导出 | **49 缺图标首选**(注意单色剪影 vs 现有彩绘 atlas 的风格差,见 §4.1) | **VERIFIED**(2026-10-05 抓取 about.html 原文) |
| [CraftPix freebies](https://craftpix.net/freebies/) | 高质量 2D 包:图标、特效序列帧、角色(含二次元向)、UI | 自有许可:个人+商用无限项目、免署名、可修改;禁转售/再打包(搜索多源一致;官方原文待读) | 图标 + 特效 + 二次元角色参考 | PARTIAL |
| [DOTOWN](https://dotown.maeda-design-room.net/) | 前任天堂设计师手元 700+ 像素图 | 可商用、免署名、禁再分发素材本身(eagle 转述) | 像素向建筑/物件补充 | PARTIAL |
| [Gamefresco](https://gamefresco.com) | 艺术家共享素材 | 商用+非商用、免署名(eagle 转述) | 待深查 | PARTIAL |
| [GameArt2D](https://www.gameart2d.com) | 免费+付费 2D 精灵(平台/角色) | 免费区 royalty-free(条款页待读) | 角色精灵参考 | PARTIAL |

### 3.3 逐包核验市场(每次都要读该包许可)

| 站点 | 内容 | 与缺口匹配 | 核验 |
|---|---|---|---|
| [itch.io 免费素材区](https://itch.io/game-assets/free) | 独立作者包,逐包许可;**本项目直连超时,用 web_reader 抓** | 动画包/主题包主战场 | 平台级 PARTIAL |
| [OpenGameArt](https://opengameart.org) | 老牌社区库,**可按 CC0/CC-BY/CC-BY-SA/GPL 过滤** | 特效、怪物、四方向角色(T8 已逐页 VERIFIED 过候选) | 平台级 PARTIAL |
| [BOOTH](https://booth.pm) | 日本二次元素材集市(多为免费/小额),逐商品许可 | **四方向二次元角色下一步主攻地** | pending |
| [LimeZu Modern Interiors](https://limezu.itch.io/moderninteriors) | 16x16 top-down 全套内装/角色生成器,系列 6 万+ 资产(Modern Exteriors/Farm 等同系) | 建筑/园圃候选(风格注意 **top-down 非 dimetric**;免费版仅个人) | **VERIFIED**(2026-10-05 抓取页面原文:"complete version license…edit and use the assets in any commercial/non-commercial project…CAN'T resell…credits required";免费版 "Personal use only") |
| [Aekashics Librarium](https://aekashics.itch.io/) | 二次元怪物 battler 大库(静态+动画,月更) | 怪物形象(**正面战斗图,非四方向行走精灵**;署名+禁转售,逐包 LICENSE) | **VERIFIED**(主页,2026-10-05);ultrapack 子页已 404(页面迁移),入口以作者主页为准 |
| [Super Game Assets](https://supergameasset.com) | 等距建筑、图标、头像 | 建筑候选(投影待实测) | pending |

### 3.4 日系二次元专区(pending,缺口主攻方向)

| 站点 | 内容 | 备注 |
|---|---|---|
| [nanamiyuki](https://nanamiyuki.com) | 背景/角色/头像/怪物/物品/特效,每日更新 | 逐素材许可,需建核验清单 |
| [guttari8](http://guttari8.sakura.ne.jp/) | 和风/洋风/现代背景 | 背景参考 |
| [tokudaya](https://tokudaya.net) | 漫画风角色(附 PSD 便于改色) | 角色参考 |
| [kopacurve](http://kopacurve.blog.fc2.com/) | 对话气泡/游戏 UI | UI 参考 |
| [KNT graphics](http://kntgraphics.web.fc2.com/) | 校园背景 | 与本项目主题弱相关,存目 |

### 3.5 聚合入口(找站的起点,不是许可证据)

- [eagle.cool《47+ Best Websites to Download Free Game Assets》](https://en.eagle.cool/blog/post/free-game-assets) — **VERIFIED**(2026-10-05 抓取全表),本文 §3.1–3.4 多数站点由此挖出;
- [Game UI Database](https://www.gameuidatabase.com) / [Interface in Game](https://interfaceingame.com) — UI 截图参考库(看风格,不下载);
- [devanshutak25.github.io](https://devanshutak25.github.io) — CC0 3D/VFX 索引hub(VFX 部分 2D 可用,未深查)。

## 4. 按缺口的当前推荐

### 4.1 49 缺物品图标

- **首选 [game-icons.net](https://game-icons.net)(VERIFIED, CC BY 3.0)**:语义覆盖广、SVG 可调色,
  用官网 Studio 或脚本按主题色(暗绿/木色/黄铜,沿用背包 UI 风格)统一调色后导出 PNG。
- **风格差警示**:它是单色剪影,现有 atlas 是彩绘写实风。所以两条路:(a)接受剪影作为 UI 语义图标层;
  (b)正式彩绘图标仍走 image_gen 自产管线或按主题定制(参照 §11.3 样板流程)。不要把两套风格混进同一背包格。
- 备选:CraftPix 免费图标包(PARTIAL,商用免署名,逐包读 LICENSE)。

### 4.2 建筑主题(园圃/地图室/炉窑/L2L3)

- **LimeZu 系列(VERIFIED)**:Modern Farm 直接对口园圃;完整版 ≥$1.50 可商用需署名。
  **但它是 top-down 16x16**,与本项目 54×26 dimetric 投影不同——若采用,只能作为小尺寸管理面板图标
  或重投影参考,不能直接铺地图(ECONOMY-BASE-DESIGN-V1 §11.1 原则)。
- **正式风格仍以自产 image_gen 管线为主**(§11.3 工坊样板已验证透明背景/风格可控),
  外部素材做主题与配色参考。二、三级外观用同一基础图固定视角/锚点演进,不逐级另生成。
- DOTOWN(GPU 像素向,PARTIAL)可做低配占位。

### 4.3 四方向二次元角色(最大缺口,未闭合)

- 本轮**没有** VERIFIED 命中"二次元 + 4 方向 + idle/walk/attack/cast + 可商用"的免费包;
  T8 的 5 个候选维持原状态(LPC=过渡仅用、Calciumtrice=参考、kostopher/NoranekoGames=pending)。
- 下一步主攻:**BOOTH 免费区逐商品核验** + nanamiyuki/tokudaya 许可页(§6 队列)。
- LimeZu 角色生成器(VERIFIED)动作表最全但像素 top-down,可当**帧表/动作清单参考**(它证明
  idle/run/shoot/punch/pick up/read/lift/throw 是像素 RPG 的完整动作基线),不是美术答案。

### 4.4 怪物

- **Aekashics Librarium(主页 VERIFIED)**:二次元怪物 battler 数量极大、免费+署名;
  用于战斗画面/结果面板没问题;**若需要地图上的行走/游荡精灵,这套不提供**,需另行解决。
- OpenGameArt 按 CC0 过滤的怪物包做补充(逐页核验,流程同 T8 候选 5)。

### 4.5 VFX(炉烟/采集/施法)

- 优先 OpenGameArt CC0 过滤(平台级 PARTIAL,逐页核验)+ CraftPix freebies 特效类(PARTIAL)。
- 炉烟建议程序化粒子,不必引入序列帧贴图(ECONOMY-BASE-DESIGN-V1 §10 的"炉烟"属于可观看动作层)。
- ansimuz.itch.io(搜索线索,CC0 VFX 序列帧)→ pending。

## 5. 明确排除项(避免后人重复踩坑)

- **Spriters-Resource / extracted ripped assets**:从商业游戏里拆出的素材,即使免费可下也**没有授权**,
  一律不碰(许可危险,不是风格问题)。
- **Unity/Unreal Asset Store、GameDev Market**:引擎市场素材多数许可绑定引擎/项目类型,且本项目是
  纯 Web JS,不引引擎;仅在许可明确无关引擎时才考虑。
- **付费大包(>$20)与需登录/订阅的源**:本轮纪律是不付费、不登录;列入候选也不下载。

## 6. 待核验队列(下一轮按序执行,完成一条升级一条的状态)

1. CraftPix 官方许可原文(从任一 freebie 下载内附 LICENSE 或站内 Terms)→ 把 §3.2 升 VERIFIED;
2. BOOTH 免费二次元素材区:搜"4方向 キャラ 無料"类目,逐商品读许可(四方向角色主攻);
3. nanamiyuki / tokudaya / guttari8 的利用規约页;
4. LimeZu Modern Farm 单品页(园圃对口,确认价格档与许可同主系列);
5. ansimuz.itch.io VFX 许可;
6. Super Game Assets 等距建筑许可与实际投影;
7. Kenney 官网 license 页直读(把 CC0 从 PARTIAL 升 VERIFIED);
8. T8 候选 3/4(kostopher、NoranekoGames)打开商品页核验动画表与 EULA。

## 7. 相关文档

- `ASSET-RENDERING-UPGRADE.md` — 素材协议与显示能力(正式接入的验收口径)
- `research/BUILDING-ASSET-RESEARCH.md` — 建筑素材本地来源、投影适配与选型判断
- `ECONOMY-BASE-DESIGN-V1.md` §10/§11 — 基地界面可观看动作、建筑素材选型原则与自产样板
- `content-prep/expedition-v1/item-icon-coverage.md` — 49 缺图标明细
- `content-prep/expedition-v1/animation-pack-candidates.md` — T8 动画包候选表(与 §4.3 衔接)
- `output/glm-r52/final-report.md` §素材缺口 — 本轮缺口清单的原始出处

> 本文数字/许可信息截止 2026-10-05。站点许可会变,正式引入任何素材前必须重读该包当下许可原文,
> 并按 T4 管线做视觉与透明度检查、记录 SHA256。
