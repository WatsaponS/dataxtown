"""Deterministic avatar spritesheet for DataX Town.

Sheet layout: 16 rows x 12 columns (4 directions x 3 frames).
Rows 0-7 = ชาย (8 สี), rows 8-15 = หญิง (8 สีเดียวกัน — ผมยาว + กระโปรง)
Direction order: down, left, right, up. Frame 0 = idle, 1-2 = walk.
Frame size 16x24. Run: python build_avatars.py
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent
FW, FH = 16, 24
DIRS = ["down", "left", "right", "up"]
FRAMES = 3

# (shirt, shirt_shadow, hair, skin) per variant — DataX-ish friendly palette.
VARIANTS = [
    ("#4f8fdd", "#33639f", "#2b2233", "#f2c79b"),
    ("#e2698a", "#a8455f", "#5a3825", "#e8b48a"),
    ("#57b06b", "#3a7d4a", "#1f1a16", "#c98d63"),
    ("#e7b94f", "#b08631", "#703c22", "#f2c79b"),
    ("#9867a8", "#6d4579", "#e5d9c0", "#e8b48a"),
    ("#65a9c2", "#42768c", "#8a2f2f", "#f5d4ae"),
    ("#d97e3f", "#9c5527", "#3a3f6b", "#c98d63"),
    ("#7f8c9f", "#565f6f", "#243b2a", "#f2c79b"),
]
PANTS, PANTS_HI = "#2f3550", "#454d75"
OUTLINE = "#1b1626"


def px(d, x, y, c):
    d.point((x, y), fill=c)


def draw_frame(d, ox, oy, dir_, frame, colors, female=False):
    shirt, shirt_sh, hair, skin = colors
    # Legs: idle = both down; walk frames alternate.
    ly = oy + 19
    if frame == 0:
        legs = [(5, 0), (9, 0)]
    elif frame == 1:
        legs = [(5, -1), (9, 1)]
    else:
        legs = [(5, 1), (9, -1)]
    for lx, dy in legs:
        d.rectangle([ox + lx, ly + dy, ox + lx + 1, min(oy + 22, ly + 3 + dy)], fill=PANTS)
        d.rectangle([ox + lx, min(oy + 23, ly + 3 + dy), ox + lx + 1, min(oy + 23, ly + 3 + dy)], fill=OUTLINE)
    # Body.
    d.rectangle([ox + 4, oy + 12, ox + 11, oy + 18], fill=shirt)
    d.rectangle([ox + 4, oy + 17, ox + 11, oy + 18], fill=shirt_sh)
    # Arms (swing on walk).
    swing = 0 if frame == 0 else (1 if frame == 1 else -1)
    if dir_ in ("down", "up"):
        d.rectangle([ox + 3, oy + 13 + swing, ox + 3, oy + 17 + swing], fill=shirt_sh)
        d.rectangle([ox + 12, oy + 13 - swing, ox + 12, oy + 17 - swing], fill=shirt_sh)
        d.point((ox + 3, oy + 18 + swing), fill=skin)
        d.point((ox + 12, oy + 18 - swing), fill=skin)
    elif dir_ == "left":
        d.rectangle([ox + 4, oy + 13 + swing, ox + 4, oy + 17 + swing], fill=shirt_sh)
        d.point((ox + 4, oy + 18 + swing), fill=skin)
    else:
        d.rectangle([ox + 11, oy + 13 + swing, ox + 11, oy + 17 + swing], fill=shirt_sh)
        d.point((ox + 11, oy + 18 + swing), fill=skin)
    # Head.
    d.rectangle([ox + 4, oy + 3, ox + 11, oy + 11], fill=skin)
    # Hair by direction.
    if dir_ == "up":
        d.rectangle([ox + 4, oy + 2, ox + 11, oy + 9], fill=hair)
    else:
        d.rectangle([ox + 4, oy + 2, ox + 11, oy + 5], fill=hair)
        d.point((ox + 4, oy + 6), fill=hair)
        d.point((ox + 11, oy + 6), fill=hair)
    # Face.
    if dir_ == "down":
        d.point((ox + 6, oy + 8), fill=OUTLINE)
        d.point((ox + 9, oy + 8), fill=OUTLINE)
        d.rectangle([ox + 7, oy + 10, ox + 8, oy + 10], fill="#b06a5a")
    elif dir_ == "left":
        d.point((ox + 5, oy + 8), fill=OUTLINE)
    elif dir_ == "right":
        d.point((ox + 10, oy + 8), fill=OUTLINE)
    # Head outline hint.
    d.rectangle([ox + 4, oy + 11, ox + 11, oy + 11], fill="#d9a97f" if dir_ != "up" else hair)
    if female:
        # ผมยาวข้างแก้มลงถึงไหล่ (มองจากหลังเห็นผมเต็มแผ่น)
        if dir_ == "up":
            d.rectangle([ox + 3, oy + 3, ox + 12, oy + 13], fill=hair)
        else:
            d.rectangle([ox + 3, oy + 3, ox + 3, oy + 12], fill=hair)
            d.rectangle([ox + 12, oy + 3, ox + 12, oy + 12], fill=hair)
        # กระโปรงบานเล็กน้อยทับช่วงเอว
        d.rectangle([ox + 4, oy + 16, ox + 11, oy + 17], fill=shirt_sh)
        d.rectangle([ox + 3, oy + 18, ox + 12, oy + 19], fill=shirt_sh)


def main():
    genders = [False, True]  # rows 0-7 ชาย, rows 8-15 หญิง
    total_rows = len(VARIANTS) * len(genders)
    sheet = Image.new("RGBA", (FW * 4 * FRAMES, FH * total_rows), (0, 0, 0, 0))
    d = ImageDraw.Draw(sheet)
    meta_variants = []
    for gi, female in enumerate(genders):
        for vi, colors in enumerate(VARIANTS):
            row = gi * len(VARIANTS) + vi
            for di, dir_ in enumerate(DIRS):
                for f in range(FRAMES):
                    draw_frame(d, (di * FRAMES + f) * FW, row * FH, dir_, f, colors, female)
            s, sh, h, sk = colors
            meta_variants.append({"shirt": s, "shirtShadow": sh, "hair": h, "skin": sk,
                                  "gender": "f" if female else "m"})
    sheet.save(OUT / "avatars.png")
    # Metadata for the in-game palette-swap recolorer (game/js/avatar.js):
    # exact key colors per variant row so JS can find-and-replace pixels.
    meta = {
        "frameW": FW, "frameH": FH, "dirs": DIRS, "frames": FRAMES,
        "colorsPerGender": len(VARIANTS),
        "variants": meta_variants,
    }
    (OUT / "avatars.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"wrote avatars.png {sheet.size[0]}x{sheet.size[1]} ({total_rows} rows) + avatars.json")


if __name__ == "__main__":
    main()
