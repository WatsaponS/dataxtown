"""สัตว์เลี้ยง 15 ชนิด — spritesheet 2 คอลัมน์ (เฟรมเดิน 2 เฟรม) x 15 แถว ช่องละ 16x16 px

สไปรต์หันหน้าไปทางซ้าย (เกม flip เองเมื่อเดินขวา) ลำดับแถวต้องตรงกับ PETS
ใน game/js/pets_data.js  รัน: python build_pets.py
"""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent
CELL = 16
FRAMES = 2

P = {
    "tan": "#d9a441", "tan_d": "#b08631", "cream": "#fff6dc",
    "grey": "#9aa6ad", "grey_d": "#737e8d", "white": "#f0e8d8",
    "black": "#1b1626", "pink": "#e8a2c0", "pink_d": "#c47b9b",
    "green": "#57b06b", "green_d": "#3c7b57", "teal": "#65a9c2",
    "blue": "#4f8fdd", "orange": "#d97a55", "red": "#b84d5a",
    "yellow": "#e7b94f", "brown": "#8b563f", "brown_d": "#5b3a32",
    "gold": "#e7b94f",
}

img = Image.new("RGBA", (CELL * FRAMES, CELL * 15), (0, 0, 0, 0))
d = ImageDraw.Draw(img)


def R(ox, oy, x0, y0, x1, y1, c):
    d.rectangle([ox + x0, oy + y0, ox + x1, oy + y1], fill=P[c])


def PX(ox, oy, x, y, c):
    d.point((ox + x, oy + y), fill=P[c])


def legs(ox, oy, f, c, y=13):
    # ขาหน้า-หลังสลับกันตามเฟรม
    if f == 0:
        R(ox, oy, 4, y, 5, 15, c); R(ox, oy, 10, y, 11, 15, c)
    else:
        R(ox, oy, 5, y, 6, 15, c); R(ox, oy, 9, y, 10, 15, c)


def draw_pet(row, fn):
    for f in range(FRAMES):
        fn(f * CELL, row * CELL, f)


# 0 หมา (ชิบะ)
def dog(ox, oy, f):
    b = -1 if f else 0
    R(ox, oy, 3, 7 + b, 12, 12 + b, "tan")
    R(ox, oy, 1, 4 + b, 6, 9 + b, "tan")          # หัว
    R(ox, oy, 2, 8 + b, 5, 9 + b, "cream")        # แก้ม
    R(ox, oy, 1, 3 + b, 2, 4 + b, "tan_d"); R(ox, oy, 5, 3 + b, 6, 4 + b, "tan_d")  # หู
    PX(ox, oy, 2, 6 + b, "black"); PX(ox, oy, 0, 7 + b, "black")
    R(ox, oy, 12, 5 + b, 13, 8 + b, "tan_d")      # หางม้วน
    legs(ox, oy, f, "tan_d")
draw_pet(0, dog)

# 1 แมว
def cat(ox, oy, f):
    b = -1 if f else 0
    R(ox, oy, 3, 8 + b, 12, 12 + b, "grey")
    R(ox, oy, 1, 5 + b, 6, 9 + b, "grey")
    R(ox, oy, 1, 3 + b, 2, 5 + b, "grey_d"); R(ox, oy, 5, 3 + b, 6, 5 + b, "grey_d")
    PX(ox, oy, 2, 7 + b, "green"); PX(ox, oy, 0, 8 + b, "pink")
    R(ox, oy, 12, 4 + b, 13, 9 + b, "grey_d")     # หางชูขึ้น
    PX(ox, oy, 13, 3 + b, "grey_d")
    legs(ox, oy, f, "grey_d")
draw_pet(1, cat)

# 2 นก
def bird(ox, oy, f):
    R(ox, oy, 4, 6, 11, 12, "blue")
    R(ox, oy, 3, 4, 7, 8, "blue")
    PX(ox, oy, 4, 5, "black")
    R(ox, oy, 1, 6, 2, 7, "orange")               # ปาก
    wy = 5 if f else 8
    R(ox, oy, 7, wy, 10, wy + 2, "teal")          # ปีกขยับ
    R(ox, oy, 11, 5, 13, 7, "teal")               # หาง
    R(ox, oy, 6, 13, 6, 15, "orange"); R(ox, oy, 9, 13, 9, 15, "orange")
draw_pet(2, bird)

