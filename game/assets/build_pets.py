"""สัตว์เลี้ยง — สร้าง pets.png จากชุด zodiac-pets-economy (13 ตัว, 4 ทิศ x 4 เฟรมเดินจริง)
แทนที่ระบบเดิม (วาดด้วย PIL primitives, หันซ้ายอย่างเดียวแล้ว flip ตอนเดินขวา, ไม่มี up/down จริง)

Source: pixel-art/zodiac-pets-economy/export/<pet>/<pet>_walk_core.png (384x384, 4 คอลัมน์
(เฟรมเดิน) x 4 แถว (ทิศ down/left/right/up), ช่องละ 96px, โปร่งใสจริงแล้ว — ไม่ต้อง chroma-key)

Layout เอาต์พุต: CELL px, 4 คอลัมน์ (เฟรมเดิน) x (13 สัตว์ x 4 ทิศ) แถว
row(pet, dir) = petIndex*4 + DIRS.index(dir)  — ดู petFrameRow() ใน game/js/pets_data.js
รัน: python build_pets.py
"""
import json
from pathlib import Path
from PIL import Image

OUT = Path(__file__).resolve().parent
SRC = OUT.parent.parent / "pixel-art" / "zodiac-pets-economy" / "export"
CELL = 32          # ขนาดช่องในเกม (ย่อจาก 96 ต้นฉบับ 3x) — คงสัดส่วนตัวสัตว์เดิมในเกม (32px on-screen)
SRC_CELL = 96
DIRS = ["down", "left", "right", "up"]
PETS = ["rat", "ox", "tiger", "rabbit", "dragon", "snake", "horse",
        "goat", "monkey", "rooster", "dog", "pig", "cat"]


def resize_rgba_premultiplied(im, new_w, new_h):
    """ต้นฉบับ 13 สัตว์นี้เป็น mask ขอบคมล้วน (alpha มีแค่ 0 หรือ 255 ไม่มีไล่เฉด) — LANCZOS มี
    negative lobe ที่ทำให้ alpha เกิด ringing (โผล่ค่า alpha ต่ำ ๆ นอกขอบตัวจริง) พอผ่าน
    premultiply/หารกลับ กลายเป็นพิกเซลเทา ๆ เป็นเส้นขอบเรือนราง ๆ รอบตัวสัตว์ที่ไม่ควรมี —
    ใช้ BOX แทน (ไม่มี negative lobe เลยไม่ ring) + ตัด cutoff ให้สูงขึ้นและปัดเป็นทึบสนิท
    (ไม่ใช่ alpha ไล่เฉด) ได้ขอบคมสมกับสไตล์พิกเซลอาร์ตที่เหลือของเกม"""
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


rows = len(PETS) * len(DIRS)
sheet = Image.new("RGBA", (CELL * 4, CELL * rows), (0, 0, 0, 0))

for pi, pet in enumerate(PETS):
    core = Image.open(SRC / pet / f"{pet}_walk_core.png").convert("RGBA")
    assert core.size == (SRC_CELL * 4, SRC_CELL * 4), f"{pet}: unexpected size {core.size}"
    for di, direction in enumerate(DIRS):
        row = pi * len(DIRS) + di
        for phase in range(4):
            frame = core.crop((phase * SRC_CELL, di * SRC_CELL, (phase + 1) * SRC_CELL, (di + 1) * SRC_CELL))
            small = resize_rgba_premultiplied(frame, CELL, CELL)
            sheet.alpha_composite(small, (phase * CELL, row * CELL))

sheet.save(OUT / "pets.png")
(OUT / "pets.json").write_text(json.dumps({
    "frameWidth": CELL, "frameHeight": CELL, "columns": 4,
    "directions": DIRS, "pets": PETS,
}, indent=2), encoding="utf-8")
print(f"wrote pets.png {sheet.size[0]}x{sheet.size[1]} ({len(PETS)} pets x {len(DIRS)} dirs x 4 phases)")
