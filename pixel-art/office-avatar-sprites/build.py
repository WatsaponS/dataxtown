"""Prepare DALL-E sprite concepts as game-ready recolorable sheets."""
from pathlib import Path
from PIL import Image, ImageColor, ImageFilter
import json
from collections import deque

ROOT = Path(__file__).resolve().parent
FRAME = 128
COLS = ROWS = 4

def chroma_alpha(im):
    im = im.convert("RGBA")
    px = im.load()
    # DALL-E's green field contains slight variation; remove green-dominant pixels.
    for y in range(im.height):
        for x in range(im.width):
            r,g,b,a = px[x,y]
            if g > 60 and g > r*1.06 and g > b*1.06:
                px[x,y] = (0,0,0,0)
            else:
                # Despill any residual green edge without affecting blue eyes/cyan clothing.
                if g>r and g>b: g=max(r,b)
                px[x,y] = (r,g,b,255)
    return im

def components(mask):
    w,h=mask.size; p=mask.load(); seen=set(); out=[]
    for y in range(h):
        for x in range(w):
            if not p[x,y] or (x,y) in seen: continue
            q=deque([(x,y)]); seen.add((x,y)); pts=[]
            while q:
                cx,cy=q.popleft(); pts.append((cx,cy))
                for nx,ny in ((cx+1,cy),(cx-1,cy),(cx,cy+1),(cx,cy-1)):
                    if 0<=nx<w and 0<=ny<h and p[nx,ny] and (nx,ny) not in seen:
                        seen.add((nx,ny)); q.append((nx,ny))
            out.append(pts)
    return out

