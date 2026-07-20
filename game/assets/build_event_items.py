"""ไอเทมอีเวนต์ตามฤดูกาล — ชุดแรก "หน้าฝน DataX" 8 ชิ้น ซื้อได้ในร้านค้าเฉพาะช่วงที่อีเวนต์ active
(ดูช่วงวันที่ + แคตตาล็อกใน game/js/events_data.js)
spritesheet 4 คอลัมน์ x 2 แถว ช่องละ 24x24 px  รัน: python build_event_items.py
"""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent
CELL = 24
COLS, ROWS = 4, 2

P = {
    "blue": "#4f8fdd", "blue_d": "#3a6bb0", "blue_hi": "#a9c8ee",
    "teal": "#65a9c2", "teal_d": "#3f7f92", "glass": "#b9ecdf",
    "yellow": "#f2d24b", "yellow_d": "#c2a02e",
    "green": "#57b06b", "green_d": "#3c7b57",
    "grey": "#737e8d", "grey_d": "#4f5761", "grey_hi": "#c3cbd3",
    "brown": "#a9744f", "brown_d": "#7a5238",
    "cream": "#fff6dc", "white": "#f0e8d8", "black": "#1b1626",
    "red": "#b84d5a", "orange": "#d97a55",
}

img = Image.new("RGBA", (COLS * CELL, ROWS * CELL), (0, 0, 0, 0))
d = ImageDraw.Draw(img)


def O(i):
    return (i % COLS) * CELL, (i // COLS) * CELL


def R(i, x0, y0, x1, y1, c):
    ox, oy = O(i)
    d.rectangle([ox + x0, oy + y0, ox + x1, oy + y1], fill=P[c])


def E(i, x0, y0, x1, y1, c):
    ox, oy = O(i)
    d.ellipse([ox + x0, oy + y0, ox + x1, oy + y1], fill=P[c])


def L(i, x0, y0, x1, y1, c, w=1):
    ox, oy = O(i)
    d.line([ox + x0, oy + y0, ox + x1, oy + y1], fill=P[c], width=w)


def PX(i, x, y, c):
    ox, oy = O(i)
    d.point((ox + x, oy + y), fill=P[c])


# 0: ร่มลายทาง
def e0_umbrella(i):
    d.pieslice([O(i)[0] + 2, O(i)[1] + 4, O(i)[0] + 21, O(i)[1] + 15], 180, 360, fill=P["blue"])
    for x in range(4, 20, 4):
        R(i, x, 5, x + 1, 9, "cream")
    R(i, 11, 9, 12, 20, "grey_d")
    R(i, 9, 19, 14, 21, "grey")
e0_umbrella(0)


# 1: รองเท้าบูทยาง
def e1_boots(i):
    R(i, 4, 6, 9, 18, "yellow"); R(i, 4, 16, 11, 21, "yellow")
    R(i, 13, 6, 18, 18, "yellow"); R(i, 13, 16, 20, 21, "yellow")
    R(i, 4, 6, 9, 8, "yellow_d"); R(i, 13, 6, 18, 8, "yellow_d")
    R(i, 4, 19, 11, 21, "grey_d"); R(i, 13, 19, 20, 21, "grey_d")
e1_boots(1)


# 2: เสื่อกันน้ำ
def e2_mat(i):
    R(i, 3, 8, 21, 18, "teal")
    for x in range(4, 21, 4):
        L(i, x, 8, x, 18, "teal_d")
    R(i, 3, 8, 21, 10, "glass")
e2_mat(2)


# 3: กบยางของเล่น
def e3_frog(i):
    E(i, 5, 10, 19, 20, "green")
    E(i, 4, 6, 10, 12, "green"); E(i, 14, 6, 20, 12, "green")
    E(i, 6, 7, 9, 10, "cream"); E(i, 15, 7, 18, 10, "cream")
    PX(i, 7, 8, "black"); PX(i, 16, 8, "black")
    R(i, 9, 15, 15, 17, "green_d")
e3_frog(3)


# 4: ชุดกันฝนแขวน
def e4_raincoat(i):
    R(i, 9, 3, 15, 5, "grey_d")
    L(i, 7, 3, 17, 3, "grey_d", 1)
    d.polygon([O(i)[0] + 8, O(i)[1] + 5, O(i)[0] + 16, O(i)[1] + 5, O(i)[0] + 18, O(i)[1] + 20, O(i)[0] + 6, O(i)[1] + 20], fill=P["yellow"])
    R(i, 10, 7, 14, 9, "yellow_d")
    L(i, 8, 12, 16, 12, "yellow_d", 1)
e4_raincoat(4)


# 5: ถังเก็บน้ำฝนจิ๋ว
def e5_barrel(i):
    R(i, 6, 6, 18, 20, "brown")
    R(i, 6, 6, 18, 20, "brown")
    L(i, 6, 9, 18, 9, "brown_d", 1); L(i, 6, 16, 18, 16, "brown_d", 1)
    R(i, 7, 20, 17, 21, "grey_d")
    R(i, 8, 3, 12, 7, "teal"); R(i, 6, 5, 14, 7, "teal_d")
e5_barrel(5)


# 6: ร่มกางตากแดด-ฝน (พาราโซล)
def e6_parasol(i):
    d.pieslice([O(i)[0] + 1, O(i)[1] + 5, O(i)[0] + 22, O(i)[1] + 16], 180, 360, fill=P["orange"])
    for x in range(3, 21, 4):
        R(i, x, 6, x + 1, 10, "cream")
    R(i, 11, 10, 12, 21, "grey_d")
e6_parasol(6)


# 7: ผ้าเช็ดเท้าลายเมฆฝน
def e7_doormat(i):
    R(i, 3, 9, 21, 17, "grey_hi")
    R(i, 3, 9, 21, 17, "grey_hi")
    E(i, 6, 10, 12, 13, "white"); E(i, 10, 9, 16, 12, "white")
    for x in range(7, 20, 3):
        L(i, x, 14, x, 16, "blue", 1)
e7_doormat(7)

img.save(OUT / "event_items.png")
print("saved", OUT / "event_items.png", img.size)
