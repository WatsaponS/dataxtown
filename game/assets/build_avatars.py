"""Deterministic avatar spritesheet for DataX Town.

Sheet layout: 16 rows x 24 columns (4 directions x 6 animation frames).
Rows 0-7 = ชาย (8 สี), rows 8-15 = หญิง (8 สีเดียวกัน — ผมยาว + กระโปรง)
Direction order: down, left, right, up. Frame order per direction:
  0 idle, 1-2 walk (alternating stride), 3-4 run (wider stride + motion lines),
  5 jump (arms-up pose, used for the "jump" celebration emote).
Final frame size 16x24 (unchanged — game code depends on this). Drawn at
4x (64x96/frame) using the same pixelstudio ramp()/gradient_dither shading
already used for the map, then BOX-downsampled back down — same technique
that gave the map real depth without changing anything downstream.
Run: python build_avatars.py
"""
import json
import sys
from pathlib import Path

SKILL = r"C:\Users\Admin\.codex\skills\pixel-art-studio\scripts"
sys.path.insert(0, SKILL)
from pixelstudio import Sprite, ramp

OUT = Path(__file__).resolve().parent
FW, FH = 16, 24              # final, on-disk frame size — game's config.frameW/frameH
OVERSAMPLE = 4                # authoring resolution multiplier, BOX-downsampled at the end
TW, TH = FW * OVERSAMPLE, FH * OVERSAMPLE
DIRS = ["down", "left", "right", "up"]
ANIMS = ["idle", "walk1", "walk2", "run1", "run2", "jump"]
FRAMES = len(ANIMS)


def Z(v):
    return round(v * OVERSAMPLE)


# (shirt, hair, skin) per variant — DataX-ish friendly palette. Shadow tones are now
# derived via ramp() (hue-shifted, not just darkened) instead of being hand-picked.
VARIANTS = [
    ("#4f8fdd", "#2b2233", "#f2c79b"),
    ("#e2698a", "#5a3825", "#e8b48a"),
    ("#57b06b", "#1f1a16", "#c98d63"),
    ("#e7b94f", "#703c22", "#f2c79b"),
    ("#9867a8", "#e5d9c0", "#e8b48a"),
    ("#65a9c2", "#8a2f2f", "#f5d4ae"),
    ("#d97e3f", "#3a3f6b", "#c98d63"),
    ("#7f8c9f", "#243b2a", "#f2c79b"),
]
PANTS, PANTS_HI = "#2f3550", "#454d75"
OUTLINE = "#1b1626"
SHOE = "#12101a"
CHEEK = "#c97a68"
BROW = "#2a2130"
INNER = "#6e2f3d"        # เสื้อชั้นในใต้เสื้อคลุมเปิดหน้า (โทนคงที่ ไม่ผูกกับสีที่ปรับแต่งได้)
MOTION_LINE = "#e8e4da"  # เส้นความไวสำหรับท่าวิ่ง

# ---- ผลิตพาเลตเฉด (lo/mid/hi) ให้ทุกสีก่อนสร้าง Sprite เพื่อไม่ให้โดน snap ทับกัน ----
tone_cache = {}  # base_hex -> (lo, mid, hi)
skin_shade_cache = {}  # skin -> shadow tone (subtle, not a full hue-shift ramp)
palette = {PANTS, PANTS_HI, OUTLINE, SHOE, CHEEK, BROW, INNER, MOTION_LINE}
for shirt, hair, skin in VARIANTS:
    if shirt not in tone_cache:
        tone_cache[shirt] = tuple(ramp(shirt, steps=3, dark=0.35, light=0.35))
    if hair not in tone_cache:
        tone_cache[hair] = tuple(ramp(hair, steps=3, dark=0.30, light=0.45))
    if skin not in skin_shade_cache:
        skin_shade_cache[skin] = ramp(skin, steps=3, dark=0.18, light=0.20)[0]
    palette.update(tone_cache[shirt])
    palette.update(tone_cache[hair])
    palette.add(skin)
    palette.add(skin_shade_cache[skin])

total_rows = len(VARIANTS) * 2
s = Sprite(FW * len(DIRS) * FRAMES * OVERSAMPLE, FH * total_rows * OVERSAMPLE, palette=list(palette))


