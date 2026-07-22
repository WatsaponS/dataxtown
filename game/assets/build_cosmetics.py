"""เครื่องแต่งกาย (หมวก/เสื้อ/กางเกง-กระโปรง/ปีก) ใส่ทับตัวละครได้ — ต้นฉบับจาก
pixel-art/cosmetics-sample (DALL-E, ท่าหน้าตรงท่าเดียว ไม่มี walk-cycle 4 ทิศแบบ avatar/pet)

เพราะต้นฉบับมีแค่ท่าเดียว เกมเลยวาดภาพเดียวกันซ้ำทั้ง 4 ทิศตอนใส่ — ไม่ตรงมุมมองเป๊ะตอนเดิน
ซ้าย/ขวา (ยังเป็นมุมหน้าตรงอยู่) แต่ตำแหน่ง/ขนาดสอดคล้องกับหัว/ลำตัว/ขาได้ดีพอใช้ เพราะโครง
ตัวละคร (หัว/ลำตัว/ขา อยู่ที่ y เดิม) เหมือนกันทุกทิศอยู่แล้ว (เช็คแล้วจากภาพจริง)

"เสื้อ" ใส่ทับเสื้อแจ็คเก็ตเดิมของตัวละคร ไม่ได้แทนที่ (สไปรท์ตัวละครเป็นภาพ flatten ภาพเดียว
ไม่ได้แยกชั้นเสื้อไว้ให้ซ่อน) เลือกไอเทมที่เป็นเสื้อคลุม/เกราะทับได้ดูเข้ากันเป็นชั้นนอก

Output: game/assets/cosmetics.png (แถวละ 1 ไอเทม, เฟรมเดียว 32x50 บันทึกตำแหน่ง/สเกลไว้ในภาพแล้ว)
       + game/assets/cosmetics.json (แค็ตตาล็อก id/category — ลำดับต้องตรง COSMETICS ใน
         game/js/cosmetics_data.js)
รัน: python build_cosmetics.py
"""
import json
from pathlib import Path
from PIL import Image

OUT = Path(__file__).resolve().parent
SRC = OUT.parent.parent / "pixel-art" / "cosmetics-sample" / "export"

FW, FH = 32, 50  # เท่ากับเฟรมตัวละคร (CONFIG.frameW/frameH) — วาดทับตรง (0,0) ได้เลยไม่ต้องคำนวณตำแหน่งซ้ำ
ALPHA_CUTOFF = 128

# (id, source file, category, ชื่อไทย, สเกล, offset (x,y) จากมุมบนซ้ายเฟรม) — สเกล/offset
# ปรับจากการทดสอบซ้อนทับกับสไปรท์ตัวละครจริงแล้ว (ดู scratchpad calibration รอบที่พัฒนา)
ITEMS = [
    ("hat_arcane_stargazer", "hat_arcane_stargazer.png", "hat", "หมวกจอมเวทย์", 0.24, (0, -1)),
    ("hat_neon_ronin", "hat_neon_ronin.png", "hat", "หมวกนีออนโรนิน", 0.24, (0, -1)),
    ("shirt_dragon_knight", "shirt_dragon_knight.png", "shirt", "เกราะอัศวินมังกร", 0.28, (0, 18)),
    ("shirt_street_phantom", "shirt_street_phantom.png", "shirt", "แจ็คเก็ตแฟนธอม", 0.28, (0, 18)),
    ("pants_rune_ranger", "pants_rune_ranger.png", "bottom", "กางเกงจอมเวทย์รูน", 0.30, (0, 30)),
    ("pants_cyber_cargo", "pants_cyber_cargo.png", "bottom", "กางเกงคาร์โก้ไซเบอร์", 0.30, (0, 30)),
    ("skirt_celestial_mage", "skirt_celestial_mage.png", "bottom", "กระโปรงนางฟ้าสวรรค์", 0.30, (0, 30)),
    ("skirt_gothic_battle", "skirt_gothic_battle.png", "bottom", "กระโปรงนักรบกอธิค", 0.30, (0, 30)),
    ("wings_crystal_seraph", "wings_crystal_seraph.png", "wings", "ปีกเทวราชคริสตัล", 0.30, (0, 14)),
    ("wings_mecha_demon", "wings_mecha_demon.png", "wings", "ปีกปีศาจเมคา", 0.30, (0, 14)),
]


def resize_rgba_box(im, new_w, new_h):
    """ต้นฉบับ alpha แบบ 0/255 ล้วน (ไม่มีไล่เฉด) — ใช้ BOX filter (ไม่มี negative lobe เลยไม่
    ring แบบ LANCZOS) + ตัด cutoff แข็งแรงให้ทึบสนิท ขอบคมสมกับสไตล์พิกเซลอาร์ตที่เหลือของเกม
    (เทคนิคเดียวกับ build_avatars.py/build_pets.py — อย่าเปลี่ยนกลับเป็น LANCZOS)"""
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


sheet = Image.new("RGBA", (FW, FH * len(ITEMS)), (0, 0, 0, 0))
catalog = []
for row, (item_id, fname, category, name_th, scale, (ox, oy)) in enumerate(ITEMS):
    src = Image.open(SRC / fname).convert("RGBA")
    cropped = src.crop(src.getbbox())
    nw, nh = max(1, round(cropped.width * scale)), max(1, round(cropped.height * scale))
    small = resize_rgba_box(cropped, nw, nh)
    frame = Image.new("RGBA", (FW, FH), (0, 0, 0, 0))
    dx = (FW - nw) // 2 + ox
    frame.alpha_composite(small, (dx, oy))
    sheet.alpha_composite(frame, (0, row * FH))
    catalog.append({"id": item_id, "category": category, "name": name_th, "row": row})

sheet.save(OUT / "cosmetics.png")
(OUT / "cosmetics.json").write_text(json.dumps({
    "frameWidth": FW, "frameHeight": FH, "items": catalog,
}, indent=2, ensure_ascii=False), encoding="utf-8")
print(f"wrote cosmetics.png {sheet.size[0]}x{sheet.size[1]} ({len(ITEMS)} items)")
