"""Build the game's full-body outfit spritesheet from the pre-made 4-direction
walk-cycle sprites in pixel-art/male-cyber-fantasy-walk-v1/ and
female-cyber-fantasy-walk-v1/ (already chroma-keyed, pose-extracted, and laid
out as down/left/right/up x 4 frames by each folder's own build.py — this
script only crops each frame tightly, rescales everything uniformly, and
re-lays it into the layout the game code expects).

Unlike the earlier piece-by-piece cosmetics (hat/shirt/pants/wings as static
overlays), this is a full-body replacement layer: when equipped it's drawn
*instead of* the base avatar body, using the same directional walk-cycle
animation, so it moves naturally instead of a single static pose. No
recolor -- it's shown exactly as designed.

Output frame is bigger than avatars.png (48x75 vs 32x50) on purpose: the
source art is much more detailed than the base avatar, and the game draws
this sheet at its own native size (not squeezed to match the base
character), so the extra source detail actually stays visible in-game
instead of being crushed down to the base character's pixel budget.

Output: game/assets/outfits.png (+ outfits.json). Row 0 = male_cyber_fantasy,
row 1 = female_cyber_fantasy. 16 cols per row (4 directions x 4 walk frames).
Run: python build_outfits.py
"""
import json
from pathlib import Path
from PIL import Image

OUT = Path(__file__).resolve().parent
ROOT = OUT.parent.parent / "pixel-art"

# ใหญ่กว่า avatars.png (32x50) โดยตั้งใจ — ต้นฉบับสไปรท์จาก DALL-E ละเอียดกว่าตัวละครฐานมาก
# (คอนเทนต์เต็มเฟรมสูงถึง ~112px) ถ้าบีบลงมาระดับเดียวกับตัวละครฐาน (48px) จะเสียรายละเอียด
# เส้นเล็ก ๆ (ขนปีก, ลายเกราะ) ไปเกือบหมด เกมวาดชุดด้วยขนาดตัวเอง ไม่บีบให้พอดีตัวละครฐาน
# (ดู game/js/outfit.js) เลยไม่จำเป็นต้องเท่ากับ 32x50 อีกต่อไป
FW, FH = 40, 62
TARGET_H = 60
DIRS = ["down", "left", "right", "up"]
FRAMES = 4

VARIANTS = [
    ("male_cyber_fantasy", ROOT / "male-cyber-fantasy-walk-v1" / "male-cyber-fantasy-walk-sheet.png"),
    ("female_cyber_fantasy", ROOT / "female-cyber-fantasy-walk-v1" / "female-cyber-fantasy-walk-sheet.png"),
]
SRC_FRAME = 128


def content_bbox(frame_rgba):
    return frame_rgba.getchannel("A").getbbox()


def measure_uniform_scale():
    """หาสเกลเดียวที่ใช้กับทุก variant ไม่งั้นชายกับหญิงจะดูตัวใหญ่เล็กไม่เท่ากัน"""
    max_w = max_h = 0
    for _, path in VARIANTS:
        sheet = Image.open(path).convert("RGBA")
        for row in range(4):
            for col in range(4):
                frame = sheet.crop((col * SRC_FRAME, row * SRC_FRAME, (col + 1) * SRC_FRAME, (row + 1) * SRC_FRAME))
                bbox = content_bbox(frame)
                if not bbox:
                    continue
                max_w = max(max_w, bbox[2] - bbox[0])
                max_h = max(max_h, bbox[3] - bbox[1])
    return TARGET_H / max_h, max_w, max_h


def resize_rgba_premultiplied(im, new_w, new_h):
    """ต้นฉบับเป็น mask ขอบคมล้วน (alpha 0/255) — ใช้ BOX + premultiply กัน ringing เหมือน
    build_avatars.py/build_pets.py (LANCZOS ทำให้ขอบเป็นฝ้าเทา ๆ ตอน imageSmoothingEnabled ปิด)"""
    r, g, b, a = im.split()
    rgb = Image.merge("RGB", (r, g, b))
    black = Image.new("RGB", im.size, (0, 0, 0))
    premult = Image.composite(rgb, black, a)
    premult_resized = premult.resize((new_w, new_h), Image.BOX)
    a_resized = a.resize((new_w, new_h), Image.BOX)
    pr, pg, pb = premult_resized.split()
    a_arr = a_resized.load()
    pr_l, pg_l, pb_l = pr.load(), pg.load(), pb.load()
    out = Image.new("RGBA", (new_w, new_h))
    out_px = out.load()
    ALPHA_CUTOFF = 128
    for y in range(new_h):
        for x in range(new_w):
            av = a_arr[x, y]
            if av < ALPHA_CUTOFF:
                out_px[x, y] = (0, 0, 0, 0)
            else:
                k = 255 / av
                out_px[x, y] = (min(255, round(pr_l[x, y] * k)), min(255, round(pg_l[x, y] * k)),
                                 min(255, round(pb_l[x, y] * k)), 255)
    return out


def place(cropped, scale):
    """ย่อ + วางกึ่งกลางแนวนอน ชิดขอบล่าง บนแคนวาส FW x FH — เหมือน build_avatars.py's place()"""
    w, h = cropped.size
    new_w, new_h = max(1, round(w * scale)), max(1, round(h * scale))
    resized = resize_rgba_premultiplied(cropped, new_w, new_h)
    canvas = Image.new("RGBA", (FW, FH), (0, 0, 0, 0))
    dx, dy = (FW - new_w) // 2, FH - new_h
    canvas.alpha_composite(resized, (dx, dy))
    return canvas


def build():
    scale, max_w, max_h = measure_uniform_scale()
    print(f"uniform scale {scale:.4f} (source max content {max_w}x{max_h})")

    total_cols = len(DIRS) * FRAMES
    out_sheet = Image.new("RGBA", (FW * total_cols, FH * len(VARIANTS)), (0, 0, 0, 0))

    for gi, (variant_id, path) in enumerate(VARIANTS):
        sheet = Image.open(path).convert("RGBA")
        for row in range(4):  # row order in source sheet already matches DIRS (down,left,right,up)
            for col in range(FRAMES):
                box = (col * SRC_FRAME, row * SRC_FRAME, (col + 1) * SRC_FRAME, (row + 1) * SRC_FRAME)
                frame = sheet.crop(box)
                bbox = content_bbox(frame)
                if not bbox:
                    continue
                placed = place(frame.crop(bbox), scale)
                dst_x = (row * FRAMES + col) * FW
                dst_y = gi * FH
                out_sheet.alpha_composite(placed, (dst_x, dst_y))

    out_sheet.save(OUT / "outfits.png")
    meta = {
        "frameW": FW, "frameH": FH, "dirs": DIRS, "frames": FRAMES,
        "variants": [v for v, _ in VARIANTS],
        "recolor": "whole-sprite-alpha (no separate mask -- entire opaque area is the recolor target)",
    }
    (OUT / "outfits.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"wrote outfits.png {out_sheet.size[0]}x{out_sheet.size[1]} + outfits.json")


if __name__ == "__main__":
    build()