def draw_frame(ox, oy, dir_, anim, shirt_tones, hair_tones, skin, skin_sh, female):
    shirt_lo, shirt, shirt_hi = shirt_tones
    hair_lo, hair, hair_hi = hair_tones

    def RC(x0, y0, x1, y1, color):
        s.rect(Z(ox + x0), Z(oy + y0), Z(ox + x1 + 1) - 1, Z(oy + y1 + 1) - 1, color)

    def PXY(x, y, color):
        RC(x, y, x, y, color)

    # Legs: idle = together; walk alternates a short stride; run alternates a wider,
    # higher-kicking stride; jump tucks both legs up (never touch the ground line).
    ly = 19
    LEG_POSE = {
        "idle": [(5, 0), (9, 0)],
        "walk1": [(5, -1), (9, 1)], "walk2": [(5, 1), (9, -1)],
        "run1": [(4, -2), (10, 2)], "run2": [(4, 2), (10, -2)],
        "jump": [(5, -2), (9, -2)],
    }
    for lx, dy in LEG_POSE[anim]:
        y1 = min(22, ly + 3 + dy)
        RC(lx, ly + dy, lx + 1, y1, PANTS_HI if dy < 0 else PANTS)
        RC(lx, min(23, ly + 3 + dy), lx + 1, min(23, ly + 3 + dy), SHOE)

    # Body — เสื้อคลุมเปิดหน้า: แถบสีปรับแต่งได้ (lo/mid/hi, ทึบไม่ dither) อยู่ด้านข้าง
    # ซ้าย-ขวา ส่วนแถบกลางอกเป็นเสื้อชั้นในโทนคงที่ (INNER) โผล่ออกมาให้เห็น — ทุกแถบยังคง
    # เป็นสีทึบล้วนตามเดิม (ไม่ใช้ gradient_dither) เพื่อให้ระบบ swap สีใน avatar.js จับสีตรงเป๊ะ
    RC(4, 12, 6, 13, shirt_hi); RC(9, 12, 11, 13, shirt_hi)
    RC(4, 14, 6, 16, shirt); RC(9, 14, 11, 16, shirt)
    RC(4, 17, 6, 18, shirt_lo); RC(9, 17, 11, 18, shirt_lo)
    RC(7, 12, 8, 18, INNER)

    # Arms — เดิน/วิ่งแกว่งตามจังหวะก้าว (วิ่งแกว่งแรงกว่า) ส่วนกระโดดชูแขนขึ้นแทนการแกว่ง
    if anim == "jump":
        if dir_ in ("down", "up"):
            RC(2, 7, 2, 13, shirt_lo); RC(13, 7, 13, 13, shirt_lo)
            PXY(2, 6, skin); PXY(13, 6, skin)
        elif dir_ == "left":
            RC(3, 6, 3, 13, shirt_lo); PXY(3, 5, skin)
        else:
            RC(12, 6, 12, 13, shirt_lo); PXY(12, 5, skin)
    else:
        swing = {"idle": 0, "walk1": 1, "walk2": -1, "run1": 2, "run2": -2}[anim]
        if dir_ in ("down", "up"):
            RC(3, 13 + swing, 3, 17 + swing, shirt_lo)
            RC(12, 13 - swing, 12, 17 - swing, shirt_lo)
            PXY(3, 18 + swing, skin)
            PXY(12, 18 - swing, skin)
        elif dir_ == "left":
            RC(4, 13 + swing, 4, 17 + swing, shirt_lo)
            PXY(4, 18 + swing, skin)
        else:
            RC(11, 13 + swing, 11, 17 + swing, shirt_lo)
            PXY(11, 18 + swing, skin)

    # เส้นความไว (motion lines) ตอนวิ่ง — เฉพาะหันซ้าย/ขวา (อ่านง่ายสุด) ชิดขอบฝั่งตรงข้าม
    # ทิศที่วิ่งไป ให้ไม่ล้ำไปทับเฟรมข้าง ๆ ในสไปรท์ชีท (แต่ละเฟรมกว้างแค่ 16px ไม่มีช่องว่างคั่น)
    if anim in ("run1", "run2") and dir_ in ("left", "right"):
        mx = 14 if dir_ == "left" else 0
        offset = 1 if anim == "run1" else 0
        PXY(mx, 13 + offset, MOTION_LINE)
        PXY(mx, 16 - offset, MOTION_LINE)

    # Head.
    RC(4, 3, 11, 11, skin)
    # Round the silhouette's corner pixels — at 4x oversample + BOX downsample this
    # softens into a gentle anti-aliased curve rather than a hard square corner.
    PXY(4, 3, hair if dir_ != "up" else skin)
    PXY(11, 3, hair if dir_ != "up" else skin)

    # Hair by direction, with spiky tufts (instead of one flat block) + a highlight streak.
    if dir_ == "up":
        RC(4, 2, 11, 9, hair)
    else:
        RC(4, 2, 11, 5, hair)
        PXY(4, 6, hair)
        PXY(11, 6, hair)
        RC(5, 2, 7, 2, hair_hi)
    # ปลายผมแหลมเป็นกระจุก (zigzag) ทับขอบบนของก้อนผม ให้ดูมีทรงมากกว่าบล็อกเดียวเรียบ ๆ
    RC(4, 1, 5, 1, hair); RC(7, 0, 8, 1, hair); RC(10, 1, 11, 1, hair)

    # Face.
    if dir_ == "down":
        PXY(6, 8, OUTLINE)
        PXY(9, 8, OUTLINE)
        PXY(6, 7, BROW)
        PXY(9, 7, BROW)
        RC(7, 10, 8, 10, CHEEK)
    elif dir_ == "left":
        PXY(5, 8, OUTLINE)
        PXY(5, 7, BROW)
    elif dir_ == "right":
        PXY(10, 8, OUTLINE)
        PXY(10, 7, BROW)
    # Neckline hint under the jaw.
    if dir_ != "up":
        RC(4, 11, 11, 11, "#d9a97f")

    if female:
        # ผมยาวข้างแก้มลงถึงไหล่ (มองจากหลังเห็นผมเต็มแผ่น)
        if dir_ == "up":
            RC(3, 3, 12, 13, hair)
            RC(3, 3, 4, 8, hair_hi)
        else:
            RC(3, 3, 3, 12, hair)
            RC(12, 3, 12, 12, hair)
        # กระโปรงบานเล็กน้อยทับช่วงเอว
        RC(4, 16, 11, 17, shirt_lo)
        RC(3, 18, 12, 19, shirt_lo)


