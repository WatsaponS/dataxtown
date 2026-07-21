from pathlib import Path
from PIL import Image, ImageChops
import json

DIRS=("front","right","left","back")

def run_qa(root:Path,slug:str):
    failures=[]; sheet=Image.open(root/f"{slug}_spritesheet.png").convert("RGBA")
    hair=Image.open(root/f"{slug}_hair_mask.png").convert("L"); clothes=Image.open(root/f"{slug}_clothing_mask.png").convert("L")
    if sheet.size!=(512,512): failures.append(f"sheet size {sheet.size}")
    if set(sheet.getchannel("A").getdata())-{0,255}: failures.append("soft alpha")
    for name,mask in (("hair",hair),("clothing",clothes)):
        if set(mask.getdata())-{0,255}: failures.append(f"{name} mask not binary")
        if not mask.getbbox(): failures.append(f"{name} mask empty")
    for row,direction in enumerate(DIRS):
        gif=Image.open(root/f"{slug}_{direction}_walk.gif")
        if gif.size!=(128,128) or gif.n_frames!=4 or gif.info.get("loop")!=0: failures.append(f"{direction} GIF contract")
        for col in range(4):
            frame=Image.open(root/"frames"/slug/f"{direction}_{col}.png").convert("RGBA")
            cell=sheet.crop((col*128,row*128,(col+1)*128,(row+1)*128))
            if ImageChops.difference(frame,cell).getbbox(): failures.append(f"{direction}_{col} differs from sheet")
            bbox=frame.getchannel("A").getbbox()
            if not bbox or bbox[0]<2 or bbox[1]<2 or bbox[2]>126 or bbox[3]!=118: failures.append(f"{direction}_{col} unsafe bbox {bbox}")
            if any(a and g>60 and g>r*1.06 and g>b*1.06 for r,g,b,a in frame.getdata()): failures.append(f"{direction}_{col} green spill")
    report={"status":"PASS" if not failures else "FAIL","failures":failures}
    (root/f"{slug}_qa.json").write_text(json.dumps(report,indent=2),encoding="utf-8")
    return report