def extract_poses(clean):
    """Find the 16 DALL-E silhouettes, then normalize each to a shared foot pivot."""
    alpha=clean.getchannel("A")
    # Bridge small gaps inside each character without joining neighboring grid cells.
    grouped=alpha.filter(ImageFilter.MaxFilter(17))
    comps=sorted(components(grouped),key=len,reverse=True)[:16]
    boxes=[]
    for pts in comps:
        xs=[p[0] for p in pts]; ys=[p[1] for p in pts]
        boxes.append((max(0,min(xs)-10),max(0,min(ys)-10),min(clean.width,max(xs)+11),min(clean.height,max(ys)+11)))
    boxes=sorted(boxes,key=lambda b:((b[1]+b[3])//2,(b[0]+b[2])//2))
    # Stable row-major grouping even when adjacent rows have slightly different baselines.
    rows=[]
    for i in range(0,16,4): rows.append(sorted(boxes[i:i+4],key=lambda b:b[0]))
    frames=[]
    for row in rows:
        for box in row:
            pose=clean.crop(box)
            bbox=pose.getchannel('A').getbbox(); pose=pose.crop(bbox)
            scale=min(92/pose.width,108/pose.height)
            size=(max(1,round(pose.width*scale)),max(1,round(pose.height*scale)))
            pose=pose.resize(size,Image.Resampling.LANCZOS)
            # Harden alpha after resampling.
            pp=pose.load()
            for yy in range(pose.height):
                for xx in range(pose.width):
                    r,g,b,a=pp[xx,yy]
                    if g>r and g>b: g=max(r,b)
                    pp[xx,yy]=(r,g,b,255) if a>=80 else (0,0,0,0)
            frame=Image.new('RGBA',(FRAME,FRAME),(0,0,0,0))
            frame.alpha_composite(pose,((FRAME-pose.width)//2,118-pose.height))
            frames.append(frame)
    return frames

def material_mask(im, kind):
    out = Image.new("L", im.size, 0); src=im.load(); dst=out.load()
    for y in range(im.height):
        for x in range(im.width):
            r,g,b,a=src[x,y]
            if not a: continue
            if kind=="hair" and r>145 and b>105 and r>g*1.25 and b>g*.88:
                dst[x,y]=255
            elif kind=="clothing" and b>105 and g>105 and r<115 and g>r*1.35 and b>r*1.35:
                dst[x,y]=255
    # Remove tiny detached mask specks; meaningful material clusters remain connected.
    for pts in components(out):
        if len(pts)<=6:
            for x,y in pts: dst[x,y]=0
    if kind=="hair":
        # Flood darker red/magenta clusters connected to the reliable bright-hair seed.
        candidate=Image.new('L',im.size,0); cp=candidate.load()
        for y in range(im.height):
            for x in range(im.width):
                r,g,b,a=src[x,y]
                if not a: continue
                dark_magenta=(r>65 and g<60 and b>32 and r>g*1.18)
                mid_magenta=(r>110 and b>88 and r>g*1.18 and b>g*.86)
                if dst[x,y] or dark_magenta or mid_magenta: cp[x,y]=255
        q=deque((x,y) for y in range(im.height) for x in range(im.width) if dst[x,y])
        seen=set(q)
        while q:
            x,y=q.popleft()
            for nx,ny in ((x+1,y),(x-1,y),(x,y+1),(x,y-1),(x+1,y+1),(x-1,y+1),(x+1,y-1),(x-1,y-1)):
                if 0<=nx<im.width and 0<=ny<im.height and cp[nx,ny] and (nx,ny) not in seen:
                    seen.add((nx,ny)); q.append((nx,ny)); dst[nx,ny]=255
        # Final semantic guard: warm peach/brown pixels at the hairline belong to skin.
        for y in range(im.height):
            for x in range(im.width):
                if not dst[x,y]: continue
                r,g,b,a=src[x,y]
                warm_skin=(r>150 and 70<g<195 and b<150 and r>g*1.18 and b<g*.94)
                light_skin=(r>200 and g>145 and b>135 and r>g*1.08 and g>b*1.02)
                if warm_skin or light_skin:
                    dst[x,y]=0
    elif kind=="clothing":
        # Pull the darker cyan outline/shadow ramp into the seeded polo mask.
        # Blue jeans are excluded because their blue channel dominates green.
        candidate=Image.new('L',im.size,0); cp=candidate.load()
        for y in range(im.height):
            for x in range(im.width):
                r,g,b,a=src[x,y]
                cyan_ramp=(a and r<135 and g>62 and b>72 and g>b*.72 and b>r*1.18)
                if dst[x,y] or cyan_ramp: cp[x,y]=255
        q=deque((x,y) for y in range(im.height) for x in range(im.width) if dst[x,y])
        seen=set(q)
        while q:
            x,y=q.popleft()
            for nx,ny in ((x+1,y),(x-1,y),(x,y+1),(x,y-1),(x+1,y+1),(x-1,y+1),(x+1,y-1),(x-1,y-1)):
                if 0<=nx<im.width and 0<=ny<im.height and cp[nx,ny] and (nx,ny) not in seen:
                    seen.add((nx,ny)); q.append((nx,ny)); dst[nx,ny]=255
        # Reject disconnected cyan shoe accents. Garment components originate
        # in the upper body; long garments remain connected to that region.
        for pts in components(out):
            if min(y % FRAME for _,y in pts) > 80:
                for x,y in pts: dst[x,y]=0
    return out

def recolor(im, mask, target):
    tr,tg,tb=ImageColor.getrgb(target); out=im.copy(); src=im.load(); m=mask.load(); dst=out.load()
    vals=[]
    for y in range(im.height):
        for x in range(im.width):
            if m[x,y]:
                r,g,b,a=src[x,y]; vals.append(max(r,g,b))
    lo,hi=(min(vals),max(vals)) if vals else (0,255)
    for y in range(im.height):
        for x in range(im.width):
            if m[x,y]:
                r,g,b,a=src[x,y]; v=max(r,g,b); k=.55+.45*((v-lo)/max(1,hi-lo))
                dst[x,y]=(int(tr*k),int(tg*k),int(tb*k),a)
    return out

SOURCES = {
    "male": "male_dalle_source.png",
    "female": "female_dalle_dress_source.png",
    "female_cto": "female_cto_dalle_source.png",
    "female_cdo": "female_cdo_dalle_source.png",
    "male_ceo": "male_ceo_dalle_source.png",
    "male_cco": "male_cco_dalle_source.png",
    "male_cfo": "male_cfo_dalle_source.png",
    "male_cro": "male_cro_dalle_source.png",
    "male_ceo_v2": "male_ceo_v2_dalle_source.png",
    "male_cco_v2": "male_cco_v2_dalle_source.png",
    "female_cdo_v2": "female_cdo_v2_dalle_source.png",
    "female_cto_v2": "female_cto_v2_dalle_source.png",
}

DEMO_COLORS = {
    "male": ("#4b2e83", "#e76f51"),
    "female": ("#4b2e83", "#e76f51"),
    "female_cto": ("#6842a6", "#c6534f"),
    "female_cdo": ("#7b4a2f", "#3d78a8"),
    "male_ceo": ("#7a4b2c", "#487db2"),
    "male_cco": ("#704126", "#477eae"),
    "male_cfo": ("#765039", "#4c78a8"),
    "male_cro": ("#75503b", "#4b79aa"),
    "male_ceo_v2": ("#70442d", "#4a78a8"),
    "male_cco_v2": ("#74462f", "#477dab"),
    "female_cdo_v2": ("#75442e", "#477baa"),
    "female_cto_v2": ("#6842a6", "#c6534f"),
}

FINAL_COLORS = {
    "female_cto": ("#171820", "#20242b"),
    "female_cdo": ("#15161b", "#1c1e24"),
    "male_ceo": ("#17171c", "#f4f1e8"),
    "male_cco": ("#17171b", "#1c1e23"),
    "male_cfo": ("#797a7e", "#f4f1e8"),
    "male_cro": ("#46484d", "#f4f1e8"),
    "male_ceo_v2": ("#17171c", "#233862"),
    "male_cco_v2": ("#17171c", "#1d1f24"),
    "female_cdo_v2": ("#17171c", "#1d1f24"),
    "female_cto_v2": ("#17171c", "#f4f1e8"),
}

def build(gender):
    source_name=SOURCES[gender]
    src=Image.open(ROOT/source_name)
    poses=extract_poses(chroma_alpha(src))
    clean=Image.new('RGBA',(FRAME*COLS,FRAME*ROWS),(0,0,0,0))
    for i,pose in enumerate(poses): clean.alpha_composite(pose,((i%4)*FRAME,(i//4)*FRAME))
    # Re-lock every cell to the shared foot pivot after chroma cleanup. Generative
    # edge colors can occasionally make one pose's last opaque row disappear.
    aligned=Image.new('RGBA',clean.size,(0,0,0,0))
    for i in range(COLS*ROWS):
        x=(i%COLS)*FRAME; y=(i//COLS)*FRAME
        cell=clean.crop((x,y,x+FRAME,y+FRAME)); bbox=cell.getchannel('A').getbbox()
        dy=(118-bbox[3]) if bbox else 0
        aligned.alpha_composite(cell,(x,y+dy))
    clean=aligned
    hair=material_mask(clean,"hair"); clothes=material_mask(clean,"clothing")
    hair.save(ROOT/f"{gender}_hair_mask.png")
    clothes.save(ROOT/f"{gender}_clothing_mask.png")
    hair_color, clothing_color = DEMO_COLORS[gender]
    demo=recolor(recolor(clean,hair,hair_color),clothes,clothing_color)
    demo.save(ROOT/f"{gender}_recolor_demo.png")
    if gender in FINAL_COLORS:
        final_hair, final_clothing = FINAL_COLORS[gender]
        final_sheet = recolor(recolor(clean,hair,final_hair),clothes,final_clothing)
    else:
        final_sheet = clean
    final_sheet.save(ROOT/f"{gender}_spritesheet.png")
    frame_dir=ROOT/"frames"/gender; frame_dir.mkdir(parents=True,exist_ok=True)
    # DALL-E rendered row 2 screen-right and row 3 screen-left; label by visible facing.
    dirs=("front","right","left","back")
    for row,direction in enumerate(dirs):
        frames=[]
        for col in range(COLS):
            frame=final_sheet.crop((col*FRAME,row*FRAME,(col+1)*FRAME,(row+1)*FRAME))
            frame.save(frame_dir/f"{direction}_{col}.png"); frames.append(frame)
        frames[0].save(ROOT/f"{gender}_{direction}_walk.gif",save_all=True,
                       append_images=frames[1:],duration=140,loop=0,disposal=2)
    return {"sheet":f"{gender}_spritesheet.png","hairMask":f"{gender}_hair_mask.png",
            "clothingMask":f"{gender}_clothing_mask.png","demo":f"{gender}_recolor_demo.png"}

assets={g:build(g) for g in SOURCES}
meta={"frameWidth":FRAME,"frameHeight":FRAME,"columns":COLS,"rows":ROWS,
      "directions":["front","right","left","back"],
      "framesPerDirection":4,"frameDurationMs":140,
      "order":"row-major","assets":assets,
      "recolor":{"hair":"white pixels in *_hair_mask.png","clothing":"white pixels in *_clothing_mask.png"}}
(ROOT/"sprites.json").write_text(json.dumps(meta,indent=2),encoding="utf-8")
print(json.dumps(meta))
