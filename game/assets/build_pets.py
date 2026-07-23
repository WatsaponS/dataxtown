"""สัตว์เลี้ยง — สร้าง pets.png จากชุด zodiac-pets-economy (13 ตัว, 4 ทิศ x 4 เฟรมเดินจริง)
แทนที่ระบบเดิม (วาดด้วย PIL primitives, หันซ้ายอย่างเดียวแล้ว flip ตอนเดินขวา, ไม่มี up/down จริง)

Source: pixel-art/zodiac-pets-economy/export/<pet>/<pet>_walk_core.png (384x384, 4 คอลัมน์
(เฟรมเดิน) x 4 แถว (ทิศ down/left/right/up), ช่องละ 96px, โปร่งใสจริงแล้ว — ไม่ต้อง chroma-key)

Layout เอาต์พุต: SRC_CELL px (เต็มความละเอียดต้นฉบับ ไม่ย่อ), 4 คอลัมน์ (เฟรมเดิน) x
(13 สัตว์ x 4 ทิศ) แถว — row(pet, dir) = petIndex*4 + DIRS.index(dir), ดู petFrameRow() ใน
game/js/pets_data.js เดิมสคริปต์นี้ย่อลง 32px แล้ว bake ลง pets.png เลย (เหมือนปัญหาที่เจอใน
build_outfits.py/build_avatars.py ก่อนหน้านี้ — เสียรายละเอียดไปตั้งแต่ต้นทาง) ตอนนี้เก็บที่
ความละเอียดเต็ม 96px แทน แล้วให้ pets.js ย่อตอน draw ด้วย canvas (ดู PET_SRC_FRAME/PET_FRAME
ใน pets_data.js ที่แยก source/display ออกจากกันแล้ว) ขนาดที่เห็นในเกมจริงเท่าเดิมทุกประการ
แค่คมขึ้นเพราะไม่ได้ทำลายรายละเอียดตั้งแต่ตอน build
รัน: python build_pets.py
"""
import json
from pathlib import Path
from PIL import Image

OUT = Path(__file__).resolve().parent
SRC = OUT.parent.parent / "pixel-art" / "zodiac-pets-economy" / "export"
SRC_CELL = 96
DIRS = ["down", "left", "right", "up"]
PETS = ["rat", "ox", "tiger", "rabbit", "dragon", "snake", "horse",
        "goat", "monkey", "rooster", "dog", "pig", "cat"]

rows = len(PETS) * len(DIRS)
sheet = Image.new("RGBA", (SRC_CELL * 4, SRC_CELL * rows), (0, 0, 0, 0))

for pi, pet in enumerate(PETS):
    core = Image.open(SRC / pet / f"{pet}_walk_core.png").convert("RGBA")
    assert core.size == (SRC_CELL * 4, SRC_CELL * 4), f"{pet}: unexpected size {core.size}"
    for di, direction in enumerate(DIRS):
        row = pi * len(DIRS) + di
        for phase in range(4):
            frame = core.crop((phase * SRC_CELL, di * SRC_CELL, (phase + 1) * SRC_CELL, (di + 1) * SRC_CELL))
            sheet.alpha_composite(frame, (phase * SRC_CELL, row * SRC_CELL))

sheet.save(OUT / "pets.png")
(OUT / "pets.json").write_text(json.dumps({
    "frameWidth": SRC_CELL, "frameHeight": SRC_CELL, "columns": 4,
    "directions": DIRS, "pets": PETS,
}, indent=2), encoding="utf-8")
print(f"wrote pets.png {sheet.size[0]}x{sheet.size[1]} ({len(PETS)} pets x {len(DIRS)} dirs x 4 phases)")
