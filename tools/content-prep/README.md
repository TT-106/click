# 内容准备预览页(tools/content-prep/)

**醒目标注:内容准备预览,未接入游戏。** 数据是 `content-prep/expedition-v1/` 的未接线设计草案;素材是未注册候选。没有存档读写、没有生产接线、没有世界碰撞/进屋效果。

## 启动

```powershell
# 独立工具会话,端口 4181(结束时应恢复自己设置的变量)
$env:PORT = '4181'
node scripts/serve.mjs
```

访问完整路径(服务不会自动找目录索引):
`http://127.0.0.1:4181/tools/content-prep/index.html`

## 四个标签

1. **物品(60)**:搜索/类别/阶段筛选;散装/件数/实例量纲、采集步长、来源用途、图标状态(已注册图标从已注册图集按 asset.json rect 提取;缺图显示诚实"缺图"占位)。
2. **配方**:按产物选择;输入、替代组(明确"任选")、工位与等级、整批耗时、外部来源、`visibleWhen` 隐藏条件、实例升级(输出=原实例,不复制)。
3. **建筑(8×3)**:每栋候选示意(语义最近的未注册候选,风格问题如实标注)、三级新增成本/建造时间/功能解锁/效率(量纲在键名)/前置;全部外观 `pending` 可见;**没有可在游戏里升级的假按钮**。
4. **素材候选**:原尺寸/240px/160px × 暗绿/浅灰/棋盘格三背景;脚点参考线=alpha≥128 包围框底边(**仅线索,不是正式锚点**);明确说明没有世界碰撞/进屋接线。

## 实现边界

- 原生 HTML/CSS/JS,无在线字体、无 CDN、无新依赖。
- 只读加载本地 JSON 与图片;不调用 `AssetCatalog` 注册,不触碰 `runtime.game`。
- 支持键盘标签切换(左右方向键)、焦点可见、375px 宽度不横向溢出、`prefers-reduced-motion` 禁用动画。

## R54复核工具

- `node tools/content-prep/validate.mjs all`：结构、量纲、互斥替代和配方/建筑启动依赖。
- `node --test tools/content-prep/test-content-rules.mjs`：29项语义及反例测试。
- `node tools/content-prep/baseline-hash.mjs output/protected-current.txt --compare=output/glm-r52/baseline/protected-files-sha256.txt`：保护文件真正逐字节比较，有缺失/变化/新增即退出1；单纯生成哈希清单不等于比较通过。
- `node tools/content-prep/preview-acceptance.mjs`：3视口×2明暗×2动画偏好共12组合；检查实际数量、图像解码和页面异常。设置 `CONTENT_PREP_OUTPUT_DIR=output/glm-r52-review` 可保留旧验收证据。
- 石料新增AI生成候选，预览显示候选状态；11项已注册、1项候选、48项仍缺图。PNG/完整提示词/alpha检查保存在 `output/imagegen/material-icons/`，未接游戏。

修正结果和工程接入顺序：`docs/CONTENT-PREP-ACCEPTANCE.md`。
