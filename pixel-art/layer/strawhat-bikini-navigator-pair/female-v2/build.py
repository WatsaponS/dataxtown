from pathlib import Path
import subprocess, sys

ROOT = Path(__file__).resolve().parent
PIPELINE = Path(r"C:\Users\Admin\.codex\skills\cost-efficient-sprite-pipeline\scripts\build_walk_grid.py")
subprocess.run([
    sys.executable, str(PIPELINE),
    "--input", str(ROOT / "female-bikini-navigator-v2-clean.png"),
    "--out-dir", str(ROOT),
    "--name", "female-bikini-navigator-v2",
], check=True)
