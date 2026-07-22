from pathlib import Path
import sys

from PIL import Image

sys.path.insert(0, r"C:\Users\Admin\.codex\skills\pixel-art-studio\scripts")
from pixelstudio import Sprite

ROOT = Path(__file__).resolve().parent
ROOT.mkdir(parents=True, exist_ok=True)

C = {
    "outline": "#202838", "outline2": "#354052",
    "wood_dark": "#aeb6bd", "wood": "#dde2e3", "wood_light": "#f7f5ee",
    "metal_dark": "#3a4655", "metal": "#68788a", "metal_light": "#a8b4bd",
    "screen_dark": "#17333d", "screen": "#4f9ba5", "screen_light": "#a8e2d8",
    "key_dark": "#46515e", "key": "#d2d8d5", "key_light": "#f0eee6",
    "chair_dark": "#2c3442", "chair": "#536276", "chair_light": "#74859a",
    "accent": "#e5b84a", "shadow": "#111722",
}

def rect(s, box, color):
    s.rect(*box, C[color])

def poly(s, points, color):
    s.polygon(points, C[color])

def draw_monitor(s):
    # rear stand and screen: subtle top-down perspective
    rect(s, (29, 26, 34, 34), "metal_dark")
    rect(s, (27, 32, 36, 35), "metal")
    rect(s, (17, 5, 46, 27), "outline")
    rect(s, (19, 7, 44, 24), "screen_dark")
    rect(s, (21, 9, 42, 22), "screen")
    rect(s, (22, 10, 41, 12), "screen_light")
    rect(s, (22, 20, 29, 21), "screen_light")
    rect(s, (18, 25, 45, 27), "outline2")
    rect(s, (31, 25, 33, 26), "accent")

def draw_desk(s):
    # rounded visual profile built from stepped corners
    poly(s, [(8, 31), (12, 27), (52, 27), (56, 31), (56, 48), (53, 51), (11, 51), (8, 48)], "outline")
    poly(s, [(10, 32), (13, 29), (51, 29), (54, 32), (54, 45), (51, 48), (13, 48), (10, 45)], "wood")
    rect(s, (13, 30, 51, 32), "wood_light")
    rect(s, (11, 45, 53, 47), "wood_dark")
    # clean cable-management slot; intentionally no keyboard or mouse
    rect(s, (29, 36, 35, 38), "wood_dark")
    rect(s, (30, 36, 34, 36), "outline2")
    rect(s, (14, 41, 50, 42), "wood_light")
    # front apron and legs
    rect(s, (11, 49, 54, 53), "wood_dark")
    rect(s, (13, 52, 17, 58), "outline")
    rect(s, (14, 52, 16, 57), "metal")
    rect(s, (48, 52, 52, 58), "outline")
    rect(s, (49, 52, 51, 57), "metal")

def draw_chair(s):
    # five-star base behind the seat
    rect(s, (30, 77, 33, 89), "metal_dark")
    poly(s, [(31, 85), (20, 91), (19, 89), (29, 83)], "metal_dark")
    poly(s, [(33, 85), (44, 91), (45, 89), (35, 83)], "metal_dark")
    rect(s, (15, 89, 21, 92), "shadow")
    rect(s, (43, 89, 49, 92), "shadow")
    rect(s, (29, 90, 35, 93), "shadow")
    # seat and back, with pixel bevels
    poly(s, [(20, 58), (24, 54), (40, 54), (44, 58), (42, 72), (38, 76), (26, 76), (22, 72)], "outline")
    poly(s, [(22, 59), (25, 56), (39, 56), (42, 59), (40, 70), (37, 73), (27, 73), (24, 70)], "chair")
    rect(s, (25, 58, 39, 61), "chair_light")
    rect(s, (25, 68, 39, 71), "chair_dark")
    # armrests
    rect(s, (17, 63, 23, 67), "outline")
    rect(s, (18, 63, 22, 64), "metal")
    rect(s, (41, 63, 47, 67), "outline")
    rect(s, (42, 63, 46, 64), "metal")
    rect(s, (30, 74, 34, 80), "outline")
    rect(s, (31, 74, 33, 79), "metal")

def make(drawers, filename):
    s = Sprite(64, 96, palette=list(C.values()))
    for fn in drawers:
        fn(s)
    s.save_png(ROOT / filename)
    return s

full = make((draw_monitor, draw_desk, draw_chair), "office-workstation.png")
make((draw_desk,), "office-desk.png")
make((draw_monitor,), "office-monitor.png")
make((draw_chair,), "office-chair.png")
full.preview(ROOT / "office-workstation-preview-4x.png", scale=4, bg="#e9e4d7", labels=False)

# A second dark-floor preview helps verify contrast in the game map.
src = Image.open(ROOT / "office-workstation.png").convert("RGBA")
preview = Image.new("RGBA", src.size, "#253047")
preview.alpha_composite(src)
preview.resize((256, 384), Image.Resampling.NEAREST).save(ROOT / "office-workstation-preview-dark-4x.png")

print("built modern office workstation: combined sprite + desk/monitor/chair modules")
