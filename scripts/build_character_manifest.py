#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Auto-discovers, validates, and imports high-resolution character sprite sheets from
pixel-art/ into game/assets/characters/, then regenerates game/js/sprites_manifest.js.

This is the ONLY supported way to add a new high-resolution character to DataX Town.
Never hand-edit sprites_manifest.js — re-run this script instead.

Usage:
    python scripts/build_character_manifest.py            # run for real
    python scripts/build_character_manifest.py --dry-run   # report only, no writes

What it does (see README section at bottom of this file for the full contract):
  1. Recursively finds every pixel-art/**/*-walk-sheet.png with a sibling *-walk.json.
  2. Skips known non-character intermediates (preview/chroma/clean/gif/frame-split/etc).
  3. Validates each candidate: 512x512 sheet, 128x128 frames, directions exactly
     [down,left,right,up], 4 frames/direction, real alpha transparency present.
  4. De-duplicates by file content hash (pixel-art/layer/<x> and pixel-art/<x> are often
     byte-identical copies of the same art — only one canonical copy is imported).
  5. Copies validated+deduped sheets (+ their json, for reference) into
     game/assets/characters/, never touching/moving/deleting the pixel-art/ originals.
  6. Regenerates game/js/sprites_manifest.js from scratch (auto-generated, do not hand-edit).
  7. Prints a full report: discovered / validated / imported / rejected-with-reasons.
