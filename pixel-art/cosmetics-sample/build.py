"""Package the one-call 2x5 cosmetic concept sheet into ten 96px assets."""
from pathlib import Path
import json
from PIL import Image

ROOT=Path(__file__).resolve().parent
SRC=ROOT/"cosmetics_transparent_pipe"/"clean.png"
OUT=ROOT/"export"
OUT.mkdir(parents=True,exist_ok=True)
FRAME=96

ITEMS=[
 ("hat_arcane_stargazer","hat","fantasy","head"),
 ("hat_neon_ronin","hat","cool","head"),
 ("shirt_dragon_knight","shirt","fantasy","torso"),
 ("shirt_street_phantom","shirt","cool","torso"),
 ("pants_rune_ranger","pants","fantasy","hips"),
 ("pants_cyber_cargo","pants","cool","hips"),
 ("skirt_celestial_mage","skirt","fantasy","hips"),
 ("skirt_gothic_battle","skirt","cool","hips"),
 ("wings_crystal_seraph","wings","fantasy","back"),
 ("wings_mecha_demon","wings","cool","back"),
]

src=Image.open(SRC).convert("RGBA")
xs=[round(i*src.width/2) for i in range(3)]
ys=[round(i*src.height/5) for i in range(6)]
frames=[]; manifest={"frameWidth":FRAME,"frameHeight":FRAME,"items":[]}

def keep_largest_component(im):
    """Remove detached generation fragments while preserving the main garment."""
    a=im.getchannel("A"); w,h=im.size; px=a.load(); seen=set(); groups=[]
    for y in range(h):
        for x in range(w):
            if not px[x,y] or (x,y) in seen: continue
            stack=[(x,y)]; seen.add((x,y)); group=[]
            while stack:
                cx,cy=stack.pop(); group.append((cx,cy))
                for nx,ny in ((cx-1,cy),(cx+1,cy),(cx,cy-1),(cx,cy+1)):
                    if 0<=nx<w and 0<=ny<h and px[nx,ny] and (nx,ny) not in seen:
                        seen.add((nx,ny)); stack.append((nx,ny))
            groups.append(group)
    if not groups: return im
    keep=set(max(groups,key=len)); out=im.copy(); op=out.load()
    for y in range(h):
        for x in range(w):
            if (x,y) not in keep: op[x,y]=(0,0,0,0)
    return out

for i,(item_id,category,theme,anchor) in enumerate(ITEMS):
 row,col=divmod(i,2)
 cell=src.crop((xs[col],ys[row],xs[col+1],ys[row+1]))
 if category == "skirt":
  cell=keep_largest_component(cell)
 box=cell.getbbox()
 assert box, item_id
 item=cell.crop(box)
 scale=min(80/item.width,80/item.height)
 nw=max(1,round(item.width*scale)); nh=max(1,round(item.height*scale))
 item=item.resize((nw,nh),Image.Resampling.NEAREST)
 frame=Image.new("RGBA",(FRAME,FRAME),(0,0,0,0))
 pos=((FRAME-nw)//2,(FRAME-nh)//2)
 frame.alpha_composite(item,pos)
 frame.save(OUT/f"{item_id}.png")
 frames.append(frame)
 manifest["items"].append({"id":item_id,"category":category,"theme":theme,
                            "anchor":anchor,"file":f"{item_id}.png",
                            "bbox":list(frame.getbbox())})

sheet=Image.new("RGBA",(FRAME*2,FRAME*5),(0,0,0,0))
preview=Image.new("RGBA",sheet.size,"#273044")
for i,frame in enumerate(frames):
 pos=((i%2)*FRAME,(i//2)*FRAME)
 sheet.alpha_composite(frame,pos); preview.alpha_composite(frame,pos)
sheet.save(OUT/"cosmetics_sample_sheet.png")
preview.save(OUT/"cosmetics_sample_preview.png")
(OUT/"cosmetics_manifest.json").write_text(json.dumps(manifest,indent=2),encoding="utf-8")
print("built 10 cosmetic samples: 2 hats, 2 shirts, 2 pants, 2 skirts, 2 wings")
