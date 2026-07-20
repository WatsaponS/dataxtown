"""ถ้วยรางวัลสัปดาห์ — 3 ชิ้น (อันดับ 1/2/3 ตอนจบฤดูกาลรายสัปดาห์บน Leaderboard) เท่านั้น ไม่มีขายตรง
spritesheet 3 คอลัมน์ x 1 แถว ช่องละ 24x24 px  รัน: python build_season_items.py
"""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent
CELL = 24
COLS, ROWS = 3, 1

P = {
    "gold": "#e7b94f", "gold_d": "#b08631", "gold_hi": "#fff0cf",
    "silver": "#c3cbd3", "silver_d": "#8b939c", "silver_hi": "#f0f4f6",
    "bronze": "#c07a45", "bronze_d": "#8a5730", "bronze_hi": "#e8b184",
    "wood": "#8b563f", "wood_d": "#5b3a32",
    "cream": "#fff6dc", "black": "#1b1626",
}

img = Image.new("RGBA", (COLS * CELL, ROWS * CELL), (0, 0, 0, 0))
d = ImageDraw.Draw(img)


def O(i):
    return (i % COLS) * CELL, (i // COLS) * CELL


def R(i, x0, y0, x1, y1, c):
    ox, oy = O(i)
    d.rectangle([ox + x0, oy + y0, ox + x1, oy + y1], fill=P[c])


def E(i, x0, y0, x1, y1, c):
    ox, oy = O(i)
    d.ellipse([ox + x0, oy + y0, ox + x1, oy + y1], fill=P[c])


def PX(i, x, y, c):
    ox, oy = O(i)
    d.point((ox + x, oy + y), fill=P[c])


def sparkle(i, x, y, c):
    PX(i, x, y - 1, c); PX(i, x, y + 1, c); PX(i, x - 1, y, c); PX(i, x + 1, y, c)


def trophy(i, cup, cup_d, cup_hi):
    # ฐานไม้
    R(i, 7, 20, 16, 22, "wood_d"); R(i, 8, 19, 15, 20, "wood")
    # ก้าน
    R(i, 10, 15, 13, 19, cup_d)
    # ถ้วย
    E(i, 6, 6, 17, 16, cup)
    E(i, 8, 8, 15, 14, cup_d)
    R(i, 8, 6, 15, 10, cup_hi)
    # หู 2 ข้าง
    E(i, 2, 8, 6, 13, cup_d); E(i, 17, 8, 21, 13, cup_d)
    E(i, 3, 9, 5, 12, cup); E(i, 18, 9, 20, 12, cup)
    sparkle(i, 11, 4, cup_hi)


trophy(0, "gold", "gold_d", "gold_hi")
trophy(1, "silver", "silver_d", "silver_hi")
trophy(2, "bronze", "bronze_d", "bronze_hi")

img.save(OUT / "season_items.png")
print("saved", OUT / "season_items.png", img.size)
