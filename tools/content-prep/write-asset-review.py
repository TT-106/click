#!/usr/bin/env python
# T4:把视觉评审结论写成 asset-review.csv(仅记录实际看过的候选;家族判定注明适用变体范围)。
import csv
from pathlib import Path

OUT = Path(r"D:\下载\clickpocalypse2-main\output\glm-r52\asset-review\asset-review.csv")
ROOT = Path(r"D:\下载\clickpocalypse2-main")

# (shortId, path, verdict, notes)
ROWS = [
    # 三栋完整建筑(128x64_shaded 实看8文件;判定适用同栋全部48文件家族)
    ("B1-128S-00..07", "assets/vendor/rubberduck-medieval-buildings-03/building_1/128x64_shaded/", "usable-with-work",
     "都铎风小屋;00-03=四朝向,04-07=同四朝向雪顶(季节内嵌文件序号);边缘干净带烘焙阴影;门/台阶在00/02朝向可见,01朝向不清晰;需标定脚点/占地;768x768画布逻辑格128x64"),
    ("B2-128S-00..07", "assets/vendor/rubberduck-medieval-buildings-03/building_2/128x64_shaded/", "usable-with-work",
     "大型庄园(含绿 awning 市场位);1024x1024画布;四朝向+雪顶;02/06朝向门最清楚,00朝向门不可见(记录为问题);细节精致缩到160px可读"),
    ("B3-128S-00..07", "assets/vendor/rubberduck-medieval-buildings-03/building_3/128x64_shaded/", "usable-with-work",
     "开放式木棚(无门,四面开放);512x512;四朝向+雪顶;适合仓库棚/干草棚/前哨遮蔽;内部深色无内容,进屋表现不可用"),
    # b1 六变体(分辨率/光照对照,实看)
    ("B1-128C-00", "assets/vendor/rubberduck-medieval-buildings-03/building_1/128x64_cloudy/b1_128x64_cloudy_00.png", "usable-with-work",
     "阴天光照无投影;与128N/128S同建筑同朝向——三光照=变体不是新建筑"),
    ("B1-128N-00", "assets/vendor/rubberduck-medieval-buildings-03/building_1/128x64_no_shadow/b1_128x64_no_shadow_00.png", "usable-with-work",
     "晴天无影版;适合自主阴影引擎"),
    ("B1-64C-00/64N/64S", "assets/vendor/rubberduck-medieval-buildings-03/building_1/64x32_shaded/", "usable-with-work",
     "半分辨率384x384;原尺寸在地图上可读;放大到160/240px预览会糊(显示尺寸应保持原生逻辑格)"),
    # feudalwars(实看2张+三背景)
    ("FW-blacksmith", "assets/vendor/feudalwars-buildings/blacksmith.png", "preferred",
     "像素等距风铁匠铺:石烟囱+铁砧+工具棚+招牌,工坊/炉窑识别度极佳;仅单一朝向;底部散落道具(砧/桶/料堆)属图内内容,占地与脚点须包含;与rubberduck渲染风不同,勿混拼正式主题"),
    ("FW-stable", "assets/vendor/feudalwars-buildings/stable.png", "usable-with-work",
     "像素等距风马厩:隔栏+草料+围栏院;单一朝向;可作营舍/马厩角色或UI插画;许可见License.txt,注册前需复核"),
    # 2x2 大道具(实看18种+雪季对照)
    ("P2x2-00..03 手推车", "assets/vendor/rubberduck-medieval-props/medieval_props_2x2_128x64_shaded/(00..03)", "preferred",
     "木制手推车四朝向;雪季整车覆雪;与货运/前哨包语义吻合;256x256画布逻辑2x2格"),
    ("P2x2-04..05 水井", "assets/vendor/rubberduck-medieval-props/medieval_props_2x2_128x64_shaded/(04..05)", "preferred",
     "石砌水井+木顶;仅两朝向;三背景检查边缘干净、160px可读;well一级最佳候选;井口深色开放,取水交互点在井沿"),
    ("P2x2-06..09 空摊位", "assets/vendor/rubberduck-medieval-props/medieval_props_2x2_128x64_shaded/(06..09)", "usable-with-work",
     "布顶市场棚(空)四朝向;可作园圃/补给所院棚;顶棚遮挡需分层策略"),
    ("P2x2-10..13 食品摊", "assets/vendor/rubberduck-medieval-props/medieval_props_2x2_128x64_shaded/(10..13)", "preferred",
     "满载果蔬的市场摊(橙/绿果篮);补给所/食品架最佳候选;四朝向;雪季仍显示鲜果(可接受,记录)"),
    ("P2x2-14..17 工具摊", "assets/vendor/rubberduck-medieval-props/medieval_props_2x2_128x64_shaded/(14..17)", "usable-with-work",
     "深色工具/器物摊;最接近'工作台'的现有素材;细节在160px偏暗,识别度弱于FW-blacksmith"),
    # 小道具41种(128S全览41格;判定按类型组)
    ("P00-P03 石瓮/蜜罐", "assets/vendor/rubberduck-medieval-props/medieval_props_128x64_shaded/(00..03)", "preferred",
     "石质瓮/袋状罐,带内容物溢口;仓库/园圃装饰可用"),
    ("P04-P07 石臼", "assets/vendor/rubberduck-medieval-props/medieval_props_128x64_shaded/(04..07)", "preferred",
     "石臼+杵+黄色内容物;加工/补给所装饰;识别度好"),
    ("P08-P15 陶罐/壶组", "assets/vendor/rubberduck-medieval-props/medieval_props_128x64_shaded/(08..15)", "preferred",
     "带盖陶罐×4与陶壶组×4;壶组为多件排布,占地按组算;仓储装饰"),
    ("P16-P17 木桶提桶", "assets/vendor/rubberduck-medieval-props/medieval_props_128x64_shaded/(16..17)", "usable-with-work",
     "提水木桶;水井配套装饰"),
    ("P18-P27 木桶组/单桶/箱/箱柜", "assets/vendor/rubberduck-medieval-props/medieval_props_128x64_shaded/(18..27)", "preferred",
     "桶对/翻盖箱/单桶;仓库堆叠语义好"),
    ("P28-P31 磨盘", "assets/vendor/rubberduck-medieval-props/medieval_props_128x64_shaded/(28..31)", "usable-with-work",
     "圆形石磨盘;加工语义可选装饰"),
    ("P32-P35 柳条篮", "assets/vendor/rubberduck-medieval-props/medieval_props_128x64_shaded/(32..35)", "preferred",
     "编织篮;园圃/食材语义"),
    ("P36-P40 板条箱", "assets/vendor/rubberduck-medieval-props/medieval_props_128x64_shaded/(36..40)", "preferred",
     "X条板箱(单/双/叠);货运与仓库堆箱"),
    # GPT 工坊概念
    ("GPT-workshop-v1", "output/imagegen/building-concepts/workshop-v1.png", "pending",
     "二次元手绘风样板:结构连贯、铁砧+工作台+灯笼可读,主题确认用;与rubberduck写实渲染/feudalwars像素风三者互斥;未注册未标定脚点/门位/占地;不能作为正式地图资源,正式主题需按此风格定向产出"),
]

with open(OUT, "w", newline="", encoding="utf-8-sig") as f:
    w = csv.writer(f)
    w.writerow(["shortId", "pathOrFamily", "verdict", "notes"])
    w.writerows(ROWS)
print(f"asset-review.csv 写入 {len(ROWS)} 行评审记录")
