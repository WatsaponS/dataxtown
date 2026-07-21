"""Build the 13-pet economical collection from cleaned API master sheets."""
from pathlib import Path
from collections import deque
import json
from PIL import Image, ImageFilter, ImageDraw

ROOT = Path(__file__).resolve().parent
PIPE = ROOT / "transparent"
OUT = ROOT / "export"
FRAME = 96
DURATION = 140
DIRECTIONS = ["down", "left", "right", "up"]
PETS = ["rat", "ox", "tiger", "rabbit", "dragon", "snake", "horse",
        "goat", "monkey", "rooster", "dog", "pig", "cat"]


def components(im):
    a = im.getchannel("A")
    w, h = im.size
    pix = a.load()
    seen, boxes = set(), []
    for y in range(h):
        for x in range(w):
            if not pix[x, y] or (x, y) in seen:
                continue
            stack = [(x, y)]
            seen.add((x, y))
            pts = []
            while stack:
                cx, cy = stack.pop()
                pts.append((cx, cy))
                for nx, ny in ((cx-1,cy),(cx+1,cy),(cx,cy-1),(cx,cy+1)):
                    if 0 <= nx < w and 0 <= ny < h and pix[nx,ny] and (nx,ny) not in seen:
                        seen.add((nx,ny)); stack.append((nx,ny))
            if len(pts) > 20:
                xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
                boxes.append((min(xs), min(ys), max(xs)+1, max(ys)+1))
    # Cluster into four rows by vertical center, then sort each row by x center.
    boxes.sort(key=lambda b: ((b[1]+b[3])/2, (b[0]+b[2])/2))
    assert len(boxes) == 16, len(boxes)
    rows = [boxes[i:i+4] for i in range(0,16,4)]
    for row in rows:
        row.sort(key=lambda b:(b[0]+b[2])/2)
    return [b for row in rows for b in row]


def sticker(core):
    alpha = core.getchannel("A")
    border = alpha.filter(ImageFilter.MaxFilter(7))
    result = Image.new("RGBA", core.size, (255,255,255,0))
    result.putalpha(border)
    result.alpha_composite(core)
    return result


OUT.mkdir(parents=True, exist_ok=True)
manifest = {"frameWidth":FRAME,"frameHeight":FRAME,"columns":4,"rows":4,
            "directions":DIRECTIONS,"frameDurationMs":DURATION,"pets":{}}
collection_frames = []

for pet in PETS:
    source_id = "cat_british" if pet == "cat" else pet
    src = Image.open(PIPE / f"{source_id}_pipe" / "clean.png").convert("RGBA")
    boxes = components(src)
    crops = [src.crop(b) for b in boxes]
    max_w = max(c.width for c in crops); max_h = max(c.height for c in crops)
    # One scale per identity keeps all 16 poses consistent; fit core within 68x68.
    scale = min(68/max_w, 68/max_h)
    pet_dir = OUT / pet
    frame_dir = pet_dir / "frames"
    frame_dir.mkdir(parents=True, exist_ok=True)
    core_frames, sticker_frames = [], []
    for idx, crop in enumerate(crops):
        nw = max(1, round(crop.width*scale)); nh = max(1, round(crop.height*scale))
        pose = crop.resize((nw,nh), Image.Resampling.NEAREST)
        core = Image.new("RGBA",(FRAME,FRAME),(0,0,0,0))
        ox = (FRAME-nw)//2; oy = 82-nh
        core.alpha_composite(pose,(ox,oy))
        framed = sticker(core)
        direction = DIRECTIONS[idx//4]; phase=idx%4
        core.save(frame_dir/f"{direction}_{phase}_core.png")
        framed.save(frame_dir/f"{direction}_{phase}.png")
        core_frames.append(core); sticker_frames.append(framed)

    core_sheet=Image.new("RGBA",(384,384),(0,0,0,0))
    sheet=Image.new("RGBA",(384,384),(0,0,0,0))
    for idx,(c,f) in enumerate(zip(core_frames,sticker_frames)):
        pos=((idx%4)*FRAME,(idx//4)*FRAME)
        core_sheet.alpha_composite(c,pos); sheet.alpha_composite(f,pos)
    core_sheet.save(pet_dir/f"{pet}_walk_core.png")
    sheet.save(pet_dir/f"{pet}_walk_sticker.png")
    dark=Image.new("RGBA",sheet.size,"#273044"); dark.alpha_composite(sheet)
    dark.save(pet_dir/f"{pet}_walk_preview.png")
    sil=Image.new("RGBA",sheet.size,(0,0,0,0)); sil.paste((255,255,255,255),mask=sheet.getchannel("A"))
    sil.save(pet_dir/f"{pet}_walk_silhouette.png")
    for row,direction in enumerate(DIRECTIONS):
        seq=sticker_frames[row*4:row*4+4]
        seq[0].save(pet_dir/f"{pet}_{direction}_walk.gif",save_all=True,
                    append_images=seq[1:],duration=DURATION,loop=0,disposal=2)
    meta={"id":pet,"frameWidth":FRAME,"frameHeight":FRAME,"columns":4,"rows":4,
          "directions":DIRECTIONS,"phases":["left-contact","passing","right-contact","recovery"],
          "frameDurationMs":DURATION,"stickerSheet":f"{pet}_walk_sticker.png",
          "coreSheet":f"{pet}_walk_core.png"}
    if pet == "cat":
        meta["breed"] = "British Shorthair"
        meta["coat"] = "golden shaded"
    (pet_dir/f"{pet}.json").write_text(json.dumps(meta,indent=2),encoding="utf-8")
    manifest["pets"][pet]=meta
    collection_frames.append(sticker_frames[0])

# Collection overview: 5 columns, 3 rows, one approved down/front pose per pet.
thumb=96; cols=5; rows=3
overview=Image.new("RGBA",(cols*thumb,rows*thumb),"#273044")
for i,frame in enumerate(collection_frames):
    overview.alpha_composite(frame,((i%cols)*thumb,(i//cols)*thumb))
overview.save(OUT/"zodiac_12_plus_cat_preview.png")
(OUT/"pets_manifest.json").write_text(json.dumps(manifest,indent=2),encoding="utf-8")
print(f"built {len(PETS)} pets, {len(PETS)*16} frames, {len(PETS)*4} GIFs")
