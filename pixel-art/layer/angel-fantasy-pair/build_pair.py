"""Build registered angel-fantasy male/female walk assets."""
from pathlib import Path
from collections import deque
import json
from PIL import Image

ROOT=Path(__file__).resolve().parent
DIRS=["down","left","right","up"]
FRAME,DURATION=128,140

def build(person):
    outdir=ROOT/person
    src=Image.open(outdir/f"{person}-angel-clean.png").convert("RGBA")
    w,h=src.size; alpha=src.getchannel("A")
    opaque=bytearray(1 if v>=128 else 0 for v in alpha.getdata())
    seen=bytearray(w*h); groups=[[] for _ in range(16)]
    for sy in range(h):
        for sx in range(w):
            start=sy*w+sx
            if not opaque[start] or seen[start]: continue
            q=deque([(sx,sy)]); seen[start]=1; pts=[]
            while q:
                x,y=q.popleft(); pts.append((x,y))
                for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
                    if 0<=nx<w and 0<=ny<h:
                        i=ny*w+nx
                        if opaque[i] and not seen[i]: seen[i]=1; q.append((nx,ny))
            if len(pts)<2: continue
            cx=sum(x for x,_ in pts)/len(pts); cy=sum(y for _,y in pts)/len(pts)
            col=min(3,max(0,int(cx*4/w))); row=min(3,max(0,int(cy*4/h)))
            groups[row*4+col].extend(pts)
    boxes=[]
    for pts in groups:
        if not pts: raise RuntimeError(f"{person}: missing pose")
        xs=[x for x,_ in pts]; ys=[y for _,y in pts]
        boxes.append((min(xs),min(ys),max(xs)+1,max(ys)+1))
    maxw=max(x1-x0 for x0,y0,x1,y1 in boxes)
    maxh=max(y1-y0 for x0,y0,x1,y1 in boxes)
    scale=min(112/maxw,112/maxh); sp=src.load(); raw=[]
    for pts,(x0,y0,x1,y1) in zip(groups,boxes):
        crop=Image.new("RGBA",(x1-x0,y1-y0),(0,0,0,0)); cp=crop.load()
        for x,y in pts: cp[x-x0,y-y0]=sp[x,y]
        nw=max(1,round(crop.width*scale)); nh=max(1,round(crop.height*scale))
        crop=crop.resize((nw,nh),Image.Resampling.LANCZOS)
        f=Image.new("RGBA",(FRAME,FRAME),(0,0,0,0))
        f.alpha_composite(crop,((FRAME-nw)//2,120-nh)); raw.append(f)
    atlas=Image.new("RGBA",(512,512),(0,0,0,0))
    for i,f in enumerate(raw): atlas.alpha_composite(f,((i%4)*FRAME,(i//4)*FRAME))
    a=atlas.getchannel("A").point(lambda v:255 if v>=128 else 0)
    rgb=Image.new("RGB",atlas.size,(0,0,0)); rgb.paste(atlas.convert("RGB"),mask=a)
    rgb=rgb.quantize(colors=96,method=Image.Quantize.MEDIANCUT).convert("RGB")
    sheet=Image.merge("RGBA",(*rgb.split(),a)); px=sheet.load()
    for y in range(512):
        for x in range(512):
            if px[x,y][3]==0: px[x,y]=(0,0,0,0)
    sheet.save(outdir/f"{person}-angel-walk-sheet.png")
    frames=[]
    for row,direction in enumerate(DIRS):
        for col in range(4):
            f=sheet.crop((col*FRAME,row*FRAME,(col+1)*FRAME,(row+1)*FRAME))
            f.save(outdir/f"{direction}_{col}.png"); frames.append(f)
        seq=frames[row*4:row*4+4]
        seq[0].save(outdir/f"{person}-angel-walk-{direction}.gif",save_all=True,
                    append_images=seq[1:],duration=DURATION,loop=0,disposal=2)
    preview=Image.new("RGBA",sheet.size,"#273044"); preview.alpha_composite(sheet)
    preview.resize((1024,1024),Image.Resampling.NEAREST).save(outdir/f"{person}-angel-preview-2x.png")
    (outdir/f"{person}-angel-walk.json").write_text(json.dumps({
      "frameWidth":FRAME,"frameHeight":FRAME,"columns":4,"rows":4,
      "framesPerDirection":4,"directions":DIRS,"frameDurationMs":DURATION,
      "order":"row-major","groundAnchorY":120,"background":"transparent",
      "paletteColors":96,"paletteScope":"shared-per-character","theme":"angel-fantasy"
    },indent=2),encoding="utf-8")

for name in ("male","female"): build(name)
print("built angel-fantasy pair: 32 frames, 2 sheets, 8 GIFs")
