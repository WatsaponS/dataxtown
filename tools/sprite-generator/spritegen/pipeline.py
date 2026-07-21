from collections import deque
from pathlib import Path
from PIL import Image, ImageColor, ImageFilter
import json

FRAME=128; COLS=ROWS=4; DIRECTIONS=("front","right","left","back")

def _components(mask):
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

def _chroma(im):
    im=im.convert("RGBA"); px=im.load()
    for y in range(im.height):
        for x in range(im.width):
            r,g,b,a=px[x,y]
            if g>60 and g>r*1.06 and g>b*1.06: px[x,y]=(0,0,0,0)
            else: px[x,y]=(r,min(g,max(r,b)) if g>r and g>b else g,b,255)
    return im

def _extract(clean):
    grouped=clean.getchannel("A").filter(ImageFilter.MaxFilter(17))
    comps=sorted(_components(grouped),key=len,reverse=True)[:16]
    if len(comps)!=16: raise ValueError(f"Expected 16 poses, found {len(comps)}")
    boxes=[]
    for pts in comps:
        xs=[p[0] for p in pts]; ys=[p[1] for p in pts]
        boxes.append((max(0,min(xs)-10),max(0,min(ys)-10),min(clean.width,max(xs)+11),min(clean.height,max(ys)+11)))
    boxes=sorted(boxes,key=lambda b:((b[1]+b[3])//2,(b[0]+b[2])//2))
    boxes=[b for i in range(0,16,4) for b in sorted(boxes[i:i+4],key=lambda z:z[0])]
    frames=[]
    for box in boxes:
        pose=clean.crop(box); pose=pose.crop(pose.getchannel("A").getbbox())
        scale=min(92/pose.width,108/pose.height)
        pose=pose.resize((round(pose.width*scale),round(pose.height*scale)),Image.Resampling.LANCZOS)
        pp=pose.load()
        for yy in range(pose.height):
            for xx in range(pose.width):
                r,g,b,a=pp[xx,yy]
                if a<80: pp[xx,yy]=(0,0,0,0)
                else:
                    if g>r and g>b: g=max(r,b)
                    pp[xx,yy]=(r,g,b,255)
        frame=Image.new("RGBA",(FRAME,FRAME)); frame.alpha_composite(pose,((FRAME-pose.width)//2,118-pose.height))
        frames.append(frame)
    return frames

def _mask(sheet,kind):
    out=Image.new("L",sheet.size); src=sheet.load(); dst=out.load()
    for y in range(sheet.height):
        for x in range(sheet.width):
            r,g,b,a=src[x,y]
            if not a: continue
            if kind=="hair" and r>100 and b>70 and r>g*1.15 and b>g*.75: dst[x,y]=255
            if kind=="clothing" and r<135 and g>62 and b>72 and g>b*.72 and b>r*1.18: dst[x,y]=255
    for pts in _components(out):
        if len(pts)<=6 or (kind=="clothing" and min(y%FRAME for _,y in pts)>80):
            for x,y in pts: dst[x,y]=0
    return out

def _recolor(im,mask,color):
    tr,tg,tb=ImageColor.getrgb(color); out=im.copy(); src=im.load(); dst=out.load(); m=mask.load()
    vals=[max(src[x,y][:3]) for y in range(im.height) for x in range(im.width) if m[x,y]]
    lo,hi=(min(vals),max(vals)) if vals else (0,255)
    for y in range(im.height):
        for x in range(im.width):
            if m[x,y]:
                v=max(src[x,y][:3]); k=.55+.45*((v-lo)/max(1,hi-lo)); a=src[x,y][3]
                dst[x,y]=(int(tr*k),int(tg*k),int(tb*k),a)
    return out

def process(master: Path, out: Path, *, slug: str, hair_color: str, clothing_color: str):
    out.mkdir(parents=True,exist_ok=True)
    poses=_extract(_chroma(Image.open(master)))
    keyed=Image.new("RGBA",(FRAME*COLS,FRAME*ROWS))
    for i,p in enumerate(poses): keyed.alpha_composite(p,((i%4)*FRAME,(i//4)*FRAME))
    hair=_mask(keyed,"hair"); clothing=_mask(keyed,"clothing")
    final=_recolor(_recolor(keyed,hair,hair_color),clothing,clothing_color)
    final.save(out/f"{slug}_spritesheet.png"); hair.save(out/f"{slug}_hair_mask.png"); clothing.save(out/f"{slug}_clothing_mask.png")
    demo=_recolor(_recolor(keyed,hair,"#6842a6"),clothing,"#c6534f"); demo.save(out/f"{slug}_recolor_demo.png")
    frame_dir=out/"frames"/slug; frame_dir.mkdir(parents=True,exist_ok=True)
    for row,direction in enumerate(DIRECTIONS):
        fs=[]
        for col in range(4):
            f=final.crop((col*FRAME,row*FRAME,(col+1)*FRAME,(row+1)*FRAME)); f.save(frame_dir/f"{direction}_{col}.png"); fs.append(f)
        fs[0].save(out/f"{slug}_{direction}_walk.gif",save_all=True,append_images=fs[1:],duration=140,loop=0,disposal=2)
    meta={"slug":slug,"frameWidth":128,"frameHeight":128,"directions":list(DIRECTIONS),"framesPerDirection":4,"frameDurationMs":140}
    (out/f"{slug}.json").write_text(json.dumps(meta,indent=2),encoding="utf-8")
    return meta
