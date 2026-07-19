// Palette-swap ตัวละคร: สร้าง spritesheet เฉพาะตัว (1 แถว 12 เฟรม) จาก variant ต้นแบบ
// โดยแทนสีผม/สีเสื้อด้วยสีที่ผู้เล่นเลือก — สีเงาเสื้อคำนวณอัตโนมัติจากสีเสื้อใหม่

export function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function darken(rgb, factor) {
  return rgb.map(v => Math.round(v * factor));
}

// opts = { hair: "#rrggbb" | null, shirt: "#rrggbb" | null } — null = ใช้สีเดิมของ variant
export function makeCustomSheet(world, variant, opts = {}) {
  const { frameW, frameH } = world.config;
  const meta = world.avatarMeta.variants[variant];
  const w = frameW * 12, h = frameH;
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(world.sheetImg, 0, variant * frameH, w, h, 0, 0, w, h);
  if (!opts.hair && !opts.shirt) return canvas;

  const swaps = [];
  if (opts.shirt) {
    const shirt = hexToRgb(opts.shirt);
    swaps.push([hexToRgb(meta.shirt), shirt]);
    swaps.push([hexToRgb(meta.shirtShadow), darken(shirt, 0.7)]);
  }
  if (opts.hair) swaps.push([hexToRgb(meta.hair), hexToRgb(opts.hair)]);

  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    for (const [from, to] of swaps) {
      if (d[i] === from[0] && d[i + 1] === from[1] && d[i + 2] === from[2]) {
        d[i] = to[0]; d[i + 1] = to[1]; d[i + 2] = to[2];
        break;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}
