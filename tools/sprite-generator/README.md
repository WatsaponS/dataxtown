# DataXTown Sprite Generator

Upload one portrait and produce a game-ready 4×4 walking sprite package. The service makes one OpenAI image-edit request, then performs chroma removal, frame extraction, recoloring, masks, GIF export, and metadata generation locally.

## Run

```powershell
cd tools\sprite-generator
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:OPENAI_API_KEY="..."
uvicorn app:app --reload --port 8765
```

Open `http://127.0.0.1:8765`.

Never put the API key in the browser or commit it. Each successful job creates a downloadable ZIP under `output/`. Model selection is controlled by `SPRITE_IMAGE_MODEL`; the default is `gpt-image-2`.

## Output

- keyed master and final transparent spritesheet;
- 16 PNG frames and four animated GIFs;
- hair and clothing masks plus recolor demo;
- prompt and JSON metadata;
- deterministic local QA report;
- original uploaded reference.

The generated asset is a stylized interpretation, not a biometric or exact facial replica. Obtain permission before using another person's likeness.
