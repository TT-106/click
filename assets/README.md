# 素材包导入

游戏规则引用语义 ID 或兼容旧资源名称；图片路径、裁切、锚点、动画属于素材包。旧 `spritesheet/*.png` 和 atlas 元数据继续使用，无需拆图。

每个资源建一个目录，例如 `assets/actors/slime/`。放入 `idle_01.png` 至 `idle_04.png`、`walk_01.png` 至 `walk_04.png` 和 `asset.json`：

```json
{
  "id": "monster.slime.anime",
  "group": "actors",
  "replace": "OozeGreen.PNG",
  "fps": 8,
  "anchor": { "x": 48, "y": 112 }
}
```

```powershell
npm run import:assets
npm run check:assets
npm run build
```

`replace` 明确替换旧资源，保持旧存档里的名称和游戏规则不变。新增素材时省略 `replace`，地图物件或内容定义用 `monster.slime.anime` 引用它。注册素材只增加显示能力；新增战斗品种、职业、碰撞或生成规则仍须在对应内容数据中定义，不能用图片自动推断规则，也不能重排已有怪物/职业定义。

可直接复制 `assets/examples/slime/`。示例为 `64×96` 的两帧 idle 和 walk，`enabled:false` 保持默认游戏外观。设为 `true` 后运行导入命令即可替换绿色软泥怪。构建会检查清单与素材包是否一致；禁用包同样检查图片和配置，避免潜伏错误。

自动导入支持 PNG、SVG、WebP；SVG 必须在根元素显式给出像素 `width/height`，`viewBox` 不代表浏览器图片的真实像素尺寸。导入按数字编号排序，识别 `idle/walk/attack/hurt/death/cast/interact`。四方向将各方向帧放在 `NE/NW/SE/SW/` 子目录，八方向可使用 `N/E/S/W`。不同帧尺寸允许不同；需要固定脚底位置时显式设置锚点或逐帧元数据。没有方向帧时使用该动作的默认帧；找不到动作时由动画选择器使用 idle。

`group` 为 `actors`、`terrain`、`items`。角色和地形共享兼容地图参考点 `origin={27,40}`，物品默认 `{0,0}`；它对应经典地块实际菱形中心，旧资源仍保留原绘制方式。`ground` 层默认锚点为图片中心；人物、树、墙等默认底部中点。例如 `54×26` 的紧裁地板默认锚点 `{27,13}`，与角色脚点落在同一世界参考点。`anchor` 是显示尺寸中的接地点像素位置，透明留白较大时应按真实脚底或地面中心覆盖；`offset` 是绘制微调；`depthOffset` 是世界坐标中的排序微调；`size` 是显示尺寸。`footprint={columns,rows}` 只表达视觉排序占地，不能改变寻路、战斗或实体碰撞。

`layer` 可为 `ground/scenery/actor/effect/overlay`。高度不进入前后排序，排序应看地面接触点和视觉占地。大型跨格建筑无法仅靠一张图片解决全部遮挡：必要时拆成有各自占地和锚点的视觉部件。

如果已经有图集元数据、帧名不符合自动规则或需要逐帧锚点，可以显式描述：

```json
{
  "id": "monster.slime.anime",
  "group": "actors",
  "anchor": { "x": 48, "y": 112 },
  "frames": {
    "idleA": { "source": { "image": "idle_a.png" } },
    "idleB": {
      "source": { "image": "sheet.png", "rect": { "x": 0, "y": 0, "width": 96, "height": 128 } },
      "anchor": { "x": 50, "y": 115 }
    }
  },
  "clips": {
    "idle": { "frames": ["idleA", "idleB"], "fps": 6, "loop": true },
    "walk": {
      "fps": 10,
      "loop": true,
      "directions": { "NE": ["idleA", "idleB"], "SW": ["idleB", "idleA"] }
    }
  }
}
```

单张静态素材用 `source: {image:"tree.png"}` 即可。`source.image` 相对当前 `asset.json`，导入器转成静态站点路径；拒绝远程 URL、项目目录外文件、重复 ID/alias、误拼状态、未知方向、越界裁切和未显式声明的旧资源覆盖。也允许引用项目 `spritesheet/` 或 `images/` 中现有图片。运行时 `game.assets.register(definition)` 使用站点相对路径，返回 Promise，只有图片及全部帧验证成功才发布；失败继续显示已有资源，修复后可重新注册。

新增二十种美术资源可以新增二十个素材包后一次导入。此次没有引入运行时目录扫描、数据库、Provider 层、地图编辑器或自动改变玩法的内容导入器；静态清单可以在后续开发期工具中继续生成。

## 地图主题和资源包

`bundle` 不填时属于经典游戏的默认资源包。声明 `"bundle": "forest-village"` 后，图片只在进入原野探索时加载，不影响经典地图裁剪和启动。开发期导入仍会检查所有包的图片、命名与裁切区域。

实际案例在 `themes/forest-village/asset.json`：19 个语义资源使用完整木屋、草地变体、树木、木桥和室内家具；原图及来源位于 `vendor/`。替换木屋美术只修改其资源描述。新增地面变体更新 `src/engine/exploration/theme.js` 的资源 ID 列表。新增建筑结构更新 `building-presets.js` 的占地、入口和外观 ID，并在生成器中安放预设；Renderer 不新增建筑类型分支。

静态地图主题只需 source。角色动画仍按 idle/walk 文件名及方向目录导入；用于现有角色时使用默认包与显式 replace。主题专属角色皮肤选择尚未接线，当前村落沿用队伍已有的显示资源。

村落的自然地表由相邻格语义生成连续轮廓。`theme.js` 的地表层声明参与连接的种类、纹理、调色和细节；例如水面同时连接 water 和 bridge，木桥在水面上方绘制。纹理整层填充并固定在世界坐标，避免半透明图块重叠形成方格线。大树、建筑和角色仍使用各自帧尺寸，地面纹理需适配当前 54×26 的菱形投影。

旧村 v3 的宏观布局仍在 `village-layout.js`，用于旧记录兼容。当前自然开放世界在 `natural-terrain.js` 连续采样地貌，在 `natural-world.js` 按环境选址建筑；不再调用村落模板。新增建筑先注册资源，再补 `building-presets.js` 的占地/门/外观 ID 和 `NATURAL_BUILDING_RULES` 的环境条件/优先级/权重。Renderer 不需要认识建筑类型。占地当前需适配 18 格选址单元；更大的城堡应使用新的区域级放置规则。草原/湿地/高地的显示映射仍在 `theme.js`，高度场目前不代表可行走地表高差。
