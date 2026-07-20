"""ไอเทมตกแต่งห้องส่วนตัว 20 ชิ้น — spritesheet 5x4 ช่อง ช่องละ 24x24 px

ลำดับ index (ซ้ายไปขวา บนลงล่าง) ต้องตรงกับ ITEMS ใน game/js/decor.js
รัน: python build_items.py -> items.png
"""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent
CELL = 24
COLS, ROWS = 5, 4

P = {
    "wood": "#8b563f", "wood_d": "#5b3a32", "wood_hi": "#b4845c",
    "navy": "#26324a", "slate": "#394158", "metal": "#9aa6ad",
    "cream": "#fff6dc", "paper": "#f7e7ba", "gold": "#e7b94f",
    "green": "#57b06b", "leaf": "#3c7b57", "teal": "#65a9c2",
    "glass": "#b9ecdf", "pink": "#d895bd", "red": "#b84d5a",
    "orange": "#d97a55", "bear": "#a9744f", "bear_d": "#7c523a",
    "white": "#f0e8d8", "black": "#1b1626", "grey": "#737e8d",
}

img = Image.new("RGBA", (COLS * CELL, ROWS * CELL), (0, 0, 0, 0))
d = ImageDraw.Draw(img)


def O(i):
    return (i % COLS) * CELL, (i // COLS) * CELL


def R(i, x0, y0, x1, y1, c):
    ox, oy = O(i)
    d.rectangle([ox + x0, oy + y0, ox + x1, oy + y1], fill=P[c])


def PX(i, x, y, c):
    ox, oy = O(i)
    d.point((ox + x, oy + y), fill=P[c])


# 0 แก้วกาแฟ (10)
R(0, 7, 10, 15, 20, "cream"); R(0, 8, 11, 14, 12, "wood_d")
R(0, 16, 12, 18, 16, "cream"); R(0, 16, 13, 17, 15, "navy")
PX(0, 9, 6, "grey"); PX(0, 12, 4, "grey"); PX(0, 10, 7, "grey"); PX(0, 13, 6, "grey")
# 1 ต้นไม้เล็ก (15)
R(1, 8, 15, 15, 21, "orange"); R(1, 9, 14, 14, 15, "wood_d")
R(1, 7, 5, 16, 13, "leaf"); R(1, 9, 3, 13, 8, "green"); PX(1, 15, 6, "green")
# 2 กองหนังสือ (20)
R(2, 5, 15, 18, 18, "red"); R(2, 6, 11, 19, 14, "teal"); R(2, 4, 7, 17, 10, "gold")
R(2, 16, 8, 17, 9, "cream"); R(2, 17, 12, 18, 13, "cream"); R(2, 6, 16, 7, 17, "cream")
# 3 โคมไฟตั้งโต๊ะ (30)
R(3, 8, 4, 16, 9, "gold"); R(3, 9, 10, 15, 10, "paper")
R(3, 11, 11, 12, 17, "slate"); R(3, 8, 18, 15, 20, "slate")
PX(3, 11, 12, "gold"); PX(3, 12, 13, "gold")
# 4 เก้าอี้ทำงาน (40)
R(4, 6, 3, 15, 11, "navy"); R(4, 7, 4, 14, 10, "slate")
R(4, 6, 12, 16, 15, "navy"); R(4, 10, 16, 12, 18, "metal")
R(4, 6, 19, 16, 20, "metal"); PX(4, 6, 21, "black"); PX(4, 16, 21, "black")
# 5 พรมกลม (45)
ox, oy = O(5)
d.ellipse([ox + 2, oy + 7, ox + 21, oy + 18], fill=P["pink"])
d.ellipse([ox + 5, oy + 9, ox + 18, oy + 16], fill=P["red"])
d.ellipse([ox + 8, oy + 11, ox + 15, oy + 14], fill=P["pink"])
# 6 รูปติดผนัง (50)
R(6, 4, 4, 19, 17, "wood"); R(6, 6, 6, 17, 15, "glass")
R(6, 7, 11, 16, 15, "leaf"); PX(6, 10, 8, "gold"); R(6, 12, 9, 14, 11, "teal")
# 7 โต๊ะทำงาน (60)
R(7, 3, 8, 20, 12, "wood"); R(7, 3, 8, 20, 9, "wood_hi")
R(7, 4, 13, 6, 20, "wood_d"); R(7, 17, 13, 19, 20, "wood_d")
R(7, 14, 4, 19, 7, "paper")
# 8 ตุ๊กตาหมี (75)
R(8, 7, 3, 10, 6, "bear"); R(8, 14, 3, 17, 6, "bear")
R(8, 7, 5, 16, 12, "bear"); R(8, 9, 8, 14, 11, "bear_d")
PX(8, 9, 7, "black"); PX(8, 14, 7, "black"); PX(8, 11, 9, "black"); PX(8, 12, 9, "black")
R(8, 6, 12, 17, 19, "bear"); R(8, 9, 13, 14, 18, "cream")
R(8, 4, 13, 6, 16, "bear"); R(8, 17, 13, 19, 16, "bear")
R(8, 7, 19, 10, 21, "bear_d"); R(8, 13, 19, 16, 21, "bear_d")
# 9 ชั้นหนังสือ (85)
R(9, 4, 2, 19, 21, "wood"); R(9, 6, 4, 17, 10, "navy")
R(9, 6, 12, 17, 19, "navy")
R(9, 7, 5, 8, 9, "red"); R(9, 9, 5, 10, 9, "gold"); R(9, 11, 5, 12, 9, "teal"); R(9, 13, 6, 14, 9, "green")
R(9, 7, 13, 8, 18, "teal"); R(9, 9, 14, 10, 18, "pink"); R(9, 11, 13, 12, 18, "cream"); R(9, 13, 13, 15, 18, "red")
# 10 กีตาร์ (95)
ox, oy = O(10)
d.ellipse([ox + 5, oy + 11, ox + 16, oy + 21], fill=P["orange"])
d.ellipse([ox + 8, oy + 13, ox + 13, oy + 18], fill=P["wood_d"])
R(10, 10, 2, 12, 12, "wood"); R(10, 9, 2, 13, 4, "wood_d")
PX(10, 11, 6, "cream"); PX(10, 11, 9, "cream")
# 11 โซฟาเล็ก (110)
R(11, 3, 8, 20, 18, "teal"); R(11, 3, 5, 20, 9, "teal")
R(11, 5, 10, 18, 14, "glass"); R(11, 2, 8, 4, 18, "navy"); R(11, 19, 8, 21, 18, "navy")
R(11, 4, 19, 6, 20, "wood_d"); R(11, 17, 19, 19, 20, "wood_d")
# 12 ตู้เย็นมินิ (125)
R(12, 6, 3, 17, 20, "white"); R(12, 6, 3, 17, 8, "glass")
R(12, 15, 5, 16, 7, "metal"); R(12, 15, 10, 16, 14, "metal")
R(12, 7, 21, 9, 21, "black"); R(12, 14, 21, 16, 21, "black")
# 13 โต๊ะกาแฟ (140)
R(13, 3, 10, 20, 13, "wood_hi"); R(13, 3, 10, 20, 11, "cream")
R(13, 4, 14, 5, 19, "wood_d"); R(13, 18, 14, 19, 19, "wood_d")
R(13, 9, 6, 12, 9, "cream"); R(13, 13, 7, 14, 9, "cream")
# 14 เครื่องเกมเรโทร (160)
R(14, 4, 4, 19, 14, "navy"); R(14, 6, 6, 17, 12, "glass")
R(14, 8, 8, 11, 10, "gold"); R(14, 13, 8, 15, 10, "red")
R(14, 6, 16, 12, 19, "grey"); PX(14, 8, 17, "black"); PX(14, 10, 17, "red")
R(14, 13, 17, 17, 18, "black")
# 15 ตู้ปลา (180)
R(15, 3, 7, 20, 19, "teal"); R(15, 4, 8, 19, 18, "glass")
R(15, 3, 6, 20, 7, "metal"); R(15, 3, 19, 20, 20, "metal")
R(15, 8, 11, 11, 13, "orange"); PX(15, 12, 12, "orange")
PX(15, 15, 15, "gold"); PX(15, 16, 14, "gold"); R(15, 5, 16, 6, 18, "leaf"); R(15, 17, 15, 18, 18, "leaf")
# 16 เตียงแมว (200)
ox, oy = O(16)
d.ellipse([ox + 2, oy + 9, ox + 21, oy + 21], fill=P["slate"])
d.ellipse([ox + 4, oy + 11, ox + 19, oy + 19], fill=P["paper"])
R(16, 8, 11, 15, 16, "grey"); R(16, 14, 9, 17, 12, "grey")
PX(16, 18, 10, "grey"); PX(16, 15, 8, "grey")
PX(16, 15, 11, "black"); R(16, 6, 13, 8, 15, "grey")
# 17 จอคอมคู่ (230)
R(17, 2, 5, 11, 12, "navy"); R(17, 3, 6, 10, 11, "teal")
R(17, 12, 5, 21, 12, "navy"); R(17, 13, 6, 20, 11, "glass")
R(17, 6, 13, 7, 15, "slate"); R(17, 16, 13, 17, 15, "slate")
R(17, 4, 16, 19, 17, "slate"); R(17, 6, 19, 17, 20, "metal")
# 18 เปียโนไฟฟ้า (260)
R(18, 2, 8, 21, 16, "black"); R(18, 3, 12, 20, 15, "cream")
for k in range(4, 20, 3):
    R(18, k, 12, k, 13, "black")
R(18, 3, 9, 8, 10, "red"); PX(18, 10, 9, "gold"); PX(18, 12, 9, "green")
R(18, 3, 17, 4, 21, "metal"); R(18, 19, 17, 20, 21, "metal")
# 19 หุ่นยนต์ Data-X (300)
R(19, 8, 2, 15, 3, "metal"); PX(19, 11, 1, "gold")
R(19, 6, 4, 17, 11, "grey"); R(19, 8, 6, 15, 9, "navy")
PX(19, 10, 7, "gold"); PX(19, 13, 7, "gold")
R(19, 7, 12, 16, 18, "metal"); R(19, 9, 13, 14, 16, "teal")
R(19, 4, 12, 6, 16, "grey"); R(19, 17, 12, 19, 16, "grey")
R(19, 8, 19, 10, 21, "slate"); R(19, 13, 19, 15, 21, "slate")

img.save(OUT / "items.png")
print(f"wrote items.png {img.size[0]}x{img.size[1]} ({COLS * ROWS} items)")
