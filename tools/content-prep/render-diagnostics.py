#!/usr/bin/env python
# 诊断夹具后处理:PPM → PNG,加「诊断夹具」标注与图例(非玩家视野)。
import subprocess, sys, json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(r"D:\下载\clickpocalypse2-main")
OUT = ROOT / "output" / "glm-r52" / "screenshots" / "diagnostics"
OUT.mkdir(parents=True, exist_ok=True)

SEEDS = [
    ("内容验收-001", "normal"), ("内容验收-011", "normal"), ("内容验收-021", "normal"),
    ("内容验收-098", "worst"), ("内容验收-25", "worst"), ("内容验收-27", "worst"),
]

FONT = None
for cand in ["C:/Windows/Fonts/msyh.ttc", "C:/Windows/Fonts/simhei.ttf", "C:/Windows/Fonts/arial.ttf"]:
    if Path(cand).exists():
        FONT = ImageFont.truetype(cand, 16)
        break
if FONT is None:
    FONT = ImageFont.load_default()


def main():
    results = []
    for seed, kind in SEEDS:
        png = OUT / f"diag-{kind}-{seed}.png"
        ppm = str(png) + ".raw.ppm"
        proc = subprocess.run(["node", "tools/content-prep/diagnostic-trajectory.mjs", seed, ppm, "8"],
                              capture_output=True, text=True, cwd=str(ROOT))
        if proc.returncode != 0:
            print(f"{seed}: node 失败 {proc.stderr[:200]}")
            continue
        meta = json.loads(proc.stdout.strip().splitlines()[-1])
        im = Image.open(ppm).convert("RGB")
        bar = Image.new("RGB", (im.width, 64), (24, 30, 26))
        d = ImageDraw.Draw(bar)
        d.text((6, 4), f"诊断夹具(DIAGNOSTIC FIXTURE)种子 {seed} [{kind}] — 非玩家探索视野", fill=(255, 190, 120), font=FONT)
        d.text((6, 28), f"完成{meta['trips']}趟 结构{meta['structures']}格 轨迹{meta['trailPoints']}点 | 归仓 {meta['warehouse'] or '(无)'}", fill=(210, 220, 200), font=FONT)
        d.text((6, 48), "绿=探索轨迹 橙=返程轨迹 白=营地 黄=结构格 暗色=不可走", fill=(160, 175, 155), font=FONT)
        sheet = Image.new("RGB", (im.width, im.height + 64))
        sheet.paste(bar, (0, 0))
        sheet.paste(im, (0, 64))
        sheet.save(png, "PNG")
        Path(ppm).unlink()
        results.append((seed, kind, meta))
        print(f"{seed} [{kind}] -> {png.name} trips={meta['trips']} warehouse={meta['warehouse'][:80]}")
    print(f"完成 {len(results)}/6")


if __name__ == "__main__":
    main()
