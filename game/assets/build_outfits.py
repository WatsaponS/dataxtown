"""Build the game's full-body outfit spritesheet from the pre-made 4-direction
walk-cycle sprites in pixel-art/male-cyber-fantasy-walk-v1/ and
female-cyber-fantasy-walk-v1/ (already chroma-keyed, pose-extracted, and laid
out as down/left/right/up x 4 frames by each folder's own build.py — this
script crops each frame tightly, rescales it (per-direction, see
measure_direction_scales below -- the source poses aren't all drawn at the
same apparent character size), and re-lays it into the layout the game
code expects).

Unlike the earlier piece-by-piece cosmetics (hat/shirt/pants/wings as static
overlays), this is a full-body replacement layer: when equipped it's drawn
*instead of* the base avatar body, using the same directional walk-cycle
animation, so it moves naturally instead of a single static pose. No
recolor -- it's shown exactly as designed.

Output frame height matches avatars.png's content height (48px) so an
equipped character stands the same height as everyone else, but the frame
is wider than avatars.png (32px) because the front-facing pose has wings
spread out to both sides -- narrower would clip the wingtips. Frame size
is derived from the actual measured source content, not guessed, and the
game draws this sheet at its own native size (not squeezed to match the
base character's frame), so the source detail stays visible instead of
being crushed down further than necessary.

Output: game/assets/outfits.png (+ outfits.json). Row 0 = male_cyber_fantasy,
row 1 = female_cyber_fantasy. 16 cols per row (4 directions x 4 walk frames).
Run: python build_outfits.py
"""
import json
from pathlib import Path
from PIL import Image

OUT = Path(__file__).resolve().parent
ROOT = OUT.parent.parent / "pixel-art"

# ส่วนสูงเนื้อตัวละครเป้าหมาย — เทียบกับ build_avatars.py's TARGET_H (48px, ตัวละครทั่วไป) แล้ว
# เพิ่มอีก ~10% ตามที่ขอ ให้ตัวใหญ่กว่าตัวละครทั่วไปนิดหน่อย (ก่อนหน้านี้ตั้ง FW/FH เป็นค่าคงที่
# เดา ๆ ไว้ ทำให้ (1) ตัวใหญ่กว่าที่ตั้งใจ และ (2) ปีกที่กางออกด้านข้าง (ท่าหน้าตรง) กว้างกว่ากรอบ
# ที่เผื่อไว้ โดนตัดขอบซ้าย/ขวา — ตอนนี้คำนวณ FW/FH จากขนาดคอนเทนต์จริงที่วัดได้ ไม่เดาอัตราส่วน
# จากตัวละครฐานอีกต่อไป)
TARGET_H = 53
WING_PAD = 4   # กันเผื่อขอบซ้าย/ขวานิดหน่อยไม่ให้ปีกชนขอบเฟรมพอดีเป๊ะ
HEADROOM = 2   # กันเผื่อขอบบน เท่ากับ build_avatars.py (เนื้อตัว 48px บนเฟรมสูง 50px)
DIRS = ["down", "left", "right", "up"]
FRAMES = 4

VARIANTS = [
    ("male_cyber_fantasy", ROOT / "male-cyber-fantasy-walk-v1" / "male-cyber-fantasy-walk-sheet.png"),
    ("female_cyber_fantasy", ROOT / "female-cyber-fantasy-walk-v1" / "female-cyber-fantasy-walk-sheet.png"),
]
SRC_FRAME = 128


def content_bbox(frame_rgba):
    return frame_rgba.getchannel("A").getbbox()


