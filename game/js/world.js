// โหลดแผนที่ (format: DataXTown social-map v1) และให้บริการ collision / zone queries

export async function loadWorld(config) {
  const map = await (await fetch(config.mapJson)).json();
  const avatarMeta = await (await fetch(config.avatarMeta)).json();
  const assetsBase = new URL(config.avatarMeta, location.href);
  const [mapImg, sheetImg, hairMaskImg, clothingMaskImg] = await Promise.all([
    loadImage(new URL(map.art, new URL(config.mapJson, location.href)).href),
    loadImage(config.avatarSheet),
    loadImage(new URL(avatarMeta.hairMask, assetsBase).href),
    loadImage(new URL(avatarMeta.clothingMask, assetsBase).href),
  ]);
  return {
    config, map, mapImg, sheetImg, avatarMeta, hairMaskImg, clothingMaskImg,
    tile: map.tileSize,
    pxW: map.width * map.tileSize,
    pxH: map.height * map.tileSize,
    entities: [],   // player + NPCs (+ remote players ในอนาคต)
    player: null,
    time: 0,
  };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("load failed: " + src));
    img.src = src;
  });
}

export function tileBlocked(world, tx, ty) {
  const m = world.map;
  if (tx < 0 || ty < 0 || tx >= m.width || ty >= m.height) return true;
  return m.collision.data[ty][tx] === m.collision.blocked;
}

// ตรวจกล่องชน (พิกัด pixel) กับ collision grid
export function boxBlocked(world, x0, y0, x1, y1) {
  const t = world.tile;
  const tx0 = Math.floor(x0 / t), ty0 = Math.floor(y0 / t);
  const tx1 = Math.floor(x1 / t), ty1 = Math.floor(y1 / t);
  for (let ty = ty0; ty <= ty1; ty++)
    for (let tx = tx0; tx <= tx1; tx++)
      if (tileBlocked(world, tx, ty)) return true;
  return false;
}

// คืนโซนที่จุด pixel (x,y) อยู่ หรือ null
export function zoneAt(world, x, y) {
  const t = world.tile;
  const tx = Math.floor(x / t), ty = Math.floor(y / t);
  for (const z of world.map.interactionZones) {
    const [zx, zy, zw, zh] = z.rect;
    if (tx >= zx && tx < zx + zw && ty >= zy && ty < zy + zh) return z;
  }
  return null;
}

export function spawnPoint(world, id) {
  const sp = world.map.spawnPoints.find(s => s.id === id) || world.map.spawnPoints[0];
  const t = world.tile;
  return { x: (sp.tile[0] + 0.5) * t, y: (sp.tile[1] + 0.5) * t };
}