# 3 หนู
def mouse(ox, oy, f):
    b = -1 if f else 0
    R(ox, oy, 4, 9 + b, 11, 13 + b, "grey")
    R(ox, oy, 2, 7 + b, 6, 11 + b, "grey")
    R(ox, oy, 5, 5 + b, 7, 7 + b, "pink")         # หูกลมใหญ่
    PX(ox, oy, 3, 8 + b, "black"); PX(ox, oy, 1, 10 + b, "pink")
    R(ox, oy, 11, 10 + b, 14, 10 + b, "pink_d")   # หางเส้น
    PX(ox, oy, 14, 9 + b, "pink_d")
    legs(ox, oy, f, "grey_d", 13)
draw_pet(3, mouse)

# 4 งู
def snake(ox, oy, f):
    s = 1 if f else 0
    R(ox, oy, 2, 5, 5, 8, "green")                # หัว
    PX(ox, oy, 3, 6, "black")
    PX(ox, oy, 0, 6, "red"); PX(ox, oy, 1, 6, "red")  # ลิ้น
    R(ox, oy, 4, 8 + s, 9, 10 + s, "green")
    R(ox, oy, 8, 10 - s, 13, 12 - s, "green_d")
    R(ox, oy, 10, 12 + s, 14, 14 + s, "green")
    PX(ox, oy, 6, 9 + s, "yellow"); PX(ox, oy, 11, 11 - s, "yellow")
draw_pet(4, snake)

# 5 กระต่าย
def rabbit(ox, oy, f):
    b = -1 if f else 0
    R(ox, oy, 4, 8 + b, 12, 13 + b, "white")
    R(ox, oy, 2, 6 + b, 6, 10 + b, "white")
    e = 1 if f else 0
    R(ox, oy, 3, 1 + b + e, 4, 6 + b, "white"); R(ox, oy, 5, 1 + b, 6, 6 + b, "white")  # หูยาว
    PX(ox, oy, 4, 2 + b + e, "pink"); PX(ox, oy, 5, 2 + b, "pink")
    PX(ox, oy, 3, 8 + b, "red"); PX(ox, oy, 1, 9 + b, "pink")
    R(ox, oy, 12, 8 + b, 13, 9 + b, "cream")      # หางปุย
    legs(ox, oy, f, "pink_d", 13)
draw_pet(5, rabbit)

# 6 เต่า
def turtle(ox, oy, f):
    R(ox, oy, 4, 6, 12, 11, "green_d")            # กระดอง
    R(ox, oy, 5, 7, 11, 9, "green")
    PX(ox, oy, 6, 8, "green_d"); PX(ox, oy, 9, 8, "green_d")
    R(ox, oy, 1, 8, 4, 11, "green")               # หัว
    PX(ox, oy, 2, 9, "black")
    if f == 0:
        R(ox, oy, 5, 12, 6, 13, "green"); R(ox, oy, 10, 12, 11, 13, "green")
    else:
        R(ox, oy, 6, 12, 7, 13, "green"); R(ox, oy, 9, 12, 10, 13, "green")
draw_pet(6, turtle)

# 7 เป็ด
def duck(ox, oy, f):
    t = 1 if f else 0
    R(ox, oy, 4, 7, 12, 12, "yellow")
    R(ox, oy, 2, 3 + t, 6, 8 + t, "yellow")
    PX(ox, oy, 3, 5 + t, "black")
    R(ox, oy, 0, 6 + t, 2, 7 + t, "orange")       # ปาก
    R(ox, oy, 8, 6, 12, 8, "tan")                 # ปีก
    R(ox, oy, 5, 13, 6, 15, "orange"); R(ox, oy, 9, 13, 10, 15, "orange")
draw_pet(7, duck)

# 8 หมูจิ๋ว
def pig(ox, oy, f):
    b = -1 if f else 0
    R(ox, oy, 3, 7 + b, 13, 13 + b, "pink")
    R(ox, oy, 1, 6 + b, 5, 11 + b, "pink")
    R(ox, oy, 0, 8 + b, 1, 9 + b, "pink_d")       # จมูก
    PX(ox, oy, 2, 7 + b, "black")
    PX(ox, oy, 2, 5 + b, "pink_d"); PX(ox, oy, 4, 5 + b, "pink_d")  # หู
    PX(ox, oy, 13, 8 + b, "pink_d"); PX(ox, oy, 14, 7 + b, "pink_d")  # หางหยิก
    legs(ox, oy, f, "pink_d")
draw_pet(8, pig)

# 9 เพนกวิน
def penguin(ox, oy, f):
    w = 1 if f else 0
    R(ox, oy, 4, 3, 11, 13, "black")
    R(ox, oy, 5, 6, 10, 12, "white")
    PX(ox, oy, 5, 4, "white"); PX(ox, oy, 9, 4, "white")
    PX(ox, oy, 6, 4, "black"); PX(ox, oy, 10, 4, "black")
    R(ox, oy, 7, 5, 8, 5, "orange")               # ปาก
    R(ox, oy, 3 - w, 6, 3, 10, "black"); R(ox, oy, 12, 6, 12 + w, 10, "black")  # ครีบกาง
    R(ox, oy, 5, 14, 6, 15, "orange"); R(ox, oy, 9, 14, 10, 15, "orange")