"""
import hashlib
import json
import os
import re
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("ERROR: Pillow is required. Install with: pip install Pillow", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent
PIXEL_ART = ROOT / "pixel-art"
OUT_DIR = ROOT / "game" / "assets" / "characters"
MANIFEST_JS = ROOT / "game" / "js" / "sprites_manifest.js"

EXPECTED_SHEET_SIZE = (512, 512)
EXPECTED_FRAME_SIZE = (128, 128)
EXPECTED_DIRECTIONS = ["down", "left", "right", "up"]
EXPECTED_FRAMES_PER_DIR = 4

# Filenames/paths that must never be treated as a character walk-sheet even if they happen
# to match the *-walk-sheet.png glob (defensive; in practice the suffix match already excludes
# most of these, but kept explicit per the "never guess, name the exclusion" instruction).
EXCLUDE_PATH_SUBSTRINGS = [
    "/preview/", "\\preview\\", "-preview.", "_preview.",
    "/chroma/", "\\chroma\\", "-chroma.", "_chroma.",
    "/clean/", "\\clean\\", "-clean.",
    ".gif",
    "/frames/", "\\frames\\",
    "/pet", "\\pet",  # pet sprites live in folders like api-horse-pet, chibi-zodiac-tiger, sticker-tiger-pet
    "/furniture/", "\\furniture\\",
    "/map/", "\\map\\", "/tiles/", "\\tiles\\",
]
# Individual split-frame files look like down_0.png / left_2.png etc — never match the
# *-walk-sheet.png suffix so no special-case needed, but guarded anyway for safety.
SPLIT_FRAME_RE = re.compile(r"^(down|left|right|up)_\d+\.png$", re.IGNORECASE)

# Known pet/companion top-level folders (from ls at project root) - their sheets, if any
# exist with the same walk-sheet.png naming, are NOT playable characters and must be excluded.
PET_FOLDER_NAMES = {
    "api-horse-pet", "api-rat-pet-economy", "api-tiger-pet",
    "chibi-zodiac-tiger", "sticker-tiger-pet",
}

# Hand-curated Thai display names, reused from the outfit system (outfit_data.js) where the
# same underlying character art already has an established Thai name. Falls back to an
# auto-generated title-case name (from the id) for anything not covered here.

# Hand-tuned visual-normalization values, applied on top of the defaults (1/0/0/0) after
# every regeneration. These are the ONLY fields in sprites_manifest.js meant to be hand-tuned
# post-generation (see Phase H of the character import spec) — never affects collision or
# logical entity position. id -> {visualScale?, visualOffsetX?, visualOffsetY?, tagOffsetY?}
VISUAL_OVERRIDES = {}

# Ids whose raw source sheet has "left" and "right" rows swapped (row that should be "left"
# actually contains right-facing art and vice versa) rather than duplicated. Tried mirroring
# in both directions first (mirror right from left, then mirror left from right) — direct
# in-game playtesting confirmed BOTH were backwards ("walk left faces right AND walk right
# faces left" persisted through both), which is only possible if the two source rows are
# already a genuine, correctly-mirrored pair that's just mislabeled — not duplicate content
# needing synthesis. Fix: swap which row is read for "left" vs "right" at copy time, no
# mirroring at all. Matches the outfit system's SWAP_LR_ROWS in build_outfits.py.
SWAP_LR_ROWS_IDS = {"noir_orchid", "noir_orchid_v2", "noir_orchid_v3"}

NAME_OVERRIDES = {
    "crimson_aegis_knight": "อัศวินโล่เพลิง",
    "dragon_elf_sentinel": "เอลฟ์มังกรผู้พิทักษ์",
    "coral_psychic_v2": "นักไซคิกปะการัง",
    "coral_psychic": "นักไซคิกปะการัง (รุ่นแรก)",
    "noir_orchid": "กล้วยไม้รัตติกาล",
    "noir_orchid_v2": "กล้วยไม้รัตติกาล V2",
    "noir_orchid_v3": "กล้วยไม้รัตติกาล V3",
    "rosewind_healer": "นักบำบัดกุหลาบลม (รุ่นแรก)",
    "rosewind_healer_v2": "นักบำบัดกุหลาบลม",
    "male_amber_scout": "หน่วยลาดตระเวนอำพัน (ชาย)",
    "female_solar_guardian": "ผู้พิทักษ์สุริยะ (หญิง)",
    "male_cyber_fantasy": "นักรบไซเบอร์ (ชาย)",
    "female_cyber_fantasy": "นักรบไซเบอร์ (หญิง)",
    "female_bikini_navigator": "นักเดินเรือหมวกฟาง (หญิง, รุ่นแรก)",
    "female_bikini_navigator_v2": "นักเดินเรือหมวกฟาง (หญิง)",
}


def to_id(stem: str) -> str:
    """'coral-psychic-v2-walk-sheet' -> 'coral_psychic_v2'"""
    s = stem
    for suf in ("-walk-sheet", "_walk_sheet"):
        if s.lower().endswith(suf):
            s = s[: -len(suf)]
            break
    return re.sub(r"[^a-zA-Z0-9]+", "_", s).strip("_").lower()


def to_display_name(id_: str) -> str:
    if id_ in NAME_OVERRIDES:
        return NAME_OVERRIDES[id_]
    return id_.replace("_", " ").title()


def should_exclude(path: Path) -> str | None:
    p = str(path).replace("\\", "/")
    if SPLIT_FRAME_RE.match(path.name):
        return "individual split-frame file, not a sheet"
    for sub in EXCLUDE_PATH_SUBSTRINGS:
        if sub.replace("\\", "/") in p:
            return f"excluded path pattern ({sub})"
    parts = set(path.parts)
    if parts & PET_FOLDER_NAMES:
        return "pet sprite folder, not a playable character"
    return None


def file_hash(path: Path) -> str:
    h = hashlib.sha256()
    h.update(path.read_bytes())
    return h.hexdigest()


def validate(png_path: Path, json_path: Path):
    """Returns (ok: bool, reason_or_meta)."""
    if not json_path.exists():
        return False, f"missing sibling json: {json_path.name}"
    try:
        meta = json.loads(json_path.read_text(encoding="utf-8"))
    except Exception as e:
        return False, f"malformed json: {e}"

    try:
        img = Image.open(png_path)
        img.load()
    except Exception as e:
        return False, f"cannot open image: {e}"

    if img.size != EXPECTED_SHEET_SIZE:
        return False, f"sheet size {img.size} != {EXPECTED_SHEET_SIZE}"

    frame_w = meta.get("frameWidth")
    frame_h = meta.get("frameHeight")
    if (frame_w, frame_h) != EXPECTED_FRAME_SIZE:
        return False, f"frame size ({frame_w},{frame_h}) != {EXPECTED_FRAME_SIZE}"

    directions = meta.get("directions")
    if directions != EXPECTED_DIRECTIONS:
        return False, f"directions {directions} != {EXPECTED_DIRECTIONS}"

    fpd = meta.get("framesPerDirection")
    if fpd != EXPECTED_FRAMES_PER_DIR:
        return False, f"framesPerDirection {fpd} != {EXPECTED_FRAMES_PER_DIR}"

    if img.mode != "RGBA":
        img = img.convert("RGBA")
    alpha = img.getchannel("A")
    extrema = alpha.getextrema()
    if extrema[0] >= 250:
        return False, "no meaningful alpha transparency found (fully opaque)"

    ground_anchor_y = meta.get("groundAnchorY", frame_h)
    if not isinstance(ground_anchor_y, (int, float)) or not (0 <= ground_anchor_y <= frame_h):
        return False, f"groundAnchorY {ground_anchor_y} out of frame bounds (0..{frame_h})"

    frame_duration_ms = meta.get("frameDurationMs", 150)

    return True, {
        "frameWidth": frame_w,
        "frameHeight": frame_h,
        "directions": directions,
        "framesPerDirection": fpd,
        "frameDurationMs": frame_duration_ms,
        "groundAnchorY": ground_anchor_y,
        "sheetSize": img.size,
    }


def find_sibling_json(png_path: Path) -> Path:
    """Usually <stem>-walk-sheet.png -> <stem>-walk.json, but a few folders (e.g.
    male-cyber-fantasy-walk-v1) name the json generically (male-walk.json) instead of
    matching the sheet's full stem. Fall back to the single *-walk.json in the same dir."""
    exact = png_path.with_name(png_path.name.replace("-walk-sheet.png", "-walk.json"))
    if exact.exists():
        return exact
    candidates = sorted(png_path.parent.glob("*-walk.json"))
    if len(candidates) == 1:
        return candidates[0]
    return exact  # let validate() report the "missing" reason with the expected name


