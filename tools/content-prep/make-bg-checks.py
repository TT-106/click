#!/usr/bin/env python
# T4:关键候选三背景检查图(暗绿/浅灰/棋盘格 × 160/240px,观察白边/模糊/阴影/裁切)。
# 只生成派生预览,不改原图。
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(r"D:\下载\clickpocalypse2-main")
OUT = ROOT / "output" / "glm-r52" / "asset-review" / "bg-checks"
OUT.mkdir(parents=True, exist_ok=True)

KEYS = [
    ("b1-00", "assets/vendor/rubberduck-medieval-buildings-03/building_1/128x64_shaded/b1_128x64_shaded_00.png"),
    ("b2-00", "assets/vendor/rubberduck-medieval-buildings-03/building_2/128x64_shaded/b2_128x64_shaded_00.png"),
    ("b3-00", "assets/vendor/rubberduck-medieval-buildings-03/building_3/128x64_shaded/b3_128x64_shaded_00.png"),
    ("b1-winter-04", "assets/vendor/rubberduck-medieval-buildings-03/building_1/128x64_shaded/b1_128x64_shaded_04.png"),
    ("fw-blacksmith", "assets/vendor/feudalwars-buildings/blacksmith.png"),
    ("fw-stable", "assets/vendor/feudalwars-buildings/stable.png"),
    ("cart-00", "assets/vendor/rubberduck-medieval-props/medieval_props_2x2_128x64_shaded/medieval_props_2x2_128x64_shaded_00.png"),
    ("well-04", "assets/vendor/rubberduck-medieval-props/medieval_props_2x2_128x64_shaded/medieval_props_2x2_128x64_shaded_04.png"),
    ("stall-empty-06", "assets/vendor/rubberduck-medieval-props/medieval_props_2x2_128x64_shaded/medieval_props_2x2_128x64_shaded_06.png"),
    ("stall-food-10", "assets/vendor/rubberduck-medieval-props/medieval_props_2x2_128x64_shaded/medieval_props_2x2_128x64_shaded_10.png"),
    ("stall-tools-16", "assets/vendor/rubberduck-medieval-props/medieval_props_2x2_128x64_shaded/medieval_props_2x2_128x64_shaded_16.png"),
    ("prop-barrel-26", "assets/vendor/rubberduck-medieval-props/medieval_props_128x64_shaded/medieval_props_128x64_shaded_26.png"),
    ("prop-mortar-04", "assets/vendor/rubberduck-medieval-props/medieval_props_128x64_shaded/medieval_props_128x64_shaded_04.png"),
    ("prop-basket-32", "assets/vendor/rubberduck-medieval-props/medieval_props_128x64_shaded/medieval_props_128x64_shaded_32.png"),
    ("gpt-workshop-v1", "output/imagegen/building-concepts/workshop-v1.png"),
]

DARK_GREEN = (36, 48, 40, 255)
LIGHT_GRAY = (200, 202, 198, 255)
CHECK_A = (150, 150, 150, 255)
CHECK_B = (110, 110, 110, 255)

FONT = None
for cand in ["C:/Windows/Fonts/msyh.ttc", "C:/Windows/Fonts/simhei.ttf", "C:/Windows/Fonts/arial.ttf"]:
    if Path(cand).exists():
        FONT = ImageFont.truetype(cand, 14)
        break
if FONT is None:
    FONT = ImageFont.load_default()


def checkerboard(w, h, cell=16):
    bg = Image.new("RGBA", (w, h), CHECK_A)
    d = ImageDraw.Draw(bg)
    for y in range(0, h, cell):
        for x in range(0, w, cell):
            if (x // cell + y // cell) % 2:
                d.rectangle([x, y, x + cell - 1, y + cell - 1], fill=CHECK_B)
    return bg


def on_background(im, bg_kind, h):
    scale = h / im.height
    w = max(1, round(im.width * scale))
    r = im.resize((w, h), Image.LANCZOS)
    canvas_size = (w + 16, h + 16)
    if bg_kind == "green":
        bg = Image.new("RGBA", canvas_size, DARK_GREEN)
    elif bg_kind == "gray":
        bg = Image.new("RGBA", canvas_size, LIGHT_GRAY)
    else:
        bg = checkerboard(*canvas_size)
    bg.paste(r, (8, 8), r)
    return bg


def main():
    for name, rel in KEYS:
        src = Image.open(ROOT / rel).convert("RGBA")
        row_imgs = []
        for h in (240, 160):
            for kind in ("green", "gray", "checker"):
                row_imgs.append(on_background(src, kind, h))
        total_w = sum(i.width for i in row_imgs) + 10 * (len(row_imgs) - 1)
        sheet = Image.new("RGB", (total_w, 240 + 50), (24, 30, 26))
        d = ImageDraw.Draw(sheet)
        d.text((6, 4), f"{name}  原尺寸 {src.width}x{src.height}  |  240px:绿/灰/棋  160px:绿/灰/棋", fill=(225, 232, 215), font=FONT)
        x = 0
        for i in row_imgs:
            sheet.paste(i.convert("RGB"), (x, 40))
            x += i.width + 10
        sheet.save(OUT / f"bgcheck-{name}.png", "PNG")
    print(f"三背景检查图完成: {len(KEYS)} 张 → {OUT}")


if __name__ == "__main__":
    main()