draw_pet(9, penguin)

# 10 กบ
def frog(ox, oy, f):
    s = 1 if f else 0
    R(ox, oy, 3, 8 - s, 12, 13, "green")
    R(ox, oy, 3, 5 - s, 5, 7 - s, "green"); R(ox, oy, 9, 5 - s, 11, 7 - s, "green")  # ตาโปน
    PX(ox, oy, 4, 6 - s, "black"); PX(ox, oy, 10, 6 - s, "black")
    R(ox, oy, 4, 11, 6, 11, "green_d")            # ปาก
    R(ox, oy, 2, 13, 4, 14, "green_d"); R(ox, oy, 11, 13, 13, 14, "green_d")
draw_pet(10, frog)

# 11 ไก่
def chicken(ox, oy, f):
    t = 1 if f else 0
    R(ox, oy, 4, 6, 12, 12, "white")
    R(ox, oy, 2, 3 + t, 6, 8 + t, "white")
    R(ox, oy, 3, 2 + t, 5, 3 + t, "red")          # หงอน
    PX(ox, oy, 3, 5 + t, "black")
    R(ox, oy, 0, 6 + t, 1, 7 + t, "orange")
    R(ox, oy, 12, 5, 14, 9, "grey")               # หางพัด
    R(ox, oy, 6, 13, 6, 15, "orange"); R(ox, oy, 9, 13, 9, 15, "orange")
draw_pet(11, chicken)

# 12 เม่น
def hedgehog(ox, oy, f):
    b = -1 if f else 0
    R(ox, oy, 4, 5 + b, 13, 12 + b, "brown_d")    # หนามหลัง
    PX(ox, oy, 5, 4 + b, "brown_d"); PX(ox, oy, 8, 3 + b, "brown_d"); PX(ox, oy, 11, 4 + b, "brown_d")
    R(ox, oy, 5, 8 + b, 12, 12 + b, "brown")
    R(ox, oy, 1, 8 + b, 5, 12 + b, "tan")         # หน้า
    PX(ox, oy, 2, 9 + b, "black"); PX(ox, oy, 0, 11 + b, "black")
    legs(ox, oy, f, "brown_d")
draw_pet(12, hedgehog)

# 13 จิ้งจอก
def fox(ox, oy, f):
    b = -1 if f else 0
    R(ox, oy, 3, 7 + b, 11, 12 + b, "orange")
    R(ox, oy, 1, 4 + b, 6, 9 + b, "orange")
    R(ox, oy, 1, 8 + b, 4, 9 + b, "cream")
    R(ox, oy, 1, 2 + b, 2, 4 + b, "brown_d"); R(ox, oy, 5, 2 + b, 6, 4 + b, "brown_d")
    PX(ox, oy, 2, 6 + b, "black"); PX(ox, oy, 0, 8 + b, "black")
    R(ox, oy, 11, 6 + b, 14, 10 + b, "orange")    # หางฟู
    R(ox, oy, 13, 6 + b, 14, 7 + b, "cream")
    legs(ox, oy, f, "brown_d")
draw_pet(13, fox)

# 14 มังกรจิ๋ว
def dragon(ox, oy, f):
    b = -1 if f else 0
    w = 1 if f else 0
    R(ox, oy, 3, 7 + b, 12, 12 + b, "teal")
    R(ox, oy, 1, 4 + b, 6, 9 + b, "teal")
    PX(ox, oy, 2, 6 + b, "gold"); PX(ox, oy, 3, 2 + b, "gold"); PX(ox, oy, 5, 2 + b, "gold")  # ตา+เขา
    R(ox, oy, 3, 3 + b, 5, 4 + b, "teal")
    R(ox, oy, 7, 4 + b - w, 10, 7 + b - w, "green_d")  # ปีกกระพือ
    R(ox, oy, 12, 8 + b, 14, 9 + b, "teal"); PX(ox, oy, 15, 7 + b, "gold")  # หาง
    R(ox, oy, 4, 9 + b, 10, 10 + b, "gold")       # ท้องทอง
    legs(ox, oy, f, "green_d")
draw_pet(14, dragon)

img.save(OUT / "pets.png")
print(f"wrote pets.png {img.size[0]}x{img.size[1]} (15 pets x {FRAMES} frames)")
