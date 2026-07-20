"""ไอเทม exclusive จากตู้กาชาปอง 50 ชิ้น — ได้จากการสุ่มเท่านั้น ไม่มีขายตรง ไม่ซ้ำกับร้านค้า/login

จัดเรียงตาม rarity tier (ต้องตรงกับ GACHA_ITEMS ใน game/js/gacha_data.js):
  mythic(1) -> legendary(2) -> epic(4) -> rare(8) -> common(20) -> basic(15) = 50 ชิ้น
spritesheet 5 คอลัมน์ x 10 แถว ช่องละ 24x24 px  รัน: python build_gacha_items.py
"""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent
CELL = 24
COLS, ROWS = 5, 10

P = {
    "gold": "#e7b94f", "gold_d": "#b08631", "gold_hi": "#fff0cf",
    "wood": "#8b563f", "wood_d": "#5b3a32", "wood_hi": "#a9744f",
    "navy": "#26324a", "slate": "#394158", "metal": "#9aa6ad", "metal_d": "#6b747c",
    "cream": "#fff6dc", "white": "#f0e8d8", "black": "#1b1626",
    "red": "#b84d5a", "pink": "#d895bd", "green": "#57b06b", "green_d": "#3c7b57",
    "leaf": "#3c7b57", "teal": "#65a9c2", "teal_d": "#3f7f92", "glass": "#b9ecdf",
    "purple": "#9867a8", "purple_d": "#6d4579", "lilac": "#c9a6e8",
    "blue": "#4f8fdd", "orange": "#d97a55", "brown": "#a9744f",
    "marble": "#e4e0d8", "marble_d": "#b9b3a6", "diamond": "#cdeef0",
    "grey": "#737e8d", "grey_d": "#4f5761", "grey_hi": "#c3cbd3", "yellow": "#f2d24b",
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


def PX(i, x, y, c):
    ox, oy = O(i)
    d.point((ox + x, oy + y), fill=P[c])


def sparkle(i, x, y, c="gold_hi"):
    PX(i, x, y - 1, c); PX(i, x, y + 1, c); PX(i, x - 1, y, c); PX(i, x + 1, y, c)


# ============ MYTHIC (0) ============
def g00_diamond_throne(i):
    R(i, 6, 4, 17, 8, "gold"); R(i, 4, 4, 6, 20, "gold_d"); R(i, 17, 4, 19, 20, "gold_d")
    R(i, 7, 9, 16, 19, "purple"); R(i, 8, 10, 15, 15, "purple_d")
    E(i, 9, 6, 14, 11, "diamond"); sparkle(i, 11, 3, "gold_hi")
    R(i, 5, 20, 18, 22, "gold_d")
    sparkle(i, 6, 12); sparkle(i, 17, 12)
g00_diamond_throne(0)

# ============ LEGENDARY (1-2) ============
def g01_grand_piano(i):
    R(i, 3, 8, 20, 18, "black"); R(i, 3, 6, 14, 9, "black")
    R(i, 4, 9, 19, 11, "gold")
    for x in range(5, 18, 2): R(i, x, 12, x, 16, "white")
    R(i, 2, 18, 6, 21, "gold_d"); R(i, 17, 18, 21, 21, "gold_d")
    E(i, 15, 4, 21, 9, "black")
g01_grand_piano(1)

def g02_yacht(i):
    ox, oy = O(i)
    d.polygon([(ox + 2, oy + 15), (ox + 22, oy + 15), (ox + 19, oy + 20), (ox + 5, oy + 20)], fill=P["cream"])
    R(i, 6, 15, 18, 15, "gold")
    R(i, 8, 6, 16, 15, "white"); R(i, 9, 7, 15, 9, "blue")
    R(i, 11, 2, 12, 7, "metal"); PX(i, 11, 2, "red")
    R(i, 2, 15, 22, 16, "gold")
g02_yacht(2)

# ============ EPIC (3-6) ============
def g03_marble_statue(i):
    E(i, 8, 2, 15, 8, "marble"); R(i, 9, 8, 14, 17, "marble")
    R(i, 7, 17, 16, 21, "marble_d")
    R(i, 6, 19, 17, 22, "gold")
    PX(i, 10, 5, "marble_d"); PX(i, 13, 5, "marble_d")
g03_marble_statue(3)

def g04_chandelier(i):
    ox, oy = O(i)
    R(i, 11, 1, 12, 5, "gold_d")
    d.polygon([(ox + 4, oy + 5), (ox + 19, oy + 5), (ox + 16, oy + 10), (ox + 7, oy + 10)], fill=P["gold"])
    for x, y in [(6, 12), (9, 14), (14, 14), (17, 12), (11, 15)]:
        E(i, x, y, x + 3, y + 3, "diamond")
    sparkle(i, 8, 8); sparkle(i, 15, 8)
g04_chandelier(4)

def g05_wine_cabinet(i):
    R(i, 3, 3, 20, 21, "wood_d"); R(i, 4, 4, 19, 20, "wood")
    for row in (6, 12):
        for x in (6, 10, 14):
            E(i, x, row, x + 3, row + 5, "green_d")
            R(i, x + 1, row - 1, x + 2, row, "gold")
    R(i, 4, 17, 19, 19, "gold_d")
g05_wine_cabinet(5)

def g06_grandfather_clock(i):
    R(i, 8, 2, 15, 6, "gold"); E(i, 9, 3, 14, 6, "cream")
    PX(i, 11, 4, "black"); PX(i, 12, 5, "black")
    R(i, 7, 6, 16, 21, "wood_d"); R(i, 8, 7, 15, 20, "wood")
    R(i, 9, 9, 14, 16, "cream")
    PX(i, 11, 12, "black")
g06_grandfather_clock(6)

# ============ RARE (7-14) ============
def g07_exec_chair(i):
    R(i, 6, 2, 17, 13, "wood_d"); R(i, 7, 3, 16, 12, "brown")  # พนักพิงสูง
    R(i, 3, 5, 6, 9, "wood_d"); R(i, 17, 5, 20, 9, "wood_d")   # ที่วางแขน
    R(i, 6, 13, 17, 18, "wood_d"); R(i, 7, 14, 16, 17, "brown")  # เบาะนั่ง
    R(i, 10, 18, 13, 20, "metal")
    R(i, 5, 20, 18, 21, "metal_d")
g07_exec_chair(7)

def g08_globe(i):
    E(i, 6, 4, 18, 16, "teal"); E(i, 6, 4, 18, 16, "teal")
    d.arc([O(i)[0] + 6, O(i)[1] + 4, O(i)[0] + 18, O(i)[1] + 16], 0, 360, fill=P["gold_hi"])
    PX(i, 9, 7, "green"); PX(i, 13, 9, "green"); PX(i, 10, 12, "green")
    R(i, 10, 16, 13, 20, "gold"); R(i, 7, 20, 16, 22, "wood_d")
g08_globe(8)

def g09_designer_lamp(i):
    R(i, 11, 2, 12, 15, "metal"); R(i, 4, 14, 19, 16, "metal_d")
    d.polygon([(O(i)[0] + 8, O(i)[1] + 2), (O(i)[0] + 15, O(i)[1] + 2), (O(i)[0] + 17, O(i)[1] + 9), (O(i)[0] + 6, O(i)[1] + 9)], fill=P["yellow"])
    PX(i, 11, 5, "gold_hi")
g09_designer_lamp(9)

def g10_bookcase(i):
    R(i, 3, 2, 20, 21, "wood_d"); R(i, 4, 3, 19, 20, "wood_hi")
    for row in (5, 11, 17):
        R(i, 5, row, 8, row + 4, "red"); R(i, 9, row, 11, row + 4, "gold")
        R(i, 12, row, 14, row + 4, "teal"); R(i, 15, row, 18, row + 4, "green")
g10_bookcase(10)

def g11_persian_rug(i):
    R(i, 2, 6, 21, 18, "red")
    R(i, 4, 8, 19, 16, "gold_d")
    R(i, 6, 10, 17, 14, "red")
    for x in range(7, 17, 3): PX(i, x, 12, "gold_hi")
g11_persian_rug(11)

def g12_golden_safe(i):
    R(i, 5, 5, 18, 19, "grey_hi"); R(i, 6, 6, 17, 18, "grey")
    E(i, 9, 9, 15, 15, "gold"); E(i, 11, 11, 13, 13, "black")
    R(i, 7, 7, 8, 8, "gold_hi")
g12_golden_safe(12)

def g13_fireplace(i):
    R(i, 3, 3, 20, 20, "marble_d"); R(i, 5, 5, 18, 18, "marble")
    R(i, 8, 10, 15, 18, "black")
    d.polygon([(O(i)[0] + 10, O(i)[1] + 12), (O(i)[0] + 13, O(i)[1] + 12), (O(i)[0] + 12, O(i)[1] + 16), (O(i)[0] + 9, O(i)[1] + 16)], fill=P["orange"])
    PX(i, 11, 13, "yellow")
g13_fireplace(13)

def g14_gold_vase(i):
    E(i, 8, 3, 15, 8, "red"); PX(i, 9, 4, "gold"); PX(i, 12, 5, "gold")
    R(i, 9, 8, 14, 17, "red"); R(i, 9, 8, 14, 9, "gold")
    R(i, 7, 17, 16, 19, "gold_d")
g14_gold_vase(14)

# ============ COMMON (15-34) ============
def g15_cactus(i):
    R(i, 9, 4, 14, 16, "green"); R(i, 5, 8, 9, 12, "green"); R(i, 14, 6, 18, 10, "green")
    for y in (6, 9, 12): PX(i, 11, y, "green_d")
    R(i, 7, 16, 16, 20, "wood")
g15_cactus(15)

def g16_pen_holder(i):
    R(i, 7, 10, 16, 20, "wood_d"); R(i, 8, 11, 15, 19, "wood")
    R(i, 9, 3, 10, 11, "black"); R(i, 12, 2, 13, 11, "red"); R(i, 14, 4, 15, 11, "blue")
g16_pen_holder(16)

def g17_alarm_clock(i):
    E(i, 5, 5, 18, 18, "teal"); E(i, 7, 7, 16, 16, "cream")
    R(i, 4, 3, 6, 5, "teal_d"); R(i, 17, 3, 19, 5, "teal_d")
    R(i, 3, 10, 5, 12, "gold"); PX(i, 11, 11, "black")
g17_alarm_clock(17)

def g18_tulip_pot(i):
    for x, c in ((6, "red"), (10, "pink"), (14, "gold")):
        R(i, x, 6, x + 2, 12, "leaf")
        E(i, x - 1, 2, x + 3, 7, c)
    R(i, 4, 14, 17, 21, "orange"); R(i, 4, 14, 17, 15, "gold_hi")
g18_tulip_pot(18)

def g19_pillow(i):
    R(i, 4, 6, 19, 18, "pink"); R(i, 4, 6, 19, 18, "pink")
    for x in range(6, 18, 3):
        for y in range(8, 17, 3): PX(i, x, y, "white")
    R(i, 4, 6, 19, 7, "purple")
g19_pillow(19)

def g20_fruit_basket(i):
    R(i, 5, 12, 18, 19, "wood"); R(i, 6, 13, 17, 18, "wood_hi")
    E(i, 6, 5, 11, 10, "red"); E(i, 10, 4, 15, 9, "gold"); E(i, 13, 6, 18, 11, "green")
    PX(i, 8, 4, "green"); PX(i, 12, 3, "green")
g20_fruit_basket(20)

def g21_certificate(i):
    R(i, 4, 3, 19, 18, "wood_d"); R(i, 5, 4, 18, 17, "cream")
    for y in (7, 9, 11): R(i, 7, y, 15, y, "grey")
    E(i, 9, 12, 13, 16, "gold"); PX(i, 11, 14, "red")
g21_certificate(21)

def g22_toaster(i):
    R(i, 4, 8, 19, 18, "metal"); R(i, 5, 9, 18, 13, "metal_d")
    R(i, 7, 4, 10, 8, "gold"); R(i, 13, 4, 16, 8, "gold")
    R(i, 6, 15, 8, 17, "black")
g22_toaster(22)

def g23_desk_fan(i):
    E(i, 4, 3, 19, 18, "grey_hi")
    E(i, 8, 7, 15, 14, "metal_d")
    for a in range(3):
        pass
    R(i, 9, 8, 14, 13, "metal")
    R(i, 10, 18, 13, 21, "metal_d")
g23_desk_fan(23)

def g24_umbrella_stand(i):
    R(i, 8, 2, 9, 16, "navy"); R(i, 14, 2, 15, 16, "red")
    R(i, 11, 4, 12, 16, "teal")
    E(i, 6, 15, 17, 21, "metal_d"); E(i, 7, 15, 16, 19, "metal")
g24_umbrella_stand(24)

def g25_yoga_mat(i):
    R(i, 4, 8, 19, 15, "purple"); R(i, 4, 8, 6, 15, "lilac"); R(i, 17, 8, 19, 15, "lilac")
    for y in (9, 11, 13): R(i, 7, y, 16, y, "purple_d")
g25_yoga_mat(25)

def g26_dumbbells(i):
    R(i, 3, 10, 6, 15, "grey_d"); R(i, 7, 11, 16, 14, "metal"); R(i, 17, 10, 20, 15, "grey_d")
    R(i, 3, 16, 6, 21, "grey_d"); R(i, 7, 17, 16, 20, "metal"); R(i, 17, 16, 20, 21, "grey_d")
g26_dumbbells(26)

def g27_mini_whiteboard(i):
    R(i, 4, 3, 19, 16, "wood"); R(i, 5, 4, 18, 15, "white")
    R(i, 7, 7, 13, 7, "blue"); R(i, 7, 10, 15, 10, "red")
    R(i, 8, 17, 15, 20, "wood_d")
g27_mini_whiteboard(27)

def g28_beach_ball(i):
    E(i, 4, 4, 19, 19, "cream")
    d.pieslice([O(i)[0] + 4, O(i)[1] + 4, O(i)[0] + 19, O(i)[1] + 19], 0, 60, fill=P["red"])
    d.pieslice([O(i)[0] + 4, O(i)[1] + 4, O(i)[0] + 19, O(i)[1] + 19], 120, 180, fill=P["blue"])
    d.pieslice([O(i)[0] + 4, O(i)[1] + 4, O(i)[0] + 19, O(i)[1] + 19], 240, 300, fill=P["gold"])
g28_beach_ball(28)

def g29_backpack(i):
    R(i, 6, 8, 17, 21, "navy"); R(i, 7, 5, 16, 9, "teal")   # ตัวกระเป๋า + ฝาบน
    R(i, 9, 3, 14, 6, "navy")                                # หูหิ้ว
    R(i, 8, 12, 15, 17, "teal_d"); PX(i, 11, 14, "gold")     # กระเป๋าหน้า + ซิป
    R(i, 5, 9, 6, 20, "navy"); R(i, 17, 9, 18, 20, "navy")   # สายสะพาย
g29_backpack(29)

def g30_sneaker(i):
    ox, oy = O(i)
    d.polygon([(ox + 3, oy + 16), (ox + 5, oy + 9), (ox + 14, oy + 8), (ox + 20, oy + 12), (ox + 20, oy + 17), (ox + 3, oy + 17)], fill=P["white"])
    R(i, 3, 15, 20, 18, "red")
    for x in (7, 9, 11): PX(i, x, 11, "black")
    R(i, 2, 18, 21, 20, "wood_d")
g30_sneaker(30)

def g31_vinyl(i):
    E(i, 3, 3, 20, 20, "black"); E(i, 8, 8, 15, 15, "red"); E(i, 10, 10, 13, 13, "black")
    R(i, 3, 20, 20, 22, "wood_d")
g31_vinyl(31)

def g32_fairy_lights(i):
    E(i, 5, 3, 16, 18, "glass"); R(i, 3, 18, 18, 20, "metal")
    for x, y, c in [(7, 7, "gold"), (10, 5, "pink"), (13, 8, "teal"), (9, 11, "gold"), (12, 12, "pink")]:
        PX(i, x, y, c)
g32_fairy_lights(32)

def g33_desk_calendar(i):
    R(i, 4, 5, 19, 19, "cream"); R(i, 4, 5, 19, 9, "red")
    for y in (12, 15):
        for x in (7, 11, 15): PX(i, x, y, "grey")
    R(i, 6, 2, 7, 6, "grey"); R(i, 16, 2, 17, 6, "grey")
g33_desk_calendar(33)

def g34_dino_figure(i):
    R(i, 5, 10, 16, 18, "green"); R(i, 13, 4, 19, 11, "green")
    for x in (14, 16, 18): R(i, x, 3, x, 5, "green_d")
    R(i, 4, 16, 7, 20, "green_d"); R(i, 12, 16, 15, 20, "green_d")
    PX(i, 17, 7, "black")
g34_dino_figure(34)

# ============ BASIC (35-49) ============
def g35_candle(i):
    R(i, 7, 10, 16, 20, "white"); R(i, 9, 4, 14, 10, "orange")
    d.polygon([(O(i)[0] + 11, O(i)[1] + 1), (O(i)[0] + 13, O(i)[1] + 5), (O(i)[0] + 9, O(i)[1] + 5)], fill=P["yellow"])
g35_candle(35)

def g36_lucky_bamboo(i):
    for x in (8, 11, 14):
        R(i, x, 4, x + 1, 17, "green")
        R(i, x, 8, x + 1, 9, "green_d")
    R(i, 5, 17, 18, 21, "teal")
g36_lucky_bamboo(36)

def g37_crystal_ball(i):
    E(i, 5, 3, 18, 16, "diamond"); PX(i, 8, 6, "white")
    R(i, 6, 16, 17, 20, "gold_d")
g37_crystal_ball(37)

def g38_pressed_flower(i):
    R(i, 3, 3, 20, 20, "wood"); R(i, 5, 5, 18, 18, "cream")
    R(i, 9, 8, 10, 15, "green"); E(i, 6, 6, 13, 12, "pink")
g38_pressed_flower(38)

def g39_handheld_game(i):
    R(i, 6, 2, 17, 21, "purple"); R(i, 8, 4, 15, 12, "glass")
    R(i, 8, 15, 10, 17, "black"); R(i, 13, 14, 14, 16, "red"); R(i, 15, 16, 16, 18, "blue")
g39_handheld_game(39)

def g40_bike_helmet(i):
    E(i, 4, 4, 19, 16, "orange")
    R(i, 4, 10, 19, 16, "orange")
    for x in (7, 10, 13, 16): R(i, x, 6, x + 1, 9, "black")
    R(i, 3, 16, 20, 18, "grey_d")
g40_bike_helmet(40)

def g41_polka_umbrella(i):
    d.pieslice([O(i)[0] + 2, O(i)[1] + 2, O(i)[0] + 21, O(i)[1] + 16], 180, 360, fill=P["teal"])
    for x, y in [(6, 8), (11, 6), (16, 8)]: PX(i, x, y, "white")
    R(i, 10, 10, 11, 21, "grey_d")
g41_polka_umbrella(41)

def g42_scarf_hook(i):
    R(i, 10, 2, 13, 4, "grey_d")
    R(i, 5, 4, 18, 8, "red")
    R(i, 5, 4, 18, 5, "cream")
    R(i, 6, 8, 9, 18, "red"); R(i, 14, 8, 17, 18, "red")
g42_scarf_hook(42)

def g43_sunglasses(i):
    R(i, 3, 14, 20, 19, "wood")
    E(i, 5, 8, 11, 13, "black"); E(i, 12, 8, 18, 13, "black")
    R(i, 11, 9, 12, 10, "black")
    PX(i, 7, 10, "teal_d"); PX(i, 14, 10, "teal_d")
g43_sunglasses(43)

def g44_notebook(i):
    R(i, 5, 4, 18, 20, "wood_d"); R(i, 6, 5, 17, 19, "brown")
    R(i, 6, 5, 8, 19, "wood_d")
    PX(i, 12, 11, "gold")
g44_notebook(44)

def g45_water_bottle(i):
    R(i, 8, 3, 13, 6, "metal_d")
    R(i, 7, 6, 14, 20, "teal")
    R(i, 7, 10, 14, 12, "white")
g45_water_bottle(45)

def g46_headset(i):
    d.arc([O(i)[0] + 4, O(i)[1] + 2, O(i)[0] + 17, O(i)[1] + 16], 180, 360, fill=P["navy"], width=2)
    R(i, 3, 8, 7, 14, "navy"); R(i, 14, 8, 18, 14, "navy")
    R(i, 4, 9, 6, 13, "purple"); R(i, 15, 9, 17, 13, "purple")
    R(i, 9, 16, 12, 20, "grey_d")
g46_headset(46)

def g47_ceramic_owl(i):
    R(i, 7, 6, 14, 18, "brown"); E(i, 6, 3, 15, 10, "brown")
    E(i, 7, 5, 10, 8, "white"); E(i, 11, 5, 14, 8, "white")
    PX(i, 8, 6, "black"); PX(i, 12, 6, "black")
    d.polygon([(O(i)[0] + 10, O(i)[1] + 8), (O(i)[0] + 12, O(i)[1] + 8), (O(i)[0] + 11, O(i)[1] + 10)], fill=P["gold"])
g47_ceramic_owl(47)

def g48_traffic_cone(i):
    d.polygon([(O(i)[0] + 11, O(i)[1] + 2), (O(i)[0] + 17, O(i)[1] + 18), (O(i)[0] + 5, O(i)[1] + 18)], fill=P["orange"])
    R(i, 7, 11, 15, 13, "white")
    R(i, 3, 18, 19, 21, "wood_d")
g48_traffic_cone(48)

def g49_rugby_ball(i):
    E(i, 4, 7, 19, 15, "brown")
    R(i, 11, 7, 12, 15, "cream")
    for y in (9, 11, 13): PX(i, 11, y, "wood_d")
g49_rugby_ball(49)

img.save(OUT / "gacha_items.png")
print(f"wrote gacha_items.png {img.size[0]}x{img.size[1]} (50 items)")
