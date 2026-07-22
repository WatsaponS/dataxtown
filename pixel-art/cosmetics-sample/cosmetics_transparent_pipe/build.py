#!/usr/bin/env python3
"""Regenerable build for cosmetics_transparent — produced by pixelpipe. Edit and rerun to iterate."""
import sys
sys.path.insert(0, 'C:\\Users\\Admin\\.codex\\skills\\pixel-art-studio/scripts')
from pixelstudio import Sprite

s = Sprite.from_png('C:\\Users\\Admin\\Desktop\\Project\\DataXTown\\pixel-art\\cosmetics-sample\\cosmetics_transparent.png', scale='auto', strip_bg=False)
s.clean(palette=None, max_colors=24, harden=True, harden_steps=None,
        despeckle_min=2, dedupe_tol=10, dehalo=False)
s.preview("preview.png", scale=2)
s.save_png("clean.png")
s.save_png("clean@2x.png", scale=2)
s.stats()
