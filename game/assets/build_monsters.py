"""มอนสเตอร์ป่า — สุ่มโผล่บนแผนที่ชั่วคราว (ดู game/js/monsters.js)

Source: pixel-art/wild/ — สองรูปแบบ:
  - โฟลเดอร์ไบโอม (coral-shallows/shadow-cave/thunder-plains/volcanic-canyon/
    whispering-root-cavern) มี 10 สปีชีส์ x 3 stage x (walk 4 เฟรม + static) แต่ฟีเจอร์นี้
    เป็นแค่โผล่มานิ่ง ๆ 10 วิแล้วหาย ไม่ได้เดิน เลยใช้แค่ "-stage1-static.png" ของแต่ละสปีชีส์พอ
  - โฟลเดอร์ fire/nature/water เป็นภาพนิ่งเดี่ยว ๆ ไม่มี stage (25/20/25 ภาพตามลำดับ)
รวมทั้งหมด 50 + 70 = 120 ภาพ ขนาดต้นฉบับไม่เท่ากัน (จาก 320x320 ถึง 339x512) — แพ็กลงกริดเดียวกัน
โดยเซ็นเตอร์แนวนอน + ชิดขอบล่างของแต่ละช่อง (bottom-anchor) ให้ "จุดยืน" ของทุกตัวตรงกันเสมอ
ไม่ว่าเฟรมต้นฉบับจะสูง/เตี้ยแค่ไหน

รัน: python build_monsters.py
"""
import glob
import json
import re
from pathlib import Path
from PIL import Image

OUT = Path(__file__).resolve().parent
SRC = OUT.parent.parent / "pixel-art" / "wild"

BIOME_DIRS = ["coral-shallows", "shadow-cave", "thunder-plains", "volcanic-canyon", "whispering-root-cavern"]
SIMPLE_DIRS = ["fire", "nature", "water"]
COLUMNS = 12
# ต้นฉบับเป็นภาพวาด painterly ไล่เฉดสีเยอะ (ไม่ใช่ pixel-art flat-color) กับขนาดใหญ่ถึง 512px —
# บีบเหลือ TARGET_MAX_H พอ (มอนสเตอร์เป็นแค่ของประดับโผล่ 10 วิแล้วหาย วาดจริงในเกมแค่ ~120px
# สูง ไม่ต้องเก็บที่ความละเอียดเต็มแบบตัวละคร/สัตว์เลี้ยงที่อยู่ติดจอนาน ๆ) ลดขนาดไฟล์รวมจาก ~15MB
# เหลือหลักร้อย KB โดยยังคมพอสำหรับจอ retina ที่ scale การ์ตูนแสดงจริง
TARGET_MAX_H = 128


def natkey(p):
    m = re.search(r"(\d+)", Path(p).stem)
    return int(m.group(1)) if m else 0


entries = []  # (id, path)
for biome in BIOME_DIRS:
    for p in sorted(glob.glob(str(SRC / biome / "*-stage1-static.png"))):
        stem = Path(p).stem  # e.g. "01-pearl-seahorse-stage1-static"
        slug = re.sub(r"^\d+-", "", stem).replace("-stage1-static", "")
        entries.append((f"{biome}/{slug}", p))
for d in SIMPLE_DIRS:
    for p in sorted(glob.glob(str(SRC / d / "*.png")), key=natkey):
        entries.append((f"{d}/{Path(p).stem}", p))

assert entries, "ไม่พบภาพมอนสเตอร์ต้นฉบับ"

imgs = [Image.open(p).convert("RGBA") for _, p in entries]
# สเกลเดียวทั้งชุด (ไม่ใช่ต่อภาพ) ให้ขนาดสัมพัทธ์ระหว่างมอนสเตอร์แต่ละตัวยังต่างกันเหมือนต้นฉบับ
scale = TARGET_MAX_H / max(im.height for im in imgs)
imgs = [im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.LANCZOS) for im in imgs]

# ขนาดช่อง = ขนาดสูงสุดของภาพทั้งหมด (หลังสเกล) ปัดขึ้นเป็นเลขคู่ 4
cell_w = -(-max(im.width for im in imgs) // 4) * 4
cell_h = -(-max(im.height for im in imgs) // 4) * 4
rows = -(-len(entries) // COLUMNS)

sheet = Image.new("RGBA", (cell_w * COLUMNS, cell_h * rows), (0, 0, 0, 0))
for i, (mid, _) in enumerate(entries):
    im = imgs[i]
    col, row = i % COLUMNS, i // COLUMNS
    dx = col * cell_w + (cell_w - im.width) // 2
    dy = row * cell_h + (cell_h - im.height)  # ชิดขอบล่างช่อง
    sheet.alpha_composite(im, (dx, dy))

sheet.save(OUT / "monsters.png", optimize=True, compress_level=9)
(OUT / "monsters.json").write_text(json.dumps({
    "frameWidth": cell_w, "frameHeight": cell_h, "columns": COLUMNS,
    "count": len(entries), "ids": [mid for mid, _ in entries],
}, indent=2, ensure_ascii=False), encoding="utf-8")
print(f"wrote monsters.png {sheet.size[0]}x{sheet.size[1]} ({len(entries)} monsters, "
      f"cell {cell_w}x{cell_h}, {COLUMNS} cols x {rows} rows)")
