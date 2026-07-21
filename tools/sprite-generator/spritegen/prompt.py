def build_prompt(*, role: str, gender: str, outfit: str, glasses: bool) -> str:
    glasses_text = "thin dark eyeglasses in every front and side pose" if glasses else "no eyeglasses"
    return f"""Use case: stylized-concept
Asset type: game-ready chibi character animation master sheet for DataXTown
Input image: use the uploaded portrait only as identity, age, hairstyle, expression, and outfit inspiration; do not make a photorealistic copy.
Primary request: create one consistent {gender} {role} character in a strict 4-column by 4-row walking sprite master sheet.
Subject: professional Asian/Thai office executive, {glasses_text}, {outfit}. Translate every hair pixel including highlights/shadows into a saturated magenta material-key family. Translate the main recolorable outer garment or shirt into a saturated cyan material-key family. Keep skin, face, eyes, glasses, inner shirt, trousers, shoes, and accessories outside those keyed families.
Style: polished high-quality 2D chibi game sprite, clean dark outlines, tasteful anime influence, crisp at small size, consistent identity and proportions.
Grid: exactly 16 isolated full-body figures. Row 1 front walk, row 2 screen-right walk, row 3 screen-left walk, row 4 back walk. Exactly four distinct phases per row.
Backdrop: perfectly flat solid #00ff00 chroma-key background, no grid, dividers, gradients, shadows, floor, checkerboard, text, logo, or watermark.
Composition: square canvas, equal spacing, full body visible, consistent baseline, no overlap or clipping.
Avoid: crossed arms, props, duplicated limbs, pose drift, inconsistent outfit/accessories, realistic rendering, green inside the character."""
