"""Deterministic pixel-art prototype of SCB Park West B, floor 7.

The layout is adapted for a social office game. It is not a construction drawing.
Run: python build.py
"""
from pathlib import Path
import json
import os
import sys

SKILL = r"C:\Users\Admin\.codex\skills\pixel-art-studio\scripts"
sys.path.insert(0, SKILL)
from pixelstudio import Sprite, ramp
from PIL import ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent
SPACE_SCALE = int(os.environ.get("DATAXTOWN_SPACE_SCALE", "1"))
if SPACE_SCALE not in (1, 2, 3):
    raise ValueError("DATAXTOWN_SPACE_SCALE must be 1, 2, or 3")
# DATAXTOWN_COMPACT=1: โหมดที่เกมใช้อยู่ — export art ย่อกลับไปที่ 24px/tile เท่าเกม
# (เท่าไหร่ก็ได้ตอนวาด ดูตัวถัดไป) และ collision เปิดเดินอิสระทุกช่องในกรอบตึก
COMPACT = os.environ.get("DATAXTOWN_COMPACT", "0") == "1"
BASE_TILE = 16 * SPACE_SCALE
# DATAXTOWN_TILE_PX: ความละเอียด "วาดจริง" ต่อ tile แยกอิสระจาก SPACE_SCALE (ตัวเลือกผังห้อง/
# เฟอร์นิเจอร์ยังคงอิงจาก SPACE_SCALE==3 เหมือนเดิม) — ยิ่งสูงยิ่งวาดเส้นโค้ง/ไล่เฉดสีได้ละเอียดขึ้น
# ก่อนย่อกลับ 24px ตอน COMPACT (สูงสุดที่ตั้งไว้ 96px ต่อ tile ตามที่ขอ)
TILE_PX = min(96, int(os.environ.get("DATAXTOWN_TILE_PX", str(BASE_TILE))))
TILE = TILE_PX
W = H = 32
STEM = {1:"scb_floor7_map", 2:"scb_floor7_map_spacious2x", 3:"scb_floor7_map_large3x"}[SPACE_SCALE]
DETAIL_SCALE = {1:1.0, 2:1.5, 3:2.0}[SPACE_SCALE] * (TILE_PX / BASE_TILE)

def Z(value):
    """Scale small props less than the room geometry to retain extra breathing room."""
    return max(1, round(value * DETAIL_SCALE))

P = {
    "void": "#171b2c", "outline": "#26324a", "wall": "#e9d7b0",
    "wall_hi": "#fff0cf", "corridor": "#c8b58c", "floor": "#f0e8d8",
    "floor_alt": "#e9ddc4", "carpet": "#d895bd", "meeting": "#dcb66f",
    "room": "#31566d", "room_hi": "#47788a", "core": "#586274",
    "core_hi": "#737e8d", "desk": "#795b46", "desk_hi": "#b4845c",
    "chair": "#26324a",
    "glass": "#77b9b4", "accent": "#e7b94f", "white": "#fff6dc",
    "shadow": "#394158", "booth": "#9867a8", "water": "#65a9c2",
    "wood": "#8b563f", "wood_dark": "#5b3a32",
    "rug_gold": "#e6c56a", "book_red": "#b84d5a", "floor_line": "#ddd3c1",
    "fabric": "#d97a55", "fabric_hi": "#f0a06b", "metal": "#9aa6ad",
    "screen_hi": "#b9ecdf", "paper": "#f7e7ba",
}

# เติมเฉดมืด/สว่างให้วัสดุหลักที่ใช้พื้นที่ใหญ่ (พื้น/ผนัง/เฟอร์นิเจอร์) สำหรับแรเงาแบบไล่โทน
# (gradient_dither) แทนสีแบนราบเดียว — ยกระดับความละเอียดแบบ GBA/DS-era โดยไม่แตะโครงเฟอร์นิเจอร์เดิม
# ramp() ไล่โทนแบบ hue-shift จริง (เงาเอียงไปน้ำเงิน, ไฮไลต์เอียงไปเหลือง) ไม่ใช่แค่ปรับความสว่าง
# setdefault กัน "_hi" ที่ตั้งมือไว้แล้ว (room_hi, core_hi, desk_hi, ...) ไม่โดนทับ
_TONE_BASES = ["floor","wall","meeting","room","desk","wood_dark","core",
               "booth","corridor","fabric","glass","carpet","wood"]
for _key in _TONE_BASES:
    _lo, _mid, _hi = ramp(P[_key], steps=3, dark=0.22, light=0.30)
    P.setdefault(f"{_key}_lo", _lo)
    P.setdefault(f"{_key}_hi", _hi)

s = Sprite(W*TILE, H*TILE, palette=list(P.values()))

def shaded_box(x0, y0, x1, y1, key, light_from="top"):
    """3-tone gradient-dithered fill (dark->base->light) — the base shading primitive
    for floors/walls/furniture bodies, replacing a flat s.rect() fill of P[key]."""
    lo, hi = P.get(f"{key}_lo", P[key]), P.get(f"{key}_hi", P[key])
    vertical = light_from in ("top", "bottom")
    colors = [lo, P[key], hi] if light_from in ("top", "left") else [hi, P[key], lo]
    s.gradient_dither(x0, y0, x1, y1, colors, axis="v" if vertical else "h")

# ย้อนจากสี -> ชื่อคีย์ใน P เพื่อให้ R() รู้ว่าเติมเฉด (_lo/_hi) ได้ไหมโดยไม่ต้องแก้ทุกจุดที่เรียก R()
_COLOR_TO_KEY = {v: k for k, v in P.items()}

def R(tx0, ty0, tx1, ty1, c, border=None):
    x0, y0, x1, y1 = tx0*TILE, ty0*TILE, (tx1+1)*TILE-1, (ty1+1)*TILE-1
    key = _COLOR_TO_KEY.get(c)
    shadeable = key and f"{key}_lo" in P
    if border:
        s.rect(x0, y0, x1, y1, border)
        if shadeable:
            shaded_box(x0+2, y0+2, x1-2, y1-2, key)
        else:
            s.rect(x0+2, y0+2, x1-2, y1-2, c)
    elif shadeable:
        shaded_box(x0, y0, x1, y1, key)
    else:
        s.rect(x0, y0, x1, y1, c)

