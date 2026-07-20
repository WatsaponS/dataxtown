"""ตู้กาชาปองที่วางอยู่ในออฟฟิศจริง — sprite เดียว ไม่มีอนิเมชัน วางตำแหน่งคงที่บนแผนที่
(วาดสดในเกม ไม่ได้ฝังลง map PNG กันต้อง rebuild แผนที่ทุกครั้งที่แก้)

ขนาด 32x40 px (สูงกว่าตารางเดียวเหมือนเฟอร์นิเจอร์ชิ้นอื่นที่ยื่นขึ้นเหนือ tile)
รัน: python build_gacha_machine.py -> gacha_machine.png
"""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent
W, H = 32, 40

P = {
    "green": "#57b06b", "green_d": "#3c7b57", "green_hi": "#7fd08f",
    "gold": "#e7b94f", "gold_d": "#b08631", "white": "#fff6dc",
    "teal": "#65a9c2", "teal_d": "#3f7f92", "grey": "#9aa6ad", "grey_d": "#6b747c",
    "black": "#1b1626", "cream": "#f5ecd6",
    "red": "#c94f4f", "blue": "#4f8fdd", "purple": "#9867a8", "orange": "#d97a55",
}

img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(img)


def R(x0, y0, x1, y1, c):
    d.rectangle([x0, y0, x1, y1], fill=P[c])


def E(x0, y0, x1, y1, c):
    d.ellipse([x0, y0, x1, y1], fill=P[c])


def PX(x, y, c):
    d.point((x, y), fill=P[c])


# เงาใต้ตู้
E(3, 37, 29, 39, "black")

# ฐานตู้ (เขียวเข้ม)
R(2, 26, 29, 37, "green_d")
R(3, 27, 28, 36, "green")
R(3, 27, 28, 28, "green_hi")

# แผงหยอดเหรียญ (ฟ้า) + ปุ่ม
R(5, 29, 13, 35, "teal")
R(6, 30, 12, 31, "gold")
R(6, 32, 12, 33, "gold")
R(7, 34, 11, 35, "black")
PX(8, 34, "gold"); PX(10, 34, "gold")

# ช่องหยอดของ (เทา) ด้านขวาล่าง
R(17, 30, 25, 37, "grey")
R(18, 31, 24, 34, "grey_d")
R(18, 35, 24, 36, "black")

# ดาวมงคลข้างช่องหยอด
PX(21, 33, "gold"); PX(20, 34, "gold"); PX(22, 34, "gold"); PX(21, 35, "gold")

# ลำตัวตู้หลัก (เขียว) + กรอบทอง
R(1, 8, 30, 26, "gold_d")
R(3, 10, 28, 24, "green")
R(3, 10, 28, 11, "green_hi")

# กระจกโดม (ครีม) โชว์ลูกกาชา
R(5, 12, 26, 22, "cream")
R(5, 12, 26, 13, "white")

# ลูกกาชาหลากสี (ทรงกลม ครึ่งบนขาว ครึ่งล่างมีสี)
balls = [(7, 15, "blue"), (11, 13, "teal"), (15, 12, "green"), (19, 14, "purple"), (22, 16, "orange")]
for bx, by, c in balls:
    E(bx, by, bx + 5, by + 5, "white")
    R(bx, by + 3, bx + 5, by + 5, c)
    PX(bx + 1, by + 1, "white")

# ที่จับหมุน (เงิน) มุมขวาของตู้
R(27, 15, 31, 19, "grey")
R(28, 16, 30, 18, "grey_d")
E(28, 12, 32, 16, "grey")

# หลอดไฟประดับบนหลังคา
R(0, 5, 31, 9, "gold")
R(1, 6, 30, 8, "gold_d")
for x in range(2, 30, 3):
    PX(x, 7, "white")

# ป้ายหัวตู้ (แดง) "GACHA"
R(6, 0, 25, 6, "red")
R(7, 1, 24, 5, "white")
for x in range(8, 24, 2):
    PX(x, 3, "red")

img.save(OUT / "gacha_machine.png")
print(f"wrote gacha_machine.png {img.size[0]}x{img.size[1]}")
