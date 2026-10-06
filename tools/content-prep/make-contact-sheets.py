#!/usr/bin/env python
# T4:联系表生成(观察用派生图,不改原图)。
# 读取 asset-candidates.json 的扫描结果,按组生成分页联系表:
#   - 三栋建筑各:shaded_128 全8文件页 + 6变体对比页(文件00)
#   - 道具:128x64_shaded 全量页、128x64_shaded_winter 对照页、64x32_shaded 页
#   - feudalwars 两张 + GPT工坊概念图
# 输出: output/glm-r52/asset-review/sheet-*.png + contact-sheet-index.csv(短编号→路径/哈希)
import json
import csv
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(r"D:\下载\clickpocalypse2-main")
REVIEW = ROOT / "output" / "glm-r52" / "asset-review"
SCAN = REVIEW / "asset-candidates.json"
TILE_W, TILE_H, LABEL_H = 300, 220, 34
COLS, ROWS = 4, 4  # 每页16格,介于12-24之间
PAGE_W = COLS * TILE_W
PAGE_H = ROWS * (TILE_H + LABEL_H)

FONT = None
for cand in ["C:/Windows/Fonts/msyh.ttc", "C:/Windows/Fonts/simhei.ttf", "C:/Windows/Fonts/arial.ttf"]:
    if Path(cand).exists():
        try:
            FONT = ImageFont.truetype(cand, 15)
            break
        except Exception:
            pass
if FONT is None:
    FONT = ImageFont.load_default()


def load_scan():
    data = json.loads(SCAN.read_text(encoding="utf-8"))
    return {r["path"]: r for r in data["records"]}


def short_id(path, pack):
    name = Path(path).name
    if pack == "rubberduck-medieval-buildings-03":
        parts = Path(path).parts
        b = parts[-3].replace("building_", "B")
        d = parts[-2]
        tag = {"128x64_cloudy": "128C", "128x64_no_shadow": "128N", "128x64_shaded": "128S",
               "64x32_cloudy": "64C", "64x32_no_shadow": "64N", "64x32_shaded": "64S"}[d]
        return f"{b}-{tag}-{name.split('_')[-1].replace('.png','')}"
    if pack == "rubberduck-medieval-props":
        if name == "Preview.png":
            return "RD-Preview"
        stem = name.replace("medieval_props_", "")
        # 例: 128x64_shaded_07 → 128S-07
        tag = stem[: len(stem) - 3].rstrip("_")
        idx = stem.split("_")[-1].replace(".png", "")
        m = {"128x64_cloudy": "128C", "128x64_no_shadow": "128N", "128x64_shaded": "128S",
             "64x32_cloudy": "64C", "64x32_no_shadow": "64N", "64x32_shaded": "64S"}
        for k, v in m.items():
            if stem.startswith(k):
                suffix = "_winter" if stem.endswith("_winter") else ""
                return f"P{idx}-{v}{suffix}"
        return f"P-{stem}"
    if pack == "feudalwars-buildings":
        return "FW-" + name.replace(".png", "")
    return name