def fix_swapped_lr(dest_png: Path, meta: dict):
    """Swap the entire 'left' and 'right' rows in-place (no mirroring — the two rows are
    already correctly-mirrored art, just placed in the wrong row). Used for SWAP_LR_ROWS_IDS
    (see comment there)."""
    directions = meta["directions"]
    fw, fh = meta["frameWidth"], meta["frameHeight"]
    frames_per_dir = meta["framesPerDirection"]
    left_row = directions.index("left")
    right_row = directions.index("right")
    img = Image.open(dest_png).convert("RGBA")
    row_w = fw * frames_per_dir
    left_strip = img.crop((0, left_row * fh, row_w, (left_row + 1) * fh))
    right_strip = img.crop((0, right_row * fh, row_w, (right_row + 1) * fh))
    img.paste(right_strip, (0, left_row * fh))
    img.paste(left_strip, (0, right_row * fh))
    img.save(dest_png)


def discover():
    candidates = []
    for png_path in sorted(PIXEL_ART.rglob("*-walk-sheet.png")):
        json_path = find_sibling_json(png_path)
        candidates.append((png_path, json_path))
    return candidates


def main():
    dry_run = "--dry-run" in sys.argv

    discovered = discover()
    print(f"Discovered {len(discovered)} candidate *-walk-sheet.png files under pixel-art/\n")

    excluded = []
    to_validate = []
    for png_path, json_path in discovered:
        reason = should_exclude(png_path)
        if reason:
            excluded.append((png_path, reason))
        else:
            to_validate.append((png_path, json_path))

    validated = []  # list of dict
    rejected = []   # list of (path, reason)
    for png_path, json_path in to_validate:
        ok, result = validate(png_path, json_path)
        if not ok:
            rejected.append((png_path, result))
        else:
            validated.append({"png": png_path, "json": json_path, "meta": result})

    # De-duplicate by content hash of the PNG (layer/<x> vs top-level <x> are often identical copies)
    seen_hash = {}
    deduped = []
    dup_skipped = []
    for entry in validated:
        h = file_hash(entry["png"])
        if h in seen_hash:
            dup_skipped.append((entry["png"], f"duplicate content of {seen_hash[h]}"))
            continue
        seen_hash[h] = entry["png"]
        entry["hash"] = h
        deduped.append(entry)

    # Assign ids, detect id collisions among genuinely-different content
    by_id = {}
    id_collisions = []
    final_entries = []
    for entry in deduped:
        id_ = to_id(entry["png"].stem)
        if id_ in by_id:
            id_collisions.append((entry["png"], f"id '{id_}' collides with {by_id[id_]['png']} (different content)"))
            continue
        by_id[id_] = entry
        entry["id"] = id_
        final_entries.append(entry)

    print(f"Excluded (non-character): {len(excluded)}")
    for p, r in excluded:
        print(f"  - {p.relative_to(ROOT)}: {r}")
    print(f"\nRejected validation: {len(rejected)}")
    for p, r in rejected:
        print(f"  - {p.relative_to(ROOT)}: {r}")
    print(f"\nDuplicate content skipped: {len(dup_skipped)}")
    for p, r in dup_skipped:
        print(f"  - {p.relative_to(ROOT)}: {r}")
    print(f"\nId collisions (NOT imported, needs manual resolution): {len(id_collisions)}")
    for p, r in id_collisions:
        print(f"  - {p.relative_to(ROOT)}: {r}")

    print(f"\n=> {len(final_entries)} characters will be imported:\n")
    for entry in sorted(final_entries, key=lambda e: e["id"]):
        rel = entry["png"].relative_to(ROOT)
        print(f"  {entry['id']:35s} <- {rel}")

    if dry_run:
        print("\n[dry-run] no files written.")
        return final_entries, excluded, rejected, dup_skipped, id_collisions

    # ---- copy assets ----
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest_entries = []
    for entry in sorted(final_entries, key=lambda e: e["id"]):
        id_ = entry["id"]
        png_name = f"{id_.replace('_', '-')}-walk-sheet.png"
        json_name = f"{id_.replace('_', '-')}-walk.json"
        dest_png = OUT_DIR / png_name
        dest_json = OUT_DIR / json_name
        dest_png.write_bytes(entry["png"].read_bytes())
        dest_json.write_bytes(entry["json"].read_bytes())

        meta = entry["meta"]
        if id_ in SWAP_LR_ROWS_IDS:
            fix_swapped_lr(dest_png, meta)
        fw, fh = meta["frameWidth"], meta["frameHeight"]
        overrides = VISUAL_OVERRIDES.get(id_, {})
        manifest_entries.append({
            "id": id_,
            "name": to_display_name(id_),
            "image": f"assets/characters/{png_name}",
            "sourceFrameWidth": fw,
            "sourceFrameHeight": fh,
            "columns": meta["framesPerDirection"],
            "rows": len(meta["directions"]),
            "directions": meta["directions"],
            "framesPerDirection": meta["framesPerDirection"],
            "frameDurationMs": meta["frameDurationMs"],
            # ครึ่งนึงของ source (128->64) ตามค่าที่ rosewind_healer_v2 ตัวแรกใช้จริงใน production —
            # พอดี ๆ กับ tile 48px ที่ defaultZoom=2 ไม่บังแผนที่/ตัวละครข้างเคียง (visualScale ใน
            # VISUAL_OVERRIDES ไว้จูนละเอียดต่อตัวทีหลัง คนละเรื่องกับ base scale นี้)
            "displayWidth": fw // 2,
            "displayHeight": fh // 2,
            "anchorX": fw // 2,
            "groundAnchorY": meta["groundAnchorY"],
            "collisionWidth": 20,
            "collisionHeight": 14,
            "hairMask": None,
            "clothingMask": None,
            "visualScale": overrides.get("visualScale", 1),
            "visualOffsetX": overrides.get("visualOffsetX", 0),
            "visualOffsetY": overrides.get("visualOffsetY", 0),
            "tagOffsetY": overrides.get("tagOffsetY", 0),
        })

    write_manifest_js(manifest_entries)
    print(f"\nWrote {len(manifest_entries)} entries to {MANIFEST_JS.relative_to(ROOT)}")
    print(f"Copied {len(manifest_entries)} sheets (+json) into {OUT_DIR.relative_to(ROOT)}")

    return final_entries, excluded, rejected, dup_skipped, id_collisions


