"""Build registered female 4x4 walk sprites from the generated concept."""
from pathlib import Path
from collections import deque
import json
from PIL import Image

ROOT=Path(__file__).resolve().parent
SRC=Image.open(ROOT/"female-walk-clean.png").convert("RGBA")
DIRS=["down","left","right","up"]
FRAME,DURATION=128,140
W,H=SRC.size

# Extract connected silhouettes globally so hair, skirt and wings may cross the
# generator's implied cell borders without being clipped or contaminating peers.
alpha=SRC.getchannel("A")
opaque=bytearray(1 if v>=128 else 0 for v in alpha.getdata())
seen=bytearray(W*H); groups=[[] for _ in range(16)]
for sy in range(H):
    for sx in range(W):
        start=sy*W+sx
        if not opaque[start] or seen[start]: continue
        q=deque([(sx,sy)]); seen[start]=1; pts=[]
        while q:
            x,y=q.popleft(); pts.append((x,y))
            for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
                if 0<=nx<W and 0<=ny<H:
                    i=ny*W+nx
                    if opaque[i] and not seen[i]: seen[i]=1; q.append((nx,ny))
        if len(pts)<2: continue
        cx=sum(x for x,_ in pts)/len(pts); cy=sum(y for _,y in pts)/len(pts)
        col=min(3,max(0,int(cx*4/W))); row=min(3,max(0,int(cy*4/H)))
        groups[row*4+col].extend(pts)

bboxes=[]
for pts in groups:
    if not pts: raise RuntimeError("missing generated pose")
    xs=[x for x,_ in pts]; ys=[y for _,y in pts]
    bboxes.append((min(xs),min(ys),max(xs)+1,max(ys)+1))
max_w=max(x1-x0 for x0,y0,x1,y1 in bboxes)
max_h=max(y1-y0 for x0,y0,x1,y1 in bboxes)
scale=min(112/max_w,112/max_h)

raw=[]; sp=SRC.load()
for pts,(x0,y0,x1,y1) in zip(groups,bboxes):
    crop=Image.new("RGBA",(x1-x0,y1-y0),(0,0,0,0)); cp=crop.load()
    for x,y in pts: cp[x-x0,y-y0]=sp[x,y]
    nw=max(1,round(crop.width*scale)); nh=max(1,round(crop.height*scale))
    crop=crop.resize((nw,nh),Image.Resampling.LANCZOS)
    f=Image.new("RGBA",(FRAME,FRAME),(0,0,0,0))
    f.alpha_composite(crop,((FRAME-nw)//2,120-nh)); raw.append(f)

# Quantize the atlas once, keeping a shared animation palette and hard alpha.
atlas=Image.new("RGBA",(FRAME*4,FRAME*4),(0,0,0,0))
for i,f in enumerate(raw): atlas.alpha_composite(f,((i%4)*FRAME,(i//4)*FRAME))
a=atlas.getchannel("A").point(lambda v:255 if v>=128 else 0)
rgb=Image.new("RGB",atlas.size,(0,0,0)); rgb.paste(atlas.convert("RGB"),mask=a)
rgb=rgb.quantize(colors=96,method=Image.Quantize.MEDIANCUT).convert("RGB")
sheet=Image.merge("RGBA",(*rgb.split(),a)); px=sheet.load()
for y in range(sheet.height):
    for x in range(sheet.width):
        if px[x,y][3]==0: px[x,y]=(0,0,0,0)
sheet.save(ROOT/"female-cyber-fantasy-walk-sheet.png")

frames=[]
for row,direction in enumerate(DIRS):
    for col in range(4):
        f=sheet.crop((col*FRAME,row*FRAME,(col+1)*FRAME,(row+1)*FRAME))
        f.save(ROOT/f"{direction}_{col}.png"); frames.append(f)
    seq=frames[row*4:row*4+4]
    seq[0].save(ROOT/f"female-walk-{direction}.gif",save_all=True,
                append_images=seq[1:],duration=DURATION,loop=0,disposal=2)

preview=Image.new("RGBA",sheet.size,"#273044"); preview.alpha_composite(sheet)
preview.resize((1024,1024),Image.Resampling.NEAREST).save(ROOT/"female-walk-preview-2x.png")
(ROOT/"female-walk.json").write_text(json.dumps({
 "frameWidth":FRAME,"frameHeight":FRAME,"columns":4,"rows":4,
 "framesPerDirection":4,"directions":DIRS,"frameDurationMs":DURATION,
 "order":"row-major","groundAnchorY":120,"background":"transparent",
 "paletteColors":96,"paletteScope":"shared-sheet","layer":"full-character",
 "source":"Image API concept + deterministic component extraction/registration"
},indent=2),encoding="utf-8")
print("built registered female 16-frame sheet, GIFs, preview and metadata")