def make_sheet(group, records, out_path, title, crop_zoom=False):
    page = Image.new("RGBA", (PAGE_W, PAGE_H + 40), (24, 30, 26, 255))
    draw = ImageDraw.Draw(page)
    draw.text((8, 8), title, fill=(220, 230, 210, 255), font=FONT)
    for i, path in enumerate(group):
        col, row = i % COLS, i // COLS
        x0, y0 = col * TILE_W, 40 + row * (TILE_H + LABEL_H)
        rec = records[path]
        try:
            im = Image.open(ROOT / path).convert("RGBA")
            if crop_zoom:
                bb = rec.get("alpha128BBox")
                if bb:
                    pad = 4
                    box = (max(0, bb["x0"] - pad), max(0, bb["y0"] - pad), min(im.width, bb["x1"] + 1 + pad), min(im.height, bb["y1"] + 1 + pad))
                    im = im.crop(box)
            im.thumbnail((TILE_W - 12, TILE_H - 12))
            if crop_zoom and im.width < 140 and im.height < 140:
                scale = max(2, 160 // max(im.width, 1))
                im = im.resize((im.width * scale, im.height * scale), Image.NEAREST)
        except Exception as e:
            im = Image.new("RGBA", (100, 60), (120, 30, 30, 255))
            path = f"{path} ERR:{e}"
        cell = Image.new("RGBA", (TILE_W, TILE_H), (46, 58, 50, 255))
        cell.paste(im, ((TILE_W - im.width) // 2, (TILE_H - im.height) // 2), im)
        page.paste(cell, (x0, y0))
        sid = short_id(path, rec["sourcePack"])
        label = f"{sid}  {rec['width']}x{rec['height']}"
        draw.text((x0 + 6, y0 + TILE_H + 2), label, fill=(235, 240, 225, 255), font=FONT)
    page.convert("RGB").save(out_path, "PNG")
    return out_path.name


def main():
    REVIEW.mkdir(parents=True, exist_ok=True)
    records = load_scan()
    by_path = records
    index_rows = []

    def emit(group, title, slug, crop_zoom=False):
        if not group:
            return
        name = make_sheet(group, by_path, REVIEW / f"sheet-{slug}.png", title, crop_zoom)
        for p in group:
            r = by_path[p]
            index_rows.append([short_id(p, r["sourcePack"]), p, r["sourcePack"], r["sha256"], r["width"], r["height"], name])

    # 1) 三栋建筑:shaded_128 全 8 文件
    for b in ["building_1", "building_2", "building_3"]:
        group = sorted(p for p in by_path if f"rubberduck-medieval-buildings-03/{b}/128x64_shaded/" in p)
        emit(group, f"{b} 128x64_shaded 全8文件(观察方向/重复)", b)
    # 2) building_1 文件00 六变体对比
    group = []
    for d in ["128x64_cloudy", "128x64_no_shadow", "128x64_shaded", "64x32_cloudy", "64x32_no_shadow", "64x32_shaded"]:
        p = f"assets/vendor/rubberduck-medieval-buildings-03/building_1/{d}/b1_{d}_00.png"
        if p in by_path:
            group.append(p)
    emit(group, "building_1 文件00 六变体对比(分辨率/阴影)", "b1-variants")
    # 3) 道具:128x64_shaded 全量(按编号排序)
    for season, tag in [("128x64_shaded", "props-128S"), ("128x64_shaded_winter", "props-128S-winter"), ("64x32_shaded", "props-64S")]:
        group = sorted((p for p in by_path if f"rubberduck-medieval-props/medieval_props_{season}/" in p),
                       key=lambda p: int(Path(p).stem.split("_")[-1]))
        for page_no in range(0, len(group), COLS * ROWS):
            emit(group[page_no:page_no + COLS * ROWS], f"道具 {season} 第{page_no // (COLS * ROWS) + 1}页(alpha裁剪放大)", f"{tag}-p{page_no // (COLS * ROWS) + 1}", crop_zoom=True)
    # 3.5) 2x2 大道具:shaded 与 winter 对照(alpha裁剪放大)
    for season, tag in [("2x2_128x64_shaded", "props2x2-128S"), ("2x2_128x64_shaded_winter", "props2x2-128S-winter")]:
        group = sorted((p2 for p2 in by_path if f"rubberduck-medieval-props/medieval_props_{season}/" in p2),
                       key=lambda p2: int(Path(p2).stem.split("_")[-1]))
        for page_no in range(0, len(group), COLS * ROWS):
            emit(group[page_no:page_no + COLS * ROWS], f"2x2大道具 {season} 第{page_no // (COLS * ROWS) + 1}页(alpha裁剪放大)", f"{tag}-p{page_no // (COLS * ROWS) + 1}", crop_zoom=True)
    # 4) feudalwars + GPT 工坊概念
    group = sorted(p for p in by_path if "feudalwars-buildings" in p)
    emit(group, "feudalwars blacksmith/stable(原图)", "feudalwars")

    gpt = ROOT / "output" / "imagegen" / "building-concepts" / "workshop-v1.png"
    gpt_row = []
    if gpt.exists():
        page = Image.new("RGB", (900, 940), (24, 30, 26))
        d = ImageDraw.Draw(page)
        d.text((8, 8), "GPT Image 工坊概念 1254x1254(风格样板,未注册)", fill=(220, 230, 210), font=FONT)
        im = Image.open(gpt).convert("RGBA")
        im.thumbnail((880, 880))
        bg = Image.new("RGBA", im.size, (46, 58, 50, 255))
        bg.paste(im, (0, 0), im)
        page.paste(bg.convert("RGB"), (10, 40))
        page.save(REVIEW / "sheet-gpt-workshop.png", "PNG")
        gpt_row.append(["GPT-workshop-v1", str(gpt.relative_to(ROOT)), "(imagegen)", "bd24b2f33de6ce2060c9569820397930677ab8d75d29675c0c0b0d38cf1035fd", 1254, 1254, "sheet-gpt-workshop.png"])

    with open(REVIEW / "contact-sheet-index.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["shortId", "path", "pack", "sha256", "width", "height", "sheet"])
        w.writerows(index_rows + gpt_row)
    print(f"联系表完成: {len(index_rows)} 格 + GPT 概念; index → contact-sheet-index.csv")


if __name__ == "__main__":
    sys.exit(main())
