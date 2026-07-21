# Claude Code handoff

This module is intentionally isolated from `game/`. Start with `README.md`, then inspect `app.py` and `spritegen/`.

## Current contract

- One portrait upload triggers exactly one paid image edit.
- All repeated work is local and deterministic.
- A job ZIP contains the source, prompt, master, sheet, masks, frames, GIFs, and JSON.
- Existing DataXTown assets are not overwritten.

## Recommended next work

1. Add background jobs and progress polling; do not hold an HTTP worker during image generation.
2. Run the project's local QA script after `process()` and expose its JSON report in the UI.
3. Add a review screen before publishing into `game/assets/`.
4. Add an explicit “Publish” operation that updates the game avatar registry atomically; never publish automatically after generation.
5. Add authentication, rate limiting, job expiry, EXIF stripping, and server-side MIME validation before deployment.
6. Add prompt presets for executive, employee, casual, dress, and blazer silhouettes.
7. Refactor duplicated sprite-processing logic from `pixel-art/office-avatar-sprites/build.py` into this package once regression tests cover existing assets.

## Acceptance tests

- exactly 16 frames, 128×128 each;
- rows are front/right/left/back and each GIF has four 140 ms frames with loop=0;
- alpha and masks contain only 0/255;
- no green-dominant opaque pixels;
- all frames share bottom pivot y=118 and safe margins;
- recolor changes occur only under hair/clothing masks;
- upload limits and filename traversal protections remain enforced.
