"""Build the game's full-body outfit spritesheet from the pre-made 4-direction
walk-cycle sprites in pixel-art/male-cyber-fantasy-walk-v1/ and
female-cyber-fantasy-walk-v1/ (already chroma-keyed, pose-extracted, and laid
out as down/left/right/up x 4 frames by each folder's own build.py — this
script crops each frame tightly, rescales it (independently per outfit AND
per direction, see measure_all_scales below -- neither different outfits
nor different directions of the same outfit are drawn at a consistent
apparent character size in the source art), and re-lays it into the layout
the game code expects).

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

LAYER = ROOT / "layer"

VARIANTS = [
    ("male_cyber_fantasy", ROOT / "male-cyber-fantasy-walk-v1" / "male-cyber-fantasy-walk-sheet.png"),
    ("female_cyber_fantasy", ROOT / "female-cyber-fantasy-walk-v1" / "female-cyber-fantasy-walk-sheet.png"),
    # ชุดเดี่ยว (ไม่แยกเพศ) จาก pixel-art/layer/
    ("coral_psychic", LAYER / "coral-psychic-v2" / "coral-psychic-v2-walk-sheet.png"),
    ("crimson_aegis_knight", LAYER / "crimson-aegis-knight" / "crimson-aegis-knight-walk-sheet.png"),
    ("dragon_elf_sentinel", LAYER / "dragon-elf-sentinel" / "dragon-elf-sentinel-walk-sheet.png"),
    ("emerald_agent", LAYER / "emerald-agent" / "emerald-agent-walk-sheet.png"),
    ("lunar_frost_noble", LAYER / "lunar-frost-noble" / "lunar-frost-noble-walk-sheet.png"),
    ("night_rift_hunter", LAYER / "night-rift-hunter" / "night-rift-hunter-walk-sheet.png"),
    ("noir_orchid", LAYER / "noir-orchid-v3" / "noir-orchid-v3-walk-sheet.png"),
    ("rosewind_healer", LAYER / "rosewind-healer-v2" / "rosewind-healer-v2-walk-sheet.png"),
    ("skybreaker_mercenary", LAYER / "skybreaker-mercenary" / "skybreaker-mercenary-walk-sheet.png"),
    # ชุดคู่ชาย/หญิง จาก pixel-art/layer/*-pair/
    ("male_amber_scout", LAYER / "amber-rose-scout-pair" / "male" / "male-amber-scout-walk-sheet.png"),
    ("female_rose_scout", LAYER / "amber-rose-scout-pair" / "female" / "female-rose-scout-walk-sheet.png"),
    ("male_angel", LAYER / "angel-fantasy-pair" / "male" / "male-angel-walk-sheet.png"),
    ("female_angel", LAYER / "angel-fantasy-pair" / "female" / "female-angel-walk-sheet.png"),
    ("male_black_swordsman", LAYER / "black-white-swordsman-pair" / "male" / "male-black-swordsman-walk-sheet.png"),
    ("female_white_rapier", LAYER / "black-white-swordsman-pair" / "female" / "female-white-rapier-walk-sheet.png"),
    ("male_dark_knight_boss", LAYER / "dark-knight-boss-pair" / "male" / "male-dark-knight-boss-walk-sheet.png"),
    ("female_dark_knight_boss", LAYER / "dark-knight-boss-pair" / "female" / "female-dark-knight-boss-walk-sheet.png"),
    ("male_dark_knight", LAYER / "dark-knight-pair" / "male" / "male-dark-knight-walk-sheet.png"),
    ("female_dark_knight", LAYER / "dark-knight-pair" / "female" / "female-dark-knight-walk-sheet.png"),
    ("male_orange_shadow", LAYER / "orange-violet-swordsman-pair" / "male" / "male-orange-shadow-walk-sheet.png"),
    ("female_violet_moon", LAYER / "orange-violet-swordsman-pair" / "female" / "female-violet-moon-walk-sheet.png"),
    ("male_scarlet_martial", LAYER / "scarlet-violet-martial-pair" / "male" / "male-scarlet-martial-walk-sheet.png"),
    ("female_violet_martial", LAYER / "scarlet-violet-martial-pair" / "female" / "female-violet-martial-walk-sheet.png"),
    ("male_silver_fox", LAYER / "silver-jade-shrine-pair" / "male" / "male-silver-fox-walk-sheet.png"),
    ("female_jade_mystic", LAYER / "silver-jade-shrine-pair" / "female" / "female-jade-mystic-walk-sheet.png"),
    ("male_midnight_gentleman", LAYER / "solar-midnight-guardian-pair" / "male" / "male-midnight-gentleman-walk-sheet.png"),
    ("female_solar_guardian", LAYER / "solar-midnight-guardian-pair" / "female" / "female-solar-guardian-walk-sheet.png"),
    ("male_steel_knight", LAYER / "steel-knight-pair" / "male" / "male-steel-knight-walk-sheet.png"),
    ("female_steel_knight", LAYER / "steel-knight-pair" / "female" / "female-steel-knight-walk-sheet.png"),
    ("male_strawhat_deck", LAYER / "strawhat-bikini-navigator-pair" / "male" / "male-strawhat-deck-walk-sheet.png"),
    ("female_bikini_navigator", LAYER / "strawhat-bikini-navigator-pair" / "female-v2" / "female-bikini-navigator-v2-walk-sheet.png"),
]
SRC_FRAME = 128

# ทุก variant ใหม่จาก pixel-art/layer/ (สร้างผ่าน pipeline ภายนอกคนละตัวกับ 2 ตัวแรก) มีปัญหา
# เดียวกันเกือบหมด: แถว "right" ในภาพต้นฉบับหันหน้าไปทางเดียวกับแถว "left" จริง ๆ (ไม่ได้ mirror
# กันตามที่ควรจะเป็น) — สร้างเฟรม "right" เอาเองจากเฟรม "left" กลับด้านซ้าย-ขวาแทนที่จะอ่านจาก
# ต้นฉบับที่พัง รับประกันว่า mirror ถูกต้องเสมอไม่ว่าต้นฉบับจะเพี้ยนแค่ไหน
MIRROR_RIGHT_FROM_LEFT = {v for v, _ in VARIANTS if v not in ("male_cyber_fantasy", "female_cyber_fantasy")}

# noir_orchid ไม่ใช่ปัญหาแบบเดียวกับด้านบน — ตรวจ raw source แยกแล้วพบว่าแถวที่ "ควร" เป็น left
# กลับมีคอนเทนต์หันขวาจริง ๆ และแถวที่ "ควร" เป็น right มีคอนเทนต์หันซ้ายจริง ๆ (สลับตำแหน่งแถวกัน
# ตรง ๆ ไม่ใช่ทั้งคู่หันทางเดียวกันแบบตัวอื่น) รอบที่แล้วเผลอเอาไปรวมกับกลุ่ม mirror-fix ด้านบน เลย
# ยิ่งพังกว่าเดิม (mirror ของแถวที่ผิดอยู่แล้ว = ยังผิดเหมือนเดิม) — ต้องสลับว่าจะอ่านจากแถวไหนตอน
# crop แทน ไม่ต้อง mirror เลย เหมือน SWAP_LR_PREFIXES ใน build_avatars.py (กรณี male_cro)
SWAP_LR_ROWS = {"noir_orchid"}
MIRROR_RIGHT_FROM_LEFT -= SWAP_LR_ROWS


def content_bbox(frame_rgba):
    return frame_rgba.getchannel("A").getbbox()


def source_row_for(variant_id, row):
    """คืน source row index ที่ต้องอ่านจริงสำหรับทิศนี้ (แถวต้นฉบับตรงกับ DIRS อยู่แล้วปกติ อ่าน
    row ตรง ๆ) ยกเว้น variant ใน SWAP_LR_ROWS ที่แถว left/right ในต้นฉบับสลับตำแหน่งกันจริง"""
    if variant_id in SWAP_LR_ROWS:
        direction = DIRS[row]
        if direction == "left":
            return DIRS.index("right")
        if direction == "right":
            return DIRS.index("left")
    return row


def measure_all_scales():
    """สเกลแยกอิสระต่อทั้งชุดและทิศ (ไม่ใช่สเกลเดียวรวมทุกชุด/ทุกทิศ) — เช็คแล้วเจอ 2 ปัญหาซ้อนกัน:
    (1) ภายในชุดเดียวกัน ท่าซ้าย/ขวา/หลังจาก DALL-E ตัวเล็กกว่าท่าหน้าตรงจริง ๆ (ไม่ใช่แค่ปีกกาง
    น้อยกว่า) และ (2) ข้ามชุด บางชุด (เช่น noir_orchid) วาดตัวละครมาเล็กกว่าชุดอื่นตั้งแต่ต้น ถ้าใช้
    สเกลเดียวรวมทุกชุด (อ้างอิงจากชุดที่ตัวใหญ่สุด) ชุดที่วาดมาเล็กจะเตี้ยกว่าเพื่อนเห็นชัด — วัดสเกล
    แยกทุก (ชุด, ทิศ) อิสระ ให้ทุกเฟรมสูงชนเป้า TARGET_H เท่ากันหมด ไม่ว่าต้นฉบับจะวาดตัวละครมา
    ใหญ่/เล็กหรือกางปีก/แขนมากน้อยแค่ไหน"""
    scales = {}  # (variant_id, dir_index) -> scale
    max_scaled_w = 0
    for variant_id, path in VARIANTS:
        sheet = Image.open(path).convert("RGBA")
        for row in range(4):
            src_row = source_row_for(variant_id, row)
            max_w = max_h = 0
            for col in range(4):
                frame = sheet.crop((col * SRC_FRAME, src_row * SRC_FRAME, (col + 1) * SRC_FRAME, (src_row + 1) * SRC_FRAME))
                bbox = content_bbox(frame)
                if not bbox:
                    continue
                max_w = max(max_w, bbox[2] - bbox[0])
                max_h = max(max_h, bbox[3] - bbox[1])
            scale = TARGET_H / max_h if max_h else 1.0
            scales[(variant_id, row)] = scale
            max_scaled_w = max(max_scaled_w, max_w * scale)
    return scales, max_scaled_w


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
    scales, max_scaled_w = measure_all_scales()
    # FW คำนวณจากความกว้าง "หลังสเกล" ที่สุดในทุก (ชุด, ทิศ) ไม่ใช่เดาอัตราส่วนจากตัวละครฐาน —
    # ท่าหน้าตรงบางชุดมีปีกกางออกด้านข้างกว้างกว่าตัวละครทั่วไปมาก ต้องเผื่อ FW ให้พอดี
    fw = round(max_scaled_w) + WING_PAD * 2
    fh = TARGET_H + HEADROOM  # ทุก (ชุด, ทิศ) สเกลให้พอดี TARGET_H แล้ว ความสูงเฟรมเลยเท่ากันหมด
    print(f"-> frame {fw}x{fh}")

    total_cols = len(DIRS) * FRAMES
    out_sheet = Image.new("RGBA", (fw * total_cols, fh * len(VARIANTS)), (0, 0, 0, 0))

    for gi, (variant_id, path) in enumerate(VARIANTS):
        sheet = Image.open(path).convert("RGBA")
        left_placed = [None] * FRAMES  # เก็บเฟรม "left" ที่ place() แล้วไว้ mirror ต่อเป็น "right"
        for row in range(4):  # row order in source sheet already matches DIRS (down,left,right,up)
            direction = DIRS[row]
            src_row = source_row_for(variant_id, row)  # ปกติ = row ตรง ๆ เว้นแต่ SWAP_LR_ROWS
            for col in range(FRAMES):
                if direction == "right" and variant_id in MIRROR_RIGHT_FROM_LEFT:
                    placed = left_placed[col].transpose(Image.FLIP_LEFT_RIGHT)
                else:
                    box = (col * SRC_FRAME, src_row * SRC_FRAME, (col + 1) * SRC_FRAME, (src_row + 1) * SRC_FRAME)
                    frame = sheet.crop(box)
                    bbox = content_bbox(frame)
                    if not bbox:
                        continue
                    placed = place(frame.crop(bbox), scales[(variant_id, row)], fw, fh)
                    if direction == "left":
                        left_placed[col] = placed
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