def measure_direction_scales():
    """สเกลแยกต่อทิศ (ไม่ใช่สเกลเดียวรวมทุกทิศ) — เช็คแล้วท่าซ้าย/ขวา/หลังจาก DALL-E ตัวเล็กกว่า
    ท่าหน้าตรงจริง ๆ (ไม่ใช่แค่ปีกกางน้อยกว่า) เช่น male ท่าหน้าตรง bbox สูง 112px แต่ท่าซ้ายสูง
    แค่ 99px ทั้งที่ควรเป็นตัวละครคนเดียวกัน ถ้าใช้สเกลเดียวจากท่าที่สูงสุด (หน้าตรง) ทิศอื่นจะโดน
    ย่อลงตามไปด้วยทั้งที่ไม่ควร ทำให้ดูตัวเล็กกว่าเวลาหันซ้าย/ขวา/หลัง — วัดสเกลแยกทิศแทน แต่ยัง
    รวม male+female เข้าด้วยกันต่อทิศ (กันชาย/หญิงดูตัวใหญ่เล็กไม่เท่ากัน)"""
    dir_max_w = [0] * 4
    dir_max_h = [0] * 4
    for _, path in VARIANTS:
        sheet = Image.open(path).convert("RGBA")
        for row in range(4):
            for col in range(4):
                frame = sheet.crop((col * SRC_FRAME, row * SRC_FRAME, (col + 1) * SRC_FRAME, (row + 1) * SRC_FRAME))
                bbox = content_bbox(frame)
                if not bbox:
                    continue
                dir_max_w[row] = max(dir_max_w[row], bbox[2] - bbox[0])
                dir_max_h[row] = max(dir_max_h[row], bbox[3] - bbox[1])
    dir_scales = [TARGET_H / h for h in dir_max_h]
    return dir_scales, dir_max_w, dir_max_h


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


def place(cropped, scale, fw, fh):
    """ย่อ + วางกึ่งกลางแนวนอน ชิดขอบล่าง บนแคนวาส fw x fh — เหมือน build_avatars.py's place()"""
    w, h = cropped.size
    new_w, new_h = max(1, round(w * scale)), max(1, round(h * scale))
    resized = resize_rgba_premultiplied(cropped, new_w, new_h)
    canvas = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
    dx, dy = (fw - new_w) // 2, fh - new_h
    canvas.alpha_composite(resized, (dx, dy))
    return canvas


def build():
    dir_scales, dir_max_w, dir_max_h = measure_direction_scales()
    # FW คำนวณจากคอนเทนต์จริงที่วัดได้หลังสเกลแยกทิศแล้ว (ไม่ใช่เดาอัตราส่วนจากตัวละครฐาน) — ท่า
    # หน้าตรงมีปีกกางออกด้านข้างกว้างกว่าตัวละครทั่วไปมาก ต้องเผื่อ FW ให้พอดีความกว้างจริงที่สุด
    # ในทุกทิศ (แต่ละทิศสเกลไม่เท่ากันแล้ว ต้องหาความกว้าง "หลังสเกล" ของแต่ละทิศมาเทียบกัน)
    fw = round(max(w * s for w, s in zip(dir_max_w, dir_scales))) + WING_PAD * 2
    fh = TARGET_H + HEADROOM  # ทุกทิศสเกลให้พอดี TARGET_H แล้ว ความสูงเฟรมเลยเท่ากันทุกทิศ
    for d, s, w, h in zip(DIRS, dir_scales, dir_max_w, dir_max_h):
        print(f"  {d}: scale {s:.4f} (source content {w}x{h})")
    print(f"-> frame {fw}x{fh}")

    total_cols = len(DIRS) * FRAMES
    out_sheet = Image.new("RGBA", (fw * total_cols, fh * len(VARIANTS)), (0, 0, 0, 0))

    for gi, (variant_id, path) in enumerate(VARIANTS):
        sheet = Image.open(path).convert("RGBA")
        for row in range(4):  # row order in source sheet already matches DIRS (down,left,right,up)
            for col in range(FRAMES):
                box = (col * SRC_FRAME, row * SRC_FRAME, (col + 1) * SRC_FRAME, (row + 1) * SRC_FRAME)
                frame = sheet.crop(box)
                bbox = content_bbox(frame)
                if not bbox:
                    continue
                placed = place(frame.crop(bbox), dir_scales[row], fw, fh)
                dst_x = (row * FRAMES + col) * fw
                dst_y = gi * fh
                out_sheet.alpha_composite(placed, (dst_x, dst_y))

    out_sheet.save(OUT / "outfits.png")
    meta = {
        "frameW": fw, "frameH": fh, "dirs": DIRS, "frames": FRAMES,
        "variants": [v for v, _ in VARIANTS],
    }
    (OUT / "outfits.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"wrote outfits.png {out_sheet.size[0]}x{out_sheet.size[1]} + outfits.json")


if __name__ == "__main__":
    build()
