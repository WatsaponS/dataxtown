import os, re, shutil, tempfile, uuid
from pathlib import Path
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, HTMLResponse
from spritegen.openai_image import generate_master
from spritegen.pipeline import process
from spritegen.prompt import build_prompt
from spritegen.qa import run_qa

ROOT=Path(__file__).resolve().parent
OUTPUT=Path(os.environ.get("SPRITE_OUTPUT_DIR",ROOT/"output")).resolve()
MAX_BYTES=int(os.environ.get("SPRITE_MAX_UPLOAD_MB","10"))*1024*1024
app=FastAPI(title="DataXTown Sprite Generator",version="0.1.0")

@app.get("/",response_class=HTMLResponse)
def home(): return (ROOT/"static"/"index.html").read_text(encoding="utf-8")

@app.post("/api/generate")
async def generate(photo:UploadFile=File(...),name:str=Form(...),role:str=Form("Executive"),gender:str=Form("person"),outfit:str=Form("professional office outfit"),glasses:bool=Form(False),hair_color:str=Form("#17171c"),clothing_color:str=Form("#1d1f24")):
    slug=re.sub(r"[^a-z0-9_-]+","-",name.lower()).strip("-")
    if not slug: raise HTTPException(400,"Invalid name")
    raw=await photo.read(MAX_BYTES+1)
    if len(raw)>MAX_BYTES: raise HTTPException(413,"Upload too large")
    if photo.content_type not in {"image/png","image/jpeg","image/webp"}: raise HTTPException(415,"PNG, JPEG or WebP only")
    job=OUTPUT/f"{slug}-{uuid.uuid4().hex[:8]}"; job.mkdir(parents=True)
    ext={"image/png":"png","image/jpeg":"jpg","image/webp":"webp"}[photo.content_type]
    reference=job/f"reference.{ext}"; reference.write_bytes(raw)
    prompt=build_prompt(role=role,gender=gender,outfit=outfit,glasses=glasses)
    (job/"prompt.txt").write_text(prompt,encoding="utf-8")
    try:
        master=generate_master(reference,prompt,job/f"{slug}_master.png")
        process(master,job,slug=slug,hair_color=hair_color,clothing_color=clothing_color)
        qa=run_qa(job,slug)
        if qa["status"]!="PASS": raise RuntimeError(f"Local QA failed: {qa['failures']}")
        archive=shutil.make_archive(str(job),"zip",root_dir=job)
    except Exception as exc:
        raise HTTPException(500,f"Generation failed: {exc}") from exc
    return {"job":job.name,"qa":qa,"download":f"/api/download/{job.name}"}

@app.get("/api/download/{job}")
def download(job:str):
    if not re.fullmatch(r"[a-z0-9_-]+-[0-9a-f]{8}",job): raise HTTPException(400,"Invalid job")
    archive=OUTPUT/f"{job}.zip"
    if not archive.exists(): raise HTTPException(404,"Not found")
    return FileResponse(archive,filename=f"{job}.zip",media_type="application/zip")
