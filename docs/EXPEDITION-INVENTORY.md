# 自动采集、角色背包与返程归仓

更新：2026-10-04，R50。入口为网页的「原野探索 → 背包」，以及桌面小窗底栏的「背包」。按 B 打开、Esc 关闭。小窗背包可点击「展开查看」切换完整窗口；不会自动暂停旅途。

## 本次交付

- 七种实际可收集材料：木料、羽毛、铜矿、铁矿、银矿、晶石、皮革。林地、草原、高地、湿地和旧屋使用不同资源分布；资源按种子与整数世界坐标重建，独立于经典随机流。
- 每个角色的背包分别堆叠，轮流分配拾取物；单人容量 24，达到队伍容量约 80% 时自动返程，也可手动要求返程。拾取会短暂停留，未来有 interact 帧的角色可以自动播放动作。
- 返程沿真实走过的路线逐格移动；路线会消除回环，跨活动窗口也能回营地，不传送、不穿墙。归来时将所有随身材料一起转入营地仓库，背包清空，休整 8 秒后再次出发。收获守恒，重复调用结算不会重复增加库存。附近探索完、达到 15 分钟模拟时间或路线长度上限时也会返程。
- RPG 背包面板包含人物像素肖像、每人数量、负重、分类、物品格、选中详情、营地仓库和最近一次归来摘要。自动整理即可使用，不要求拖放、逐件清理或定时操作。375px 网页和 Windows 观赏小窗均有适配。
- 「新世界」将随身材料安全归仓，保留已有仓库。更换世界的地貌与资源重新生成；不会将营地库存清空。

这是用于验证观赏价值的短循环。原野尚无独立战斗、制作配方、可装备新物品、真正基地设施、关闭后的离线推进或一周远征。本轮没有把材料描述中的未来用途做成可点击的假功能，经典装备与战斗仍走原系统。

## 实际下载的素材

| 包 | 作者与原站 | 许可 | 本地文件与用途 |
|---|---|---|---|
| RPG Crafting Material Icons | [BizmasterStudios / OpenGameArt](https://opengameart.org/content/rpg-crafting-material-icons) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | `assets/vendor/bizmaster-crafting/materials.png`；16 个 32×32 帧，地图资源标记与背包图标共用 |
| UI Pack - Adventure | [Kenney 原站](https://kenney.nl/assets/ui-pack-adventure) | CC0 | `assets/vendor/kenney-ui-adventure/`；完整 PNG/Vector/Spritesheet 库存，本次实际使用两个面板 PNG 作可伸缩边框 |

材料原 PNG 没有改写或拆成单图；通过 `assets/themes/expedition/asset.json` 注册语义帧。界面内的「素材署名」保留作品名、作者、作品链接、许可链接及选帧/缩放说明；目录中的 `License.txt` 与 `download.json` 同样保留这些信息和下载哈希。Kenney 的原版许可文件保留。

原始下载另存 `artifacts/vendor-assets/bizmaster-crafting.png` 与 `artifacts/vendor-assets/kenney-ui-adventure.zip`。校验值是本次实际下载文件的 SHA256，不是作者数字签名：

```
bizmaster-crafting.png
1a500b7084bd8d3eb5233b3d29c18034838839c1a721262fb35db3829e6eb081
kenney-ui-adventure.zip
982e8ab66842509ee9214f9c2038e594cbe029f19d1dc177fecaad3b41a67ed3
```

只增加了这两包相关素材。新的二次元角色与多方向动作仍在产品待办中；这里没有宣称它们已经替换现有角色。

## 职责与添加内容

- `src/data/expedition-items.js`：物品身份、名称、图标语义 ID、分类、品质、负重和远征参数。
- `src/engine/exploration/resources.js`：资源覆盖层版本、不同生境的资源分布、坐标散列与数量。
- `src/engine/exploration/expedition.js`：携带、角色归属、消耗位图、回环路线、归仓和恢复校验。
- `open-world-session.js`：在现有探索生命周期中调用以上规则；旧地形生成器与纯探索接口保留。
- `expedition-inventory.js`：只消费只读快照及帧预览，不决定掉落、数量、容量或规则。图标预览通过既有 AssetCatalog，边框路径也由清单解析。

以后增加材料：放入 PNG 或 atlas metadata，注册 `asset.json`，在物品数据中增加 ID 与 icon，在资源分布中加入该 ID，再运行 `npm run import:assets`。地图 Renderer 与物品格均按语义 ID 解析，不需要为新材料增加 if/else。添加动画仍沿用 `idle_01` / `walk_01` / `interact_01` 和方向目录的既有导入流程。

资源生成的发布版本必须保持稳定。替换图片不影响资源或世界版本；改变已发布版本的资源位置、数量、物品身份或负重，要制定迁移或保留旧规则。删除已保存的物品也不能只删定义。

## 保存与兼容

`C2_OPEN_WORLD_V1` 的地形版本仍为 1，增加可选的 `expedition` 子记录：覆盖层版本、营地、角色 ownerIds、个人堆叠、仓库、已采集位图、回营路线、阶段、时钟、最近拾取与六条归来记录。旧记录没有子记录时，在队伍当前位置建立营地，不移动队伍、不改变发现历史或旧地形。

已采集位置按区块位图保存，缓存淘汰/返回/重启不会刷新资源。恢复会拒绝未知物品、过载、负数量、错误阶段、跳步路线和未访问的采集位图。载入失败会保留原 JSON，本次临时探索不能自动覆盖它；主动保存会显示错误。

角色目前按唯一姓名关联背包。队伍重排按姓名恢复，离队角色的材料安全归仓，新队员为空包；更名目前被视为新身份，旧袋材料被归仓；这是与“改名不换背包主人”目标不符的实现缺口，不能认定为已确认玩法。后续应提供永久ID及更名迁移。原野工具栏现有备份恢复 UI，确认可能回退收获后才写回，当前记录另行留档；取消/坏备份/写回失败保留保护，桌面等待磁盘确认。网页与桌面存档仍各自独立，经典 `.c2save` 不包含原野库存。桌面仍沿用原子 JSON 文件与上一份备份，返程/归仓立即创建检查点，退出等待磁盘确认。

## 验证入口

```
npm run check
npm run lint
npm run test:expedition
npm run test:expedition:desktop
npm run test:village
npm run test:e2e
npm run test:scenarios
npm run test:parity
npm run desktop:make
```

桌面专项支持 `DESKTOP_EXECUTABLE` 指向打包 exe，使用自动创建的独立测试目录。验证实际自动拾取、每人背包、分类详情、负重、手动和自动逐格返程、只结算一次、重新出发、经典完整存档隔离、浏览器刷新/损坏保护及真实 Windows 保存退出/重启。截图与结果在 `output/playwright/expedition/`。

## 后续优先级

1. 给材料提供少量真实配方：工具/补给 → 一个可见营地设施，形成收获的使用闭环。
2. 资源在地图上换成地面矿脉、倒木或可交互物件外观；当前小图标是功能标记，不代表已经砍树或改变地形。增加不同生境的观赏节奏。
3. 引入一个有完整多方向/连贯施法动作的原创角色和一类真实原野遭遇，再扩装备与背包类别。
4. 长周期需要分块动态记录数据库、离线时间规则、永久角色 ID 与远征回顾。当前位图与回环路线有界，不能把单份 JSON 作为无限世界方案。