def write_manifest_js(entries):
    lines = []
    lines.append("// AUTO-GENERATED by scripts/build_character_manifest.py — DO NOT HAND-EDIT.")
    lines.append("// Re-run the script to add/update characters; it discovers, validates, copies")
    lines.append("// assets, and rewrites this file from scratch every time.")
    lines.append("//")
    lines.append("// visualScale/visualOffsetX/visualOffsetY/tagOffsetY are the only fields meant")
    lines.append("// to be hand-tuned after generation (visual normalization only — never affects")
    lines.append("// collision or logical entity position). Edit them here; re-running the script")
    lines.append("// preserves them via VISUAL_OVERRIDES at the top of the script.")
    lines.append("")
    lines.append("export const SPRITE_MANIFEST = [")
    for e in entries:
        lines.append("  {")
        lines.append(f"    id: {json.dumps(e['id'])},")
        lines.append(f"    name: {json.dumps(e['name'], ensure_ascii=False)},")
        lines.append(f"    image: {json.dumps(e['image'])},")
        lines.append(f"    sourceFrameWidth: {e['sourceFrameWidth']},")
        lines.append(f"    sourceFrameHeight: {e['sourceFrameHeight']},")
        lines.append(f"    columns: {e['columns']},")
        lines.append(f"    rows: {e['rows']},")
        lines.append(f"    directions: {json.dumps(e['directions'])},")
        lines.append(f"    framesPerDirection: {e['framesPerDirection']},")
        lines.append(f"    frameDurationMs: {e['frameDurationMs']},")
        lines.append(f"    displayWidth: {e['displayWidth']},")
        lines.append(f"    displayHeight: {e['displayHeight']},")
        lines.append(f"    anchorX: {e['anchorX']},")
        lines.append(f"    groundAnchorY: {e['groundAnchorY']},")
        lines.append(f"    collisionWidth: {e['collisionWidth']},")
        lines.append(f"    collisionHeight: {e['collisionHeight']},")
        lines.append(f"    hairMask: {json.dumps(e['hairMask'])},")
        lines.append(f"    clothingMask: {json.dumps(e['clothingMask'])},")
        lines.append(f"    visualScale: {e['visualScale']},")
        lines.append(f"    visualOffsetX: {e['visualOffsetX']},")
        lines.append(f"    visualOffsetY: {e['visualOffsetY']},")
        lines.append(f"    tagOffsetY: {e['tagOffsetY']},")
        lines.append("  },")
    lines.append("];")
    lines.append("")
    lines.append("export function getSpriteDef(id) {")
    lines.append("  return SPRITE_MANIFEST.find(s => s.id === id) || null;")
    lines.append("}")
    lines.append("")
    MANIFEST_JS.write_text("\n".join(lines), encoding="utf-8")


if __name__ == "__main__":
    main()