def main():
    genders = [False, True]  # rows 0-7 ชาย, rows 8-15 หญิง
    meta_variants = []
    for gi, female in enumerate(genders):
        for vi, (shirt, hair, skin) in enumerate(VARIANTS):
            row = gi * len(VARIANTS) + vi
            shirt_tones = tone_cache[shirt]
            hair_tones = tone_cache[hair]
            skin_sh = skin_shade_cache[skin]
            for di, dir_ in enumerate(DIRS):
                for fi, anim in enumerate(ANIMS):
                    draw_frame((di * FRAMES + fi) * FW, row * FH, dir_, anim,
                               shirt_tones, hair_tones, skin, skin_sh, female)
            meta_variants.append({
                "shirt": shirt, "shirtLo": shirt_tones[0], "shirtHi": shirt_tones[2],
                "hair": hair, "hairLo": hair_tones[0], "hairHi": hair_tones[2],
                "skin": skin, "gender": "f" if female else "m",
            })

    from PIL import Image
    import tempfile
    src_path = Path(tempfile.gettempdir()) / "dataxtown_avatars_src.png"
    s.save_png(src_path)  # oversampled source, scratch-only — not shipped with the game
    im = Image.open(src_path)
    im.resize((im.width // OVERSAMPLE, im.height // OVERSAMPLE), Image.BOX).save(OUT / "avatars.png")

    meta = {
        "frameW": FW, "frameH": FH, "dirs": DIRS, "frames": FRAMES, "animNames": ANIMS,
        "colorsPerGender": len(VARIANTS),
        "variants": meta_variants,
    }
    (OUT / "avatars.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"wrote avatars.png {FW*len(DIRS)*FRAMES}x{FH*total_rows} ({total_rows} rows) + avatars.json")


if __name__ == "__main__":
    main()