def desk(tx, ty, horizontal=True):
    x, y = tx*TILE, ty*TILE
    if horizontal:
        w,h=Z(14),Z(7); x0=x+(TILE-w)//2; y0=y+(TILE-h)//2-Z(2)
        s.rect(x0,y0,x0+w-1,y0+h-1,P["desk"])
        s.line(x0+Z(1),y0,x0+w-Z(2),y0,P["desk_hi"])
        # One monitor per seat: dark bezel, blue screen, short centered stand.
        mw,mh=Z(7),Z(4); mx=x+(TILE-mw)//2; my=y0-Z(3)
        s.rect(mx,my,mx+mw-1,my+mh-1,P["outline"])
        s.rect(mx+Z(1),my+Z(1),mx+mw-Z(2),my+mh-Z(2),P["glass"])
        s.rect(x+(TILE-Z(2))//2,my+mh,x+(TILE+Z(2))//2-1,my+mh+Z(2),P["outline"])
        cw,ch=Z(4),Z(3); cx=x+(TILE-cw)//2
        s.rect(cx,y0+h+Z(2),cx+cw-1,y0+h+Z(2)+ch-1,P["chair"])
    else:
        w,h=Z(7),Z(14); x0=x+(TILE-w)//2-Z(2); y0=y+(TILE-h)//2
        s.rect(x0,y0,x0+w-1,y0+h-1,P["desk"])
        s.line(x0,y0+Z(1),x0,y0+h-Z(2),P["desk_hi"])
        cw,ch=Z(3),Z(4)
        s.rect(x0+w+Z(2),y+(TILE-ch)//2,x0+w+Z(2)+cw-1,y+(TILE-ch)//2+ch-1,P["chair"])

def monitor_bank(tx, ty, seats=4, width_tiles=2.55):
    """Shared bench matching the user's reference: one long desk, four monitors/seats."""
    x, y = int(tx*TILE), int(ty*TILE)
    width, depth = int(width_tiles*TILE), Z(10)
    # Cable/power points above the shared desktop.
    for i in range(seats):
        cx = x + round((i+0.5)*width/seats)
        s.rect(cx-Z(3),y-Z(10),cx+Z(3),y-Z(5),P["outline"])
    # Contact shadow and a deep three-quarter bench keep this in the same scale as characters.
    s.rect(x+Z(2),y+depth+Z(10),x+width+Z(2),y+depth+Z(13),P["shadow"])
    s.rect(x,y,x+width-1,y+depth-1,P["desk"])
    s.line(x+Z(2),y,x+width-Z(3),y,P["desk_hi"])
    s.rect(x+Z(2),y+depth,x+width-Z(3),y+depth+Z(3),P["wood_dark"])
    for i in range(seats):
        cx = x + round((i+0.5)*width/seats)
        mw,mh=Z(10),Z(7); mx=cx-mw//2; my=y+Z(2)
        s.rect(mx,my,mx+mw-1,my+mh-1,P["outline"])
        s.rect(mx+Z(1),my+Z(1),mx+mw-Z(2),my+mh-Z(2),P["glass"])
        s.line(mx+Z(2),my+Z(2),mx+mw-Z(3),my+Z(2),P["screen_hi"])
        s.rect(cx-Z(1),my+mh,cx+Z(1),my+mh+Z(2),P["outline"])
        # Four chairs form a clean lower row, one aligned with each screen.
        cw,ch=Z(10),Z(8)
        s.rect(cx-cw//2,y+depth+Z(5),cx+cw//2,y+depth+Z(5)+ch-1,P["chair"])
        s.rect(cx-cw//2+Z(2),y+depth+Z(5),cx+cw//2-Z(2),y+depth+Z(9),P["core_hi"])
        # Keyboard and one personal prop per seat make the bank feel occupied.
        s.rect(cx-Z(3),y+Z(1),cx+Z(3),y+Z(2),P["metal"])
        if i % 2 == 0: s.rect(cx+Z(5),y+Z(1),cx+Z(7),y+Z(4),P["accent"])

def plant(tx, ty):
    x, y = tx*TILE, ty*TILE
    cw=Z(8); ch=Z(8); x0=x+(TILE-cw)//2; y0=y+(TILE-Z(12))//2
    s.rect(x0+Z(2),y0+Z(7),x0+cw-Z(2),y0+Z(12),P["desk"])
    s.rect(x0,y0+Z(1),x0+cw-1,y0+ch,P["plant"])
    s.rect(x0+Z(1),y0,x0+Z(4),y0+Z(4),P["plant_hi"])

def table(tx0, ty0, tx1, ty1):
    R(tx0, ty0, tx1, ty1, P["desk"], P["shadow"])
    s.line(tx0*TILE+4, ty0*TILE+3, (tx1+1)*TILE-5, ty0*TILE+3, P["desk_hi"])

def floor_grid(tx0,ty0,tx1,ty1):
    """Quiet tile seams for large white floors; low contrast keeps paths readable."""
    x0,y0,x1,y1=tx0*TILE,ty0*TILE,(tx1+1)*TILE-1,(ty1+1)*TILE-1
    for tx in range(tx0+2,tx1+1,2): s.line(tx*TILE,y0+2,tx*TILE,y1-2,P["floor_line"])
    for ty in range(ty0+2,ty1+1,2): s.line(x0+2,ty*TILE,x1-2,ty*TILE,P["floor_line"])

def parquet(tx0,ty0,tx1,ty1):
    """Very quiet navigation flooring; the lift must not dominate the activity zones."""
    x0,y0,x1,y1=tx0*TILE,ty0*TILE,(tx1+1)*TILE-1,(ty1+1)*TILE-1
    step=TILE
    for y in range(y0+step,y1,step): s.line(x0+2,y,x1-2,y,P["floor_line"])
    row=0
    for y in range(y0,y1,step):
        offset=(step//2) if row%2 else 0
        for x in range(x0+offset,x1,step*2): s.line(x,y+2,x,min(y+step-2,y1),P["floor_line"])
        row+=1

def plaid_rug(tx0,ty0,tx1,ty1):
    x0,y0,x1,y1=map(int,(tx0*TILE,ty0*TILE,tx1*TILE,ty1*TILE))
    s.rect(x0,y0,x1,y1,P["wood_dark"])
    s.rect(x0+Z(3),y0+Z(3),x1-Z(3),y1-Z(3),P["rug_red"])
    gap=max(Z(18),12)
    for x in range(x0+gap,x1,gap): s.rect(x-Z(2),y0+Z(3),x+Z(2),y1-Z(3),P["rug_gold"])
    for y in range(y0+gap,y1,gap): s.rect(x0+Z(3),y-Z(2),x1-Z(3),y+Z(2),P["rug_gold"])

def window_panel(tx,ty,width_tiles):
    x,y=int(tx*TILE),int(ty*TILE); w=int(width_tiles*TILE)
    s.rect(x,y,x+w,y+Z(12),P["wood_dark"])
    s.rect(x+Z(3),y+Z(3),x+w//2-Z(2),y+Z(9),P["water"])
    s.rect(x+w//2+Z(2),y+Z(3),x+w-Z(3),y+Z(9),P["water"])

def bookshelf(tx,ty,width_tiles=1.3):
    x,y=int(tx*TILE),int(ty*TILE); w=int(width_tiles*TILE)
    s.rect(x,y,x+w,y+Z(18),P["wood_dark"])
    s.rect(x+Z(3),y+Z(3),x+w-Z(3),y+Z(8),P["desk"])
    colors=[P["rug_gold"],P["book_red"],P["water"],P["wall_hi"]]
    bw=max(2,Z(3)); bx=x+Z(5)
    for i in range(7):
        s.rect(bx+i*bw,y+Z(4),bx+i*bw+bw-1,y+Z(8),colors[i%len(colors)])

def tv_console(tx,ty,width_tiles=1.8):
    x,y=int(tx*TILE),int(ty*TILE); w=int(width_tiles*TILE)
    s.rect(x,y,x+w,y+Z(18),P["wood_dark"])
    s.rect(x+Z(4),y+Z(3),x+w-Z(4),y+Z(12),P["outline"])
    s.rect(x+Z(6),y+Z(5),x+w-Z(6),y+Z(10),P["void"])
    s.rect(x+Z(3),y+Z(14),x+w-Z(3),y+Z(17),P["desk"])
    # A few game cases/books in the lower shelf.
    for i,c in enumerate((P["rug_gold"],P["book_red"],P["water"],P["wall_hi"])):
        s.rect(x+Z(8+i*4),y+Z(15),x+Z(10+i*4),y+Z(17),c)

def sofa_horizontal(tx0,ty0,tx1,ty1):
    x0,y0,x1,y1=map(int,(tx0*TILE,ty0*TILE,tx1*TILE,ty1*TILE))
    s.rect(x0,y0,x1,y1,P["wood_dark"])
    s.rect(x0+Z(3),y0+Z(3),x1-Z(3),y1-Z(3),P["fabric"])
    # Seat/back bands and cushion divisions give it a furnished, not rug-like, silhouette.
    s.rect(x0+Z(5),y0+Z(4),x1-Z(5),y0+Z(10),P["fabric_hi"])
    for x in range(x0+(x1-x0)//4,x1,Z(18)):
        s.line(x,y0+Z(4),x,y1-Z(4),P["desk_hi"])
    s.rect(x0+Z(2),y0+Z(2),x0+Z(6),y1-Z(2),P["desk"])
    s.rect(x1-Z(6),y0+Z(2),x1-Z(2),y1-Z(2),P["desk"])
    s.rect(x0+Z(4),y1-Z(2),x1-Z(4),y1+Z(3),P["shadow"])

def glass_table(tx0,ty0,tx1,ty1):
    x0,y0,x1,y1=map(int,(tx0*TILE,ty0*TILE,tx1*TILE,ty1*TILE))
    s.rect(x0,y0,x1,y1,P["outline"])
    s.rect(x0+Z(3),y0+Z(3),x1-Z(3),y1-Z(3),P["water"])
    s.rect(x0+Z(6),y0+Z(6),x1-Z(6),y1-Z(6),P["wall_hi"])
    s.line(x0+Z(5),y0+Z(5),x1-Z(5),y0+Z(5),P["white"])

def wall_picture(tx,ty,width_tiles=1.0,height_tiles=.55):
    x,y=int(tx*TILE),int(ty*TILE); w,h=int(width_tiles*TILE),int(height_tiles*TILE)
    s.rect(x,y,x+w,y+h,P["wood_dark"])
    s.rect(x+Z(3),y+Z(3),x+w-Z(3),y+h-Z(3),P["wall_hi"])
    s.polygon([(x+Z(6),y+h-Z(5)),(x+w//2,y+Z(6)),(x+w-Z(6),y+h-Z(5))],P["water"])

def cabinet(tx,ty,width_tiles=.8,height_tiles=1.2):
    x,y=int(tx*TILE),int(ty*TILE); w,h=int(width_tiles*TILE),int(height_tiles*TILE)
    s.rect(x,y,x+w,y+h,P["wood_dark"])
    s.rect(x+Z(3),y+Z(3),x+w-Z(3),y+h-Z(3),P["desk"])
    for yy in (y+h//3,y+2*h//3): s.line(x+Z(4),yy,x+w-Z(4),yy,P["desk_hi"])
    s.rect(x+w-Z(7),y+h//2,x+w-Z(4),y+h//2+Z(2),P["rug_gold"])

def armchair(tx,ty,color="fabric"):
    x,y=int(tx*TILE),int(ty*TILE); w,h=Z(22),Z(18)
    s.rect(x+Z(3),y+h,x+w+Z(3),y+h+Z(4),P["shadow"])
    s.rect(x,y+Z(3),x+w,y+h,P["wood_dark"])
    s.rect(x+Z(3),y,x+w-Z(3),y+Z(11),P[color])
    s.rect(x+Z(5),y+Z(2),x+w-Z(5),y+Z(6),P["fabric_hi"])
    s.rect(x+Z(3),y+Z(11),x+w-Z(3),y+h-Z(3),P[color])

def floor_lamp(tx,ty):
    x,y=int(tx*TILE),int(ty*TILE)
    s.rect(x+Z(8),y+Z(20),x+Z(18),y+Z(23),P["shadow"])
    s.rect(x+Z(12),y+Z(7),x+Z(14),y+Z(20),P["metal"])
    s.polygon([(x+Z(5),y+Z(8)),(x+Z(21),y+Z(8)),(x+Z(18),y),(x+Z(8),y)],P["accent"])
    s.line(x+Z(8),y+Z(2),x+Z(18),y+Z(2),P["paper"])

def meeting_table(tx0,ty0,tx1,ty1,seats=6,door_aisle=False):
    x0,y0,x1,y1=map(int,(tx0*TILE,ty0*TILE,tx1*TILE,ty1*TILE))
    s.rect(x0+Z(5),y0+Z(8),x1+Z(5),y1+Z(8),P["shadow"])
    s.rect(x0,y0,x1,y1,P["wood_dark"]); s.rect(x0+Z(3),y0+Z(3),x1-Z(3),y1-Z(5),P["desk"])
    s.line(x0+Z(5),y0+Z(4),x1-Z(5),y0+Z(4),P["desk_hi"])
    for i in range(seats//2):
        cx=x0+round((i+.5)*(x1-x0)/(seats//2))
        chair_rows = (y0-Z(11),y1+Z(5))
        for row_index,yy in enumerate(chair_rows):
            # In rooms entered from the south, omit the lower centre chair so
            # the door axis remains a full character-wide visual aisle.
            if door_aisle and row_index == 1 and i == (seats//2)//2:
                continue
            s.rect(cx-Z(5),yy,cx+Z(5),yy+Z(7),P["chair"])
            s.rect(cx-Z(3),yy+Z(1),cx+Z(3),yy+Z(3),P["core_hi"])
    if door_aisle:
        # Sixth seat moves to the west head of the table: 3 north + 2 south + 1 head.
        hx=x0-Z(11); hy=(y0+y1)//2-Z(5)
        s.rect(hx,hy,hx+Z(7),hy+Z(10),P["chair"])
        s.rect(hx+Z(1),hy+Z(2),hx+Z(3),hy+Z(8),P["core_hi"])
    # Shared papers and video console.
    s.rect((x0+x1)//2-Z(5),y0+Z(6),(x0+x1)//2+Z(5),y0+Z(11),P["paper"])

def north_meeting_table(tx0=13.65,ty0=3.72,tx1=16.35,ty1=4.16):
    """Six-seat compact table with no furniture on its south/door side.

    Its lowest pixel is deliberately <= y221 in Large3x, reserving a measured
    48px clear-floor band before the north-room doorway jamb at y270.
    """
    x0,y0,x1,y1=map(int,(tx0*TILE,ty0*TILE,tx1*TILE,ty1*TILE))
    s.rect(x0+Z(4),y0+Z(8),x1+Z(4),y1+Z(8),P["shadow"])
    s.rect(x0,y0,x1,y1,P["wood_dark"])
    s.rect(x0+Z(3),y0+Z(3),x1-Z(3),y1-Z(3),P["desk"])
    s.line(x0+Z(5),y0+Z(4),x1-Z(5),y0+Z(4),P["desk_hi"])
    # Three presentation-facing seats on the north side.
    for i in range(3):
        cx=x0+round((i+.5)*(x1-x0)/3); yy=y0-Z(11)
        s.rect(cx-Z(5),yy,cx+Z(5),yy+Z(7),P["chair"])
        s.rect(cx-Z(3),yy+Z(1),cx+Z(3),yy+Z(3),P["core_hi"])
    # Three side/head seats stay outside the centered south-door corridor.
    side_seats=((x0-Z(11),y0-Z(2)),(x0-Z(11),y1-Z(7)),(x1+Z(4),y0+Z(2)))
    for sx,sy in side_seats:
        s.rect(sx,sy,sx+Z(7),sy+Z(10),P["chair"])
        s.rect(sx+Z(1),sy+Z(2),sx+Z(3),sy+Z(8),P["core_hi"])
    s.rect((x0+x1)//2-Z(5),y0+Z(6),(x0+x1)//2+Z(5),y0+Z(11),P["paper"])

def whiteboard(tx,ty,width_tiles=2.2):
    x,y=int(tx*TILE),int(ty*TILE); w=int(width_tiles*TILE)
    s.rect(x+Z(3),y+Z(3),x+w+Z(3),y+Z(20),P["shadow"])
    s.rect(x,y,x+w,y+Z(18),P["metal"]); s.rect(x+Z(3),y+Z(3),x+w-Z(3),y+Z(14),P["white"])
    for i,c in enumerate((P["book_red"],P["accent"],P["water"],P["fabric"])):
        s.rect(x+Z(7+i*8),y+Z(6+(i%2)*4),x+Z(12+i*8),y+Z(10+(i%2)*4),c)

def stage_screen(tx,ty,width_tiles=5.5):
    x,y=int(tx*TILE),int(ty*TILE); w=int(width_tiles*TILE)
    s.rect(x+Z(5),y+Z(5),x+w+Z(5),y+Z(35),P["shadow"])
    s.rect(x,y,x+w,y+Z(31),P["outline"]); s.rect(x+Z(5),y+Z(5),x+w-Z(5),y+Z(24),P["glass"])
    s.polygon([(x+Z(15),y+Z(20)),(x+Z(30),y+Z(9)),(x+Z(43),y+Z(18)),(x+Z(60),y+Z(7)),(x+w-Z(12),y+Z(20))],P["screen_hi"])
    s.rect(x+w//2-Z(8),y+Z(31),x+w//2+Z(8),y+Z(36),P["metal"])

def acoustic_panel(tx,ty,color="booth"):
    x,y=int(tx*TILE),int(ty*TILE); w,h=Z(16),Z(28)
    s.rect(x,y,x+w,y+h,P["wood_dark"]); s.rect(x+Z(3),y+Z(3),x+w-Z(3),y+h-Z(3),P[color])
    for yy in range(y+Z(7),y+h-Z(3),Z(7)): s.line(x+Z(4),yy,x+w-Z(4),yy,P["room_hi"])

def executive_desk(tx,ty,width_tiles=1.65,show_chair=True):
    """Compact three-quarter executive desk with a readable monitor and guest side."""
    x,y=int(tx*TILE),int(ty*TILE); w=int(width_tiles*TILE)
    s.rect(x+Z(5),y+Z(17),x+w+Z(5),y+Z(25),P["shadow"])
    s.rect(x,y+Z(7),x+w,y+Z(21),P["wood_dark"])
    s.rect(x+Z(3),y+Z(7),x+w-Z(3),y+Z(15),P["desk"])
    s.line(x+Z(5),y+Z(9),x+w-Z(5),y+Z(9),P["desk_hi"])
    # Screen, keyboard, desk paper and executive chair.
    s.rect(x+Z(8),y,x+Z(31),y+Z(12),P["outline"])
    s.rect(x+Z(11),y+Z(3),x+Z(28),y+Z(8),P["screen_hi"])
    s.rect(x+Z(16),y+Z(12),x+Z(23),y+Z(15),P["metal"])
    s.rect(x+Z(35),y+Z(10),x+Z(49),y+Z(14),P["paper"])
    if show_chair:
        s.rect(x+w//2-Z(7),y+Z(24),x+w//2+Z(7),y+Z(32),P["chair"])

def guest_chairs(tx,ty,gap=.62):
    for dx in (0,gap):
        x,y=int((tx+dx)*TILE),int(ty*TILE)
        s.rect(x,y+Z(4),x+Z(16),y+Z(16),P["wood_dark"])
        s.rect(x+Z(3),y,x+Z(13),y+Z(10),P["fabric"])
        s.rect(x+Z(4),y+Z(11),x+Z(12),y+Z(16),P["fabric_hi"])

def data_dashboard(tx,ty,width_tiles=2.65):
    """Three-panel wall dashboard: chart clusters distinguish the CDO office."""
    x,y=int(tx*TILE),int(ty*TILE); w=int(width_tiles*TILE); gap=Z(3)
    panel=(w-2*gap)//3
    for i in range(3):
        px=x+i*(panel+gap)
        s.rect(px+Z(3),y+Z(3),px+panel+Z(3),y+Z(25),P["shadow"])
        s.rect(px,y,px+panel,y+Z(22),P["outline"])
        s.rect(px+Z(3),y+Z(3),px+panel-Z(3),y+Z(19),P["glass"])
        if i == 0:
            for n,bh in enumerate((5,10,7,14)):
                s.rect(px+Z(6+n*7),y+Z(17-bh),px+Z(10+n*7),y+Z(17),P["screen_hi"])
        elif i == 1:
            s.line(px+Z(5),y+Z(15),px+Z(13),y+Z(10),P["accent"])
            s.line(px+Z(13),y+Z(10),px+Z(21),y+Z(13),P["accent"])
            s.line(px+Z(21),y+Z(13),px+panel-Z(5),y+Z(5),P["accent"])
        else:
            for n in range(3):
                s.rect(px+Z(6),y+Z(5+n*5),px+panel-Z(6+n*4),y+Z(7+n*5),P["water"])

def server_rack(tx,ty,height_tiles=1.55):
    x,y=int(tx*TILE),int(ty*TILE); w,h=Z(25),int(height_tiles*TILE)
    s.rect(x+Z(4),y+Z(4),x+w+Z(4),y+h+Z(4),P["shadow"])
    s.rect(x,y,x+w,y+h,P["outline"]); s.rect(x+Z(3),y+Z(3),x+w-Z(3),y+h-Z(3),P["core"])
    for yy in range(y+Z(8),y+h-Z(5),Z(12)):
        s.rect(x+Z(6),yy,x+w-Z(6),yy+Z(6),P["core_hi"])
        s.rect(x+Z(8),yy+Z(2),x+Z(11),yy+Z(4),P["water"])
        s.rect(x+Z(14),yy+Z(2),x+Z(17),yy+Z(4),P["accent"])

def refrigerator(tx,ty):
    x,y=int(tx*TILE),int(ty*TILE); w,h=Z(27),Z(54)
    s.rect(x+Z(4),y+Z(5),x+w+Z(4),y+h+Z(5),P["shadow"])
    s.rect(x,y,x+w,y+h,P["metal"]); s.rect(x+Z(3),y+Z(3),x+w-Z(3),y+h-Z(3),P["wall_hi"])
    s.line(x+Z(3),y+Z(21),x+w-Z(3),y+Z(21),P["outline"])
    s.rect(x+w-Z(8),y+Z(8),x+w-Z(5),y+Z(17),P["core"])
    s.rect(x+w-Z(8),y+Z(28),x+w-Z(5),y+Z(40),P["core"])

def water_dispenser(tx,ty):
    x,y=int(tx*TILE),int(ty*TILE)
    s.rect(x+Z(4),y+Z(20),x+Z(24),y+Z(50),P["metal"])
    s.rect(x+Z(7),y+Z(24),x+Z(21),y+Z(36),P["core"])
    s.rect(x+Z(11),y+Z(28),x+Z(14),y+Z(31),P["water"])
    s.rect(x+Z(7),y,x+Z(21),y+Z(22),P["glass"])
    s.rect(x+Z(10),y+Z(3),x+Z(18),y+Z(16),P["screen_hi"])

def finance_dashboard(tx,ty,width_tiles=2.6):
    x,y=int(tx*TILE),int(ty*TILE); w=int(width_tiles*TILE)
    s.rect(x+Z(4),y+Z(4),x+w+Z(4),y+Z(30),P["shadow"])
    s.rect(x,y,x+w,y+Z(27),P["outline"]); s.rect(x+Z(4),y+Z(4),x+w-Z(4),y+Z(23),P["white"])
    # Gold bars and a rising cash-flow line distinguish Finance from CDO analytics.
    for i,bh in enumerate((6,11,8,16,13)):
        bx=x+Z(9+i*12); s.rect(bx,y+Z(20-bh),bx+Z(7),y+Z(20),P["accent"])
    s.line(x+Z(7),y+Z(17),x+Z(25),y+Z(12),P["book_red"])
    s.line(x+Z(25),y+Z(12),x+Z(43),y+Z(15),P["book_red"])
    s.line(x+Z(43),y+Z(15),x+w-Z(8),y+Z(7),P["book_red"])

def podium(tx, ty):
    """Small lectern for the playback stage — same wood_dark/desk/accent grammar as cabinet()."""
    x, y = int(tx*TILE), int(ty*TILE)
    w, h = Z(14), Z(20)
    s.rect(x+Z(2), y+h, x+w+Z(2), y+h+Z(4), P["shadow"])
    s.rect(x, y, x+w, y+h, P["wood_dark"])
    s.rect(x+Z(2), y+Z(2), x+w-Z(2), y+h-Z(6), P["desk"])
    s.rect(x+Z(4), y+Z(5), x+w-Z(4), y+Z(9), P["accent"])

def bleacher_tier(x0t, x1t, ty):
    """One bleacher row: shadow, riser, tread, cushion, cushion highlight, seat-divider ticks."""
    x0, x1, y = int(x0t*TILE), int(x1t*TILE), int(ty*TILE)
    s.rect(x0+Z(3), y+Z(20), x1+Z(3), y+Z(24), P["shadow"])
    s.rect(x0, y+Z(4), x1, y+Z(20), P["wood_dark"])
    s.rect(x0+Z(2), y+Z(7), x1-Z(2), y+Z(17), P["desk"])
    s.rect(x0+Z(3), y, x1-Z(3), y+Z(9), P["fabric"])
    s.rect(x0+Z(5), y+Z(1), x1-Z(5), y+Z(4), P["fabric_hi"])
    for cx in range(x0+Z(16), x1-Z(4), Z(18)):
        s.line(cx, y+Z(1), cx, y+Z(8), P["desk_hi"])

def playback_bleachers():
    """Three amphitheater tiers facing the stage screen, split by a center aisle
    (x15-17) so spawn 'north_lounge' [16,9] and the CEO home tile [15,8] stay clear,
    and the room keeps a straight walk-through from the corridor to the stage."""
    for ty in (7.65, 8.35, 9.05):
        for x0t, x1t in ((11.0, 15.0), (17.0, 21.0)):
            bleacher_tier(x0t, x1t, ty)

def west_open_bleachers():
    """Two wide bleacher tiers for the relocated bottom-left open space — one solid
    block (no aisle needed here, unlike the stage) facing the datax_sign above it."""
    for ty in (27.15, 27.9):
        bleacher_tier(2.35, 8.9, ty)

def datax_sign(tx, ty, width_tiles, compact=False):
    """DATAX wordmark sign — same screen-shell grammar as stage_screen(), with real
    rendered text (PIL) instead of the mountain-silhouette graphic."""
    x, y = int(tx*TILE), int(ty*TILE); w = int(width_tiles*TILE)
    hh = Z(16) if compact else Z(26)
    s.rect(x+Z(3), y+Z(3), x+w+Z(3), y+hh+Z(3), P["shadow"])
    s.rect(x, y, x+w, y+hh, P["outline"])
    s.rect(x+Z(3), y+Z(3), x+w-Z(3), y+hh-Z(3), P["glass"])
    img = s._img()
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("arialbd.ttf", Z(11) if compact else Z(16))
    except Exception:
        font = ImageFont.load_default()
    text = "DATAX"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2]-bbox[0], bbox[3]-bbox[1]
    tx_px = x + (w - tw)//2 - bbox[0]
    ty_px = y + (hh - th)//2 - bbox[1]
    draw.text((tx_px, ty_px), text, font=font, fill=P["booth"])

def stepped_seating():
    """Three staggered lounge tiers with a clear north entry and east aisle."""
    tiers=((2.45,25.75,4.15),(2.70,26.65,3.75),(2.95,27.55,3.35))
    for tx,ty,width in tiers:
        x,y=int(tx*TILE),int(ty*TILE); w=int(width*TILE)
        # Contact shadow, dark riser, warm front face, cushion and top highlight.
        s.rect(x+Z(6),y+Z(28),x+w+Z(6),y+Z(36),P["shadow"])
        s.rect(x,y+Z(10),x+w,y+Z(30),P["wood_dark"])
        s.rect(x+Z(3),y+Z(13),x+w-Z(3),y+Z(27),P["desk"])
        s.rect(x+Z(5),y,x+w-Z(5),y+Z(15),P["fabric"])
        s.rect(x+Z(8),y+Z(3),x+w-Z(8),y+Z(7),P["fabric_hi"])
        for cx in range(x+Z(35),x+w-Z(20),Z(38)):
            s.line(cx,y+Z(3),cx,y+Z(14),P["desk_hi"])

# Tapered building shell: narrow north edge, long diagonal wings, broad south base.
# This preserves the distinctive triangular footprint of the reference plan.
shell = [(10*TILE,1*TILE),(21*TILE,1*TILE),(31*TILE,27*TILE),
         (27*TILE,30*TILE),(4*TILE,30*TILE),(0*TILE,27*TILE)]
s.rect(0, 0, W*TILE-1, H*TILE-1, P["void"])
s.polygon(shell, P["outline"])
inner = [(10*TILE,2*TILE),(21*TILE,2*TILE),(30*TILE,27*TILE),
         (27*TILE,29*TILE),(4*TILE,29*TILE),(1*TILE,27*TILE)]
s.polygon(inner, P["floor"] if SPACE_SCALE == 3 else P["corridor"])
# In Large3x, tan flooring is intentionally confined to the lift precinct only.
# The user's red annotation is a guide; no red border is rendered.
if SPACE_SCALE == 3:
    R(10,10,20,21,P["corridor"])
    parquet(10,10,20,21)

# Office wings. Large3x corrects the east wing by one tile so both floor polygons
# mirror exactly around the footprint axis x=15.5.
R(2,7,8,20,P["floor"],P["wall"])
if SPACE_SCALE == 3:
    R(22,7,28,20,P["floor"],P["wall"])
    floor_grid(2,7,8,20); floor_grid(22,7,28,20)
else:
    R(23,7,29,20,P["floor"],P["wall"])
# Large trial doubles capacity to 32 workstations: 8 rows x 4 seats.
# Fractional tile positions use the extra 48px cells while retaining generous gaps.
if SPACE_SCALE == 3:
    west_bank_rows = [11.3,13.6,15.9,18.2]
    east_bank_rows = [8.0,9.7,16.4,17.9,19.4,20.9,22.4]
    bank_width_tiles = 2.55
    bank_left_x = 6.15
    # The footprint vertices are centered on tile axis 15.5, so spans mirror via 31-x-width.
    bank_right_x = (W-1) - bank_left_x - bank_width_tiles
    desk_rows = {}  # individual desks are replaced by shared 4-seat benches
    bank_specs=[]
    for y in west_bank_rows:
        monitor_bank(bank_left_x,y)
        bank_specs.append(("west",bank_left_x,y,2.55))
    east_specs=[(22.0,8.0,1.72),(22.0,9.7,2.08)] + [(bank_right_x,y,2.55) for y in east_bank_rows[2:]]
    for x,y,width_tiles in east_specs:
        monitor_bank(x,y,width_tiles=width_tiles)
        bank_specs.append(("east",x,y,width_tiles))
else:
    desk_rows = {11:[7,8], 13:[7,8], 16:[7,8], 19:[7,8]}
for y, left_xs in desk_rows.items():
    for x in left_xs:
        desk(x,y)
        desk(31-x,y)

# Top collaboration rooms and play-back stage.
R(9,2,12,5,P["room"],P["wall"]); R(13,2,16,5,P["room"],P["wall"])
R(17,2,21,5,P["room"],P["wall"]); R(22,2,25,6,P["floor_alt"],P["wall"])
if SPACE_SCALE == 3:
    # Every north room uses the same three-quarter grammar: dark back wall, lighter floor plane.
    for ax,bx in ((9,12),(13,16),(17,21)):
        s.rect(ax*TILE+Z(3),int(4.15*TILE),(bx+1)*TILE-Z(3),6*TILE-Z(3),P["room_hi"])
        s.line(ax*TILE+Z(3),int(4.15*TILE),(bx+1)*TILE-Z(3),int(4.15*TILE),P["wall_hi"])
    # Left: Chief Customer Officer. Warm consultation layout with two guest chairs,
    # customer/profile artwork and a restrained executive workstation.
    window_panel(9.35,2.35,2.8)
    # Keep the complete composition east of x10: the tapered facade masks all
    # content west of that safe line at this height.
    wall_picture(10.35,3.25,.72,.52); cabinet(11.90,3.25,.55,.72)
    # The desk chair is omitted here because its pedestal would fall directly
    # on the centered south-door axis; visitor seating remains off-axis.
    executive_desk(10.35,3.45,1.28,show_chair=False); guest_chairs(11.66,3.66,.46)
    # Centre: Chief Risk Officer (คุณ Manis). Risk-monitor dashboard and records
    # cabinet on the back wall, executive desk west of the centered door aisle
    # (x15) with visitor seating east of it — same grammar as the flanking offices.
    window_panel(13.35,2.35,2.3)
    finance_dashboard(13.45,3.25,1.65); cabinet(15.35,3.25,.55,.72)
    executive_desk(13.6,4.4,1.35); guest_chairs(15.7,4.7,.5)
    # Right: Chief Data Officer. Cool multi-panel analytics wall, executive desk,
    # technical library and one visitor chair form a distinct data-focused office.
    window_panel(17.35,2.35,3.3); data_dashboard(17.55,3.22,2.8)
    executive_desk(17.55,4.43,1.7); bookshelf(19.48,4.48,1.18)
    guest_chairs(20.05,4.76,.5)
# A wedge-shaped phone booth occupies the narrow upper-left facade pocket.
if SPACE_SCALE == 3:
    booth_outer=[(int(9.6*TILE),2*TILE),(10*TILE,2*TILE),(10*TILE,6*TILE),(int(7.8*TILE),6*TILE)]
    booth_inner=[(int(9.55*TILE),int(2.25*TILE)),(int(9.78*TILE),int(2.25*TILE)),
                 (int(9.78*TILE),int(5.72*TILE)),(int(8.08*TILE),int(5.72*TILE))]
    s.polygon(booth_outer,P["wall"]); s.polygon(booth_inner,P["booth"])
    # Glass door, phone console and a single stool.
    s.line(int(9.36*TILE),int(2.7*TILE),int(8.35*TILE),int(5.45*TILE),P["glass"])
    s.rect(int(8.55*TILE),int(4.45*TILE),int(9.15*TILE),int(4.72*TILE),P["desk"])
    s.rect(int(8.72*TILE),int(4.12*TILE),int(8.98*TILE),int(4.42*TILE),P["outline"])
    s.rect(int(8.7*TILE),int(5.05*TILE),int(9.02*TILE),int(5.36*TILE),P["chair"])
    # Clear doorway at the wide lower edge of the wedge.
    s.rect(int(8.5*TILE),int(5.76*TILE),int(9.18*TILE),6*TILE,P["floor"])
    s.line(int(8.48*TILE),int(5.72*TILE),int(8.48*TILE),6*TILE,P["outline"])
R(10,6,21,9,P["floor"],P["wall"])
if SPACE_SCALE == 3:
    floor_grid(10,6,21,9)
    # Two extra workstation banks — the presentation stage moved to the relocated
    # open space in the bottom-left; this floor becomes more desk capacity instead.
    monitor_bank(11.2,6.9,seats=5,width_tiles=4.3)
    monitor_bank(16.3,6.9,seats=5,width_tiles=4.3)
    bank_specs.append(("north",11.2,6.9,4.3))
    bank_specs.append(("north",16.3,6.9,4.3))
else:
    table(14,7,17,7)

# Central service core, lift lobby and entrance. The 3x trial uses a smaller
# lift block so the circulation ring around it is materially wider.
if SPACE_SCALE == 3:
    R(13,11,18,17,P["core"],P["wall"])
    R(13,13,14,16,P["core_hi"],P["outline"]); R(17,13,18,16,P["core_hi"],P["outline"])
    for x in (13,14,17,18): s.line(x*TILE,13*TILE,x*TILE,17*TILE-1,P["outline"])
    # Lift-door seams, metal highlights, indicators and call panels make the core architectural.
    for ax,bx in ((13,14),(17,18)):
        cx=int((ax+bx+1)*TILE/2)
        s.line(cx,13*TILE+Z(5),cx,17*TILE-Z(4),P["outline"])
        s.line(ax*TILE+Z(5),13*TILE+Z(5),ax*TILE+Z(5),17*TILE-Z(5),P["metal"])
        s.rect(cx-Z(5),13*TILE+Z(8),cx+Z(5),13*TILE+Z(13),P["outline"])
        s.rect(cx-Z(2),13*TILE+Z(10),cx+Z(2),13*TILE+Z(12),P["accent"])
    s.rect(int(15.15*TILE),int(14.15*TILE),int(15.42*TILE),int(14.75*TILE),P["outline"])
    s.rect(int(15.22*TILE),int(14.28*TILE),int(15.35*TILE),int(14.42*TILE),P["water"])
    # North and south lift lobbies create two explicit exits through the core.
    R(15,11,16,12,P["wall_hi"],P["wall"])
    R(15,17,16,19,P["wall_hi"],P["wall"])
    R(12,17,14,19,P["wall_hi"],P["wall"]); R(17,17,19,19,P["wall_hi"],P["wall"])
    # Upward chevrons identify the new north exit.
    for k in range(2):
        y=int((10.6-k*.45)*TILE); tip=int((10.25-k*.45)*TILE)
        s.line(int(15.35*TILE),y,16*TILE,tip,P["white"])
        s.line(int(16.65*TILE),y,16*TILE,tip,P["white"])
    # DATAX wordmark sign above the north lift entrance.
    datax_sign(13.25,9.1,5.5,compact=True)
else:
    R(10,10,21,19,P["core"],P["wall"])
    R(12,13,14,17,P["core_hi"],P["outline"]); R(17,13,19,17,P["core_hi"],P["outline"])
    for x in (12,14,17,19): s.line(x*TILE,13*TILE,x*TILE,18*TILE-1,P["outline"])
    R(14,18,17,20,P["wall_hi"],P["wall"])
    R(10,18,12,20,P["wall_hi"],P["wall"]); R(19,18,21,20,P["wall_hi"],P["wall"])
# Actual west/east lift portals cut through the core side walls at y15.
# They are separate thresholds, not a fake transverse corridor through solid lift art.
if SPACE_SCALE == 3:
    py=int(15.5*TILE); opening=TILE
    for px,inner_side in ((13*TILE,"right"),(19*TILE,"left")):
        s.rect(px-Z(5),py-opening//2,px+Z(5),py+opening//2-1,P["wall_hi"])
        jamb=px+Z(5) if inner_side=="right" else px-Z(5)
        s.line(jamb,py-opening//2,jamb,py+opening//2-1,P["outline"])
        s.line(px-Z(6),py+opening//2,px+Z(6),py+opening//2,P["shadow"])
    # Recognizable directional arrows outside the west/east portals.
    ay=int(15.5*TILE)
    s.polygon([(int(11.3*TILE),ay),(int(11.72*TILE),ay-Z(14)),(int(11.72*TILE),ay-Z(6)),
               (int(12.5*TILE),ay-Z(6)),(int(12.5*TILE),ay+Z(6)),
               (int(11.72*TILE),ay+Z(6)),(int(11.72*TILE),ay+Z(14))],P["white"])
    # East arrow mirrors the west one about the core axis: sits fully outside the
    # portal threshold (tail 19.5 -> tip 20.7) instead of overlapping it.
    s.polygon([(int(20.7*TILE),ay),(int(20.28*TILE),ay-Z(14)),(int(20.28*TILE),ay-Z(6)),
               (int(19.5*TILE),ay-Z(6)),(int(19.5*TILE),ay+Z(6)),
               (int(20.28*TILE),ay+Z(6)),(int(20.28*TILE),ay+Z(14))],P["white"])
    # South chevrons mark the preserved exit at tiles 15/16 -> 18.
    for k in range(2):
        sy=int((18.0+k*.42)*TILE)
        s.line(int(15.35*TILE),sy,int(16*TILE),sy+Z(14),P["white"])
        s.line(int(16.65*TILE),sy,int(16*TILE),sy+Z(14),P["white"])
    # DATAX wordmark sign below the south lift exit, above the entrance chevrons.
    datax_sign(13.25,19.75,5.5,compact=True)
# Entrance chevrons.
for k in range(3):
    y=(21+k)*TILE
    s.line(14*TILE,y,16*TILE,y+TILE,P["white"]); s.line(18*TILE,y,16*TILE,y+TILE,P["white"])

# Side feature rooms.
if SPACE_SCALE == 3:
    # CTO Technology room: compact server lab with a collaboration console.
    R(1,21,4,24,P["room"],P["wall"])
    server_rack(2.18,21.45,1.35)
    whiteboard(2.95,21.45,1.25); tv_console(2.15,23.45,1.65)
    # Stepped/sloped Open Space follows the lower-left facade rather than reading
    # as another closed rectangular room. Widened 1 tile east (was x2-8) into the
    # meeting suite's old space now that meeting_1..0 shifted right — this is now
    # the relocated presentation/town-hall spot (was the north Playback Stage).
    open_outer=[(2*TILE,25*TILE),(5*TILE,25*TILE),(int(5.55*TILE),int(25.35*TILE)),
                (9*TILE-1,int(25.35*TILE)),(9*TILE-1,29*TILE-1),(2*TILE,29*TILE-1)]
    s.polygon(open_outer,P["wall"])
    open_inner=[(2*TILE+Z(3),25*TILE+Z(3)),(5*TILE-Z(2),25*TILE+Z(3)),
                (int(5.55*TILE),int(25.35*TILE)+Z(3)),(9*TILE-Z(4),int(25.35*TILE)+Z(3)),
                (9*TILE-Z(4),29*TILE-Z(4)),(2*TILE+Z(3),29*TILE-Z(4))]
    s.polygon(open_inner,P["floor"])
    # DATAX sign + two bleacher tiers replace the old stepped lounge — this is now
    # the primary town-hall/demo-day gathering spot.
    datax_sign(3.6,25.55,4.5)
    west_open_bleachers()
    # North doorway aligns with the white circulation gap between the reduced room and breakout.
    s.rect(int(5.05*TILE),25*TILE,int(5.95*TILE),25*TILE+Z(4),P["floor"])
    s.rect(int(5.0*TILE),25*TILE,int(5.05*TILE),25*TILE+Z(8),P["outline"])
    s.rect(int(5.95*TILE),25*TILE,int(6.0*TILE),25*TILE+Z(8),P["outline"])
    # East layout follows the user's reference: two bench rows, CFO Finance,
    # then five lower bench rows. The old large east rooms are removed.
    R(22,11,27,15,P["room"],P["wall"])
    s.rect(int(22.25*TILE),int(12*TILE),int(27.55*TILE),int(15.55*TILE),P["wood"])
    window_panel(22.45,11.3,2.4); finance_dashboard(24.85,11.3,2.35)
    cabinet(26.65,12.35,.65,1.05)
    meeting_table(23.0,13.35,25.9,14.15,4)
    whiteboard(22.55,12.0,1.75)
    # (พรมชมพูข้าง core ถูกถอดออก — เคยอ่านเป็น "ห้องลับ" ที่ไม่มีป้าย/ฟังก์ชัน)
    # West-side collaboration mass balances the denser east workstation wing.
    # Note: the tapered facade clips anything west of ~x7 up here (boundary recedes
    # to x6.15 only by y11, where the first monitor bank already sits) — this sliver
    # is genuinely narrow, so add density rather than fighting the diagonal.
    wall_picture(7.65,8.0,.95,.55); cabinet(7.35,9.05,.8,1.0)
    bookshelf(7.35,10.15,.8)
    tv_console(5.0,20.15,1.8)
else:
    R(1,21,6,24,P["room"],P["wall"]); R(2,25,7,28,P["room"],P["wall"])
# Pantry occupies the west mid-zone with explicit appliances and a small counter.
R(7,20,9,24,P["meeting"],P["wall"])
if SPACE_SCALE == 3:
    refrigerator(7.25,20.45); water_dispenser(8.22,20.55)
    cabinet(7.25,22.25,1.85,.75); glass_table(7.55,23.45,9.15,24.05)
    # หมายเหตุ: ตู้กาชาปองไม่ได้วาดลงแผนที่ตรงนี้ — มันเป็น sprite แยก (assets/gacha_machine.png)
    # ที่ render.js/gacha.js วาดสดตามตำแหน่ง GACHA_X/GACHA_Y เอง (ดู gacha_data.js)
if SPACE_SCALE != 3:
    R(22,20,24,24,P["carpet"],P["wall"]); R(25,21,30,24,P["room"],P["wall"])

# Bottom meeting suite and phone booths. Shifted +1 tile east (was x8-28) to give
# the relocated open space one more tile of width on its east edge.
R(9,25,12,28,P["meeting"],P["wall"]); R(13,25,17,28,P["meeting"],P["wall"])
R(18,25,21,28,P["meeting"],P["wall"]); R(22,25,24,28,P["meeting"],P["wall"])
R(25,25,26,26,P["booth"],P["wall"]); R(25,27,26,28,P["booth"],P["wall"])
R(27,25,28,28,P["meeting"],P["wall"]); R(29,25,29,28,P["meeting"],P["wall"])
if SPACE_SCALE == 3:
    window_panel(9.35,25.35,2.3); bookshelf(22.3,27.8,1.25)
    wall_picture(9.55,25.35,.95,.5); wall_picture(13.4,25.35,1.15,.5)
    wall_picture(18.3,25.35,1.3,.5); wall_picture(22.3,25.35,.95,.5)
    # Two former dead-end rooms east of the phone booths get real purposes + wall decor.
    cabinet(27.3,25.5,.75,1.4); bookshelf(28.0,25.5,.85)
    meeting_table(27.3,27.15,28.7,27.7,2)
    # แทน server_rack เดิม — สีสัน/จุดไฟกะพริบมันดันคล้ายตู้กาชาปองเกินไป เลยเปลี่ยนเป็นตู้เก็บของ
    # ธรรมดา (โทนไม้ ไม่มีจุดสีสด) ให้ห้องนี้อ่านชัดว่าเป็นห้องเก็บอุปกรณ์ ไม่ใช่ตู้สุ่มไอเทมอีกใบ
    cabinet(29.15,25.5,1.3,1.9)
    s.rect(int(29.3*TILE),int(27.55*TILE),int(29.3*TILE)+Z(14),int(27.55*TILE)+Z(10),P["wood"])
    s.rect(int(29.3*TILE)+Z(2),int(27.55*TILE)+Z(2),int(29.3*TILE)+Z(12),int(27.55*TILE)+Z(8),P["wood_dark"])
if SPACE_SCALE == 3:
    meeting_table(9.45,26.25,12.45,27.1,4)
    meeting_table(13.55,26.2,17.4,27.25,8)
    meeting_table(18.35,26.2,21.55,27.25,6)
    meeting_table(22.2,26.25,24.45,27.05,4)
else:
    table(13,26,14,27); table(17,26,19,27)

# Door openings: pale threshold plus a dark jamb on one side.
doors = [(10,4,"v"),(10,8,"h"),
         (24,22,"v"),(27,21,"h"),
         (11,25,"h"),(15,25,"h"),(19,25,"h"),(23,25,"h"),(25,25,"h"),(29,25,"h")]
if SPACE_SCALE == 3:
    doors = [v for v in doors if v not in [(24,22,"v"),(27,21,"h")]]
    doors += [(22,13,"v")]
for tx,ty,d in doors:
    x,y=tx*TILE,ty*TILE
    opening=Z(7); half=(TILE-opening)//2; jamb=Z(2)
    threshold = P["floor"] if SPACE_SCALE == 3 else P["corridor"]
    if d=="h":
        s.rect(x+half,y,x+half+opening-1,y+Z(3),threshold)
        s.rect(x+half-jamb,y,x+half-1,y+Z(8),P["outline"])
    else:
        s.rect(x,y+half,x+Z(3),y+half+opening-1,threshold)
        s.rect(x,y+half-jamb,x+Z(8),y+half-1,P["outline"])

# Centered south openings for the three north rooms. These replace the old
# corner cuts and share a consistent threshold, paired jambs and inner shadow.
if SPACE_SCALE == 3:
    for cx in (10.8,15.0,19.05):
        opening=Z(34); x=int(cx*TILE)-opening//2; y=6*TILE
        s.rect(x,y-Z(4),x+opening,y+Z(4),P["floor"])
        s.rect(x-Z(3),y-Z(9),x-1,y+Z(5),P["outline"])
        s.rect(x+opening+1,y-Z(9),x+opening+Z(3),y+Z(5),P["outline"])
        s.line(x+Z(3),y+Z(5),x+opening-Z(3),y+Z(5),P["shadow"])
    # CTO east-wall door: full 48px opening from interior [4,22] to exterior [5,22].
    x=5*TILE; y0=22*TILE
    s.rect(x-Z(5),y0,x+Z(5),y0+TILE-1,P["floor"])
    s.line(x-Z(6),y0,x-Z(6),y0+TILE-1,P["outline"])
    s.line(x+Z(6),y0,x+Z(6),y0+TILE-1,P["outline"])
    s.line(x-Z(5),y0+TILE,x+Z(5),y0+TILE,P["shadow"])
    # Pantry south door connects [8,24] to [8,25]; west wall remains closed.
    x0=8*TILE; y=25*TILE
    s.rect(x0,y-Z(5),x0+TILE-1,y+Z(5),P["floor"])
    s.line(x0,y-Z(6),x0,y+Z(6),P["outline"])
    s.line(x0+TILE-1,y-Z(6),x0+TILE-1,y+Z(6),P["outline"])
    s.line(x0,y+Z(6),x0+TILE-1,y+Z(6),P["shadow"])

# One-pixel drop shadows on room walls establish a consistent top-left light.
shadow_rooms=[(9,2,12,5),(13,2,16,5),(17,2,21,5),
              (9,25,12,28),(13,25,16,28),(17,25,21,28),(22,25,24,28)]
if SPACE_SCALE == 3:
    shadow_rooms += [(1,21,4,24),(22,11,27,15),(20,18,21,19)]
else:
    shadow_rooms += [(1,21,6,24),(25,21,30,24)]
for x0,y0,x1,y1 in shadow_rooms:
    s.line(x0*TILE+3,(y1+1)*TILE-2,(x1+1)*TILE-3,(y1+1)*TILE-2,P["shadow"])

# Lighting strips, glass highlights and corridor wayfinding.
for x in range(3,29,3):
    lw,lh=Z(8),Z(3); lx=x*TILE+(TILE-lw)//2
    s.rect(lx,4*TILE+Z(3),lx+lw-1,4*TILE+Z(3)+lh-1,P["white"])
for y in range(6,25,3):
    lw,lh=Z(8),Z(3); ly=y*TILE+(TILE-lh)//2
    s.rect(9*TILE+(TILE-lw)//2,ly,9*TILE+(TILE+lw)//2-1,ly+lh-1,P["accent"])
    s.rect(22*TILE+(TILE-lw)//2,ly,22*TILE+(TILE+lw)//2-1,ly+lh-1,P["accent"])

# Clip all furnishings to the tapered footprint, then restore its crisp 3px border.
# The diagonal follows the original plan much more closely than the former octagon.
s.polygon([(0,0),(10*TILE,0),(10*TILE,1*TILE),(0,27*TILE),(4*TILE,30*TILE),(0,32*TILE)],P["void"])
s.polygon([(21*TILE,0),(32*TILE,0),(32*TILE,32*TILE),(27*TILE,30*TILE),(31*TILE,27*TILE),(21*TILE,1*TILE)],P["void"])
s.rect(0,30*TILE+1,32*TILE-1,32*TILE-1,P["void"])
edges = [((10,1),(21,1)),((10,1),(0,27)),((0,27),(4,30)),
         ((4,30),(27,30)),((27,30),(31,27)),((31,27),(21,1))]
_border_half = Z(2)
for (x0,y0),(x1,y1) in edges:
    for off in range(-_border_half, _border_half+1):
        s.line(x0*TILE,y0*TILE+off,x1*TILE,y1*TILE+off,P["outline"])

s.save_png(OUT/f"{STEM}.png")
s.save_png(OUT/f"{STEM}@2x.png", scale=2)
s.preview(OUT/f"{STEM}_preview.png", scale=1, bg=P["void"], labels=False)
s.save_swatch(OUT/f"{STEM}_palette.png")
stats = s.stats()

GAME_TILE_PX = 48  # ขนาด tile จริงที่เกมคาดหวังเสมอ ไม่ว่าจะวาดต้นฉบับละเอียดแค่ไหน (สูงสุด 96px/tile)
# เพิ่มจาก 24 -> 48 (2x) ให้สัดส่วนแผนที่ตรงกับตัวละครสไปรท์ใหม่ที่ใหญ่ขึ้น (32x50 จาก 16x24 เดิม)
# ตรงกับ TILE_PX เริ่มต้น (48) พอดี เลยได้แผนที่ที่ความละเอียดต้นฉบับเต็ม ๆ โดยไม่ต้องย่อเลย (factor=1)
if COMPACT:
    # ย่อ art ที่วาดไว้ละเอียด (TILE_PX สูงสุด 96) กลับไปที่ 24px/tile เท่าที่เกมใช้จริงเสมอ —
    # หาร TILE_PX ลงตัวพอดีทุกกรณี (48/24=2 เดิม, 96/24=4 ตอนวาดละเอียดสุด)
    from PIL import Image
    _im = Image.open(OUT/f"{STEM}.png")
    _factor = max(1, TILE_PX // GAME_TILE_PX)
    # BOX (area-average) กันเบลอทั้งภาพแบบ Lanczos แต่ยังคง "เก็บ" รายละเอียดจากต้นฉบับละเอียด
    # (ไล่เฉด/เส้นโค้ง) เป็น anti-alias บาง ๆ ที่ขอบ — ต่างจาก NEAREST ที่ทิ้งพิกเซลที่วาดเพิ่มไปเฉย ๆ
    # (ทดสอบเทียบข้าง ๆ กันแล้ว: NEAREST กับ TILE_PX สูงขึ้นให้ผลเหมือนเดิมทุกพิกเซล ไม่มีประโยชน์อะไรเลย)
    _resample = Image.BOX if _factor > 1 else Image.NEAREST
    _im.resize((_im.width // _factor, _im.height // _factor), _resample).save(OUT/f"{STEM}.png")

# Tile-level collision: 0 walkable, 1 blocked. Start blocked, open circulation,
# then block architectural core, walls and furniture-dense rooms.
collision = [[1 for _ in range(W)] for _ in range(H)]
walk_rects = [(5,3,26,9),(9,6,22,24),(2,5,9,24),(22,5,29,24),(4,21,27,29)]
for x0,y0,x1,y1 in walk_rects:
    for y in range(y0,y1+1):
        for x in range(x0,x1+1): collision[y][x]=0
core_collision = (13,11,18,17) if SPACE_SCALE == 3 else (10,10,21,19)
east_workspace_collision = (22,7,28,20) if SPACE_SCALE == 3 else (23,7,29,20)
for x0,y0,x1,y1 in [core_collision,(2,7,8,20),east_workspace_collision]:
    for y in range(y0,y1+1):
        for x in range(x0,x1+1): collision[y][x]=1
# Clear office aisles and lobby/entrance.
lift_lobby_clear = (14,17,17,24) if SPACE_SCALE == 3 else (13,18,18,24)
office_aisles = ([(5,7,5,20),(7,7,7,20),(24,7,24,20),(26,7,26,20)]
                  if SPACE_SCALE == 3 else
                  [(4,7,4,20),(7,7,7,20),(25,7,25,20),(28,7,28,20)])
for x0,y0,x1,y1 in office_aisles + [lift_lobby_clear]:
    for y in range(y0,y1+1):
        for x in range(x0,x1+1): collision[y][x]=0
if SPACE_SCALE == 3:
    # Lift portals: side thresholds and the south lobby only. Solid lift artwork
    # remains blocked; there is no collision tunnel through the core.
    for x,y in ((12,15),(13,15),(18,15),(19,15),(15,17),(16,17),(15,18),(16,18)):
        collision[y][x]=0
    # Close the obsolete transverse/north route through solid core artwork.
    for y in range(11,17):
        for x in range(13,19):
            if (x,y) not in ((13,15),(18,15)): collision[y][x]=1
    # South exit connects to the established entrance lobby.
    for y in range(18,25):
        for x in (15,16): collision[y][x]=0
    # CTO east door and Pantry south door; obsolete north/west gaps are closed.
    collision[22][4]=0; collision[22][5]=0; collision[21][4]=1
    collision[24][8]=0; collision[25][8]=0; collision[22][7]=1
    # Obsolete isolated doorway east of the north executive suite.
    collision[5][22]=1; collision[6][22]=1

# Block collision cells whose centers fall beyond the diagonal shell.
def inside_poly(px, py, poly):
    inside = False
    j = len(poly)-1
    for i in range(len(poly)):
        xi,yi=poly[i]; xj,yj=poly[j]
        if ((yi>py)!=(yj>py)) and px < (xj-xi)*(py-yi)/(yj-yi)+xi:
            inside = not inside
        j=i
    return inside
tile_shell=[(10,1),(21,1),(31,27),(27,30),(4,30),(0,27)]
for y in range(H):
    for x in range(W):
        if not inside_poly(x+0.5,y+0.5,tile_shell): collision[y][x]=1
if SPACE_SCALE == 3:
    # North-room interiors are walkable around their furniture, with each south
    # threshold kept open. Furniture-heavy rear/desk tiles remain blocked.
    for y in range(2,6):
        for x in range(9,22):
            if inside_poly(x+0.5,y+0.5,tile_shell): collision[y][x]=0
    for x,y in ((9,2),(10,2),(11,2),(12,2),(13,2),(14,2),(15,2),(16,2),
                (17,2),(18,2),(19,2),(20,2),(21,2),
                (9,4),(10,4),(13,4),(14,4),(15,4),(16,4),(17,4),(18,4),(19,4),(20,4)):
        collision[y][x]=1
    # Centered, straight door approaches for CCO, meeting room and CDO.
    # Obsolete corner approaches are closed to keep collision aligned with walls.
    for x,y in ((13,5),(17,5),(21,5),(13,6),(17,6),(21,6)):
        collision[y][x]=1
    for x,y in ((11,5),(11,6),(15,5),(15,6),(19,5),(19,6)):
        if inside_poly(x+0.5,y+0.5,tile_shell): collision[y][x]=0
    # East focus room: open only the visible in-shell interior, connect through
    # the west doorway, and keep the visually solid south wall blocked.
    for y in range(11,16):
        for x in range(22,28):
            if inside_poly(x+0.5,y+0.5,tile_shell): collision[y][x]=0
    collision[13][21]=0  # corridor side of the visible west doorway
    collision[13][22]=0  # room side of the visible west doorway
    for x in range(22,28): collision[16][x]=1

if COMPACT:
    # เดินอิสระเต็มพื้นที่: เปิดทุกช่องที่อยู่ในกรอบตึก ชนเฉพาะเปลือกอาคาร/void
    collision = [[0 if inside_poly(x+0.5, y+0.5, tile_shell) else 1 for x in range(W)]
                 for y in range(H)]

data = {
  "format":"DataXTown social-map v1", "tileSize":(GAME_TILE_PX if COMPACT else TILE), "width":W, "height":H,
  "art":f"{STEM}.png", "collision":{"blocked":1,"walkable":0,"data":collision},
  "spawnPoints":[
    {"id":"main_entrance","tile":[16,23]}, {"id":"north_lounge","tile":[16,9]},
    {"id":"west_workspace","tile":[5,14] if SPACE_SCALE==3 else [9,14]},
    {"id":"east_workspace","tile":[26,17] if SPACE_SCALE==3 else [22,14]}],
  "interactionZones":[
    {"id":"cco_office","type":"executive_consultation","rect":[10,2,3,4],"anchor":[11,5]},
    {"id":"cro_office","type":"risk_executive","rect":[13,2,4,4],"anchor":[15,5]},
    {"id":"cdo_office","type":"data_executive","rect":[17,2,5,4],"anchor":[19,5]},
    {"id":"phone_booth_northwest","type":"private_audio","rect":[8,2,2,4]},
    {"id":"cfo_finance","type":"executive_finance","rect":[22,11,6,5],"anchor":[22,13]},
    {"id":"cto_technology","type":"technology","rect":[1,21,4,4],"anchor":[4,22]},
    {"id":"pantry","type":"refreshment","rect":[7,20,3,5],"anchor":[8,24]},
    {"id":"open_space_west","type":"presentation","rect":[2,25,7,4],"anchor":[5,26]},
    {"id":"meeting_1","type":"meeting","rect":[9,25,4,4],"anchor":[11,25]},
    {"id":"meeting_2","type":"meeting","rect":[13,25,5,4],"anchor":[15,25]},
    {"id":"meeting_3","type":"meeting","rect":[18,25,4,4],"anchor":[19,25]},
    {"id":"meeting_0","type":"meeting","rect":[22,25,3,4],"anchor":[23,25]},
    {"id":"huddle_room","type":"meeting","rect":[27,25,2,4],"anchor":[27,25]},
    {"id":"supply_closet","type":"utility","rect":[29,25,1,4],"anchor":[29,25]},
    {"id":"lift_lobby","type":"transit","rect":[12,15,8,4],"anchors":{"left":[12,15],"right":[19,15],"south":[16,18]}},
    {"id":"phone_booths","type":"private_audio","rect":[25,25,2,4]}],
  "workstations":([
    {"id":f"monitor_{bank*4+seat+1:02d}","tile":[round(x0+(seat+.5)*width_tiles/4,2),y],
     "bank":bank+1,"seat":seat+1,"side":side}
    for bank,(side,x0,y,width_tiles) in enumerate(bank_specs)
    for seat in range(4)] if SPACE_SCALE == 3 else [
    {"id":f"monitor_{row*4+seat+1:02d}","tile":[round(x,2),round(y,2)],"row":row+1,"seat":seat+1}
    for row,(y,left_xs) in enumerate(desk_rows.items())
    for seat,x in enumerate(left_xs + [31-v for v in reversed(left_xs)])]),
  "notes":["Conceptual game layout only; not suitable for construction or emergency planning.",
           "Use nearest-neighbor texture filtering and integer camera zoom."]
}
(OUT/f"{STEM}.json").write_text(json.dumps(data,indent=2),encoding="utf-8")
print(json.dumps({"outputs":[f"{STEM}.png",f"{STEM}@2x.png",f"{STEM}.json"],"stats":stats},default=str))
